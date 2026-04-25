"use client";

import Link from "next/link";
import { demoContext, demoRecommendation } from "@/lib/demo-data";
import { ruleBasedRecommendation, glmAdvantages } from "@/lib/compare-data";
import type { ShiftRecommendation } from "@/lib/types";

export default function ComparePage() {
  const c = demoContext;

  return (
    <main className="min-h-screen bg-[#f4efe6] text-[#1a1a1a] dark:bg-[#0d0c0a] dark:text-[#e8e4d8]">
      <div className="mx-auto max-w-6xl px-6 py-10 sm:px-10 sm:py-16">
        <header className="mb-12 border-b border-[#1a1a1a]/15 pb-6 dark:border-[#e8e4d8]/15">
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#1a1a1a]/60 dark:text-[#e8e4d8]/60">
                Ronda — Reasoning Comparison
              </p>
              <h1 className="mt-1 font-serif text-4xl font-normal italic tracking-tight">
                With GLM, without GLM.
              </h1>
            </div>
            <Link
              href="/"
              className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#1a1a1a]/60 hover:text-[#1a1a1a] dark:text-[#e8e4d8]/60 dark:hover:text-[#e8e4d8]"
            >
              ← back to morning brief
            </Link>
          </div>
          <p className="mt-4 max-w-3xl text-[15px] leading-relaxed text-[#1a1a1a]/75 dark:text-[#e8e4d8]/75">
            Same rider, same inputs, same Friday in Klang Valley with afternoon
            rain, the KL Grand Prix at Bukit Jalil, and a Bangsar bonus zone.
            On the left: what a deterministic rules engine produces. On the
            right: what ILMU-GLM-5.1 reasons. The gap is the value of the LLM.
          </p>
        </header>

        <section className="mb-10 rounded-sm border border-[#1a1a1a]/15 bg-[#15140f]/[0.04] px-5 py-4 dark:border-[#e8e4d8]/15 dark:bg-[#e8e4d8]/[0.03]">
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#1a1a1a]/55 dark:text-[#e8e4d8]/55 mb-2">
            Today's inputs (identical for both engines)
          </p>
          <ul className="grid gap-2 text-sm sm:grid-cols-2 sm:gap-x-8">
            <li><span className="text-[#1a1a1a]/55 dark:text-[#e8e4d8]/55">Date:</span> {c.date} ({c.day_of_week})</li>
            <li><span className="text-[#1a1a1a]/55 dark:text-[#e8e4d8]/55">7-day avg:</span> RM{c.recent_7day_avg_net_rm.toFixed(0)} net</li>
            <li><span className="text-[#1a1a1a]/55 dark:text-[#e8e4d8]/55">Weather:</span> {c.weather_summary}</li>
            <li><span className="text-[#1a1a1a]/55 dark:text-[#e8e4d8]/55">Fuel:</span> RON95 RM{c.fuel_price_ron95_rm_per_litre.toFixed(2)}/L</li>
            <li className="sm:col-span-2"><span className="text-[#1a1a1a]/55 dark:text-[#e8e4d8]/55">Events:</span> {c.events_summary}</li>
            <li className="sm:col-span-2"><span className="text-[#1a1a1a]/55 dark:text-[#e8e4d8]/55">Incentives:</span> {c.incentives_summary}</li>
          </ul>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <RecCard title="Rules engine (no GLM)" subtitle="Deterministic fallback" rec={ruleBasedRecommendation} muted />
          <RecCard title="ILMU-GLM-5.1" subtitle="Reasoning engine" rec={demoRecommendation} />
        </section>

        <section className="mt-14">
          <h2 className="mb-4 border-b border-[#1a1a1a]/10 pb-2 font-mono text-[10px] uppercase tracking-[0.25em] dark:border-[#e8e4d8]/10">
            What GLM caught that rules missed
          </h2>
          <ul className="divide-y divide-[#1a1a1a]/10 dark:divide-[#e8e4d8]/10">
            {glmAdvantages.map((a, i) => (
              <li key={i} className="grid gap-3 py-5 lg:grid-cols-[1fr_2fr_2fr] lg:gap-6">
                <p className="font-medium">{a.category}</p>
                <p className="text-sm leading-relaxed text-[#1a1a1a]/65 dark:text-[#e8e4d8]/65">
                  <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#1a1a1a]/45 dark:text-[#e8e4d8]/45">Rules: </span>
                  {a.rules}
                </p>
                <p className="text-sm leading-relaxed">
                  <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#c8412c] dark:text-[#e87158]">GLM: </span>
                  {a.glm}
                </p>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-14 border-t border-[#1a1a1a]/15 pt-8 dark:border-[#e8e4d8]/15">
          <blockquote className="border-l-2 border-[#c8412c] pl-5 font-serif text-xl italic leading-relaxed">
            "If the GLM component is removed, the system should no longer be
            able to generate meaningful insights or support decision-making
            effectively."
            <footer className="mt-2 font-mono text-[10px] not-italic uppercase tracking-[0.25em] text-[#1a1a1a]/55 dark:text-[#e8e4d8]/55">
              — UMHackathon 2026, Domain 2 brief
            </footer>
          </blockquote>
          <p className="mt-6 max-w-3xl text-[15px] leading-relaxed text-[#1a1a1a]/80 dark:text-[#e8e4d8]/80">
            The rules engine on the left is what Ronda falls back to when GLM
            is unreachable. It produces a safe, generic recommendation grounded
            in the rider's average — but it cannot read events, weight
            incentives, calibrate confidence, or explain itself. That gap is
            why GLM is load-bearing, not decorative.
          </p>
        </section>
      </div>
    </main>
  );
}

function RecCard({
  title,
  subtitle,
  rec,
  muted = false,
}: {
  title: string;
  subtitle: string;
  rec: ShiftRecommendation;
  muted?: boolean;
}) {
  const accent = muted ? "[#1a1a1a]/55" : "[#c8412c]";
  const accentDark = muted ? "[#e8e4d8]/55" : "[#e87158]";

  return (
    <div
      className={`rounded-sm border p-6 ${
        muted
          ? "border-[#1a1a1a]/15 bg-[#15140f]/[0.03] dark:border-[#e8e4d8]/15 dark:bg-[#e8e4d8]/[0.02]"
          : "border-[#c8412c]/40 bg-[#f4efe6] dark:border-[#e87158]/40 dark:bg-[#0d0c0a]"
      }`}
    >
      <div className={`mb-1 font-mono text-[10px] uppercase tracking-[0.25em] text-${accent} dark:text-${accentDark}`}>
        {title}
      </div>
      <p className="mb-6 font-serif italic text-sm text-[#1a1a1a]/60 dark:text-[#e8e4d8]/60">
        {subtitle}
      </p>

      <p className="font-serif text-4xl font-normal leading-none tracking-tight">
        {rec.recommendation === "work"
          ? "Ride today."
          : rec.recommendation === "rest"
          ? "Rest today."
          : "Ride part-time."}
      </p>
      <p className="mt-2 font-serif italic text-sm text-[#1a1a1a]/65 dark:text-[#e8e4d8]/65">
        {rec.confidence} confidence
      </p>

      <div className="mt-6 flex items-baseline gap-3">
        <span className="font-mono text-2xl font-medium tracking-tight">
          RM {rec.projected_net_rm.toFixed(0)}
        </span>
        <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#1a1a1a]/55 dark:text-[#e8e4d8]/55">
          projected net
        </span>
      </div>

      <ul className="mt-5 space-y-2 text-sm">
        {rec.shift_windows.map((w, i) => (
          <li key={i} className="flex items-baseline justify-between gap-3">
            <span className="font-mono">{w.start} — {w.end}</span>
            <span className="font-serif italic text-[#1a1a1a]/70 dark:text-[#e8e4d8]/70">
              {w.zones.join(" · ")}
            </span>
          </li>
        ))}
      </ul>

      <blockquote className="mt-6 border-l-2 border-[#1a1a1a]/20 pl-4 font-serif text-sm italic leading-relaxed text-[#1a1a1a]/85 dark:border-[#e8e4d8]/20 dark:text-[#e8e4d8]/85">
        "{rec.reasoning_narrative}"
      </blockquote>

      <div className="mt-5 font-mono text-[10px] uppercase tracking-[0.25em] text-[#1a1a1a]/50 dark:text-[#e8e4d8]/50">
        source: {rec.source}
      </div>
    </div>
  );
}