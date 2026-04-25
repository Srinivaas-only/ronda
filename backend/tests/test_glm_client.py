"""
Smoke tests for GLM client.

These tests require ILMU_API_KEY (or ANTHROPIC_AUTH_TOKEN) in .env.
Skipped automatically if no key. Uses the cheaper model for dev by default to
save quota — override with GLM_MODEL_TEST env var if you want to test GLM-5.1.
"""
from __future__ import annotations

import os
import sys
from pathlib import Path

import pytest

# Allow running from repo root OR backend/
BACKEND = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND))

from dotenv import load_dotenv

load_dotenv(BACKEND.parent / ".env")

pytestmark = pytest.mark.skipif(
    not (os.getenv("ILMU_API_KEY") or os.getenv("ANTHROPIC_AUTH_TOKEN")),
    reason="ILMU_API_KEY/ANTHROPIC_AUTH_TOKEN not set — skipping live GLM tests",
)


@pytest.fixture
def test_client():
    from glm_client import GlmClient
    # Use the cheaper model for tests to save quota during dev.
    test_model = os.getenv("GLM_MODEL_TEST", os.getenv("GLM_MODEL_CHEAP", "glm-4.7"))
    return GlmClient(model=test_model)


@pytest.fixture
def dummy_packet():
    from schemas import ContextPacket, WeatherHour, Event, Incentive, HistoricalHour
    return ContextPacket(
        date="2026-04-22",
        day_of_week="Wednesday",
        is_public_holiday=False,
        holiday_name=None,
        fuel_price_ron95_rm_per_litre=2.05,
        weather_hourly=[
            WeatherHour(
                time=f"2026-04-22T{h:02d}:00",
                temp_c=30,
                precipitation_mm=0 if h < 14 else 3.5,
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
                description="+RM2 per delivery in Bangsar",
                zone="Bangsar",
                window_start="18:00",
                window_end="22:00",
                bonus_rm=2.0,
            ),
        ],
        rider_history_relevant=[
            HistoricalHour(day_of_week=2, hour=12, zone="PJ", avg_orders=5.2,
                           avg_net_rm=32.5, rain_flag=False),
            HistoricalHour(day_of_week=2, hour=19, zone="Bangsar", avg_orders=7.8,
                           avg_net_rm=48.0, rain_flag=False),
        ],
        recent_7day_avg_net_rm=95.50,
    )


def test_morning_recommendation_returns_valid_schema(test_client, dummy_packet):
    rec, usage = test_client.recommend_morning(dummy_packet)
    assert rec.source in ("glm", "fallback_rules")
    assert rec.projected_net_rm >= 0
    assert 40 <= len(rec.reasoning_narrative) <= 1200
    assert 2 <= len(rec.key_factors) <= 8
    if rec.source == "glm":
        assert usage is not None
        assert usage.total_tokens > 0
        print(f"\n[tokens] in={usage.input_tokens} out={usage.output_tokens}")
        print(f"[narrative] {rec.reasoning_narrative}")


def test_client_init_without_key_raises():
    from glm_client import GlmClient
    with pytest.raises(RuntimeError):
        GlmClient(api_key="")
