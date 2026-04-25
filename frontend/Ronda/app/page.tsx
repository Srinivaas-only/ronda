"use client";

import { useEffect, useState } from "react";
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

const SAMPLE_BRIEF: RecommendResponse = {
  recommendation: {
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
      "Better to split shift today. Morning PJ run before the rain starts can secure steady orders. Evening shift in Bangsar is solid because of the RM2 incentive and spillover crowd from Bukit Jalil. Skip the 15:00 slot since your history shows rain kills earnings there.",
    key_factors: [
      { factor: "Afternoon rain (14:00–22:00)", impact: "negative", weight: "high", note: "Reduces order volume and makes riding risky." },
      { factor: "Bangsar +RM2 incentive (18:00–22:00)", impact: "positive", weight: "high", note: "Significantly boosts gross earnings during peak dinner." },
      { factor: "KL Grand Prix Fan Zone (Bukit Jalil)", impact: "positive", weight: "medium", note: "Spillover crowd to nearby Bangsar increases demand." },
      { factor: "RON95 at RM2.05/L", impact: "neutral", weight: "low", note: "Standard fuel cost, no major impact." },
    ],
    caveats: [
      "Rain forecast 14:00–22:00 might cause cancellations.",
      "Traffic around Bukit Jalil/Bangsar could be heavily congested from 18:00.",
      "Projected net is based on 7-day average; actual depends on rain intensity.",
    ],
    source: "glm",
  },
  meta: {
    model: "ilmu-glm-5.1",
    latency_seconds: 10.7,
    output_tokens: 1104,
    input_tokens: 0,
    prompt_chars: 752,
    context_summary_chars: 356,
    source: "glm",
  },
  trace: {
    systemPrompt: "(sample brief — click 'Update brief' to see your real prompt)",
    userPrompt: "(sample brief — click 'Update brief' to see your real prompt)",
    rawResponse: "(sample brief — click 'Update brief' to see your real GLM response)",
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
    <main className="min-h-screen bg-[#f4efe6] text-[#1a1a1a] dark:bg-[#0d0c0a] dark:text-[#e8e4d8]">
      <div className="mx-auto max-w-7xl px-6 py-8 sm:px-10 sm:py-12">
        <div className="mb-10 flex items-center justify-between border-b border-[#1a1a1a]/10 pb-5 dark:border-[#e8e4d8]/10">
          <div className="flex items-baseline gap-3">
            <span className="font-serif text-xl italic">Ronda</span>
            <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#1a1a1a]/55 dark:text-[#e8e4d8]/55">
              Morning brief · gig riders
            </span>
          </div>
          <Link
            href="/compare"
            className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#c8412c] hover:underline dark:text-[#e87158]"
          >
            with vs without GLM →
          </Link>
        </div>

        <div className="grid gap-12 lg:grid-cols-[5fr_8fr] lg:gap-16">
          <aside className="lg:sticky lg:top-8 lg:self-start">
            <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#1a1a1a]/55 dark:text-[#e8e4d8]/55">
              Tell me about today
            </p>
            <h1 className="mt-2 font-serif text-3xl font-normal italic leading-tight tracking-tight">
              The numbers that matter.
            </h1>
            <p className="mt-3 text-[14px] leading-relaxed text-[#1a1a1a]/70 dark:text-[#e8e4d8]/70">
              Pre-filled with realistic Klang Valley defaults. Edit any field and update the brief on the right.
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
                    placeholder="e.g. concert at Axiata Arena 19:00–23:00"
                  />
                </UnderlineField>
                <UnderlineField label="Active incentives">
                  <UnderlineTextarea
                    value={form.incentives_text}
                    onChange={(v) => update("incentives_text", v)}
                    placeholder="e.g. +RM2 per delivery in Bangsar 6pm–10pm"
                  />
                </UnderlineField>
              </Group>

              <div className="flex items-center justify-between border-t border-[#1a1a1a]/10 pt-5 dark:border-[#e8e4d8]/10">
                <span className="font-serif text-xs italic text-[#1a1a1a]/50 dark:text-[#e8e4d8]/50">
                  ilmu-glm-5.1 · ~10s
                </span>
                <button
                  type="submit"
                  disabled={view.kind === "loading"}
                  className="rounded-sm border border-[#c8412c] px-4 py-2 font-mono text-[11px] uppercase tracking-[0.2em] text-[#c8412c] transition-colors hover:bg-[#c8412c] hover:text-[#f4efe6] disabled:opacity-40 dark:border-[#e87158] dark:text-[#e87158] dark:hover:bg-[#e87158] dark:hover:text-[#0d0c0a]"
                >
                  {view.kind === "loading" ? "Reasoning…" : "Update brief →"}
                </button>
              </div>
            </form>
          </aside>

          <section className="min-w-0">
            {view.kind === "loading" && <LoadingState />}
            {view.kind === "error" && <ErrorState message={view.message} />}
            {view.kind === "result" && <Brief data={view.data} form={form} />}
            {view.kind === "idle" && <div className="opacity-50">Click "Update brief" to begin.</div>}
          </section>
        </div>
      </div>
    </main>
  );
}

