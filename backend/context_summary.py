"""
Compress a ContextPacket into a short natural-language paragraph before
sending to GLM.

Why: the ILMU endpoint sits behind Cloudflare with a ~100s response
ceiling. GLM-5.1 reasoning over 15 hourly weather rows in verbose JSON
reliably pushes past that ceiling. A compact paragraph carries the same
information in ~400 chars vs ~2,200 chars of JSON, and GLM reasons over
it faster because it doesn't have to parse redundant structure.

probe_sizes.py TEST 2 (~500 char total prompt) succeeded; that's the
target size for our real prompt too.
"""
from __future__ import annotations

from schemas import ContextPacket


def summarize_weather(packet: ContextPacket) -> str:
    """Collapse 15 hourly rows into a short description."""
    hours = packet.weather_hourly
    if not hours:
        return "no weather data"

    # Find rain blocks
    rain_blocks: list[tuple[str, str]] = []
    in_rain = False
    rain_start = ""
    for h in hours:
        t = h.time.split("T")[1][:5]  # "HH:MM"
        is_raining = h.precipitation_mm >= 2.0
        if is_raining and not in_rain:
            in_rain = True
            rain_start = t
        elif not is_raining and in_rain:
            in_rain = False
            rain_blocks.append((rain_start, t))
    if in_rain:
        rain_blocks.append((rain_start, hours[-1].time.split("T")[1][:5]))

    first = hours[0].time.split("T")[1][:5]
    last = hours[-1].time.split("T")[1][:5]
    avg_temp = sum(h.temp_c for h in hours) / len(hours)

    if not rain_blocks:
        return f"{first}-{last} clear, ~{avg_temp:.0f}°C"

    rain_desc = ", ".join(f"rain {a}-{b}" for a, b in rain_blocks)
    return f"{first}-{last} mostly clear with {rain_desc}, ~{avg_temp:.0f}°C"


def summarize_events(packet: ContextPacket) -> str:
    if not packet.events:
        return "no notable events"
    parts = [
        f"{e.name} in {e.zone} {e.start}-{e.end} ({e.expected_crowd} crowd)"
        for e in packet.events
    ]
    return "; ".join(parts)


def summarize_incentives(packet: ContextPacket) -> str:
    if not packet.incentives:
        return "no special incentives today"
    parts = [i.description for i in packet.incentives]
    return "; ".join(parts)


def summarize_history(packet: ContextPacket) -> str:
    """Rider's pattern for this day of week in 2-3 data points."""
    rows = packet.rider_history_relevant
    if not rows:
        return f"no history, recent 7-day avg RM{packet.recent_7day_avg_net_rm:.0f} net"

    parts = []
    for r in rows:
        tag = " (rain)" if r.rain_flag else ""
        parts.append(f"{r.hour:02d}:00 {r.zone} avg RM{r.avg_net_rm:.0f}{tag}")
    return f"recent 7-day avg RM{packet.recent_7day_avg_net_rm:.0f} net; this weekday pattern: " + "; ".join(parts)


def summarize_context(packet: ContextPacket) -> str:
    """Produce the full compact context paragraph."""
    holiday_str = f" (public holiday: {packet.holiday_name})" if packet.is_public_holiday else ""
    return (
        f"Date: {packet.date} ({packet.day_of_week}){holiday_str}. "
        f"RON95 RM{packet.fuel_price_ron95_rm_per_litre:.2f}/L. "
        f"Weather: {summarize_weather(packet)}. "
        f"Events: {summarize_events(packet)}. "
        f"Incentives: {summarize_incentives(packet)}. "
        f"Rider: {summarize_history(packet)}."
    )
