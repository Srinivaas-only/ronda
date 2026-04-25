# Ronda

> *AI shift coach for Malaysian gig riders. UMHackathon 2026, Domain 2: AI for Economic Empowerment & Decision Intelligence.*

Every morning, a Malaysian foodpanda rider faces one decision that swings their daily income by RM50–100: **should I ride today, and if yes — which hours, which zones?** Most riders make it on gut feel. Ronda makes it with reasoning.

The reasoning engine is **ILMU-GLM-5.1** (Z.AI's GLM via YTL AI Labs). Without GLM, the system falls back to a transparent rule-based baseline — so the value of the LLM layer is provable, not hidden.

---

## What the product does

Given six signals — hourly weather forecast, public holidays, local events, RON95 fuel price, the rider's own historical earnings pattern, and platform incentives — Ronda issues a structured daily shift recommendation: a **verdict** (work / rest / partial), **shift windows** with zones, **projected net earnings** (after petrol), a **plain-language narrative**, **key factors** that drove the decision, and **caveats** to watch for.

At 14:00 the system re-plans the afternoon if the morning's actuals diverged from forecast.

The recommendation is auditable: every output is grounded in the rider's own historical numbers and the live signals shown.

---

## Why the rubric is satisfied

| Criterion | How Ronda answers it |
|---|---|
| **GLM-indispensable** | Six heterogeneous signals synthesised into a narrative recommendation with explicit factor weighting and confidence calibration. A rules engine cannot produce the natural-language reasoning, the conflict-aware confidence, or the personalised explanation. |
| **Quantifiable economic impact** | Output includes projected net RM, gross RM, petrol RM, and uplift % vs the rider's recent 7-day average. |
| **Realistic target user & validation** | Persona: Aiman, 27, foodpanda Klang Valley, ~RM3,000 net/month. Backed by 90 days of synthetic-but-realistic earnings history (655 rows, RM 102/day net, RM 19.5 orders/day — within the foodpanda KL real-world band). |
| **Decision intelligence, not automation** | The system does not place orders or click for the rider. It informs one daily decision and explains itself. |

---

## Architecture (top-down)

```
┌────────────────────────────────────────────────────────────────┐
│                  Frontend — Next.js 16 + Tailwind              │
│       Morning view · Trace panel · Editorial dark UI           │
└──────────────────────────────┬─────────────────────────────────┘
                               │  HTTPS / JSON
┌──────────────────────────────┴─────────────────────────────────┐
│                Backend — FastAPI + Python 3.14                 │
│                                                                │
│  Context Assembler ──► Context Summariser ──► GLM Client       │
│        │                                            │          │
│        ▼                                            ▼          │
│  Weather · Events · Incentives · Rider History  ILMU API       │
│  (Open-Meteo, JSON, SQLite seed)            (Anthropic-compat) │
│                                                                │
│  Validator (Pydantic) ◄── streaming → non-streaming → fallback │
│                                                                │
└────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌────────────────────────────────────────────────────────────────┐
│         ILMU-GLM-5.1  via  https://api.ilmu.ai/anthropic       │
└────────────────────────────────────────────────────────────────┘
```

### Why we use a context summariser

ILMU's edge sits behind Cloudflare with a ~100s response ceiling. Verbose JSON context (15 hourly weather rows + history + events) reliably tripped the timeout on GLM-5.1's reasoning workload. We compress the structured packet into a ~350-character natural-language paragraph before sending. Real prompt size dropped from 3,219 → 1,240 chars; latency dropped from "504 timeout" → ~10s. Identical signal preserved.

### Why streaming + non-streaming fallback

GLM-5.1 occasionally drops streaming connections mid-response (`httpx.RemoteProtocolError`). The client tries streaming first; on disconnect it retries non-streaming once before falling through to the rule-based baseline.

---

## Tech stack

**Backend:** Python 3.14 · FastAPI · Pydantic · `anthropic` SDK (pointed at ILMU) · pandas · numpy
**Frontend:** Next.js 16 (Turbopack) · React 19 · Tailwind v4 · shadcn/ui · TypeScript · Instrument Serif + IBM Plex Sans/Mono
**Reasoning:** ILMU-GLM-5.1 (Z.AI / YTL AI Labs) via Anthropic-compatible endpoint
**Data:** Synthetic 90-day rider history (deterministic, seeded), Open-Meteo weather, hand-curated events/incentives JSON
**CI:** GitHub Actions

---

## Quick start

### Backend
```bash
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1   # Windows
pip install -r requirements.txt
cp ../.env.example ../.env     # add your ILMU_API_KEY
python see_glm.py              # runs one full GLM recommendation
```

### Frontend
```bash
cd frontend/Ronda
npm install
npm run dev
# http://localhost:3000
```

---

## Repo layout

```
backend/
  glm_client.py          ILMU client: streaming + fallback + validation
  prompts.py             system + user prompt templates
  context_summary.py     packet → compact paragraph compressor
  schemas.py             Pydantic models — output contract
  data/
    aiman_history.csv         90 days of synthetic rider history
    synthetic_generator.py    one-zone-per-hour realistic generator
  see_glm.py             pitch-grade demo script
  scripts/               diagnostic probes (model discovery, latency)
  tests/

frontend/Ronda/
  app/page.tsx           morning view + GLM trace panel
  app/layout.tsx         font wiring (Instrument Serif, IBM Plex)
  lib/types.ts           TS types mirroring Pydantic schemas
  lib/demo-data.ts       cached real GLM-5.1 output (offline-safe demo)

docs/                    PRD, SAD, QA testing documentation
.github/workflows/ci.yml backend test pipeline
```

---

## Engineering notes worth reading

- **GLM output is enforced via Pydantic.** Every response must validate against `ShiftRecommendation`. Malformed → retry once with the validation error fed back to GLM → still bad → rule-based fallback labelled `source: "fallback_rules"`.
- **Token cost is logged on every call.** Real measured average: ~750 input chars, ~1,100 output tokens, ~10s latency. With 50M-token quota that's headroom for ~16,000 recommendations.
- **No private data.** Aiman's history is synthetic and reproducible (seeded RNG). No real rider PII enters the system.
- **The trace panel on the morning view shows the actual prompt and raw JSON response** — the same evidence judges would otherwise need to inspect logs to find.

---

## Team

| Member | Role | Primary contribution |
|---|---|---|
| **Srinivaas** | Backend & ML Integration Lead | FastAPI service, ILMU-GLM-5.1 client with streaming + non-streaming + rule-based fallback, Pydantic schema enforcement, context summariser, synthetic data generator, Cloudflare timeout diagnosis & resolution. |
| **Thenesh** | Frontend Engineering | Next.js 16 + Tailwind v4 implementation, side-by-side form layout, custom dropdown component, trace panel, comparison view routing, mobile responsiveness, dark-mode wiring. |
| **Teeva** | UI/UX Design & Brand | Editorial visual system (Instrument Serif + IBM Plex Mono), colour palette, dark-cream tonal range, typographic hierarchy, brand voice ("Selamat pagi, Aiman" greeting tone), pitch deck visual direction. |
| **Davud** | Quality Assurance & Documentation | Test scenario design, risk-assessment matrix, prompt/response validation pairs, hallucination handling tests, quality assurance documentation, CI workflow definition, edge-case scripting. |
| **Ambhrish** | Product Strategy & Pitch | Persona research (Aiman, Mei Ling, Ravi), market sizing for Malaysian gig economy, pitch deck narrative arc, 10-minute pitch video script and direction, judging-criteria alignment. |

---

## License

Private — UMHackathon 2026 submission.
