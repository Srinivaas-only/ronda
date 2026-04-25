"""Measure what our real prompt actually looks like."""
from pathlib import Path
from dotenv import load_dotenv
load_dotenv(Path(__file__).parent.parent / ".env")

from schemas import ContextPacket, WeatherHour, Event, Incentive, HistoricalHour
from prompts import SYSTEM_PROMPT, build_morning_user_prompt

packet = ContextPacket(
    date="2026-04-24",
    day_of_week="Friday",
    is_public_holiday=False,
    holiday_name=None,
    fuel_price_ron95_rm_per_litre=2.05,
    weather_hourly=[
        WeatherHour(time=f"2026-04-24T{h:02d}:00", temp_c=30,
                    precipitation_mm=0 if h < 14 else 4.0,
                    wind_kmh=8, condition="clear" if h < 14 else "rain")
        for h in range(8, 23)
    ],
    events=[Event(name="KL Grand Prix fan zone", zone="Bukit Jalil",
                  start="18:00", end="23:00", expected_crowd="large", kind="sports")],
    incentives=[Incentive(description="+RM2 per delivery in Bangsar 6pm-10pm",
                          zone="Bangsar", window_start="18:00", window_end="22:00",
                          bonus_rm=2.0)],
    rider_history_relevant=[
        HistoricalHour(day_of_week=4, hour=12, zone="PJ", avg_orders=5.8, avg_net_rm=36.0, rain_flag=False),
        HistoricalHour(day_of_week=4, hour=19, zone="Bangsar", avg_orders=8.5, avg_net_rm=54.0, rain_flag=False),
        HistoricalHour(day_of_week=4, hour=15, zone="PJ", avg_orders=2.1, avg_net_rm=11.0, rain_flag=True),
    ],
    recent_7day_avg_net_rm=105.50,
)

user_prompt = build_morning_user_prompt(packet.model_dump_json(indent=None))

print(f"System prompt: {len(SYSTEM_PROMPT)} chars")
print(f"User prompt:   {len(user_prompt)} chars")
print(f"TOTAL:         {len(SYSTEM_PROMPT) + len(user_prompt)} chars")
print()
print("=" * 70)
print("FULL USER PROMPT (what ILMU actually receives):")
print("=" * 70)
print(user_prompt)