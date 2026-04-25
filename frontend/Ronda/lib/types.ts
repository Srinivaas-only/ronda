// Ronda — types mirroring backend/schemas.py

export type Recommendation = "work" | "rest" | "partial";
export type Confidence = "high" | "medium" | "low";
export type Impact = "positive" | "negative" | "neutral";
export type Weight = "high" | "medium" | "low";

export interface ShiftWindow {
  start: string;
  end: string;
  zones: string[];
}

export interface KeyFactor {
  factor: string;
  impact: Impact;
  weight: Weight;
  note?: string;
}

export interface ShiftRecommendation {
  recommendation: Recommendation;
  shift_windows: ShiftWindow[];
  projected_net_rm: number;
  projected_gross_rm: number;
  projected_petrol_rm: number;
  confidence: Confidence;
  reasoning_narrative: string;
  key_factors: KeyFactor[];
  caveats: string[];
  source: "glm" | "fallback_rules";
}

export interface RiderContext {
  date: string;
  day_of_week: string;
  recent_7day_avg_net_rm: number;
  fuel_price_ron95_rm_per_litre: number;
  weather_summary: string;
  events_summary: string;
  incentives_summary: string;
}