"""
Pydantic models defining the contract between GLM and the rest of the system.

The output schema is enforced on every GLM response. If GLM returns malformed
JSON or a response that fails validation, the client retries once, then falls
back to a rule-based baseline recommendation labelled as such.
"""
from __future__ import annotations

from enum import Enum
from typing import Literal
from pydantic import BaseModel, Field


class Recommendation(str, Enum):
    WORK = "work"
    REST = "rest"
    PARTIAL = "partial"


class Confidence(str, Enum):
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class Impact(str, Enum):
    POSITIVE = "positive"
    NEGATIVE = "negative"
    NEUTRAL = "neutral"


class Weight(str, Enum):
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class ShiftWindow(BaseModel):
    start: str = Field(..., description="Start time HH:MM 24h")
    end: str = Field(..., description="End time HH:MM 24h")
    zones: list[str] = Field(..., description="Recommended zones for this window")
    target_app: str = Field("", description="Recommended platform: ShopeeFood | Grab | FoodPanda")
    opportunity_gain_rm: float = Field(0.0, ge=0, description="Estimated RM gain from switching to this platform vs staying on rider's current app")


class KeyFactor(BaseModel):
    factor: str = Field(..., description="Short name of the signal")
    impact: Impact
    weight: Weight
    note: str = Field("", description="One-line justification")


class ShiftRecommendation(BaseModel):
    """The structured recommendation GLM must return."""
    recommendation: Recommendation
    shift_windows: list[ShiftWindow]
    projected_net_rm: float = Field(..., ge=0, description="Projected net earnings in RM")
    projected_gross_rm: float = Field(..., ge=0, description="Before petrol and costs")
    projected_petrol_rm: float = Field(..., ge=0)
    confidence: Confidence
    reasoning_narrative: str = Field(
        ...,
        min_length=40,
        max_length=1200,
        description="Plain-language explanation for the rider, 3-5 sentences",
    )
    key_factors: list[KeyFactor] = Field(..., min_length=2, max_length=8)
    caveats: list[str] = Field(default_factory=list)
    source: Literal["glm", "fallback_rules"] = "glm"


class WeatherHour(BaseModel):
    time: str  # ISO-like "2026-04-22T14:00"
    temp_c: float
    precipitation_mm: float
    wind_kmh: float
    condition: str  # "clear" | "rain" | "thunderstorm" | "cloudy" etc.


class Event(BaseModel):
    name: str
    zone: str
    start: str  # HH:MM
    end: str
    expected_crowd: Literal["small", "medium", "large"]
    kind: str  # "concert", "match", "sale", "religious", etc.


class Incentive(BaseModel):
    description: str
    zone: str | None = None
    window_start: str | None = None  # HH:MM
    window_end: str | None = None
    bonus_rm: float | None = None
    quest_target: int | None = None  # e.g. "complete 20 orders"


class HistoricalHour(BaseModel):
    day_of_week: int  # 0=Mon .. 6=Sun
    hour: int  # 0..23
    zone: str
    avg_orders: float
    avg_net_rm: float
    rain_flag: bool


class ContextPacket(BaseModel):
    """Everything assembled before the GLM call."""
    date: str  # ISO date "2026-04-22"
    day_of_week: str  # "Tuesday"
    is_public_holiday: bool
    holiday_name: str | None = None
    fuel_price_ron95_rm_per_litre: float
    weather_hourly: list[WeatherHour]
    events: list[Event]
    incentives: list[Incentive]
    rider_history_relevant: list[HistoricalHour]  # pre-filtered
    recent_7day_avg_net_rm: float  # baseline for impact calc


class RecommendationRequest(BaseModel):
    rider_id: str
    request_type: Literal["morning", "midday_replan"] = "morning"
    current_time: str  # ISO datetime
    # For midday re-plans:
    morning_recommendation_id: str | None = None
    morning_actuals: dict | None = None  # hours worked, RM earned, orders done
