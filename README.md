# Ronda

> **A high-frequency earnings optimizer for Malaysian gig riders.**
> Platform Arbitrage powered by GLM-5.1 via Z.AI.

UMHackathon 2026 · Domain 2: AI for Economic Empowerment & Decision Intelligence
Built by Srinivaas, Thenesh, Teeva, Davud, and Ambrish

---

## 🌐 Live Deployment

| | URL |
|---|---|
| **Frontend** | https://ronda-bice.vercel.app |
| **Backend API** | https://ronda-backend-0og9.onrender.com |
| **API Docs (Swagger)** | https://ronda-backend-0og9.onrender.com/docs |

---

## 📂 Submission Documents (Final Round)

| Document | Link |
|---|---|
| **Business Proposal** | [Google Drive — PDF](https://drive.google.com/file/d/1lU5exMjYFJpCBn21UVbq0lm7I6ecvc4l/view?usp=drive_link) |
| **Deployment Plan** | [Google Drive — PDF](https://drive.google.com/file/d/1SC7daZhmu_9BjpmNoPtVYzOreS0D9NiW/view?usp=drive_link) |
| **Refined QATD** | [Google Drive — PDF](https://drive.google.com/file/d/1Q8D_fUbzVVlqNMnWF04Jh7Y15X_i6zId/view?usp=drive_link) |
| **Pitch Deck** | [Google Drive — PDF](https://drive.google.com/file/d/12LuhHeieL9CCxQMqUbMejcwwvgMGkw7L/view?usp=drive_link) |
| **PRD (Preliminary)** | [`docs/UMHackathon2026_Ronda_PRD_1.pdf`](docs/UMHackathon2026_Ronda_PRD_1.pdf) |
| **SAD (Preliminary)** | [`docs/UMHackathon2026_Ronda_SAD_1.pdf`](docs/UMHackathon2026_Ronda_SAD_1.pdf) |
| **QATD (Preliminary)** | [`docs/UMHackathon2026_Ronda_QATD_1.pdf`](docs/UMHackathon2026_Ronda_QATD_1.pdf) |

> **To add your Google Drive links:** Upload each PDF to Google Drive → Right-click → Share → "Anyone with the link" → Copy link → Replace `YOUR_GDRIVE_LINK_HERE` above.

---

## 📹 Pitch Video

**▶️ [Watch the 10-minute pitch video here](https://drive.google.com/file/d/1s91Sx2t0eKzWxmp665ZrhS0u0Tm7kys3/view?usp=sharing)**

> Live product demonstration + architecture walkthrough + market context.

---

## What Ronda does

Every morning, hundreds of thousands of Malaysian gig workers face the same decision: should I work today, where, and when? The data they need is fragmented across five different places — weather apps, platform incentive bulletins, news feeds for events, fuel-price tickers, and their own earnings history. No tool synthesises them. Worse, no tool compares across platforms.

Ronda is a high-frequency earnings optimizer that takes a rider's context and produces a structured shift recommendation in approximately 10 seconds. The core innovation is **Platform Arbitrage** — comparing live voucher drops, incentive boosts, and surge windows across Grab, ShopeeFood, and Foodpanda to tell riders exactly *when* and *where* to switch apps for maximum RM per hour.

The reasoning engine is **GLM-5.1** (Z.AI), accessed via the Anthropic-compatible API surface at `api.z.ai/api/anthropic`. The output includes:

- A verdict (work / rest / partial)
- Shift windows with **target app** (Grab / ShopeeFood / FoodPanda) and **opportunity gain** per window
- Projected net earnings after petrol
- A Malaysian-English narrative naming the Switch Window explicitly
- Ranked key factors with impact weights
- Explicit caveats with confidence calibration

A side-by-side comparison view at `/compare` demonstrates that removing GLM degrades the system to a generic rules engine that cannot read events, compare platforms, weight incentives, or calibrate confidence.

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
    │   - Platform Arbitrage prompt builder
    │   - 3-tier fallback chain
    │   - SQLite (rider profiles + shift history)
    │
    ▼   Anthropic-compatible API · streaming preferred
    │
GLM-5.1 (api.z.ai/api/anthropic)
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
cp .env.example .env   # then edit .env to add your Z.AI API key
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

Ronda uses **SQLite** (zero-config, file-based). The database is auto-created as `backend/ronda.db` on first server startup via the FastAPI lifespan hook. It stores rider profiles and shift history via SQLAlchemy ORM.

**View the database:**
- **Swagger UI (easiest):** Open `http://localhost:8000/docs` and use `GET /api/riders`, `POST /api/riders`, `GET /api/shifts`, `POST /api/shifts`
- **VS Code:** Install the *SQLite Viewer* extension, then click on `backend/ronda.db`
- **DB Browser:** Download [DB Browser for SQLite](https://sqlitebrowser.org/) and open `backend/ronda.db`

> `ronda.db` is gitignored — it won't be committed.

### Environment variables

| Variable | Description | Example |
|---|---|---|
| `ILMU_API_KEY` | Z.AI API key for GLM-5.1 | `sk-...` |
| `ANTHROPIC_BASE_URL` | API endpoint (default: `https://api.z.ai/api/anthropic`) | `https://api.z.ai/api/anthropic` |
| `GLM_MODEL_REASONING` | Model string (default: `ilmu-glm-5.1`) | `ilmu-glm-5.1` |
| `FRONTEND_ORIGINS` | Comma-separated CORS origins | `http://localhost:3000,https://ronda-bice.vercel.app` |

---

## Tech stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 16 (App Router, Turbopack) · React 19 · Tailwind v4 · TypeScript · shadcn/ui |
| **Backend** | Python 3.14 · FastAPI · uvicorn · Pydantic v2 · anthropic SDK · SQLAlchemy |
| **Database** | SQLite (auto-created, zero-config) |
| **Reasoning** | GLM-5.1 via Z.AI (`api.z.ai/api/anthropic`) |
| **CI** | GitHub Actions (ruff lint + Pydantic schema tests) |
| **Deployment** | Frontend: Vercel · Backend: Render (Singapore) |
| **Fonts** | Instrument Serif · IBM Plex Mono · IBM Plex Sans |

---

## Real measured numbers

Every number from a live GLM call:

| Metric | Value |
|---|---|
| End-to-end latency | 10–25s (median 12s, p95 25s) |
| Output tokens per call | 1,000–1,200 |
| Prompt size after compression | ~750 chars |
| Quota headroom | ~16,000 recommendations (hackathon 50M-token quota) |
| Schema pass rate (first try) | 100% |

---

## Engineering decisions worth noting

| Constraint | Fix |
|---|---|
| Cloudflare 504s on verbose JSON | Context summariser compresses 3,200-char ContextPackets → 350-char paragraphs. Latency: 504 → 10s |
| Streaming drops mid-response | Three-tier fallback: stream → non-stream → rule-based, with source flag exposed to UI |
| GLM-5.1 returns content in non-text blocks | Read from final message instead of streamed text iterator |
| Schema drift in GLM output | Pydantic validation + one corrective retry feeding the validation error back to GLM |
| CORS blocking Vercel → Render | `FRONTEND_ORIGINS` env var + `*.vercel.app` regex pattern |
| Auth error after key migration | `ANTHROPIC_BASE_URL` → `ILMU_BASE_URL` fallback chain in env var reading |

---

## Team

| Member | Role | Primary contribution |
|---|---|---|
| **Srinivaas** | Backend & ML Integration Lead | FastAPI service, GLM-5.1 client with streaming + non-streaming + rule-based fallback, Pydantic schema enforcement, context summariser, Platform Arbitrage prompt engineering, SQLite database, Cloudflare timeout diagnosis & resolution |
| **Thenesh** | Frontend Engineering | Next.js 16 + Tailwind v4 implementation, side-by-side form layout, custom dropdown component, trace panel, comparison view routing, mobile responsiveness, dark-mode wiring |
| **Teeva** | UI/UX Design & Brand | Editorial visual system (Instrument Serif + IBM Plex Mono), colour palette, dark-cream tonal range, typographic hierarchy, brand voice, pitch deck visual direction |
| **Davud** | Quality Assurance & Documentation | Test scenario design, risk-assessment matrix, prompt/response validation pairs, hallucination handling tests, quality assurance documentation, CI workflow definition, edge-case scripting |
| **Ambrish** | Product Strategy & Pitch | Persona research (Aiman, Mei Ling, Ravi), market sizing for Malaysian gig economy, pitch deck narrative arc, 10-minute pitch video script and direction, judging-criteria alignment |

---

## Repository structure

```
ronda/
├── README.md                           ← you are here
├── docs/                               ← submission documents
│   ├── UMHackathon2026_Ronda_PRD_1.pdf
│   ├── UMHackathon2026_Ronda_SAD_1.pdf
│   ├── UMHackathon2026_Ronda_QATD_1.pdf
│   ├── UMHackathon2026_Ronda_BusinessProposal.pdf
│   └── UMHackathon2026_Ronda_PitchDeck.pdf
├── backend/                            ← FastAPI + GLM-5.1 client
│   ├── main.py                         HTTP, CORS, /api/recommend, /api/health, rider/shift CRUD
│   ├── glm_client.py                   3-tier GLM orchestration + schema retry
│   ├── schemas.py                      ShiftRecommendation, ContextPacket (Pydantic v2)
│   ├── api_models.py                   Request/response models for /api/recommend
│   ├── context_summary.py              ContextPacket → 350-char paragraph
│   ├── prompts.py                      Platform Arbitrage system + user prompts
│   ├── database.py                     SQLite engine + session factory (SQLAlchemy)
│   ├── models.py                       Rider + ShiftHistory ORM models
│   ├── see_glm.py                      Quick GLM smoke test script
│   ├── data/
│   │   ├── aiman_history.csv           655-row synthetic rider history
│   │   └── synthetic_generator.py      History data generator
│   ├── scripts/
│   │   ├── measure.py                  Latency measurement script
│   │   ├── probe_models.py             Model availability checker
│   │   ├── probe_sizes.py              Prompt size testing
│   │   └── see_raw.py                  Raw GLM response inspector
│   ├── tests/
│   │   ├── test_schemas.py             6 unit tests (Pydantic schema validation)
│   │   └── test_glm_client.py          GLM client integration tests
│   └── requirements.txt
├── frontend/Ronda/                     ← Next.js 16 application
│   ├── app/
│   │   ├── page.tsx                    Morning brief view (form + verdict + narrative)
│   │   ├── compare/page.tsx            GLM vs rules side-by-side comparison
│   │   ├── layout.tsx                  Root layout + font loading
│   │   └── globals.css                 Tailwind v4 config + design tokens
│   ├── components/
│   │   ├── theme-provider.tsx          Dark mode provider
│   │   └── ui/                         shadcn/ui primitives (alert, badge, button, card, progress, separator)
│   ├── lib/
│   │   ├── api.ts                      API client (POST /api/recommend)
│   │   ├── types.ts                    TypeScript types mirroring Pydantic schema
│   │   ├── compare-data.ts             Pre-canned GLM vs rules scenarios
│   │   ├── demo-data.ts                Sample brief for offline demo
│   │   └── utils.ts                    Tailwind merge utility
│   └── package.json
└── .github/workflows/
    └── ci.yml                          Ruff lint + pytest on every push
```

---

© UMHackathon 2026 · Ronda · Powered by GLM-5.1 via Z.AI
