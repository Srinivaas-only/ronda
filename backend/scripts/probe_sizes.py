"""
Tests ILMU at three prompt sizes to isolate whether the disconnect is
prompt-size related or endpoint flakiness.
"""
import os
import logging
from pathlib import Path
from dotenv import load_dotenv
import anthropic
import httpx

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s :: %(message)s")
load_dotenv(Path(__file__).parent.parent / ".env")

client = anthropic.Anthropic(
    api_key=os.getenv("ILMU_API_KEY") or os.getenv("ANTHROPIC_AUTH_TOKEN"),
    base_url=os.getenv("ILMU_BASE_URL", "https://api.ilmu.ai/anthropic"),
    timeout=180.0,
    max_retries=0,
)


def test(label: str, system: str, user: str, max_tokens: int = 2000) -> None:
    print(f"\n{'=' * 70}\n{label}\n{'=' * 70}")
    print(f"system length: {len(system)} chars, user length: {len(user)} chars")
    try:
        text_chunks: list[str] = []
        with client.messages.stream(
            model="ilmu-glm-5.1",
            system=system,
            messages=[{"role": "user", "content": user}],
            max_tokens=max_tokens,
            temperature=0.3,
        ) as stream:
            for chunk in stream.text_stream:
                text_chunks.append(chunk)
            final = stream.get_final_message()
        text = "".join(text_chunks)
        print(f"✅ STREAM OK — in={final.usage.input_tokens}, out={final.usage.output_tokens}")
        print(f"First 300 chars of response:\n{text[:300]}")
    except httpx.RemoteProtocolError as e:
        print(f"❌ STREAM DROPPED: {e}")
        # try non-streaming
        print("   trying non-streaming fallback...")
        try:
            resp = client.messages.create(
                model="ilmu-glm-5.1",
                system=system,
                messages=[{"role": "user", "content": user}],
                max_tokens=max_tokens,
                temperature=0.3,
            )
            text = "\n".join(b.text for b in resp.content if getattr(b, "type", None) == "text")
            print(f"✅ NONSTREAM OK — in={resp.usage.input_tokens}, out={resp.usage.output_tokens}")
            print(f"First 300 chars:\n{text[:300]}")
        except Exception as e2:
            print(f"❌ NONSTREAM ALSO FAILED: {type(e2).__name__}: {e2}")
    except Exception as e:
        print(f"❌ OTHER ERROR: {type(e).__name__}: {e}")


# --- Test 1: tiny prompt ---
test(
    "TEST 1: Tiny prompt, JSON out",
    system="You output JSON only. No prose.",
    user='Return JSON: {"status": "ok"}',
    max_tokens=200,
)

# --- Test 2: medium prompt ---
test(
    "TEST 2: Medium prompt (~500 char system, reasoning task)",
    system=(
        "You are a shift-planning advisor for Malaysian food-delivery riders. "
        "You reason over weather, events, and earnings history to recommend "
        "work hours. Output only JSON with fields: recommendation (work/rest), "
        "shift_hours (list of 'HH:MM-HH:MM'), projected_net_rm (number), "
        "reasoning (2-3 sentences). No markdown."
    ),
    user=(
        "Today is Friday 24 April 2026 in KL. Weather: clear morning, rain 2-5pm, "
        "clear evening. Rider's 7-day average: RM105. Bangsar bonus zone "
        "6pm-10pm (+RM2/order). Recommend the shift plan."
    ),
    max_tokens=1500,
)

# --- Test 3: large prompt (close to real) ---
big_system = (
    "You are Ronda, a shift-planning advisor for Malaysian food-delivery riders. "
    "You reason over six inputs: weather, holidays, events, fuel price, rider "
    "history, platform incentives. Output ONLY valid JSON. No markdown. No prose "
    "outside JSON. Keep reasoning_narrative 3-5 sentences. "
) * 4  # ~900 chars
big_user = (
    "Context: Friday 24 April 2026, Klang Valley. Weather hourly 8am-11pm: "
    "clear until 2pm, rain 2-5pm (3mm/h), clear evening. Fuel RON95 RM2.05/L. "
    "Events: KL Grand Prix fan zone Bukit Jalil 6pm-11pm (large crowd). "
    "Incentives: +RM2/order Bangsar 6pm-10pm. "
    "Rider history: Fridays average RM105 net, strong lunch (11-2pm PJ) and "
    "dinner (6-10pm Bangsar). "
    "Return JSON with: recommendation, shift_windows (list of {start, end, "
    "zones}), projected_net_rm, confidence, reasoning_narrative, key_factors "
    "(list of {factor, impact, weight})."
)
test("TEST 3: Large prompt (~900 char system, ~650 char user)",
     big_system, big_user, max_tokens=2500)

print("\nDone.")
