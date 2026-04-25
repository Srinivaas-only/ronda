"""
Ronda FastAPI backend.

Endpoints:
  GET  /health                 liveness + GLM reachability
  POST /recommend/morning      morning recommendation
  POST /recommend/midday       midday re-plan
  GET  /riders/{rider_id}/context  (debug) show the assembled context packet

Swagger UI at /docs auto-generates the SAD diagram content for free.
"""
from __future__ import annotations

import logging
import os
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()  # load .env before importing glm_client so env vars are set

from glm_client import GlmClient  # noqa: E402
from schemas import (  # noqa: E402
    ContextPacket,
    RecommendationRequest,
    ShiftRecommendation,
)

logging.basicConfig(
    level=os.getenv("LOG_LEVEL", "INFO"),
    format="%(asctime)s %(levelname)s %(name)s :: %(message)s",
)
logger = logging.getLogger("ronda")

app = FastAPI(
    title="Ronda API",
    description="AI shift coach for Malaysian gig riders. UMHackathon 2026, Domain 2.",
    version="0.1.0",
)

# Permissive CORS for hackathon demo — tighten in production
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


def _client() -> GlmClient:
    try:
        return GlmClient()
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "service": "ronda", "version": app.version}


@app.post("/recommend/morning", response_model=ShiftRecommendation)
def recommend_morning(payload: dict) -> ShiftRecommendation:
    """
    Body: { "request": RecommendationRequest, "context": ContextPacket }

    Kept as a loose dict here so context assembly can evolve without contract breakage
    during rapid iteration. Tighten to typed payload before finals.
    """
    try:
        _ = RecommendationRequest.model_validate(payload["request"])
        packet = ContextPacket.model_validate(payload["context"])
    except (KeyError, ValueError) as e:
        raise HTTPException(status_code=422, detail=f"bad payload: {e}") from e

    rec, usage = _client().recommend_morning(packet)
    if usage:
        logger.info("morning rec ok — tokens in=%d out=%d", usage.prompt_tokens, usage.completion_tokens)
    return rec


@app.post("/recommend/midday", response_model=ShiftRecommendation)
def recommend_midday(payload: dict) -> ShiftRecommendation:
    """
    Body: {
      "request": RecommendationRequest,
      "context": ContextPacket,
      "morning_recommendation": ShiftRecommendation,
      "morning_actuals": { "hours_worked": float, "net_rm": float, "orders": int }
    }
    """
    try:
        packet = ContextPacket.model_validate(payload["context"])
        morning = ShiftRecommendation.model_validate(payload["morning_recommendation"])
        actuals = payload.get("morning_actuals", {})
    except (KeyError, ValueError) as e:
        raise HTTPException(status_code=422, detail=f"bad payload: {e}") from e

    rec, usage = _client().recommend_midday_replan(packet, morning, actuals)
    if usage:
        logger.info("midday rec ok — tokens in=%d out=%d", usage.prompt_tokens, usage.completion_tokens)
    return rec
