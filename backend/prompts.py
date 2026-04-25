"""
Prompt templates for Ronda.

We ship a compact natural-language context paragraph (see context_summary.py)
instead of verbose JSON. This keeps total prompt size well inside the
Cloudflare ~100s response ceiling we observe on the ILMU endpoint.
"""

SYSTEM_PROMPT = """You are Ronda, a shift-planning advisor for Malaysian foodpanda riders \
(Klang Valley, motorbike). Given weather, events, fuel price, bonus incentives, and the \
rider's own history, you recommend shift hours and zones for today, plus projected net \
earnings (after petrol). Output valid JSON only — no prose outside JSON, no markdown. \
Keep reasoning_narrative 3-5 sentences, plain Malaysian English. Be honest when signals \
conflict (lower confidence). Ground projected_net_rm in the rider's recent average."""

# Legacy placeholders for older diagnostic scripts
FEW_SHOT_EXAMPLE_INPUT = ""
FEW_SHOT_EXAMPLE_OUTPUT = ""


def build_morning_user_prompt(context_summary: str) -> str:
    return (
        f"Today: {context_summary}\n\n"
        "Return JSON: {recommendation (work|rest|partial), shift_windows "
        "(list of {start HH:MM, end HH:MM, zones}), projected_net_rm, "
        "projected_gross_rm, projected_petrol_rm, confidence (high|medium|low), "
        "reasoning_narrative (3-5 sentences), key_factors (list of "
        "{factor, impact (positive|negative|neutral), weight (high|medium|low), note}), "
        'caveats (list of strings), source ("glm")}. JSON only.'
    )


def build_midday_replan_user_prompt(
    context_summary: str,
    morning_recommendation_json: str,
    morning_actuals_json: str,
) -> str:
    return (
        f"Afternoon re-plan. Morning call: {morning_recommendation_json}\n"
        f"Morning actuals: {morning_actuals_json}\n"
        f"Now: {context_summary}\n\n"
        "Return same JSON schema covering the rest of today. "
        "In reasoning_narrative note what changed vs morning. JSON only."
    )


def assemble_messages(system: str, user: str) -> list[dict]:
    return [
        {"role": "system", "content": system},
        {"role": "user", "content": user},
    ]
