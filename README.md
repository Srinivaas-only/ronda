# Ronda

> **An AI shift coach for Malaysian gig riders.**
> Powered by GLM-5.1.

UMHackathon 2026 · Domain 2: AI for Economic Empowerment & Decision Intelligence
Built by Srinivaas, Thenesh, Teeva, Davud, and Ambrish

---

## 🌐 Live Deployment

- **Frontend:** https://ronda-bice.vercel.app
- **Backend API:** https://ronda-backend-0og9.onrender.com
- **API Docs:** https://ronda-backend-0og9.onrender.com/docs

  ---

## 📹 Pitch Video

**▶️ [Watch the 10-minute pitch video here](https://drive.google.com/file/d/1s91Sx2t0eKzWxmp665ZrhS0u0Tm7kys3/view?usp=sharing)**

> Live product demonstration + architecture walkthrough + market context.

---

## 📂 Submission Documents

All required submission documents (PRD, SAD, QATD, Pitch Deck) are in the **`/docs`** folder of this repository. Navigate there to view or download the PDFs.

---

## What Ronda does

Every morning, hundreds of thousands of Malaysian gig workers face the same decision: should I work today, where, and when? The data they need is fragmented across five different places — weather apps, the platform's incentive bulletin, news feeds for events, fuel-price tickers, and their own earnings history. No tool synthesises them.

Ronda is a single-screen web application that takes a rider's context and produces a structured shift recommendation in approximately 10 seconds. The reasoning engine is **ILMU-GLM-5.1** (Z.AI / YTL AI Labs), accessed via the Anthropic-compatible API surface at `api.ilmu.ai/anthropic`. The output is a verdict (work / rest / partial), shift windows with zones, projected net earnings after petrol, a Malaysian-English narrative, ranked key factors, and explicit caveats.

A side-by-side comparison view at `/compare` demonstrates that removing GLM degrades the system to a generic rules engine that cannot read events, weight incentives, or calibrate confidence.

---

## Architecture

```
Browser (Next.js 16, React 19, Tailwind v4, TypeScript)
    │
    ▼   HTTPS / JSON · POST /api/recommend
    │
Backend (FastAPI, Python 3.14, Pydantic v2)
    │   - Input validation
    │   - Context summariser (3,200 → 350 chars)
    │   - Prompt builder
    │   - 3-tier fallback chain
    │
    ▼   Anthropic-compatible API · streaming preferred
    │
ILMU-GLM-5.1 (api.ilmu.ai/anthropic)
```

### Three-tier fallback chain

1. **Streaming** (preferred) — `anthropic.messages.stream()` reading from final message to capture non-text blocks
2. **Non-streaming** — fallback on `httpx.RemoteProtocolError`
3. **Rule-based** — deterministic baseline grounded in rider's 7-day average; tagged `source: "fallback_rules"` so the UI can communicate degraded mode honestly

---

## Quick start

### Backend
```bash
cd backend
pip install -r requirements.txt
cp .env.example .env   # then edit .env to add ILMU_API_KEY
uvicorn main:app --reload --port 8000
```

### Frontend
```bash
cd frontend/Ronda
npm install
npm run dev
```

 Open http://localhost:3000

### Database

Ronda uses **SQLite** (zero-config, file-based). The database is auto-created as `backend/ronda.db` on first server startup. It stores rider profiles and shift history.

**View the database:**
1. **Swagger UI (easiest):** Open `http://localhost:8000/docs` and use the interactive API docs to `GET /api/riders`, `POST /api/riders`, `GET /api/shifts`, `POST /api/shifts`
2. **VS Code:** Install the *SQLite Viewer* extension, then click on `backend/ronda.db` in the file explorer
3. **Command line:**
   ```bash
   cd backend
   python -c "from database import engine; import pandas as pd; print(pd.read_sql('SELECT * FROM riders', engine))"
   ```
4. **GUI app:** Download [DB Browser for SQLite](https://sqlitebrowser.org/) and open `backend/ronda.db`

> **Note:** `ronda.db` is gitignored (`*.db` in `.gitignore`) — it won't be committed.

---

## Tech stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 16 (App Router, Turbopack) · React 19 · Tailwind v4 · TypeScript · shadcn/ui |
| **Backend** | Python 3.14 · FastAPI · uvicorn · Pydantic v2 · anthropic SDK |
| **Reasoning** | ILMU-GLM-5.1 via api.ilmu.ai/anthropic |
| **CI** | GitHub Actions (lint + Pydantic schema tests) |
| **Fonts** | Instrument Serif · IBM Plex Mono · IBM Plex Sans |

---

## Real measured numbers

Every number from a live GLM call:

| Metric | Value |
|---|---|
| Median latency (p50) | 12s |
| 95th percentile latency | 25s |
| Output tokens per call | ~1,200 |
| Prompt size after compression | 750 chars |
| Quota headroom | 16,000 recommendations |
| Schema pass rate (first try) | 100% |

---

## Engineering decisions worth noting

| Constraint | Fix |
|---|---|
| Cloudflare 504s on verbose JSON | Context summariser compresses 3,200-char ContextPackets → 350-char paragraphs. Latency: 504 → 10s |
| ILMU streaming drops mid-response | Three-tier fallback: stream → non-stream → rule-based, with source flag exposed to UI |
| GLM-5.1 returns content in non-text blocks | Read from final message instead of streamed text iterator |
| Schema drift in GLM output | Pydantic validation + one corrective retry feeding the validation error back to GLM |

---

## Team

| Member | Role | Primary contribution |
|---|---|---|
| **Srinivaas** | Backend & ML Integration Lead | FastAPI service, ILMU-GLM-5.1 client with streaming + non-streaming + rule-based fallback, Pydantic schema enforcement, context summariser, synthetic data generator, Cloudflare timeout diagnosis & resolution |
| **Thenesh** | Frontend Engineering | Next.js 16 + Tailwind v4 implementation, side-by-side form layout, custom dropdown component, trace panel, comparison view routing, mobile responsiveness, dark-mode wiring |
| **Teeva** | UI/UX Design & Brand | Editorial visual system (Instrument Serif + IBM Plex Mono), colour palette, dark-cream tonal range, typographic hierarchy, brand voice, pitch deck visual direction |
| **Davud** | Quality Assurance & Documentation | Test scenario design, risk-assessment matrix, prompt/response validation pairs, hallucination handling tests, quality assurance documentation, CI workflow definition, edge-case scripting |
| **Ambrish** | Product Strategy & Pitch | Persona research (Aiman, Mei Ling, Ravi), market sizing for Malaysian gig economy, pitch deck narrative arc, 10-minute pitch video script and direction, judging-criteria alignment |

---

## Repository structure

```
ronda/
├── README.md                           ← you are here
├── docs/                               ← all submission documents
│   ├── UMHackathon2026_Ronda_PRD.pdf
│   ├── UMHackathon2026_Ronda_SAD.pdf
│   ├── UMHackathon2026_Ronda_QATD.pdf
│   └── UMHackathon2026_Ronda_PitchDeck.pdf
├── backend/                            ← FastAPI + GLM-5.1 client
│   ├── main.py
│   ├── api_models.py
│   ├── schemas.py
│   ├── glm_client.py
│   ├── context_summary.py
│   ├── prompts.py
│   ├── data/
│   │   ├── aiman_history.csv
│   │   └── synthetic_generator.py
│   └── requirements.txt
└── frontend/Ronda/                     ← Next.js 16 application
    ├── app/
    │   ├── page.tsx                    ← morning brief view
    │   └── compare/page.tsx            ← GLM vs rules comparison
    ├── lib/
    │   ├── api.ts
    │   ├── types.ts
    │   ├── compare-data.ts
    │   └── demo-data.ts
    └── package.json
```

---

© UMHackathon 2026 · Ronda
