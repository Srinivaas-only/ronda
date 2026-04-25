# Ronda — Documentation

**Three PDFs must be submitted by 26 April 07:59 MYT:**

| Document | Owner | Status | Draft path |
|---|---|---|---|
| PRD (Product Requirement Document) | Teammate 3 | TODO | `docs/prd/PRD.md` → export to PDF |
| SAD (System Analysis Document) | Teammate 3 | TODO | `docs/sad/SAD.md` → export to PDF |
| QA Testing Documentation | Teammate 4 | TODO | `docs/qa/QA.md` → export to PDF |

The samples provided by the hackathon organisers are in the project root of the repo (one level up). Follow their section structure exactly — judges are scoring against it.

## Writing approach

Write each doc in Markdown first for version-control friendliness. Export to PDF using:

```bash
# with pandoc
pandoc docs/prd/PRD.md -o docs/prd/PRD.pdf --pdf-engine=xelatex
```

Or Google Docs → Download → PDF if that's faster.

## Mandatory content cross-refs

The following things MUST appear somewhere in the docs for the rubric:

- **PRD §4.3** — Model selection (GLM), justification, prompting strategy, context handling, fallback behaviour. All documented in `backend/prompts.py` and `backend/glm_client.py`.
- **SAD** — LLM as service layer diagram, dependency diagram, sequence diagram for morning recommendation, ERD for SQLite schema, tech stack, NFR table with token latency + cost efficiency.
- **QA §2** — Risk register with 5×5 matrix. §6 — 3 prompt/response test pairs, oversized input test, adversarial test, hallucination handling. §4 — CI/CD thresholds.
- **Citations** — every external resource (OpenAPI, Open-Meteo, GLM docs, any dataset) must be cited. Missing citations = potential DQ per the Official Handbook.
