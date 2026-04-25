"""Quick check: see what GLM actually says."""
import logging
import os
from pathlib import Path
from dotenv import load_dotenv

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s :: %(message)s",
)

load_dotenv(Path(__file__).parent.parent / ".env")

from glm_client import GlmClient
from schemas import ContextPacket, WeatherHour, Event, Incentive, HistoricalHour


packet = ContextPacket(
    date="2026-04-24",
    day_of_week="Friday",
    is_public_holiday=False,
    holiday_name=None,
    fuel_price_ron95_rm_per_litre=2.05,
    weather_hourly=[
        WeatherHour(
            time=f"2026-04-24T{h:02d}:00",
            temp_c=30,
            precipitation_mm=0 if h < 14 else 4.0,
            wind_kmh=8,
            condition="clear" if h < 14 else "rain",
        )
        for h in range(8, 23)
    ],
    events=[
        Event(
            name="KL Grand Prix fan zone",
            zone="Bukit Jalil",
            start="18:00",
            end="23:00",
            expected_crowd="large",
            kind="sports",
        ),
    ],
    incentives=[
        Incentive(
            description="+RM2 per delivery in Bangsar 6pm-10pm",
            zone="Bangsar",
            window_start="18:00",
            window_end="22:00",
            bonus_rm=2.0,
        ),
    ],
    rider_history_relevant=[
        HistoricalHour(day_of_week=4, hour=12, zone="PJ",
                       avg_orders=5.8, avg_net_rm=36.0, rain_flag=False),
        HistoricalHour(day_of_week=4, hour=19, zone="Bangsar",
                       avg_orders=8.5, avg_net_rm=54.0, rain_flag=False),
        HistoricalHour(day_of_week=4, hour=15, zone="PJ",
                       avg_orders=2.1, avg_net_rm=11.0, rain_flag=True),
    ],
    recent_7day_avg_net_rm=105.50,
)

print("Calling GLM... (this may take 30-60s)\n")

client = GlmClient(model=os.getenv("GLM_MODEL_REASONING", "ilmu-glm-5.1"))
rec, usage = client.recommend_morning(packet)

print("\n" + "=" * 70)
print(f"MODEL USED: {client.model}")
print(f"SOURCE:     {rec.source}")
if usage:
    print(f"TOKENS:     in={usage.input_tokens}  out={usage.output_tokens}  total={usage.total_tokens}")
print("=" * 70)
print(f"\nRECOMMENDATION: {rec.recommendation.value.upper()}")
print(f"CONFIDENCE:     {rec.confidence.value}")
print(f"\nPROJECTED EARNINGS:")
print(f"  Gross:  RM {rec.projected_gross_rm:.2f}")
print(f"  Petrol: RM {rec.projected_petrol_rm:.2f}")
print(f"  NET:    RM {rec.projected_net_rm:.2f}")
print(f"\nSHIFT WINDOWS:")
for w in rec.shift_windows:
    print(f"  {w.start}-{w.end} in {', '.join(w.zones)}")
print(f"\nNARRATIVE (what Aiman sees on screen):")
print(f'  "{rec.reasoning_narrative}"')
print(f"\nKEY FACTORS:")
for f in rec.key_factors:
    print(f"  [{f.weight.value.upper():6}] {f.impact.value:8} - {f.factor}")
    if f.note:
        print(f"           {f.note}")
if rec.caveats:
    print(f"\nCAVEATS:")
    for c in rec.caveats:
        print(f"  - {c}")
print("\n" + "=" * 70)