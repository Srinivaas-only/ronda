// Real GLM-5.1 output captured from a successful run on 2026-04-25 13:07 MYT.
// Hardcoded so the demo works even if ILMU is offline during recording.

import type { ShiftRecommendation, RiderContext } from "./types";

export const demoContext: RiderContext = {
  date: "2026-04-24",
  day_of_week: "Friday",
  recent_7day_avg_net_rm: 105.5,
  fuel_price_ron95_rm_per_litre: 2.05,
  weather_summary: "Mostly clear morning, rain 14:00–22:00, ~30°C",
  events_summary: "KL Grand Prix fan zone in Bukit Jalil 18:00–23:00 (large crowd)",
  incentives_summary: "+RM2 per delivery in Bangsar 18:00–22:00",
};

export const demoRecommendation: ShiftRecommendation = {
  recommendation: "work",
  shift_windows: [
    { start: "11:30", end: "14:00", zones: ["PJ"] },
    { start: "18:00", end: "22:00", zones: ["Bangsar"] },
  ],
  projected_net_rm: 108,
  projected_gross_rm: 133,
  projected_petrol_rm: 25,
  confidence: "medium",
  reasoning_narrative:
    "Better to split shift today. Morning PJ run before the rain starts can secure steady orders. Evening shift in Bangsar is solid because of the RM2 incentive and spillover crowd from Bukit Jalil, but rain might slow things down a bit. Skip the 15:00 slot since your history shows rain kills earnings there. Overall should hit slightly above your average if you stick to the dry and incentivised hours.",
  key_factors: [
    {
      factor: "Afternoon rain (14:00–22:00)",
      impact: "negative",
      weight: "high",
      note: "Reduces order volume and makes riding risky, especially the 15:00 PJ slot.",
    },
    {
      factor: "Bangsar +RM2 incentive (18:00–22:00)",
      impact: "positive",
      weight: "high",
      note: "Significantly boosts gross earnings per delivery during peak dinner.",
    },
    {
      factor: "KL Grand Prix Fan Zone (Bukit Jalil)",
      impact: "positive",
      weight: "medium",
      note: "Spillover crowd to nearby Bangsar increases demand; direct Bukit Jalil access may jam.",
    },
    {
      factor: "RON95 at RM2.05/L",
      impact: "neutral",
      weight: "low",
      note: "Standard fuel cost, no major impact on daily net.",
    },
  ],
  caveats: [
    "Rain forecast 14:00–22:00 might cause cancellations or slower delivery times.",
    "Traffic around Bukit Jalil/Bangsar could be heavily congested from 18:00.",
    "Projected net is based on 7-day average; actual depends on rain intensity.",
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