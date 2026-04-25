"""
ILMU-GLM client wrapper (via YTL AI Labs' Anthropic-compatible endpoint).

Fix in this version:
  - GLM-5.1 sometimes streams content in non-text blocks (e.g. thinking blocks)
    that text_stream skips. We now read text from the FINAL message's content
    list, not just the streamed text iterator.
  - max_tokens raised back to 4000 so JSON doesn't get truncated mid-string.
  - On parse failure we print the raw response we DID get so we can debug.
  - _validate is more tolerant of leading/trailing prose.
"""
from __future__ import annotations

import json
import logging
import os
from dataclasses import dataclass
from typing import Any

import anthropic
import httpx
from anthropic import APIError, APITimeoutError, APIConnectionError
from pydantic import ValidationError

from context_summary import summarize_context
from prompts import (
    SYSTEM_PROMPT,
    build_morning_user_prompt,
    build_midday_replan_user_prompt,
)
from schemas import (
    ContextPacket,
    ShiftRecommendation,
    Recommendation,
    Confidence,
    ShiftWindow,
    KeyFactor,
    Impact,
    Weight,
)

logger = logging.getLogger(__name__)

ILMU_API_KEY = os.getenv("ILMU_API_KEY", "") or os.getenv("ANTHROPIC_AUTH_TOKEN", "")
ILMU_BASE_URL = os.getenv("ILMU_BASE_URL", "https://api.ilmu.ai/anthropic")
GLM_MODEL_REASONING = os.getenv("GLM_MODEL_REASONING", "ilmu-glm-5.1")
GLM_MODEL_CHEAP = os.getenv("GLM_MODEL_CHEAP", "ilmu-glm-5.1")

MAX_OUTPUT_TOKENS = 4000
REQUEST_TIMEOUT_SECONDS = 90.0


@dataclass
class GlmUsage:
    input_tokens: int
    output_tokens: int

    @property
    def total_tokens(self) -> int:
        return self.input_tokens + self.output_tokens


