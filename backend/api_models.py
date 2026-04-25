"""
API-layer Pydantic models for the /api/recommend endpoint.

These are SEPARATE from `schemas.py` (the GLM output contract).
The shape the frontend sends → these models → we build a ContextPacket → call GLM → return ShiftRecommendation.
"""
from __future__ import annotations

from pydantic import BaseModel, Field


class WeatherInput(BaseModel):
    """Simplified weather inputs the user actually fills in."""
    morning_condition: str = Field(default="clear", description="clear | cloudy | rain")
    afternoon_condition: str = Field(default="rain", description="clear | cloudy | rain")
    evening_condition: str = Field(default="clear", description="clear | cloudy | rain")
    temp_c: float = Field(default=30.0, ge=20, le=40)


class RecommendRequest(BaseModel):
    """What the frontend posts when the user clicks 'Get my brief'."""
    rider_name: str = Field(default="Aiman", min_length=1, max_length=50)
    rider_platform: str = Field(default="foodpanda", max_length=30)
    home_zone: str = Field(default="Petaling Jaya", max_length=50)
    day_of_week: str = Field(default="Friday")
    date: str = Field(default="2026-04-25", description="YYYY-MM-DD")

    fuel_price_ron95_rm: float = Field(default=2.05, gt=0, lt=10)
    recent_7day_avg_net_rm: float = Field(default=105.0, ge=0, le=2000)

    weather: WeatherInput = Field(default_factory=WeatherInput)
    events_text: str = Field(
        default="",
        description="Free-text events today (e.g. 'concert at Axiata 19:00')",
        max_length=500,
    )
    incentives_text: str = Field(
        default="",
        description="Free-text incentives (e.g. '+RM2 in Bangsar 6-10pm')",
        max_length=500,
    )


class RecommendResponse(BaseModel):
    """What the API returns to the frontend."""
    recommendation: dict  # the full ShiftRecommendation as a dict
    meta: dict  # latency_seconds, output_tokens, model, etc.
    trace: dict  # systemPrompt, userPrompt, rawResponse — for the trace panel