function LoadingState() {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center border border-dashed border-[#1a1a1a]/15 px-8 py-16 text-center dark:border-[#e8e4d8]/15">
      <p className="font-serif text-2xl italic">Reasoning over your day…</p>
      <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.25em] text-[#1a1a1a]/55 dark:text-[#e8e4d8]/55">
        Calling ILMU-GLM-5.1 · this takes about 10 seconds
      </p>
      <div className="mt-6 h-px w-32 overflow-hidden bg-[#1a1a1a]/10 dark:bg-[#e8e4d8]/10">
        <div className="h-full w-1/3 animate-pulse bg-[#c8412c] dark:bg-[#e87158]" />
      </div>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="border border-[#c8412c]/40 bg-[#c8412c]/[0.06] px-6 py-6 dark:border-[#e87158]/40 dark:bg-[#e87158]/[0.06]">
      <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-[#c8412c] dark:text-[#e87158]">
        Backend error
      </p>
      <p className="mt-2 font-serif text-base">{message}</p>
      <p className="mt-3 text-sm text-[#1a1a1a]/65 dark:text-[#e8e4d8]/65">
        Make sure the FastAPI backend is running at <code className="font-mono">localhost:8000</code>.
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

  return (
    <div className="space-y-12">
      <header>
        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#1a1a1a]/55 dark:text-[#e8e4d8]/55">
          {form.day_of_week} · {form.date}
        </p>
        <h2 className="mt-3 font-serif text-3xl font-normal italic leading-none tracking-tight">
          Hi, {form.rider_name}.
        </h2>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <h3 className="font-serif text-7xl font-normal leading-none tracking-tight sm:text-[88px]">
            {VERDICT_LABEL[r.recommendation]}.
          </h3>
          <p className="font-serif italic text-[#1a1a1a]/65 dark:text-[#e8e4d8]/65">
            {CONFIDENCE_LABEL[r.confidence]}
          </p>
        </div>
        <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-[#1a1a1a]/75 dark:text-[#e8e4d8]/75">
          {VERDICT_SUB[r.recommendation]}.
        </p>
      </header>

      <section>
        <SectionLabel>Projected earnings</SectionLabel>
        <div className="mb-1 flex items-baseline justify-end">
          <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#1a1a1a]/55 dark:text-[#e8e4d8]/55">
            vs 7-day avg RM{form.recent_7day_avg_net_rm.toFixed(0)}
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

      <section>
        <SectionLabel>Shift windows</SectionLabel>
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

      <section>
        <SectionLabel>What I'm thinking</SectionLabel>
        <blockquote className="border-l-2 border-[#c8412c] pl-5 font-serif text-lg italic leading-relaxed">
          "{r.reasoning_narrative}"
        </blockquote>
      </section>

      <section>
        <SectionLabel>What drove this</SectionLabel>
        <ul className="divide-y divide-[#1a1a1a]/10 dark:divide-[#e8e4d8]/10">
          {r.key_factors.map((f, i) => (
            <li key={i} className="grid grid-cols-[auto_1fr_auto] items-baseline gap-4 py-4">
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
        <section>
          <SectionLabel>Watch out for</SectionLabel>
          <ul className="space-y-2">
            {r.caveats.map((cav, i) => (
              <li
                key={i}
                className="flex gap-3 text-[15px] leading-relaxed text-[#1a1a1a]/80 dark:text-[#e8e4d8]/80"
              >
                <span className="font-mono text-[#c8412c] dark:text-[#e87158]" aria-hidden>⚠</span>
                <span>{cav}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <footer className="border-t border-[#1a1a1a]/15 pt-6 dark:border-[#e8e4d8]/15">
        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#1a1a1a]/60 dark:text-[#e8e4d8]/60">
          Reasoned by {m.model} · {m.latency_seconds.toFixed(1)}s · {m.output_tokens} tokens · source: {m.source}
        </p>
      </footer>

      <details className="group rounded-sm border border-[#1a1a1a]/15 bg-[#15140f]/5 dark:border-[#e8e4d8]/15 dark:bg-[#e8e4d8]/[0.03]">
        <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-4 font-mono text-[10px] uppercase tracking-[0.25em] text-[#1a1a1a]/70 hover:text-[#1a1a1a] dark:text-[#e8e4d8]/70 dark:hover:text-[#e8e4d8]">
          <span>Developer trace — view GLM-5.1 prompt &amp; response</span>
          <span className="font-mono text-base transition-transform group-open:rotate-45" aria-hidden>+</span>
        </summary>
        <div className="space-y-6 border-t border-[#1a1a1a]/10 px-5 py-6 dark:border-[#e8e4d8]/10">
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

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <fieldset className="space-y-5">
      <legend className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#1a1a1a]/45 dark:text-[#e8e4d8]/45">
        {label}
      </legend>
      <div className="space-y-5">{children}</div>
    </fieldset>
  );
}

function UnderlineField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block font-mono text-[10px] uppercase tracking-[0.2em] text-[#1a1a1a]/50 dark:text-[#e8e4d8]/50">
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
      className="w-full border-b border-[#1a1a1a]/20 bg-transparent py-1.5 font-mono text-sm text-[#1a1a1a] focus:border-[#c8412c] focus:outline-none dark:border-[#e8e4d8]/20 dark:text-[#e8e4d8] dark:focus:border-[#e87158] dark:[color-scheme:dark]"
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
      className="w-full resize-none border-b border-[#1a1a1a]/20 bg-transparent py-1.5 font-mono text-sm text-[#1a1a1a] placeholder:text-[#1a1a1a]/30 focus:border-[#c8412c] focus:outline-none dark:border-[#e8e4d8]/20 dark:text-[#e8e4d8] dark:placeholder:text-[#e8e4d8]/30 dark:focus:border-[#e87158]"
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
        className="flex w-full items-center justify-between border-b border-[#1a1a1a]/20 bg-transparent py-1.5 font-mono text-sm text-[#1a1a1a] hover:border-[#1a1a1a]/40 focus:border-[#c8412c] focus:outline-none dark:border-[#e8e4d8]/20 dark:text-[#e8e4d8] dark:hover:border-[#e8e4d8]/40 dark:focus:border-[#e87158]"
      >
        <span>{value}</span>
        <span className="text-xs text-[#1a1a1a]/50 dark:text-[#e8e4d8]/50" aria-hidden>{open ? "▴" : "▾"}</span>
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute z-10 mt-1 w-full rounded-sm border border-[#1a1a1a]/20 bg-[#f4efe6] py-1 font-mono text-sm shadow-md dark:border-[#e8e4d8]/20 dark:bg-[#15140f]"
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
                      ? "bg-[#c8412c]/15 text-[#c8412c] dark:bg-[#e87158]/15 dark:text-[#e87158]"
                      : "text-[#1a1a1a] hover:bg-[#1a1a1a]/5 dark:text-[#e8e4d8] dark:hover:bg-[#e8e4d8]/5"
                  }`}
                >
                  <span>{o}</span>
                  {active && <span className="text-xs" aria-hidden>✓</span>}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mb-4 border-b border-[#1a1a1a]/10 pb-2 font-mono text-[10px] uppercase tracking-[0.25em] text-[#1a1a1a]/55 dark:border-[#e8e4d8]/10 dark:text-[#e8e4d8]/55">
      {children}
    </h3>
  );
}

function Stat({
  label, value, sub, accent = false,
}: { label: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <div
      className={`flex flex-col gap-1 px-4 py-5 ${
        accent ? "bg-[#f4efe6] dark:bg-[#0d0c0a]" : "bg-[#ebe5d8] dark:bg-[#15140f]"
      }`}
    >
      <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#1a1a1a]/60 dark:text-[#e8e4d8]/60">
        {label}
      </span>
      <span className={`font-mono tracking-tight ${accent ? "text-3xl font-medium" : "text-xl"}`}>
        {value}
      </span>
      {sub && <span className="font-mono text-[10px] text-emerald-700 dark:text-emerald-400">{sub}</span>}
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
