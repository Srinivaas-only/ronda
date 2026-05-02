// Real GLM-5.1 output for the Platform Arbitrage scenario.
// Rider normally on Grab, but ShopeeFood drops +RM4 in Bangsar 12-3pm.
// Ronda-GLM catches the Switch Window — a generic AI would miss this.

import type { ShiftRecommendation, RiderContext } from "./types";

export const demoContext: RiderContext = {
  date: "2026-04-24",
  day_of_week: "Friday",
  recent_7day_avg_net_rm: 105.5,
  fuel_price_ron95_rm_per_litre: 2.05,
  weather_summary: "Mostly clear morning, rain 14:00–22:00, ~30°C",
  events_summary: "KL Grand Prix fan zone in Bukit Jalil 18:00–23:00 (large crowd)",
  incentives_summary: "ShopeeFood: +RM4 flash incentive in Bangsar (Valid 12pm-3pm); Grab: 1.2x boost in PJ (Valid all day); FoodPanda: No active promos",
};

export const demoRecommendation: ShiftRecommendation = {
  recommendation: "work",
  shift_windows: [
    { start: "12:00", end: "15:00", zones: ["Bangsar"], target_app: "ShopeeFood", opportunity_gain_rm: 20.0 },
    { start: "18:00", end: "22:00", zones: ["Bangsar"], target_app: "Grab", opportunity_gain_rm: 0.0 },
  ],
  projected_net_rm: 145.5,
  projected_gross_rm: 175,
  projected_petrol_rm: 29.5,
  confidence: "high",
  reasoning_narrative:
    "ShopeeFood just dropped a +RM4 flash incentive in Bangsar until 3pm — that's a 30% boost on your hourly rate vs staying on Grab. Switch to ShopeeFood now for the 12-3pm window. After 3pm, switch back to Grab for the evening dinner rush in Bangsar, leveraging the 1.2x boost and spillover crowd from Bukit Jalil. Rain starts at 4pm but Bangsar demand stays strong with the Grand Prix crowd.",
  key_factors: [
    {
      factor: "ShopeeFood +RM4 voucher (12pm-3pm)",
      impact: "positive",
      weight: "high",
      note: "Flash incentive worth ~RM4 × 5 orders = RM20 extra. This is the Switch Window.",
    },
    {
      factor: "Grab 1.2x boost (all day PJ)",
      impact: "positive",
      weight: "medium",
      note: "Decent baseline but outperformed by ShopeeFood during the voucher window.",
    },
    {
      factor: "Klang Valley rain (14:00–22:00)",
      impact: "negative",
      weight: "medium",
      note: "Increases demand/surge but slows delivery times and makes riding risky.",
    },
    {
      factor: "KL Grand Prix Fan Zone (Bukit Jalil)",
      impact: "positive",
      weight: "medium",
      note: "Spillover crowd to nearby Bangsar increases dinner demand from 6pm.",
    },
  ],
  caveats: [
    "ShopeeFood voucher ends at 3pm — switch back to Grab after to avoid losing the 1.2x boost.",
    "Rain from 4pm may cause cancellations; plan routes carefully.",
    "Traffic around Bukit Jalil/Bangsar could be heavily congested from 18:00.",
  ],
  source: "glm",
};

export const demoMeta = {
  model: "ilmu-glm-5.1",
  latency_seconds: 10.7,
  output_tokens: 1104,
  prompt_chars: 752,
  context_summary_chars: 356,
};

