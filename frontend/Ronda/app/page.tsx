"use client";

import { demoContext, demoRecommendation, demoMeta, demoTrace } from "@/lib/demo-data";
import type { Confidence, Impact, Weight } from "@/lib/types";

const VERDICT_LABEL: Record<string, string> = {
  work: "Ride today",
  rest: "Rest today",
  partial: "Ride part-time",
};

const VERDICT_SUB: Record<string, string> = {
  work: "Conditions favour a working day",
  rest: "Today is not worth the risk",
  partial: "Mixed signals — work selectively",
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

export default function MorningView() {
  const r = demoRecommendation;
  const c = demoContext;
  const m = demoMeta;

  const uplift = r.projected_net_rm - c.recent_7day_avg_net_rm;
  const upliftPct = (uplift / c.recent_7day_avg_net_rm) * 100;

  return (
    <main className="min-h-screen bg-[#f4efe6] text-[#1a1a1a] dark:bg-[#0d0c0a] dark:text-[#e8e4d8]">
      <div className="mx-auto max-w-3xl px-6 py-10 sm:px-10 sm:py-16">
        <header className="mb-12 border-b border-[#1a1a1a]/15 pb-6 dark:border-[#e8e4d8]/15">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#1a1a1a]/60 dark:text-[#e8e4d8]/60">
                Ronda — Morning Brief
              </p>
              <h1 className="mt-1 font-serif text-4xl font-normal italic tracking-tight">
                Selamat pagi, Aiman.
              </h1>
            </div>
            <div className="text-right">
              <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#1a1a1a]/60 dark:text-[#e8e4d8]/60">
                {c.day_of_week}
              </p>
              <p className="font-mono text-sm">{c.date}</p>
            </div>
          </div>
        </header>

        <section className="mb-14">
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#1a1a1a]/60 dark:text-[#e8e4d8]/60">
            Today's call
          </p>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <h2 className="font-serif text-6xl font-normal leading-none tracking-tight sm:text-7xl">
              {VERDICT_LABEL[r.recommendation]}.
            </h2>
            <p className="font-serif italic text-[#1a1a1a]/70 dark:text-[#e8e4d8]/70">
              {CONFIDENCE_LABEL[r.confidence]}
            </p>
          </div>
          <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-[#1a1a1a]/75 dark:text-[#e8e4d8]/75">
            {VERDICT_SUB[r.recommendation]}.
          </p>
        </section>

        <section className="mb-14">
          <div className="mb-4 flex items-baseline justify-between border-b border-[#1a1a1a]/10 pb-2 dark:border-[#e8e4d8]/10">
            <h3 className="font-mono text-[10px] uppercase tracking-[0.25em]">
              Projected earnings
            </h3>
            <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#1a1a1a]/60 dark:text-[#e8e4d8]/60">
              vs 7-day avg RM{c.recent_7day_avg_net_rm.toFixed(0)}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-px overflow-hidden rounded-sm bg-[#1a1a1a]/10 dark:bg-[#e8e4d8]/10">
            <Stat label="Gross" value={`RM ${r.projected_gross_rm.toFixed(0)}`} />
            <Stat label="Petrol" value={`− RM ${r.projected_petrol_rm.toFixed(0)}`} />
            <Stat
              label="Net"
              value={`RM ${r.projected_net_rm.toFixed(0)}`}
              accent
              sub={`${uplift >= 0 ? "+" : ""}${upliftPct.toFixed(1)}%`}
            />
          </div>
        </section>

        <section className="mb-14">
          <h3 className="mb-4 border-b border-[#1a1a1a]/10 pb-2 font-mono text-[10px] uppercase tracking-[0.25em] dark:border-[#e8e4d8]/10">
            Shift windows
          </h3>
          <ul className="space-y-3">
            {r.shift_windows.map((w, i) => (
              <li
                key={i}
                className="flex items-baseline justify-between gap-4 border-b border-dashed border-[#1a1a1a]/15 pb-3 last:border-0 dark:border-[#e8e4d8]/15"
              >
                <span className="font-mono text-2xl tracking-tight">
                  {w.start}
                  <span className="text-[#1a1a1a]/40 dark:text-[#e8e4d8]/40"> — </span>
                  {w.end}
                </span>
                <span className="font-serif italic text-[#1a1a1a]/80 dark:text-[#e8e4d8]/80">
                  {w.zones.join(" · ")}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="mb-14">
          <h3 className="mb-4 border-b border-[#1a1a1a]/10 pb-2 font-mono text-[10px] uppercase tracking-[0.25em] dark:border-[#e8e4d8]/10">
            What I'm thinking
          </h3>
          <blockquote className="border-l-2 border-[#c8412c] pl-5 font-serif text-lg italic leading-relaxed">
            "{r.reasoning_narrative}"
          </blockquote>
        </section>

        <section className="mb-14">
          <h3 className="mb-4 border-b border-[#1a1a1a]/10 pb-2 font-mono text-[10px] uppercase tracking-[0.25em] dark:border-[#e8e4d8]/10">
            What drove this
          </h3>
          <ul className="divide-y divide-[#1a1a1a]/10 dark:divide-[#e8e4d8]/10">
            {r.key_factors.map((f, i) => (
              <li
                key={i}
                className="grid grid-cols-[auto_1fr_auto] items-baseline gap-4 py-4"
              >
                <span
                  className={`font-mono text-lg ${
                    f.impact === "positive"
                      ? "text-emerald-700 dark:text-emerald-400"
                      : f.impact === "negative"
                      ? "text-[#c8412c] dark:text-[#e87158]"
                      : "text-[#1a1a1a]/40 dark:text-[#e8e4d8]/40"
                  }`}
                  aria-hidden
                >
                  {IMPACT_GLYPH[f.impact]}
                </span>
                <div>
                  <p className="font-medium">{f.factor}</p>
                  {f.note && (
                    <p className="mt-1 text-sm leading-relaxed text-[#1a1a1a]/70 dark:text-[#e8e4d8]/70">
                      {f.note}
                    </p>
                  )}
                </div>
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#1a1a1a]/50 dark:text-[#e8e4d8]/50">
                  {WEIGHT_DOT[f.weight]}
                </span>
              </li>
            ))}
          </ul>
        </section>

        {r.caveats.length > 0 && (
          <section className="mb-14">
            <h3 className="mb-4 border-b border-[#1a1a1a]/10 pb-2 font-mono text-[10px] uppercase tracking-[0.25em] dark:border-[#e8e4d8]/10">
              Watch out for
            </h3>
            <ul className="space-y-2">
              {r.caveats.map((cav, i) => (
                <li
                  key={i}
                  className="flex gap-3 text-[15px] leading-relaxed text-[#1a1a1a]/80 dark:text-[#e8e4d8]/80"
                >
                  <span className="font-mono text-[#c8412c] dark:text-[#e87158]" aria-hidden>
                    ⚠
                  </span>
                  <span>{cav}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <footer className="mt-16 border-t border-[#1a1a1a]/15 pt-6 dark:border-[#e8e4d8]/15">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#1a1a1a]/60 dark:text-[#e8e4d8]/60">
              Reasoned by {m.model} · {m.latency_seconds.toFixed(1)}s · {m.output_tokens} tokens
            </p>
            <p className="font-serif text-xs italic text-[#1a1a1a]/50 dark:text-[#e8e4d8]/50">
              Ronda — for Malaysian gig riders.
            </p>
          </div>
        </footer>

        {/* ─── GLM trace panel ─────────────────────────────────── */}
        <details className="group mt-10 rounded-sm border border-[#1a1a1a]/15 bg-[#15140f]/5 dark:border-[#e8e4d8]/15 dark:bg-[#e8e4d8]/[0.03]">
          <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-4 font-mono text-[10px] uppercase tracking-[0.25em] text-[#1a1a1a]/70 hover:text-[#1a1a1a] dark:text-[#e8e4d8]/70 dark:hover:text-[#e8e4d8]">
            <span>Developer trace — view GLM-5.1 prompt &amp; response</span>
            <span
              className="font-mono text-base transition-transform group-open:rotate-45"
              aria-hidden
            >
              +
            </span>
          </summary>

          <div className="space-y-6 border-t border-[#1a1a1a]/10 px-5 py-6 dark:border-[#e8e4d8]/10">
            <div className="grid gap-3 font-mono text-[11px] sm:grid-cols-3">
              <Kv label="Endpoint" value="api.ilmu.ai/anthropic" />
              <Kv label="Model" value={demoMeta.model} />
              <Kv label="Latency" value={`${demoMeta.latency_seconds.toFixed(1)}s`} />
              <Kv label="Output tokens" value={demoMeta.output_tokens.toString()} />
              <Kv label="Prompt size" value={`${demoMeta.prompt_chars} chars`} />
              <Kv label="Context summary" value={`${demoMeta.context_summary_chars} chars`} />
            </div>

            <TraceBlock label="System prompt" body={demoTrace.systemPrompt} />
            <TraceBlock label="User prompt" body={demoTrace.userPrompt} />
            <TraceBlock label="Raw response (JSON)" body={demoTrace.rawResponse} />
          </div>
        </details>
      </div>
    </main>
  );
}

function Stat({
  label,
  value,
  sub,
  accent = false,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`flex flex-col gap-1 px-4 py-5 ${
        accent
          ? "bg-[#f4efe6] dark:bg-[#0d0c0a]"
          : "bg-[#ebe5d8] dark:bg-[#15140f]"
      }`}
    >
      <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#1a1a1a]/60 dark:text-[#e8e4d8]/60">
        {label}
      </span>
      <span
        className={`font-mono tracking-tight ${
          accent ? "text-3xl font-medium" : "text-xl"
        }`}
      >
        {value}
      </span>
      {sub && (
        <span className="font-mono text-[10px] text-emerald-700 dark:text-emerald-400">
          {sub}
        </span>
      )}
    </div>
  );
}

function Kv({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 border-l-2 border-[#c8412c]/40 pl-3 dark:border-[#e87158]/40">
      <span className="text-[#1a1a1a]/55 dark:text-[#e8e4d8]/55">{label}</span>
      <span className="text-[#1a1a1a] dark:text-[#e8e4d8]">{value}</span>
    </div>
  );
}

function TraceBlock({ label, body }: { label: string; body: string }) {
  return (
    <div>
      <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.25em] text-[#1a1a1a]/55 dark:text-[#e8e4d8]/55">
        {label}
      </p>
      <pre className="overflow-x-auto whitespace-pre-wrap break-words rounded-sm border border-[#1a1a1a]/10 bg-[#15140f]/[0.04] p-4 font-mono text-[11px] leading-relaxed text-[#1a1a1a]/85 dark:border-[#e8e4d8]/10 dark:bg-black/30 dark:text-[#e8e4d8]/85">
        {body}
      </pre>
    </div>
  );
}
