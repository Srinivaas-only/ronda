# Ronda

**AI shift coach for Malaysian food-delivery riders.**

Built for UMHackathon 2026, Domain 2: AI for Economic Empowerment & Decision Intelligence.

Ronda is a decision-intelligence tool that helps gig-economy riders answer one question every day: *"Should I ride today, and if yes — which hours, which zones, and what's my projected net earnings?"* It reasons over weather, local events, public holidays, fuel cost, platform incentives, and the rider's own earnings history to produce a structured recommendation with plain-language explanation — then adapts at midday when reality diverges from forecast.

The reasoning engine is **ILMU-GLM-5.1** (Z.AI's GLM delivered through YTL AI Labs' hackathon endpoint). Without GLM, the system falls back to a clearly-labelled rule-based baseline, proving the reasoning layer is load-bearing.

## Target user

Aiman, 27, full-time foodpanda rider in Klang Valley. 125cc motorbike. Earns RM2,800–3,500/month gross. Rides 5–6 days/week, 8–10 hours/day. Been riding 2+ years.

## Decision cadence

- **09:00 daily** — morning shift recommendation for the day ahead
- **14:00 daily** — midday re-plan based on morning actuals and updated forecasts

## Repo layout

```
backend/    FastAPI service + ILMU-GLM integration + synthetic data
frontend/   Next.js 14 UI (scaffolded by frontend owner)
docs/       PRD, SAD, QA Testing Doc
.github/    CI workflow
```

## Team & ownership

| Area | Owner |
|---|---|
| Backend + GLM + data | Vaas |
| Frontend | Teammate 2 |
| PRD + SAD | Teammate 3 |
| QA doc + pitch deck + video | Teammate 4 |

## Prerequisites

1. **Python 3.11+** installed. If not set up yet, follow VS Code's tutorial: https://code.visualstudio.com/docs/python/python-tutorial
2. **ILMU API key** from https://console.ilmu.ai/ (you should already have this from the hackathon setup).
3. **Node.js 20+** (only for the frontend).

## Local setup (backend)

```bash
cd backend
python -m venv .venv
source .venv/bin/activate       # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp ../.env.example ../.env      # then fill in ILMU_API_KEY and your model string
uvicorn main:app --reload
```

Open `http://localhost:8000/docs` for auto-generated OpenAPI docs (screenshots go into the SAD doc).

### Verify the ILMU connection works

```bash
# from backend/
pytest tests/test_glm_client.py -v -s
```

If the test passes, GLM (the model configured in `.env`) is reachable and returning schema-valid JSON.

## Model string configuration

The exact identifier for GLM-5.1 on the ILMU endpoint must be copied verbatim from your ILMU console. `.env.example` defaults to `glm-5.1` as a best-guess. If the test fails with "model not found", replace `GLM_MODEL_REASONING` in `.env` with the string the console gives you.

## License

Private — UMHackathon 2026 submission.