// The actual prompt sent to ILMU-GLM-5.1 (full system + user) and the raw
// JSON the model returned. Used by the developer trace panel to prove
// integration is real, not faked.
export const demoTrace = {
    systemPrompt: `You are Ronda-GLM, a High-Frequency Earnings Optimizer for Malaysian riders (Klang Valley, motorbike). Your "Secret Sauce" is Platform Arbitrage: comparing live incentives across ShopeeFood, Grab, and FoodPanda to find the highest-profit window.

DECISION LOGIC — follow this order every time:
1. BASELINE: Start with the rider's 7-day historical average.
2. OVERLAYS: Adjust for Weather (rain = higher demand, more surge) and Traffic/Events (e.g. KL Grand Prix = avoid Bukit Jalil, leverage spillover).
3. THE ARBITRAGE (CRITICAL): Prioritize "Live Incentives" above all else. If a platform drops a voucher or boost (e.g., ShopeeFood +RM4), calculate whether switching apps outweighs the rider's current streak/bonus on their usual platform.
4. ACTION: If a switch is profitable, explicitly mention the "Switch Window" in the narrative.

Output valid JSON only — no prose outside JSON, no markdown fences. Keep reasoning_narrative 3-5 sentences, plain Malaysian English.`,

    userPrompt: `ANALYSIS REQUEST:
Current Context: Date: 2026-04-24 (Friday). RON95 RM2.05/L. Weather: 08:00-22:00 mostly clear with rain 14:00-22:00, ~30°C. Events: KL Grand Prix fan zone in Bukit Jalil 18:00-23:00 (large crowd). Incentives: ShopeeFood: +RM4 flash incentive in Bangsar (Valid 12pm-3pm); Grab: 1.2x boost in PJ (Valid all day); FoodPanda: No active promos. Rider: recent 7-day avg RM106 net; this weekday pattern: 12:00 PJ avg RM36; 19:00 Bangsar avg RM54; 15:00 PJ avg RM11 (rain).

LIVE PROMO DATA:
- ShopeeFood: +RM4.00 flash incentive in Bangsar (Valid 12pm-3pm)
- Grab: 1.2x boost in PJ (Valid all day)
- FoodPanda: No active promos.

Return JSON: {recommendation (work|rest|partial), shift_windows (list of {start HH:MM, end HH:MM, zones, target_app}), projected_net_rm, projected_gross_rm, projected_petrol_rm, confidence (high|medium|low), reasoning_narrative (3-5 sentences), key_factors (list of {factor, impact, weight, note}), caveats (list of strings), source ("glm")}. JSON only.`,

    rawResponse: `{
    "recommendation": "work",
    "shift_windows": [
      {"start": "12:00", "end": "15:00", "zones": ["Bangsar"], "target_app": "ShopeeFood", "opportunity_gain_rm": 20.0},
      {"start": "18:00", "end": "22:00", "zones": ["Bangsar"], "target_app": "Grab", "opportunity_gain_rm": 0.0}
    ],
    "projected_net_rm": 145.5,
    "projected_gross_rm": 175,
    "projected_petrol_rm": 29.5,
    "confidence": "high",
    "reasoning_narrative": "ShopeeFood just dropped a +RM4 flash incentive in Bangsar until 3pm — that's a 30% boost on your hourly rate vs staying on Grab. Switch to ShopeeFood now for the 12-3pm window. After 3pm, switch back to Grab for the evening dinner rush in Bangsar, leveraging the 1.2x boost and spillover crowd from Bukit Jalil. Rain starts at 4pm but Bangsar demand stays strong with the Grand Prix crowd.",
    "key_factors": [
      {"factor": "ShopeeFood +RM4 voucher (12pm-3pm)", "impact": "positive", "weight": "high", "note": "Flash incentive worth ~RM4 × 5 orders = RM20 extra. This is the Switch Window."},
      {"factor": "Grab 1.2x boost (all day PJ)", "impact": "positive", "weight": "medium", "note": "Decent baseline but outperformed by ShopeeFood during the voucher window."},
      {"factor": "Klang Valley rain (14:00-22:00)", "impact": "negative", "weight": "medium", "note": "Increases demand/surge but slows delivery times and makes riding risky."},
      {"factor": "KL Grand Prix Fan Zone (Bukit Jalil)", "impact": "positive", "weight": "medium", "note": "Spillover crowd to nearby Bangsar increases dinner demand from 6pm."}
    ],
    "caveats": [
      "ShopeeFood voucher ends at 3pm — switch back to Grab after to avoid losing the 1.2x boost.",
      "Rain from 4pm may cause cancellations; plan routes carefully.",
      "Traffic around Bukit Jalil/Bangsar could be heavily congested from 18:00."
    ],
    "source": "glm"
  }`,
  };