class GlmClient:
    def __init__(self, api_key: str | None = None, model: str | None = None):
        self.api_key = api_key or ILMU_API_KEY
        self.model = model or GLM_MODEL_REASONING
        if not self.api_key:
            raise RuntimeError(
                "ILMU_API_KEY (or ANTHROPIC_AUTH_TOKEN) not configured. "
                "Get one from https://console.ilmu.ai/"
            )
        self._client = anthropic.Anthropic(
            api_key=self.api_key,
            base_url=ILMU_BASE_URL,
            timeout=REQUEST_TIMEOUT_SECONDS,
            max_retries=0,
        )

    def recommend_morning(
        self, packet: ContextPacket
    ) -> tuple[ShiftRecommendation, GlmUsage | None]:
        ctx = summarize_context(packet)
        logger.info("Context summary (%d chars): %s", len(ctx), ctx)
        user = build_morning_user_prompt(ctx)
        return self._call_and_validate(user, packet)

    def recommend_midday_replan(
        self,
        packet: ContextPacket,
        morning_recommendation: ShiftRecommendation,
        morning_actuals: dict[str, Any],
    ) -> tuple[ShiftRecommendation, GlmUsage | None]:
        ctx = summarize_context(packet)
        user = build_midday_replan_user_prompt(
            ctx,
            morning_recommendation.model_dump_json(indent=None),
            json.dumps(morning_actuals),
        )
        return self._call_and_validate(user, packet)

    def _call_and_validate(
        self, user_prompt: str, packet: ContextPacket
    ) -> tuple[ShiftRecommendation, GlmUsage | None]:
        messages: list[dict] = [{"role": "user", "content": user_prompt}]
        logger.info("User prompt size: %d chars", len(user_prompt))

        raw = ""
        try:
            raw, usage = self._send(SYSTEM_PROMPT, messages)
            return self._validate(raw), usage
        except (ValidationError, json.JSONDecodeError) as e:
            logger.warning("GLM schema validation failed: %s", e)
            logger.warning("Raw (full): %r", raw)
            retry_messages = messages + [
                {"role": "assistant", "content": raw or "(empty)"},
                {
                    "role": "user",
                    "content": (
                        f"That failed schema validation ({e}). "
                        "Return ONLY valid compact JSON matching the schema. "
                        "No prose, no markdown, no thinking. Be concise."
                    ),
                },
            ]
            try:
                raw2, usage2 = self._send(SYSTEM_PROMPT, retry_messages)
                return self._validate(raw2), usage2
            except Exception as e2:
                logger.error("Retry also failed: %s", e2)
                return self._fallback(packet), None
        except (
            APIError,
            APITimeoutError,
            APIConnectionError,
            httpx.RemoteProtocolError,
            httpx.HTTPError,
        ) as e:
            logger.error("GLM API/transport error: %s: %s", type(e).__name__, e)
            return self._fallback(packet), None

    def _send(self, system: str, messages: list[dict]) -> tuple[str, GlmUsage]:
        try:
            return self._send_streaming(system, messages)
        except (httpx.RemoteProtocolError, anthropic.APIConnectionError) as e:
            logger.warning("Streaming dropped (%s) — trying non-streaming", type(e).__name__)
            return self._send_nonstreaming(system, messages)

    def _send_streaming(self, system: str, messages: list[dict]) -> tuple[str, GlmUsage]:
        # We drain the stream but read content from the FINAL message
        # because text_stream skips non-text blocks (e.g. thinking blocks
        # from reasoning models). Reading from final.content catches everything.
        with self._client.messages.stream(
            model=self.model,
            system=system,
            messages=messages,
            max_tokens=MAX_OUTPUT_TOKENS,
            temperature=0.3,
        ) as stream:
            for _ in stream.text_stream:
                pass
            final = stream.get_final_message()
        return self._extract_from_final(final, mode="stream")

    def _send_nonstreaming(self, system: str, messages: list[dict]) -> tuple[str, GlmUsage]:
        resp = self._client.messages.create(
            model=self.model,
            system=system,
            messages=messages,
            max_tokens=MAX_OUTPUT_TOKENS,
            temperature=0.3,
        )
        return self._extract_from_final(resp, mode="nonstream")

    @staticmethod
    def _extract_from_final(final_msg, mode: str) -> tuple[str, GlmUsage]:
        text_parts: list[str] = []
        block_summary: list[str] = []
        for block in final_msg.content:
            btype = getattr(block, "type", "unknown")
            if btype == "text":
                text_parts.append(block.text)
                block_summary.append(f"text({len(block.text)})")
            else:
                block_summary.append(f"{btype}(skipped)")

        content = "".join(text_parts).strip()
        content = _strip_markdown_fence(content)

        usage = GlmUsage(
            input_tokens=final_msg.usage.input_tokens,
            output_tokens=final_msg.usage.output_tokens,
        )
        logger.info(
            "ILMU ok (%s) stop=%s in=%d out=%d blocks=[%s] text_len=%d",
            mode,
            final_msg.stop_reason,
            usage.input_tokens,
            usage.output_tokens,
            ", ".join(block_summary),
            len(content),
        )
        return content, usage

    @staticmethod
    def _validate(raw: str) -> ShiftRecommendation:
        if not raw:
            raise json.JSONDecodeError("empty response body", "", 0)
        # Tolerate leading/trailing prose by extracting the {…} block
        first_brace = raw.find("{")
        last_brace = raw.rfind("}")
        if first_brace > 0 or (last_brace != -1 and last_brace < len(raw) - 1):
            if first_brace != -1 and last_brace != -1 and last_brace > first_brace:
                candidate = raw[first_brace : last_brace + 1]
                try:
                    data = json.loads(candidate)
                    return ShiftRecommendation.model_validate(data)
                except (json.JSONDecodeError, ValidationError):
                    pass
        data = json.loads(raw)
        return ShiftRecommendation.model_validate(data)

    @staticmethod
    def _fallback(packet: ContextPacket) -> ShiftRecommendation:
        avg = packet.recent_7day_avg_net_rm
        rainy_hours = sum(1 for h in packet.weather_hourly if h.precipitation_mm > 2.0)
        is_weekend = packet.day_of_week in ("Saturday", "Sunday")

        rec = Recommendation.WORK if (avg > 70 and rainy_hours < 8) else Recommendation.PARTIAL
        windows = [
            ShiftWindow(start="11:00", end="14:00", zones=["PJ", "Damansara"]),
            ShiftWindow(start="18:00", end="22:00", zones=["Bangsar"]),
        ]
        return ShiftRecommendation(
            recommendation=rec,
            shift_windows=windows,
            projected_net_rm=round(avg * (1.15 if is_weekend else 1.0), 2),
            projected_gross_rm=round(avg * 1.3, 2),
            projected_petrol_rm=round(avg * 0.15, 2),
            confidence=Confidence.LOW,
            reasoning_narrative=(
                "GLM is currently unavailable, so this is a baseline from simple rules "
                "over your recent 7-day average. Treat the numbers as rough. The real "
                "Ronda recommendation will return once the GLM reasoning engine is back online."
            ),
            key_factors=[
                KeyFactor(factor="7-day average", impact=Impact.POSITIVE, weight=Weight.MEDIUM),
                KeyFactor(factor="Weather (rough)", impact=Impact.NEUTRAL, weight=Weight.LOW),
            ],
            caveats=["Fallback mode — GLM reasoning engine unavailable."],
            source="fallback_rules",
        )


def _strip_markdown_fence(text: str) -> str:
    t = text.strip()
    if t.startswith("```"):
        first_newline = t.find("\n")
        if first_newline != -1:
            t = t[first_newline + 1 :]
        if t.endswith("```"):
            t = t[:-3]
    return t.strip()
