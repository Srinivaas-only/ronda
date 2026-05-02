"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  defaultRequest,
  getRecommendation,
  type RecommendRequest,
  type RecommendResponse,
} from "@/lib/api";
import type { Confidence, Impact, Weight, ShiftWindow } from "@/lib/types";

const VERDICT_LABEL: Record<string, string> = {
  work: "RIDE TODAY",
  rest: "REST TODAY",
  partial: "RIDE PART-TIME",
};

const VERDICT_SUB: Record<string, string> = {
  work: "Conditions favour a working day — switch apps for max earnings",
  rest: "Today is not worth the risk — stay safe",
  partial: "Mixed signals — work selectively during peak windows",
};

const CONFIDENCE_LABEL: Record<Confidence, string> = {
  high: "High confidence",
  medium: "Medium confidence",
  low: "Low confidence",
};

const IMPACT_GLYPH: Record<Impact, string> = {
  positive: "▲",
  negative: "▼",
  neutral: "▪",
};

const WEIGHT_DOT: Record<Weight, string> = {
  high: "●●●",
  medium: "●●○",
  low: "●○○",
};

const NEON = "#CCFF00";
const ALERT_RED = "#FF3B3B";

type ViewState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "result"; data: RecommendResponse }
  | { kind: "error"; message: string };

const SAMPLE_BRIEF: RecommendResponse = {
  recommendation: {
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
      "ShopeeFood just dropped a +RM4 flash incentive in Bangsar until 3pm — that's a 30% boost on your hourly rate vs staying on Grab. Switch to ShopeeFood now for the 12-3pm window. After 3pm, switch back to Grab for the evening dinner rush in Bangsar, leveraging the 1.2x boost and spillover crowd from Bukit Jalil.",
    key_factors: [
      { factor: "ShopeeFood +RM4 voucher (12pm-3pm)", impact: "positive", weight: "high", note: "Flash incentive worth ~RM4 × 5 orders = RM20 extra. This is the Switch Window." },
      { factor: "Grab 1.2x boost (all day PJ)", impact: "positive", weight: "medium", note: "Decent baseline but outperformed by ShopeeFood during the voucher window." },
      { factor: "Klang Valley rain (14:00–22:00)", impact: "negative", weight: "medium", note: "Increases demand/surge but slows delivery times." },
      { factor: "KL Grand Prix Fan Zone (Bukit Jalil)", impact: "positive", weight: "medium", note: "Spillover crowd to nearby Bangsar increases dinner demand." },
    ],
    caveats: [
      "ShopeeFood voucher ends at 3pm — switch back to Grab after.",
      "Rain from 4pm may cause cancellations; plan routes carefully.",
      "Traffic around Bukit Jalil/Bangsar could be heavily congested from 18:00.",
    ],
    source: "glm",
  },
  meta: {
    model: "ilmu-glm-5.1",
    latency_seconds: 10.7,
    output_tokens: 1104,
    input_tokens: 0,
    prompt_chars: 850,
    context_summary_chars: 420,
    source: "glm",
  },
  trace: {
    systemPrompt: "(sample brief — click 'Coach Me' to see your real prompt)",
    userPrompt: "(sample brief — click 'Coach Me' to see your real prompt)",
    rawResponse: "(sample brief — click 'Coach Me' to see your real GLM response)",
  },
};

