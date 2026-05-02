"""
Prompt templates for Ronda-GLM, the High-Frequency Earnings Optimizer.

Core differentiator: Platform Arbitrage — comparing live incentives across
ShopeeFood, Grab, and FoodPanda to find the highest-profit window for
Malaysian gig riders (Klang Valley, motorbike).

We ship a compact natural-language context paragraph (see context_summary.py)
instead of verbose JSON. This keeps total prompt size well inside the
Cloudflare ~100s response ceiling we observe on the ILMU endpoint.
"""

SYSTEM_PROMPT = """\
You are Ronda-GLM, a High-Frequency Earnings Optimizer for Malaysian riders \
(Klang Valley, motorbike). Your "Secret Sauce" is Platform Arbitrage: \
comparing live incentives across ShopeeFood, Grab, and FoodPanda to find the \
highest-profit window.

DECISION LOGIC — follow this order every time:
1. BASELINE: Start with the rider's 7-day historical average.
2. OVERLAYS: Adjust for Weather (rain = higher demand, more surge) and \
Traffic/Events (e.g. KL Grand Prix = avoid Bukit Jalil, leverage spillover).
3. THE ARBITRAGE (CRITICAL): Prioritize "Live Incentives" above all else. \
If a platform drops a voucher or boost (e.g., ShopeeFood +RM4), calculate \
whether switching apps outweighs the rider's current streak/bonus on their \
usual platform. Factor in: bonus amount × estimated orders, vs opportunity \
cost of leaving a streak.
4. ACTION: If a switch is profitable, explicitly mention the "Switch Window" \
in the narrative — the exact time and app to switch TO.
5. OPPORTUNITY COST: For each shift_window, calculate opportunity_gain_rm — \
how many extra RM the rider earns by using target_app vs staying on their \
usual platform. This is the "cost of not switching." Be specific: \
"Staying on Grab during 12-3pm costs you ~RM20 because ShopeeFood's +RM4 \
× 5 orders = RM20 extra."

You are a NEGOTIATOR between platforms. Tell the rider exactly when their \
loyalty bonus on one app is no longer worth the surge/voucher on another.

Output valid JSON only — no prose outside JSON, no markdown fences.
Keep reasoning_narrative 3-5 sentences, plain Malaysian English.
Be honest when signals conflict (lower confidence).
Ground projected_net_rm in the rider's recent average, adjusted for the \
best available incentive window.
"""

# Legacy placeholders for older diagnostic scripts
FEW_SHOT_EXAMPLE_INPUT = ""
FEW_SHOT_EXAMPLE_OUTPUT = ""


def build_morning_user_prompt(context_summary: str, incentives_text: str = "") -> str:
    """Build the morning analysis prompt with live promo data."""
    promo_section = ""
    if incentives_text.strip():
        promo_section = f"""
LIVE PROMO DATA:
{incentives_text.strip()}

Use the promo data above to perform platform arbitrage. Compare these live \
promos against the rider's historical pattern. Should they stay on their usual \
app, or is a specific promo big enough to justify a switch? If switching is \
profitable, mention the "Switch Window" in reasoning_narrative.
"""
    return (
        f"ANALYSIS REQUEST:\n"
        f"Current Context: {context_summary}\n"
        f"{promo_section}\n"
        "Return JSON: {recommendation (work|rest|partial), shift_windows "
        "(list of {start HH:MM, end HH:MM, zones, target_app, "
        "opportunity_gain_rm (float, extra RM from switching to target_app vs "
        "staying on usual platform)}), projected_net_rm, "
        "projected_gross_rm, projected_petrol_rm, confidence (high|medium|low), "
        "reasoning_narrative (3-5 sentences, mention Switch Window if applicable), "
        "key_factors (list of "
        "{factor, impact (positive|negative|neutral), weight (high|medium|low), note}), "
        "caveats (list of strings), source (\"glm\")}. JSON only."
    )


def build_midday_replan_user_prompt(
    context_summary: str,
    morning_recommendation_json: str,
    morning_actuals_json: str,
    incentives_text: str = "",
) -> str:
    """Build the midday re-plan prompt."""
    promo_section = ""
    if incentives_text.strip():
        promo_section = f"""
LIVE PROMO DATA (updated):
{incentives_text.strip()}
"""
    return (
        f"Afternoon re-plan. Morning call: {morning_recommendation_json}\n"
        f"Morning actuals: {morning_actuals_json}\n"
        f"Now: {context_summary}\n"
        f"{promo_section}\n"
        "Return same JSON schema covering the rest of today. "
        "In reasoning_narrative note what changed vs morning, including any "
        "new Switch Windows from updated promo data. JSON only."
    )


def assemble_messages(system: str, user: str) -> list[dict]:
    return [
        {"role": "system", "content": system},
        {"role": "user", "content": user},
    ]