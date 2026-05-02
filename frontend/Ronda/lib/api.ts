// API client for the Ronda FastAPI backend.

import type { ShiftRecommendation } from "./types";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export interface WeatherInput {
  morning_condition: "clear" | "cloudy" | "rain";
  afternoon_condition: "clear" | "cloudy" | "rain";
  evening_condition: "clear" | "cloudy" | "rain";
  temp_c: number;
}

export interface RecommendRequest {
  rider_name: string;
  rider_platform: string;
  home_zone: string;
  day_of_week: string;
  date: string;
  fuel_price_ron95_rm: number;
  recent_7day_avg_net_rm: number;
  weather: WeatherInput;
  events_text: string;
  incentives_text: string;
}

export interface RecommendMeta {
  model: string;
  latency_seconds: number;
  output_tokens: number;
  input_tokens: number;
  prompt_chars: number;
  context_summary_chars: number;
  source: "glm" | "fallback_rules";
}

export interface RecommendTrace {
  systemPrompt: string;
  userPrompt: string;
  rawResponse: string;
}

export interface RecommendResponse {
  recommendation: ShiftRecommendation;
  meta: RecommendMeta;
  trace: RecommendTrace;
}

export const defaultRequest: RecommendRequest = {
  rider_name: "Aiman",
  rider_platform: "Grab",
  home_zone: "Petaling Jaya",
  day_of_week: "Friday",
  date: "2026-04-25",
  fuel_price_ron95_rm: 2.05,
  recent_7day_avg_net_rm: 105,
  weather: {
    morning_condition: "clear",
    afternoon_condition: "rain",
    evening_condition: "clear",
    temp_c: 30,
  },
  events_text: "KL Grand Prix fan zone in Bukit Jalil 18:00–23:00 (large crowd)",
  incentives_text: "ShopeeFood: +RM4 flash incentive in Bangsar (Valid 12pm-3pm)\nGrab: 1.2x boost in PJ (Valid all day)\nFoodPanda: No active promos",
};

export async function getRecommendation(
  req: RecommendRequest,
): Promise<RecommendResponse> {
  const res = await fetch(`${BACKEND_URL}/api/recommend`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `Backend returned ${res.status}: ${text || res.statusText}`,
    );
  }

  return (await res.json()) as RecommendResponse;
}