export default function RondaPage() {
  const [form, setForm] = useState<RecommendRequest>(defaultRequest);
  const [view, setView] = useState<ViewState>({ kind: "result", data: SAMPLE_BRIEF });

  function update<K extends keyof RecommendRequest>(key: K, value: RecommendRequest[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }
  function updateWeather(key: keyof RecommendRequest["weather"], value: string | number) {
    setForm((f) => ({ ...f, weather: { ...f.weather, [key]: value } }));
  }

  async function handleSubmit() {
    setView({ kind: "loading" });
    try {
      const data = await getRecommendation(form);
      setView({ kind: "result", data });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Reasoning engine error.";
      setView({ kind: "error", message });
    }
  }

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-[#f0f0f0]">
      <div className="mx-auto max-w-7xl px-6 py-8 sm:px-10 sm:py-12">
        {/* Header */}
        <div className="mb-10 flex items-center justify-between border-b border-[#222] pb-5">
          <div className="flex items-baseline gap-3">
            <span className="font-serif text-xl italic text-white">Ronda</span>
            <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#888]">
              Shift Coach &middot; Live Arbitrage
            </span>
          </div>
          <Link
            href="/compare"
            className="font-mono text-[10px] uppercase tracking-[0.25em] hover:underline"
            style={{ color: NEON }}
          >
            with vs without GLM &rarr;
          </Link>
        </div>

        <div className="grid gap-12 lg:grid-cols-[5fr_8fr] lg:gap-16">
          {/* LEFT: Form */}
          <aside className="lg:sticky lg:top-8 lg:self-start">
            <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#888]">
              Right now
            </p>
            <h1 className="mt-2 font-serif text-3xl font-normal italic leading-tight tracking-tight text-white">
              Stop guessing. Start earning.
            </h1>
            <p className="mt-3 text-[14px] leading-relaxed text-[#999]">
              Your Shift Coach monitors live platform incentives, weather, events & fuel &mdash; then tells you exactly when to switch apps and what zone to wait in.
            </p>

            <form
              onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}
              className="mt-8 space-y-7"
            >
              <Group label="Rider">
                <UnderlineField label="Name">
                  <UnderlineInput value={form.rider_name} onChange={(v) => update("rider_name", v)} />
                </UnderlineField>
                <div className="grid gap-5 sm:grid-cols-2">
                  <UnderlineField label="Platform">
                    <UnderlineInput value={form.rider_platform} onChange={(v) => update("rider_platform", v)} />
                  </UnderlineField>
                  <UnderlineField label="Home zone">
                    <UnderlineInput value={form.home_zone} onChange={(v) => update("home_zone", v)} />
                  </UnderlineField>
                </div>
                <UnderlineField label="Recent 7-day average net (RM)">
                  <UnderlineInput
                    type="number"
                    value={form.recent_7day_avg_net_rm.toString()}
                    onChange={(v) => update("recent_7day_avg_net_rm", Number(v) || 0)}
                  />
                </UnderlineField>
              </Group>

              <Group label="Today">
                <div className="grid gap-5 sm:grid-cols-2">
                  <UnderlineField label="Day">
                    <CustomSelect
                      value={form.day_of_week}
                      onChange={(v) => update("day_of_week", v)}
                      options={["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"]}
                    />
                  </UnderlineField>
                  <UnderlineField label="Date">
                    <UnderlineInput type="date" value={form.date} onChange={(v) => update("date", v)} />
                  </UnderlineField>
                </div>
                <div className="grid gap-5 sm:grid-cols-3">
                  <UnderlineField label="Morning">
                    <CustomSelect
                      value={form.weather.morning_condition}
                      onChange={(v) => updateWeather("morning_condition", v)}
                      options={["clear","cloudy","rain"]}
                    />
                  </UnderlineField>
                  <UnderlineField label="Afternoon">
                    <CustomSelect
                      value={form.weather.afternoon_condition}
                      onChange={(v) => updateWeather("afternoon_condition", v)}
                      options={["clear","cloudy","rain"]}
                    />
                  </UnderlineField>
                  <UnderlineField label="Evening">
                    <CustomSelect
                      value={form.weather.evening_condition}
                      onChange={(v) => updateWeather("evening_condition", v)}
                      options={["clear","cloudy","rain"]}
                    />
                  </UnderlineField>
                </div>
                <UnderlineField label="RON95 fuel price (RM/L)">
                  <UnderlineInput
                    type="number"
                    step="0.01"
                    value={form.fuel_price_ron95_rm.toString()}
                    onChange={(v) => update("fuel_price_ron95_rm", Number(v) || 0)}
                  />
                </UnderlineField>
              </Group>

              <Group label="Signals">
                <UnderlineField label="Events">
                  <UnderlineTextarea
                    value={form.events_text}
                    onChange={(v) => update("events_text", v)}
                    placeholder="e.g. concert at Axiata Arena 19:00-23:00"
                  />
                </UnderlineField>
                <UnderlineField label="Live promo data (all platforms)">
                  <UnderlineTextarea
                    value={form.incentives_text}
                    onChange={(v) => update("incentives_text", v)}
                    placeholder={"e.g. ShopeeFood: +RM4 Bangsar 12-3pm\nGrab: 1.2x PJ all day\nFoodPanda: no promos"}
                  />
                </UnderlineField>
              </Group>

              <div className="flex items-center justify-between border-t border-[#222] pt-5">
                <span className="font-mono text-xs text-[#666]">
                  ilmu-glm-5.1 &middot; ~10s
                </span>
                <button
                  type="submit"
                  disabled={view.kind === "loading"}
                  className="rounded-md px-5 py-2.5 font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-black transition-all hover:brightness-110 disabled:opacity-40"
                  style={{ backgroundColor: NEON }}
                >
                  {view.kind === "loading" ? "Thinking\u2026" : "Coach Me \u2192"}
                </button>
              </div>
            </form>
          </aside>

          {/* RIGHT: Brief */}
          <section className="min-w-0">
            {view.kind === "loading" && <LoadingState />}
            {view.kind === "error" && <ErrorState message={view.message} />}
            {view.kind === "result" && <Brief data={view.data} form={form} />}
            {view.kind === "idle" && <div className="opacity-50 text-[#888]">Click "Coach Me" to begin.</div>}
          </section>
        </div>
      </div>
    </main>
  );
}

