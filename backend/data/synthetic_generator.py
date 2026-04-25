"""
Synthetic earnings history generator for Aiman (foodpanda rider, Klang Valley).

Generates a realistic ~90-day hourly log where:
  - Aiman is in ONE zone per hour (physically possible, unlike the v1 generator)
  - Zone choice is weighted by demand at that hour + a slight personal preference
  - Lunch (12-14) and dinner (18-21) peaks
  - Friday/weekend uplift
  - Afternoon rain variance (more orders but higher risk)
  - Rest days (usually Monday)
  - Petrol cost proportional to km driven

Target realism: foodpanda rider in KL, ~RM90-140 net per working day,
~20-30 orders per working day, ~RM2,800-3,500/month gross.

Output: backend/data/aiman_history.csv
"""
from __future__ import annotations

import random
from datetime import datetime, timedelta
from pathlib import Path

import numpy as np
import pandas as pd

RNG = np.random.default_rng(seed=42)

ZONES = ["PJ", "Damansara", "Bangsar", "KL Sentral", "Subang"]
# Base demand per zone (not all zones are equal)
ZONE_BASE_DEMAND = {
    "PJ": 1.10,        # dense residential, reliable
    "Damansara": 0.95,
    "Bangsar": 1.25,   # premium, higher per-order
    "KL Sentral": 1.00,
    "Subang": 0.85,
}
# Aiman's personal preference — he lives in PJ so works PJ more
ZONE_PREFERENCE = {
    "PJ": 1.5,
    "Damansara": 1.2,
    "Bangsar": 1.1,
    "KL Sentral": 0.8,
    "Subang": 0.7,
}

# Hourly demand multipliers across 24h
HOUR_MULTIPLIER = np.array(
    [
        0.05, 0.03, 0.02, 0.02, 0.03, 0.05,  # 0-5
        0.15, 0.25, 0.35, 0.40, 0.55, 0.85,  # 6-11
        1.20, 1.25, 0.90, 0.70, 0.75, 0.95,  # 12-17
        1.40, 1.50, 1.35, 1.05, 0.70, 0.35,  # 18-23
    ]
)

# Day of week multipliers (0=Mon..6=Sun)
DOW_MULTIPLIER = np.array([0.95, 0.95, 1.00, 1.00, 1.15, 1.20, 1.10])

RON95_PRICE_RM = 2.05
BIKE_KMPL = 38.0                # 125cc motorbike
AVG_KM_PER_ORDER = 4.5
AVG_GROSS_PER_ORDER = 5.5       # RM base rate + typical tip


def pick_zone_for_hour(hour: int) -> str:
    """
    Aiman picks one zone for this hour, weighted by:
      - zone's base demand (busy zones attract him)
      - his personal preference (he lives in PJ)
    """
    weights = np.array([
        ZONE_BASE_DEMAND[z] * ZONE_PREFERENCE[z]
        for z in ZONES
    ])
    weights = weights / weights.sum()
    return RNG.choice(ZONES, p=weights)


def generate_day(date) -> list[dict]:
    """Generate rows for one day — Aiman in ONE zone per hour."""
    rows = []
    dow = date.weekday()
    is_weekend = dow >= 5

    # Rest day — usually Monday, sometimes random
    if dow == 0 and RNG.random() < 0.55:
        return []
    if RNG.random() < 0.05:  # occasional random day off
        return []

    # Rain window (Klang Valley — frequent afternoon rain)
    rain_start = None
    if RNG.random() < 0.50:
        rain_start = int(RNG.integers(13, 19))

    # Which hours Aiman rides today
    chosen_hours: list[int] = []
    # Lunch block — almost always
    if RNG.random() < 0.88:
        chosen_hours.extend(range(11, 15))
    # Dinner block — almost always
    if RNG.random() < 0.95:
        chosen_hours.extend(range(18, 23))
    # Weekend breakfast / weekday late morning — sometimes
    if is_weekend and RNG.random() < 0.45:
        chosen_hours.extend(range(9, 11))
    if not is_weekend and RNG.random() < 0.20:
        chosen_hours.extend([10])

    chosen_hours = sorted(set(chosen_hours))
    if not chosen_hours:
        return []

    for hour in chosen_hours:
        # ONE zone per hour
        zone = pick_zone_for_hour(hour)

        rain_flag = rain_start is not None and rain_start <= hour < rain_start + 3

        demand_mult = (
            HOUR_MULTIPLIER[hour]
            * DOW_MULTIPLIER[dow]
            * ZONE_BASE_DEMAND[zone]
        )
        if rain_flag:
            demand_mult *= 1.20  # more food orders during rain
        rain_noise = 0.25 if rain_flag else 0.12
        noise = RNG.normal(1.0, rain_noise)

        # Orders in this single hour in this single zone
        # Peak hour in good zone ≈ 3-5 orders
        orders = max(0, int(round(demand_mult * 1.8 * noise)))
        if orders == 0:
            continue

        gross = orders * AVG_GROSS_PER_ORDER * RNG.normal(1.0, 0.10)
        km = orders * AVG_KM_PER_ORDER * RNG.normal(1.0, 0.08)
        petrol = (km / BIKE_KMPL) * RON95_PRICE_RM
        net = gross - petrol

        rows.append({
            "date": date.isoformat(),
            "day_of_week": dow,
            "hour": hour,
            "zone": zone,
            "orders": int(orders),
            "gross_rm": round(float(gross), 2),
            "petrol_rm": round(float(petrol), 2),
            "net_rm": round(float(net), 2),
            "km": round(float(km), 2),
            "rain_flag": bool(rain_flag),
        })
    return rows


def generate_history(days: int = 90) -> pd.DataFrame:
    end = datetime.now().date() - timedelta(days=1)
    start = end - timedelta(days=days - 1)
    all_rows: list[dict] = []
    cur = start
    while cur <= end:
        all_rows.extend(generate_day(cur))
        cur += timedelta(days=1)
    return pd.DataFrame(all_rows)


def main() -> None:
    out_dir = Path(__file__).resolve().parent
    out_dir.mkdir(parents=True, exist_ok=True)

    df = generate_history(days=90)

    daily = df.groupby("date").agg(
        orders=("orders", "sum"),
        gross_rm=("gross_rm", "sum"),
        net_rm=("net_rm", "sum"),
    )
    working_days = len(daily)
    total_days = 90
    rest_days = total_days - working_days

    print(f"Generated {len(df)} hourly rows across {working_days} working days "
          f"({rest_days} rest days over {total_days} total).")
    print()
    print("Per-day stats:")
    print(f"  Avg orders/day      : {daily['orders'].mean():.1f}")
    print(f"  Avg gross RM/day    : {daily['gross_rm'].mean():.2f}")
    print(f"  Avg net RM/day      : {daily['net_rm'].mean():.2f}")
    print(f"  Min/max net RM/day  : {daily['net_rm'].min():.2f} / {daily['net_rm'].max():.2f}")
    print()
    print("Monthly projection (30 working days):")
    print(f"  Est. gross RM/month : {daily['gross_rm'].mean() * 30:.2f}")
    print(f"  Est. net RM/month   : {daily['net_rm'].mean() * 30:.2f}")
    print()
    print("Zone distribution (% of hours worked):")
    zone_share = df["zone"].value_counts(normalize=True) * 100
    for z, pct in zone_share.items():
        print(f"  {z:12} {pct:5.1f}%")
    print()

    csv_path = out_dir / "aiman_history.csv"
    df.to_csv(csv_path, index=False)
    print(f"Wrote {csv_path}")


if __name__ == "__main__":
    main()
