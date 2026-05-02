"use client";

import Link from "next/link";
import {
  ruleBasedRecommendation,
  glmAdvantages,
} from "@/lib/compare-data";
import { demoRecommendation } from "@/lib/demo-data";

const NEON = "#CCFF00";
const ALERT_RED = "#FF3B3B";

const VERDICT_LABEL: Record<string, string> = {
  work: "RIDE TODAY",
  rest: "REST TODAY",
  partial: "RIDE PART-TIME",
};

export default function ComparePage() {
  const rules = ruleBasedRecommendation;
  const glm = demoRecommendation;
  const diff = glm.projected_net_rm - rules.projected_net_rm;

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-[#f0f0f0]">
      <div className="mx-auto max-w-5xl px-6 py-10 sm:px-10">
        {/* Header */}
        <div className="mb-10 flex items-center justify-between border-b border-[#222] pb-5">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#888]">
              Comparison · Same Friday, Same Rider
            </p>
            <h1 className="mt-2 font-serif text-3xl italic text-white">
              What the rules engine missed
            </h1>
          </div>
          <Link
            href="/"
            className="font-mono text-[10px] uppercase tracking-[0.25em] hover:underline"
            style={{ color: NEON }}
          >
            ← back to brief
          </Link>
        </div>

        {/* Side-by-side */}
        <div className="grid gap-8 md:grid-cols-2">
          {/* Rules Card */}
          <Card label="Rules Engine (without GLM)" borderColor="#444">
            <Verdict verdict={rules.recommendation} confidence={rules.confidence} />
            <NetEarnings rm={rules.projected_net_rm} />
            <ShiftList windows={rules.shift_windows} />
            <Narrative text={rules.reasoning_narrative} />
            <Meta source={rules.source} />
          </Card>

          {/* GLM Card */}
          <Card label="Ronda-GLM (with Platform Arbitrage)" borderColor={NEON}>
            <Verdict verdict={glm.recommendation} confidence={glm.confidence} />
            <NetEarnings rm={glm.projected_net_rm} />
            {/* Opportunity cost callout */}
            {diff > 0 && (
              <div className="rounded-lg p-3 mb-4" style={{ backgroundColor: `${NEON}10`, border: `1px solid ${NEON}40` }}>
                <p className="font-mono text-[10px] uppercase tracking-[0.2em]" style={{ color: NEON }}>
                  💰 GLM found +RM{diff.toFixed(0)} extra
                </p>
                <p className="font-mono text-sm text-[#ccc] mt-1">
                  Staying on Grab all day would have cost you RM{diff.toFixed(0)}
                </p>
              </div>
            )}
            <ShiftList windows={glm.shift_windows} highlight />
            <Narrative text={glm.reasoning_narrative} />
            <Meta source={glm.source} />
          </Card>
        </div>

        {/* Delta */}
        <div className="mt-8 rounded-xl border border-[#222] bg-[#111] p-6 text-center">
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#888]">
            Net earnings difference
          </p>
          <p className="mt-3 font-mono text-5xl font-black" style={{ color: diff > 0 ? NEON : ALERT_RED }}>
            {diff > 0 ? "+" : ""}RM {diff.toFixed(0)}
          </p>
          <p className="mt-2 font-mono text-sm text-[#999]">
            {diff > 0
              ? "Ronda-GLM catches the Switch Window. That's the difference between waiting for orders and getting back-to-back deliveries."
              : "No advantage detected."}
          </p>
        </div>

        {/* Advantages table */}
        <section className="mt-12">
          <h2 className="border-b border-[#222] pb-3 font-mono text-[10px] uppercase tracking-[0.25em] text-[#888]">
            What GLM caught that rules missed
          </h2>
          <div className="divide-y divide-[#1a1a1a]">
            {glmAdvantages.map((a, i) => (
              <div key={i} className="grid gap-4 py-5 md:grid-cols-[180px_1fr_1fr]">
                <p className="font-mono text-[11px] font-bold text-white">{a.category}</p>
                <div className="rounded-lg border border-[#222] bg-[#111] p-3">
                  <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#888] mb-1">Rules</p>
                  <p className="text-[13px] leading-relaxed text-[#999]">{a.rules}</p>
                </div>
                <div className="rounded-lg p-3" style={{ backgroundColor: `${NEON}08`, border: `1px solid ${NEON}30` }}>
                  <p className="font-mono text-[9px] uppercase tracking-[0.2em] mb-1" style={{ color: NEON }}>GLM</p>
                  <p className="text-[13px] leading-relaxed text-[#ccc]">{a.glm}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Closing */}
        <div className="mt-12 rounded-xl border border-[#222] bg-[#111] p-8 text-center">
          <p className="font-serif text-xl italic text-white">
            "The rules engine sees a number. Ronda-GLM sees an opportunity. Back-to-back deliveries, zero idle time, maximum net profit."
          </p>
          <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.25em] text-[#888]">
            Platform Arbitrage — the anti-ChatGPT edge
          </p>
        </div>
      </div>
    </main>
  );
}

/* ─── Sub-components ─── */

function Card({
  label, borderColor, children,
}: { label: string; borderColor: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border bg-[#111] p-6 space-y-4" style={{ borderColor }}>
      <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#888]">{label}</p>
      {children}
    </div>
  );
}

function Verdict({ verdict, confidence }: { verdict: string; confidence: string }) {
  return (
    <div className="flex items-end justify-between">
      <span className="font-mono text-3xl font-black text-white">{VERDICT_LABEL[verdict]}</span>
      <span
        className="font-mono text-[10px] uppercase font-bold"
        style={{ color: confidence === "high" ? NEON : confidence === "medium" ? "#FFA500" : ALERT_RED }}
      >
        {confidence}
      </span>
    </div>
  );
}

function NetEarnings({ rm }: { rm: number }) {
  return (
    <div className="rounded-lg bg-[#0d0d0d] p-4 text-center">
      <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#888]">Net earnings</p>
      <p className="mt-1 font-mono text-4xl font-black text-white">RM {rm.toFixed(0)}</p>
    </div>
  );
}

function ShiftList({ windows, highlight = false }: { windows: { start: string; end: string; zones: string[]; target_app?: string; opportunity_gain_rm?: number }[]; highlight?: boolean }) {
  return (
    <div className="space-y-2">
      {windows.map((w, i) => (
        <div key={i} className="flex items-center justify-between rounded-lg border border-[#222] bg-[#0d0d0d] px-4 py-2.5">
          <span className="font-mono text-sm font-bold text-white">{w.start} — {w.end}</span>
          <div className="flex items-center gap-2">
            <span className="font-serif text-xs italic text-[#999]">{w.zones.join(" · ")}</span>
            {w.target_app && (
              <span
                className="rounded px-2 py-0.5 font-mono text-[9px] font-bold uppercase"
                style={{
                  color: highlight && (w.opportunity_gain_rm ?? 0) > 0 ? "black" : "#ccc",
                  backgroundColor: highlight && (w.opportunity_gain_rm ?? 0) > 0 ? NEON : "#333",
                }}
              >
                {w.target_app}
              </span>
            )}
            {highlight && (w.opportunity_gain_rm ?? 0) > 0 && (
              <span className="font-mono text-[10px] font-bold" style={{ color: NEON }}>
                +RM{w.opportunity_gain_rm!.toFixed(0)}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function Narrative({ text }: { text: string }) {
  return (
    <blockquote className="rounded-lg border-l-2 bg-[#0d0d0d] p-3 font-serif text-sm italic leading-relaxed text-[#ccc]" style={{ borderColor: "#333" }}>
      "{text}"
    </blockquote>
  );
}

function Meta({ source }: { source: string }) {
  return (
    <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#555]">
      source: {source}
    </p>
  );
}