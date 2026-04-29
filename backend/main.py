"""
Ronda backend — FastAPI app exposing /api/recommend.

Run locally:
  uvicorn main:app --reload --port 8000

Run on Render (production):
  Render uses the Procfile: uvicorn main:app --host 0.0.0.0 --port $PORT

Endpoint:
  POST /api/recommend
    body: RecommendRequest (see api_models.py)
    returns: RecommendResponse with the GLM recommendation + trace metadata

The trace panel on the frontend reads `meta` and `trace` to show the actual
prompt that was sent and the raw JSON response. Everything is real.
"""
from __future__ import annotations

import logging
import os
import time
from contextlib import asynccontextmanager
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

# Load .env BEFORE importing GlmClient so it sees the API key.
# In production (Render), env vars are injected directly so this is a no-op.
load_dotenv(Path(__file__).parent.parent / ".env")

from api_models import RecommendRequest, RecommendResponse
from context_summary import summarize_context
from glm_client import GlmClient
from prompts import SYSTEM_PROMPT, build_morning_user_prompt
from schemas import (
    ContextPacket,
    Event,
    HistoricalHour,
    Incentive,
    WeatherHour,
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s :: %(message)s",
)
logger = logging.getLogger("ronda.api")


# ─── App lifecycle ─────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Ronda API starting up. ILMU model: %s", os.getenv("GLM_MODEL_REASONING", "ilmu-glm-5.1"))
    yield
    logger.info("Ronda API shutting down.")


app = FastAPI(
    title="Ronda API",
    description="AI shift coach for Malaysian gig riders.",
    version="1.0.0",
    lifespan=lifespan,
)

# ─── CORS ──────────────────────────────────────────────────────────────────
# Allow localhost for dev + any production frontend URL set via FRONTEND_ORIGINS.
# FRONTEND_ORIGINS is a comma-separated list, e.g.:
#   FRONTEND_ORIGINS=https://ronda.vercel.app,https://ronda-git-main.vercel.app
_default_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://192.168.68.104:3000",
]
_extra_origins_env = os.getenv("FRONTEND_ORIGINS", "").strip()
_extra_origins = [o.strip() for o in _extra_origins_env.split(",") if o.strip()]
_allowed_origins = _default_origins + _extra_origins

# Also allow ALL Vercel preview URLs via regex (every PR gets a unique URL)
_allowed_origin_regex = r"https://.*\.vercel\.app"

logger.info("CORS allowed origins: %s", _allowed_origins)
logger.info("CORS allowed origin regex: %s", _allowed_origin_regex)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_origin_regex=_allowed_origin_regex,
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)


# ─── Health ────────────────────────────────────────────────────────────────

@app.get("/")
def root():
    """Root endpoint so Render's health check sees a 200."""
    return {
        "service": "ronda-api",
        "status": "ok",
        "docs": "/docs",
        "health": "/api/health",
    }


@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "model": os.getenv("GLM_MODEL_REASONING", "ilmu-glm-5.1"),
        "endpoint": os.getenv("ILMU_BASE_URL", "https://api.ilmu.ai/anthropic"),
    }


# ─── Recommendation endpoint ───────────────────────────────────────────────

@app.post("/api/recommend", response_model=RecommendResponse)
def recommend(req: RecommendRequest):
    logger.info("Recommend request: rider=%s day=%s", req.rider_name, req.day_of_week)

    packet = _build_context_packet(req)
    ctx_summary = summarize_context(packet)
    user_prompt = build_morning_user_prompt(ctx_summary)

    t0 = time.perf_counter()
    try:
        client = GlmClient(model=os.getenv("GLM_MODEL_REASONING", "ilmu-glm-5.1"))
        rec, usage = client.recommend_morning(packet)
    except Exception as e:
        logger.exception("GLM call failed")
        raise HTTPException(status_code=500, detail=f"Reasoning engine error: {e}")
    elapsed = round(time.perf_counter() - t0, 2)

    return RecommendResponse(
        recommendation=rec.model_dump(),
        meta={
            "model": os.getenv("GLM_MODEL_REASONING", "ilmu-glm-5.1"),
            "latency_seconds": elapsed,
            "output_tokens": usage.output_tokens if usage else 0,
            "input_tokens": usage.input_tokens if usage else 0,
            "prompt_chars": len(user_prompt),
            "context_summary_chars": len(ctx_summary),
            "source": rec.source,
        },
        trace={
            "systemPrompt": SYSTEM_PROMPT,
            "userPrompt": user_prompt,
            "rawResponse": rec.model_dump_json(indent=2),
        },
    )


# ─── Helpers ───────────────────────────────────────────────────────────────

def _build_context_packet(req: RecommendRequest) -> ContextPacket:
    """Translate the simple form input into the rich ContextPacket the GLM client expects."""

    # Build hourly weather from the 3 simple conditions
    weather_hourly = []
    for h in range(8, 23):
        if h < 12:
            cond = req.weather.morning_condition
        elif h < 17:
            cond = req.weather.afternoon_condition
        else:
            cond = req.weather.evening_condition
        precip = 4.0 if cond == "rain" else (0.5 if cond == "cloudy" else 0.0)
        weather_hourly.append(
            WeatherHour(
                time=f"{req.date}T{h:02d}:00",
                temp_c=req.weather.temp_c,
                precipitation_mm=precip,
                wind_kmh=8,
                condition=cond,
            )
        )

    # Parse free-text events into structured Event objects (or treat as one big event)
    events = []
    if req.events_text.strip():
        events.append(
            Event(
                name=req.events_text.strip()[:100],
                zone="Klang Valley",
                start="00:00",
                end="23:59",
                expected_crowd="medium",
                kind="other",
            )
        )

    # Parse free-text incentives
    incentives = []
    if req.incentives_text.strip():
        incentives.append(
            Incentive(
                description=req.incentives_text.strip()[:200],
                zone="Klang Valley",
                window_start="00:00",
                window_end="23:59",
                bonus_rm=0.0,  # not parsed; we let the LLM read the description
            )
        )

    # Minimal historical context — derived from the 7-day average
    avg = req.recent_7day_avg_net_rm
    history = [
        HistoricalHour(day_of_week=4, hour=12, zone=req.home_zone,
                       avg_orders=4.5, avg_net_rm=avg * 0.30, rain_flag=False),
        HistoricalHour(day_of_week=4, hour=19, zone=req.home_zone,
                       avg_orders=6.0, avg_net_rm=avg * 0.45, rain_flag=False),
        HistoricalHour(day_of_week=4, hour=15, zone=req.home_zone,
                       avg_orders=2.0, avg_net_rm=avg * 0.10, rain_flag=True),
    ]

    return ContextPacket(
        date=req.date,
        day_of_week=req.day_of_week,
        is_public_holiday=False,
        holiday_name=None,
        fuel_price_ron95_rm_per_litre=req.fuel_price_ron95_rm,
        weather_hourly=weather_hourly,
        events=events,
        incentives=incentives,
        rider_history_relevant=history,
        recent_7day_avg_net_rm=avg,
    )