/* Glanceable Components */

function ProfitDial({ net, avg }: { net: number; avg: number }) {
  const cap = avg * 1.5;
  const pct = Math.min(100, Math.round((net / cap) * 100));
  const barColor = pct >= 70 ? NEON : pct >= 40 ? "#FFA500" : ALERT_RED;
  return (
    <div className="rounded-xl border border-[#222] bg-[#111] p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#888]">
          Earnings Potential
        </span>
        <span className="font-mono text-2xl font-bold" style={{ color: barColor }}>
          {pct}%
        </span>
      </div>
      <div className="h-3 w-full rounded-full bg-[#1a1a1a] overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, backgroundColor: barColor }}
        />
      </div>
      <p className="mt-2 font-mono text-[10px] text-[#666]">
        Based on RM{net.toFixed(0)} net vs your RM{avg.toFixed(0)} avg (max RM{cap.toFixed(0)})
      </p>
    </div>
  );
}

function SwitchLogicCard({ windows, currentPlatform }: { windows: ShiftWindow[]; currentPlatform: string }) {
  const switchWindows = windows.filter((w) => w.target_app && w.target_app !== currentPlatform && (w.opportunity_gain_rm ?? 0) > 0);
  if (switchWindows.length === 0) return null;

  return (
    <div className="rounded-xl border border-[#222] bg-[#111] p-5">
      <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#888] mb-4">
        {"\uD83D\uDD00"} Your Shift Coach says: SWITCH NOW
      </p>
      {switchWindows.map((w, i) => (
        <div key={i} className="flex items-center gap-4 mb-3 last:mb-0">
          <div className="flex-1 rounded-lg border border-[#333] bg-[#1a1a1a] p-3 text-center">
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#888]">Current</p>
            <p className="font-mono text-lg font-bold text-white mt-1">{currentPlatform}</p>
            <p className="font-mono text-[10px] text-[#666] mt-1">{w.start} &mdash; {w.end}</p>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-xl" style={{ color: NEON }}>&rarr;</span>
            <span className="font-mono text-[10px] font-bold mt-1" style={{ color: NEON }}>
              +RM{w.opportunity_gain_rm?.toFixed(0)}
            </span>
          </div>
          <div className="flex-1 rounded-lg p-3 text-center" style={{ borderColor: NEON, borderWidth: 1, backgroundColor: `${NEON}10` }}>
            <p className="font-mono text-[9px] uppercase tracking-[0.2em]" style={{ color: NEON }}>Switch to</p>
            <p className="font-mono text-lg font-bold mt-1" style={{ color: NEON }}>{w.target_app}</p>
            <p className="font-mono text-[10px] text-[#999] mt-1">{w.zones.join(" \u00B7 ")}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function OpportunityCost({ windows, currentPlatform }: { windows: ShiftWindow[]; currentPlatform: string }) {
  const totalGain = windows
    .filter((w) => w.target_app && w.target_app !== currentPlatform)
    .reduce((sum, w) => sum + (w.opportunity_gain_rm ?? 0), 0);
  if (totalGain <= 0) return null;

  return (
    <div className="rounded-xl border p-4 flex items-center gap-4" style={{ borderColor: `${ALERT_RED}40`, backgroundColor: `${ALERT_RED}10` }}>
      <span className="text-2xl">{"\u26A0\uFE0F"}</span>
      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.2em]" style={{ color: ALERT_RED }}>
          Opportunity Cost
        </p>
        <p className="font-mono text-lg font-bold mt-1" style={{ color: ALERT_RED }}>
          Staying on {currentPlatform} costs you ~RM{totalGain.toFixed(0)} today
        </p>
        <p className="font-mono text-[10px] text-[#999] mt-1">
          Switch apps during the detected window to get back-to-back deliveries instead of waiting idle
        </p>
      </div>
    </div>
  );
}

function LivePulse({ factors }: { factors: { factor: string; impact: string; weight: string; note?: string }[] }) {
  const triggers = factors.map((f) => {
    let icon = "\uD83D\uDCCA";
    let label = f.factor;
    if (f.factor.toLowerCase().includes("rain") || f.factor.toLowerCase().includes("weather")) {
      icon = "\uD83C\uDF27\uFE0F";
    } else if (f.factor.toLowerCase().includes("grand prix") || f.factor.toLowerCase().includes("bukit jalil") || f.factor.toLowerCase().includes("concert") || f.factor.toLowerCase().includes("fan zone")) {
      icon = "\uD83C\uDFDF\uFE0F";
    } else if (f.factor.toLowerCase().includes("voucher") || f.factor.toLowerCase().includes("boost") || f.factor.toLowerCase().includes("incentive") || f.factor.toLowerCase().includes("shopee") || f.factor.toLowerCase().includes("grab")) {
      icon = "\uD83D\uDCB0";
    }
    const shortLabel = f.note
      ? (f.note.length > 50 ? f.note.slice(0, 50) + "\u2026" : f.note)
      : label;
    return { icon, label, shortLabel, impact: f.impact, weight: f.weight };
  });

  return (
    <div className="rounded-xl border border-[#222] bg-[#111] p-5">
      <div className="flex items-center gap-2 mb-4">
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: NEON }} />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5" style={{ backgroundColor: NEON }} />
        </span>
        <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#888]">
          Live Pulse &mdash; What Your Shift Coach is Sensing
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {triggers.map((t, i) => (
          <div
            key={i}
            className="rounded-lg border border-[#222] bg-[#1a1a1a] px-3 py-2 flex items-center gap-2"
          >
            <span className="text-sm">{t.icon}</span>
            <span className="font-mono text-[11px] text-[#ccc]">{t.shortLabel}</span>
            <span
              className="font-mono text-[9px] uppercase font-bold"
              style={{
                color: t.impact === "positive" ? NEON : t.impact === "negative" ? ALERT_RED : "#888",
              }}
            >
              {t.weight === "high" ? "HIGH" : t.weight === "medium" ? "MED" : "LOW"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function VoucherSniper({ incentivesText }: { incentivesText: string }) {
  if (!incentivesText.trim()) return null;

  const lines = incentivesText.trim().split("\n").filter((l) => l.trim());
  const vouchers = lines.map((line) => {
    const colonIdx = line.indexOf(":");
    if (colonIdx === -1) return { platform: line.trim(), detail: "", active: false, hasBonus: false };
    const platform = line.slice(0, colonIdx).trim();
    const detail = line.slice(colonIdx + 1).trim();
    const isActive = !detail.toLowerCase().includes("no active") && !detail.toLowerCase().includes("no promo");
    const hasBonus = detail.includes("RM") || detail.includes("+");
    return { platform, detail, active: isActive, hasBonus };
  });

  return (
    <div className="rounded-xl border border-[#222] bg-[#111] p-5">
      <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#888] mb-4">
        {"\uD83C\uDFAF"} Voucher Sniper &mdash; Flash Promos & Order Spikes
      </p>
      <div className="grid gap-2 sm:grid-cols-3">
        {vouchers.map((v, i) => (
          <div
            key={i}
            className={`rounded-lg border p-3 ${
              v.active && v.hasBonus
                ? "border-[#222]"
                : v.active
                ? "border-[#222]"
                : "border-[#1a1a1a] opacity-40"
            }`}
            style={{
              backgroundColor: v.active && v.hasBonus ? `${NEON}10` : "#1a1a1a",
              borderColor: v.active && v.hasBonus ? `${NEON}40` : undefined,
            }}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className={`h-2 w-2 rounded-full ${v.active ? "animate-pulse" : ""}`}
                style={{ backgroundColor: v.active && v.hasBonus ? NEON : v.active ? "#FFA500" : "#555" }}
              />
              <span className="font-mono text-[10px] uppercase tracking-[0.15em] font-bold text-white">
                {v.platform}
              </span>
              {v.active && v.hasBonus && (
                <span className="rounded px-1.5 py-0.5 font-mono text-[8px] font-bold uppercase" style={{ backgroundColor: NEON, color: "black" }}>
                  {"\u26A1"} FLASH
                </span>
              )}
            </div>
            <p className={`font-mono text-[11px] ${v.active ? "text-[#ccc]" : "text-[#555]"}`}>
              {v.detail || "No spike detected"}
            </p>
            {v.active && v.hasBonus && (
              <p className="font-mono text-[9px] mt-1" style={{ color: NEON }}>
                Order spike expected &mdash; switch now for back-to-back deliveries
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* BRIEF */

function LoadingState() {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center rounded-xl border border-dashed border-[#333] px-8 py-16 text-center">
      <p className="font-serif text-2xl italic text-white">Your Shift Coach is thinking&hellip;</p>
      <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.25em] text-[#888]">
        Analyzing live data via GLM-5.1 &middot; ~10 seconds
      </p>
      <div className="mt-6 h-1 w-32 overflow-hidden rounded-full bg-[#222]">
        <div className="h-full w-1/3 animate-pulse rounded-full" style={{ backgroundColor: NEON }} />
      </div>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="rounded-xl border p-6" style={{ borderColor: `${ALERT_RED}40`, backgroundColor: `${ALERT_RED}10` }}>
      <p className="font-mono text-[11px] uppercase tracking-[0.25em]" style={{ color: ALERT_RED }}>
        Backend error
      </p>
      <p className="mt-2 font-serif text-base text-white">{message}</p>
      <p className="mt-3 text-sm text-[#999]">
        Make sure the FastAPI backend is running at <code className="font-mono text-[#ccc]">localhost:8000</code>.
      </p>
    </div>
  );
}

function Brief({ data, form }: { data: RecommendResponse; form: RecommendRequest }) {
  const r = data.recommendation;
  const m = data.meta;
  const trace = data.trace;
  const uplift = r.projected_net_rm - form.recent_7day_avg_net_rm;
  const upliftPct = form.recent_7day_avg_net_rm > 0 ? (uplift / form.recent_7day_avg_net_rm) * 100 : 0;

  // Estimate delivery density for the RESULT section
  const hasSwitch = r.shift_windows.some((w) => (w.opportunity_gain_rm ?? 0) > 0);
  const deliveriesPerHr = hasSwitch ? "~6/hr during Switch Window" : "~3/hr average";
  const idleTime = hasSwitch ? "~15 min idle (vs 45 min without switching)" : "~45 min idle between orders";

  return (
    <div className="space-y-8">
      {/* Verdict */}
      <header>
        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#888]">
          {form.day_of_week} &middot; {form.date}
        </p>
        <h2 className="mt-3 font-serif text-2xl italic text-[#999]">
          Hi, {form.rider_name}.
        </h2>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <h3 className="font-mono text-6xl font-black leading-none tracking-tight text-white sm:text-7xl">
            {VERDICT_LABEL[r.recommendation]}
          </h3>
          <p className="font-mono text-sm" style={{ color: r.confidence === "high" ? NEON : r.confidence === "medium" ? "#FFA500" : ALERT_RED }}>
            {CONFIDENCE_LABEL[r.confidence]}
          </p>
        </div>
        <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-[#999]">
          {VERDICT_SUB[r.recommendation]}.
        </p>
      </header>

      <ProfitDial net={r.projected_net_rm} avg={form.recent_7day_avg_net_rm} />
      <SwitchLogicCard windows={r.shift_windows} currentPlatform={form.rider_platform} />
      <OpportunityCost windows={r.shift_windows} currentPlatform={form.rider_platform} />
      <VoucherSniper incentivesText={form.incentives_text} />
      <LivePulse factors={r.key_factors} />

      {/* Projected Earnings + RESULT */}
      <section>
        <SectionLabel>Projected Earnings</SectionLabel>
        <div className="mb-1 flex items-baseline justify-end">
          <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#888]">
            vs 7-day avg RM{form.recent_7day_avg_net_rm.toFixed(0)}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-px overflow-hidden rounded-xl bg-[#222]">
          <Stat label="Gross" value={`RM ${r.projected_gross_rm.toFixed(0)}`} />
          <Stat label="Petrol" value={`\u2212 RM ${r.projected_petrol_rm.toFixed(0)}`} />
          <Stat
            label="Net"
            value={`RM ${r.projected_net_rm.toFixed(0)}`}
            accent
            sub={`${uplift >= 0 ? "+" : ""}${upliftPct.toFixed(1)}%`}
          />
        </div>
        {/* RESULT: delivery density & idle time */}
        <div className="mt-3 grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-[#222] bg-[#111] p-3 text-center">
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#888]">Delivery Density</p>
            <p className="font-mono text-lg font-bold mt-1" style={{ color: NEON }}>{deliveriesPerHr}</p>
            <p className="font-mono text-[9px] text-[#666] mt-1">Back-to-back during peak</p>
          </div>
          <div className="rounded-lg border border-[#222] bg-[#111] p-3 text-center">
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#888]">Idle Time</p>
            <p className="font-mono text-lg font-bold mt-1" style={{ color: hasSwitch ? NEON : "#FFA500" }}>{idleTime}</p>
            <p className="font-mono text-[9px] text-[#666] mt-1">Less waiting = more earning</p>
          </div>
        </div>
      </section>

      {/* Shift Windows */}
      <section>
        <SectionLabel>Shift Windows</SectionLabel>
        <div className="space-y-3">
          {r.shift_windows.map((w, i) => (
            <div
              key={i}
              className="flex items-center justify-between gap-4 rounded-lg border border-[#222] bg-[#111] px-5 py-4"
            >
              <span className="font-mono text-2xl font-bold tracking-tight text-white">
                {w.start}
                <span className="text-[#555]"> &mdash; </span>
                {w.end}
              </span>
              <div className="flex items-center gap-3">
                <span className="font-serif italic text-[#999]">
                  {w.zones.join(" \u00B7 ")}
                </span>
                {w.target_app && (
                  <span
                    className="rounded-md px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.15em]"
                    style={{
                      color: (w.opportunity_gain_rm ?? 0) > 0 ? "black" : "#ccc",
                      backgroundColor: (w.opportunity_gain_rm ?? 0) > 0 ? NEON : "#333",
                    }}
                  >
                    {w.target_app}
                  </span>
                )}
                {(w.opportunity_gain_rm ?? 0) > 0 && (
                  <span className="font-mono text-xs font-bold" style={{ color: NEON }}>
                    +RM{w.opportunity_gain_rm!.toFixed(0)}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Reasoning */}
      <section>
        <SectionLabel>What Your Shift Coach is Thinking</SectionLabel>
        <blockquote className="rounded-xl border-l-4 bg-[#111] p-5 font-serif text-lg italic leading-relaxed text-white" style={{ borderColor: NEON }}>
          &ldquo;{r.reasoning_narrative}&rdquo;
        </blockquote>
      </section>

      {/* Key Factors */}
      <section>
        <SectionLabel>What Drove This</SectionLabel>
        <ul className="divide-y divide-[#1a1a1a]">
          {r.key_factors.map((f, i) => (
            <li key={i} className="grid grid-cols-[auto_1fr_auto] items-baseline gap-4 py-4">
              <span
                className="font-mono text-lg"
                style={{
                  color: f.impact === "positive" ? NEON : f.impact === "negative" ? ALERT_RED : "#666",
                }}
                aria-hidden
              >
                {IMPACT_GLYPH[f.impact]}
              </span>
              <div>
                <p className="font-medium text-white">{f.factor}</p>
                {f.note && (
                  <p className="mt-1 text-sm leading-relaxed text-[#999]">{f.note}</p>
                )}
              </div>
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#666]">
                {WEIGHT_DOT[f.weight]}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* Caveats */}
      {r.caveats.length > 0 && (
        <section>
          <SectionLabel>Watch Out For</SectionLabel>
          <ul className="space-y-2">
            {r.caveats.map((cav, i) => (
              <li key={i} className="flex gap-3 text-[15px] leading-relaxed text-[#ccc]">
                <span style={{ color: ALERT_RED }} aria-hidden>{"\u26A0"}</span>
                <span>{cav}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Footer */}
      <footer className="border-t border-[#222] pt-6">
        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#666]">
          Reasoned by {m.model} &middot; {m.latency_seconds.toFixed(1)}s &middot; {m.output_tokens} tokens &middot; source: {m.source}
        </p>
      </footer>

      {/* Developer Trace */}
      <details className="group rounded-xl border border-[#222] bg-[#111]">
        <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-4 font-mono text-[10px] uppercase tracking-[0.25em] text-[#888] hover:text-white">
          <span>Developer trace &mdash; view GLM-5.1 prompt & response</span>
          <span className="font-mono text-base transition-transform group-open:rotate-45" aria-hidden>+</span>
        </summary>
        <div className="space-y-6 border-t border-[#222] px-5 py-6">
          <div className="grid gap-3 font-mono text-[11px] sm:grid-cols-3">
            <Kv label="Endpoint" value="api.ilmu.ai/anthropic" />
            <Kv label="Model" value={m.model} />
            <Kv label="Latency" value={`${m.latency_seconds.toFixed(1)}s`} />
            <Kv label="Output tokens" value={m.output_tokens.toString()} />
            <Kv label="Prompt size" value={`${m.prompt_chars} chars`} />
            <Kv label="Context summary" value={`${m.context_summary_chars} chars`} />
          </div>
          <TraceBlock label="System prompt" body={trace.systemPrompt} />
          <TraceBlock label="User prompt" body={trace.userPrompt} />
          <TraceBlock label="Raw response (JSON)" body={trace.rawResponse} />
        </div>
      </details>
    </div>
  );
}

/* FORM COMPONENTS */

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <fieldset className="space-y-5">
      <legend className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#555]">
        {label}
      </legend>
      <div className="space-y-5">{children}</div>
    </fieldset>
  );
}

function UnderlineField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block font-mono text-[10px] uppercase tracking-[0.2em] text-[#666]">
        {label}
      </span>
      {children}
    </label>
  );
}

function UnderlineInput({
  value, onChange, type = "text", step,
}: { value: string; onChange: (v: string) => void; type?: string; step?: string }) {
  return (
    <input
      type={type}
      step={step}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full border-b border-[#333] bg-transparent py-1.5 font-mono text-sm text-white focus:border-[#CCFF00] focus:outline-none [color-scheme:dark]"
    />
  );
}

function UnderlineTextarea({
  value, onChange, placeholder,
}: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={2}
      className="w-full resize-none border-b border-[#333] bg-transparent py-1.5 font-mono text-sm text-white placeholder:text-[#444] focus:border-[#CCFF00] focus:outline-none"
    />
  );
}

function CustomSelect({
  value, onChange, options,
}: { value: string; onChange: (v: string) => void; options: string[] }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    function handleClick() { setOpen(false); }
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [open]);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }}
        className="flex w-full items-center justify-between border-b border-[#333] bg-transparent py-1.5 font-mono text-sm text-white hover:border-[#555] focus:border-[#CCFF00] focus:outline-none"
      >
        <span>{value}</span>
        <span className="text-xs text-[#666]" aria-hidden>{open ? "\u25B4" : "\u25BE"}</span>
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute z-10 mt-1 w-full rounded-lg border border-[#333] bg-[#1a1a1a] py-1 font-mono text-sm shadow-lg"
        >
          {options.map((o) => {
            const active = o === value;
            return (
              <li key={o}>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onChange(o); setOpen(false); }}
                  className={`flex w-full items-center justify-between px-3 py-1.5 text-left ${
                    active
                      ? "text-black font-bold"
                      : "text-[#ccc] hover:bg-[#222]"
                  }`}
                  style={active ? { backgroundColor: NEON } : undefined}
                >
                  <span>{o}</span>
                  {active && <span className="text-xs" aria-hidden>{"\u2713"}</span>}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/* SHARED UI COMPONENTS */

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mb-4 border-b border-[#222] pb-2 font-mono text-[10px] uppercase tracking-[0.25em] text-[#888]">
      {children}
    </h3>
  );
}

function Stat({
  label, value, sub, accent = false,
}: { label: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <div className={`flex flex-col gap-1 px-4 py-5 ${accent ? "bg-[#0d0d0d]" : "bg-[#141414]"}`}>
      <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#888]">
        {label}
      </span>
      <span className={`font-mono tracking-tight ${accent ? "text-3xl font-bold text-white" : "text-xl text-[#ccc]"}`}>
        {value}
      </span>
      {sub && <span className="font-mono text-[10px] font-bold" style={{ color: NEON }}>{sub}</span>}
    </div>
  );
}

function Kv({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 border-l-2 pl-3" style={{ borderColor: `${NEON}60` }}>
      <span className="text-[#888]">{label}</span>
      <span className="text-white">{value}</span>
    </div>
  );
}

function TraceBlock({ label, body }: { label: string; body: string }) {
  return (
    <div>
      <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.25em] text-[#888]">
        {label}
      </p>
      <pre className="overflow-x-auto whitespace-pre-wrap break-words rounded-lg border border-[#222] bg-[#0d0d0d] p-4 font-mono text-[11px] leading-relaxed text-[#ccc]">
        {body}
      </pre>
    </div>
  );
}