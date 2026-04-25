"use client";

import { useState } from "react";
import Link from "next/link";
import {
  defaultRequest,
  getRecommendation,
  type RecommendRequest,
  type RecommendResponse,
} from "@/lib/api";
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

type ViewState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "result"; data: RecommendResponse }
  | { kind: "error"; message: string };

export default function RondaPage() {
  const [form, setForm] = useState<RecommendRequest>(defaultRequest);
  const [view, setView] = useState<ViewState>({ kind: "idle" });

  function update<K extends keyof RecommendRequest>(
    key: K,
    value: RecommendRequest[K],
  ) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function updateWeather(
    key: keyof RecommendRequest["weather"],
    value: string | number,
  ) {
    setForm((f) => ({ ...f, weather: { ...f.weather, [key]: value } }));
  }

  async function handleSubmit() {
    setView({ kind: "loading" });
    try {
      const data = await getRecommendation(form);
      setView({ kind: "result", data });
      // Scroll to the result
      setTimeout(() => {
        document.getElementById("brief")?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Something went wrong calling the reasoning engine.";
      setView({ kind: "error", message });
    }
  }

  return (
    <main className="min-h-screen bg-[#f4efe6] text-[#1a1a1a] dark:bg-[#0d0c0a] dark:text-[#e8e4d8]">
      <div className="mx-auto max-w-3xl px-6 py-10 sm:px-10 sm:py-16">
        {/* ─── Header ─────────────────────────────────────────── */}
        <header className="mb-12 border-b border-[#1a1a1a]/15 pb-6 dark:border-[#e8e4d8]/15">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#1a1a1a]/60 dark:text-[#e8e4d8]/60">
                Ronda — Morning Brief
              </p>
              <h1 className="mt-1 font-serif text-4xl font-normal italic tracking-tight">
                Tell me about today.
              </h1>
              <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-[#1a1a1a]/75 dark:text-[#e8e4d8]/75">
                Fill in your numbers, hit the button, and ILMU-GLM-5.1 will
                reason over your day. Smart defaults are pre-filled — leave
                them or edit anything you want.
              </p>
            </div>
            <Link
              href="/compare"
              className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#c8412c] hover:underline dark:text-[#e87158] whitespace-nowrap"
            >
              with vs without GLM →
            </Link>
          </div>
        </header>

        {/* ─── FORM ──────────────────────────────────────────── */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
          className="mb-14"
        >
          {/* Rider section */}
          <FormSection title="Rider">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Name">
                <Input
                  value={form.rider_name}
                  onChange={(v) => update("rider_name", v)}
                />
              </Field>
              <Field label="Platform">
                <Input
                  value={form.rider_platform}
                  onChange={(v) => update("rider_platform", v)}
                />
              </Field>
              <Field label="Home zone">
                <Input
                  value={form.home_zone}
                  onChange={(v) => update("home_zone", v)}
                />
              </Field>
              <Field label="7-day avg net (RM)">
                <Input
                  type="number"
                  value={form.recent_7day_avg_net_rm.toString()}
                  onChange={(v) =>
                    update("recent_7day_avg_net_rm", Number(v) || 0)
                  }
                />
              </Field>
            </div>
          </FormSection>

          {/* Day & weather */}
          <FormSection title="Today">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Day of week">
                <Select
                  value={form.day_of_week}
                  onChange={(v) => update("day_of_week", v)}
                  options={[
                    "Monday",
                    "Tuesday",
                    "Wednesday",
                    "Thursday",
                    "Friday",
                    "Saturday",
                    "Sunday",
                  ]}
                />
              </Field>
              <Field label="Date">
                <Input
                  type="date"
                  value={form.date}
                  onChange={(v) => update("date", v)}
                />
              </Field>
              <Field label="Morning weather">
                <Select
                  value={form.weather.morning_condition}
                  onChange={(v) => updateWeather("morning_condition", v)}
                  options={["clear", "cloudy", "rain"]}
                />
              </Field>
              <Field label="Afternoon weather">
                <Select
                  value={form.weather.afternoon_condition}
                  onChange={(v) => updateWeather("afternoon_condition", v)}
                  options={["clear", "cloudy", "rain"]}
                />
              </Field>
              <Field label="Evening weather">
                <Select
                  value={form.weather.evening_condition}
                  onChange={(v) => updateWeather("evening_condition", v)}
                  options={["clear", "cloudy", "rain"]}
                />
              </Field>
              <Field label="RON95 fuel price (RM/L)">
                <Input
                  type="number"
                  step="0.01"
                  value={form.fuel_price_ron95_rm.toString()}
                  onChange={(v) =>
                    update("fuel_price_ron95_rm", Number(v) || 0)
                  }
                />
              </Field>
            </div>
          </FormSection>

          {/* Events & incentives */}
          <FormSection title="Signals">
            <Field label="Events today (free text)">
              <Textarea
                value={form.events_text}
                onChange={(v) => update("events_text", v)}
                placeholder="e.g. concert at Axiata Arena 19:00–23:00"
              />
            </Field>
            <Field label="Active incentives (free text)">
              <Textarea
                value={form.incentives_text}
                onChange={(v) => update("incentives_text", v)}
                placeholder="e.g. +RM2 per delivery in Bangsar 6pm–10pm"
              />
            </Field>
          </FormSection>

          {/* Submit */}
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <button
              type="submit"
              disabled={view.kind === "loading"}
              className="rounded-sm bg-[#c8412c] px-6 py-3 font-mono text-xs uppercase tracking-[0.25em] text-[#f4efe6] transition-opacity hover:opacity-90 disabled:opacity-50 dark:bg-[#e87158] dark:text-[#0d0c0a]"
            >
              {view.kind === "loading"
                ? "Reasoning…"
                : "Get my brief →"}
            </button>
            <p className="font-serif italic text-sm text-[#1a1a1a]/55 dark:text-[#e8e4d8]/55">
              powered by ilmu-glm-5.1 · ~10s response time
            </p>
          </div>
        </form>

        {/* ─── LOADING / ERROR / RESULT ────────────────────── */}
        {view.kind === "loading" && (
          <div className="border border-dashed border-[#1a1a1a]/20 px-6 py-12 text-center dark:border-[#e8e4d8]/20">
            <p className="font-serif italic text-2xl">
              Reasoning over your day…
            </p>
            <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.25em] text-[#1a1a1a]/55 dark:text-[#e8e4d8]/55">
              Calling ILMU-GLM-5.1 · this takes ~10 seconds
            </p>
          </div>
        )}

        {view.kind === "error" && (
          <div className="border border-[#c8412c]/40 bg-[#c8412c]/[0.06] px-6 py-6 dark:border-[#e87158]/40 dark:bg-[#e87158]/[0.06]">
            <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-[#c8412c] dark:text-[#e87158]">
              Backend error
            </p>
            <p className="mt-2 font-serif text-base">{view.message}</p>
            <p className="mt-3 text-sm text-[#1a1a1a]/65 dark:text-[#e8e4d8]/65">
              Make sure the FastAPI backend is running at <code className="font-mono">localhost:8000</code>.
              Try <code className="font-mono">uvicorn main:app --reload --port 8000</code>.
            </p>
          </div>
        )}

        {view.kind === "result" && (
          <div id="brief">
            <Brief data={view.data} form={form} />
          </div>
        )}
      </div>
    </main>
  );
}

/* ─────────────────────────────────────────────────────────── */
/* The recommendation brief, rendered after submission         */
/* ─────────────────────────────────────────────────────────── */

function Brief({
  data,
  form,
}: {
  data: RecommendResponse;
  form: RecommendRequest;
}) {
  const r = data.recommendation;
  const m = data.meta;
  const trace = data.trace;

  const uplift = r.projected_net_rm - form.recent_7day_avg_net_rm;
  const upliftPct =
    form.recent_7day_avg_net_rm > 0
      ? (uplift / form.recent_7day_avg_net_rm) * 100
      : 0;

  return (
    <div className="border-t-2 border-[#c8412c] pt-10 dark:border-[#e87158]">
      <div className="mb-10 flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#1a1a1a]/60 dark:text-[#e8e4d8]/60">
            Your brief
          </p>
          <h2 className="mt-1 font-serif text-3xl font-normal italic tracking-tight">
            Hi, {form.rider_name}.
          </h2>
        </div>
        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#1a1a1a]/55 dark:text-[#e8e4d8]/55">
          {form.day_of_week} · {form.date}
        </p>
      </div>

      {/* Verdict */}
      <section className="mb-14">
        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#1a1a1a]/60 dark:text-[#e8e4d8]/60">
          Today's call
        </p>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <h3 className="font-serif text-6xl font-normal leading-none tracking-tight sm:text-7xl">
            {VERDICT_LABEL[r.recommendation]}.
          </h3>
          <p className="font-serif italic text-[#1a1a1a]/70 dark:text-[#e8e4d8]/70">
            {CONFIDENCE_LABEL[r.confidence]}
          </p>
        </div>
        <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-[#1a1a1a]/75 dark:text-[#e8e4d8]/75">
          {VERDICT_SUB[r.recommendation]}.
        </p>
      </section>

      {/* Earnings */}
      <section className="mb-14">
        <div className="mb-4 flex items-baseline justify-between border-b border-[#1a1a1a]/10 pb-2 dark:border-[#e8e4d8]/10">
          <h3 className="font-mono text-[10px] uppercase tracking-[0.25em]">
            Projected earnings
          </h3>
          <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#1a1a1a]/60 dark:text-[#e8e4d8]/60">
            vs 7-day avg RM{form.recent_7day_avg_net_rm.toFixed(0)}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-px overflow-hidden rounded-sm bg-[#1a1a1a]/10 dark:bg-[#e8e4d8]/10">
          <Stat label="Gross" value={`RM ${r.projected_gross_rm.toFixed(0)}`} />
          <Stat
            label="Petrol"
            value={`− RM ${r.projected_petrol_rm.toFixed(0)}`}
          />
          <Stat
            label="Net"
            value={`RM ${r.projected_net_rm.toFixed(0)}`}
            accent
            sub={`${uplift >= 0 ? "+" : ""}${upliftPct.toFixed(1)}%`}
          />
        </div>
      </section>

      {/* Shifts */}
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
                <span className="text-[#1a1a1a]/40 dark:text-[#e8e4d8]/40">
                  {" "}
                  —{" "}
                </span>
                {w.end}
              </span>
              <span className="font-serif italic text-[#1a1a1a]/80 dark:text-[#e8e4d8]/80">
                {w.zones.join(" · ")}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* Narrative */}
      <section className="mb-14">
        <h3 className="mb-4 border-b border-[#1a1a1a]/10 pb-2 font-mono text-[10px] uppercase tracking-[0.25em] dark:border-[#e8e4d8]/10">
          What I'm thinking
        </h3>
        <blockquote className="border-l-2 border-[#c8412c] pl-5 font-serif text-lg italic leading-relaxed">
          "{r.reasoning_narrative}"
        </blockquote>
      </section>

      {/* Factors */}
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

      {/* Caveats */}
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
                <span
                  className="font-mono text-[#c8412c] dark:text-[#e87158]"
                  aria-hidden
                >
                  ⚠
                </span>
                <span>{cav}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <footer className="mt-16 border-t border-[#1a1a1a]/15 pt-6 dark:border-[#e8e4d8]/15">
        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#1a1a1a]/60 dark:text-[#e8e4d8]/60">
          Reasoned by {m.model} · {m.latency_seconds.toFixed(1)}s ·{" "}
          {m.output_tokens} tokens · source: {m.source}
        </p>
      </footer>

      {/* Trace panel */}
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
            <Kv label="Model" value={m.model} />
            <Kv label="Latency" value={`${m.latency_seconds.toFixed(1)}s`} />
            <Kv label="Output tokens" value={m.output_tokens.toString()} />
            <Kv label="Prompt size" value={`${m.prompt_chars} chars`} />
            <Kv
              label="Context summary"
              value={`${m.context_summary_chars} chars`}
            />
          </div>

          <TraceBlock label="System prompt" body={trace.systemPrompt} />
          <TraceBlock label="User prompt" body={trace.userPrompt} />
          <TraceBlock label="Raw response (JSON)" body={trace.rawResponse} />
        </div>
      </details>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────── */
/* Tiny reusable form bits                                     */
/* ─────────────────────────────────────────────────────────── */

function FormSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="mb-8">
      <legend className="mb-4 font-mono text-[10px] uppercase tracking-[0.25em] text-[#1a1a1a]/60 dark:text-[#e8e4d8]/60">
        {title}
      </legend>
      <div className="space-y-4">{children}</div>
    </fieldset>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.2em] text-[#1a1a1a]/55 dark:text-[#e8e4d8]/55">
        {label}
      </span>
      {children}
    </label>
  );
}

function Input({
  value,
  onChange,
  type = "text",
  step,
}: {
  value: string;
  onChange: (v: string) => void;
  type?: string;
  step?: string;
}) {
  return (
    <input
      type={type}
      step={step}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-sm border border-[#1a1a1a]/20 bg-transparent px-3 py-2 font-mono text-sm text-[#1a1a1a] focus:border-[#c8412c] focus:outline-none dark:border-[#e8e4d8]/20 dark:text-[#e8e4d8] dark:focus:border-[#e87158]"
    />
  );
}

function Select({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-sm border border-[#1a1a1a]/20 bg-transparent px-3 py-2 font-mono text-sm text-[#1a1a1a] focus:border-[#c8412c] focus:outline-none dark:border-[#e8e4d8]/20 dark:text-[#e8e4d8] dark:focus:border-[#e87158]"
    >
      {options.map((o) => (
        <option key={o} value={o} className="bg-[#0d0c0a]">
          {o}
        </option>
      ))}
    </select>
  );
}

function Textarea({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={2}
      className="w-full rounded-sm border border-[#1a1a1a]/20 bg-transparent px-3 py-2 font-mono text-sm text-[#1a1a1a] placeholder:text-[#1a1a1a]/30 focus:border-[#c8412c] focus:outline-none dark:border-[#e8e4d8]/20 dark:text-[#e8e4d8] dark:placeholder:text-[#e8e4d8]/30 dark:focus:border-[#e87158]"
    />
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
