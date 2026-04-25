# Ronda — Frontend

**Owner: Teammate 2**

This directory is intentionally empty. Scaffold it tomorrow with:

```bash
npx create-next-app@latest . --typescript --tailwind --app --no-src-dir --import-alias "@/*"
npx shadcn@latest init
npx shadcn@latest add card button badge separator alert progress
```

## What you're building (minimum for the demo)

Three screens:

1. **Morning view** (9am) — show today's recommendation. Big verdict (Work / Rest / Partial), shift windows with zones, projected net RM, narrative, key factors as coloured chips.
2. **Midday view** (2pm) — show morning plan vs actuals, then the revised afternoon plan. Highlight what changed.
3. **Evening review** (optional, nice to have) — morning vs actual earnings, lessons surfaced by GLM.

## Backend contract

Base URL from env var `NEXT_PUBLIC_API_URL`, default `http://localhost:8000`.

```
POST /recommend/morning
POST /recommend/midday
GET  /health
```

Full types are in `backend/schemas.py`. Mirror them in `types.ts`.

## Design direction

- Mobile-first. Aiman uses a mid-range Android. Design for 375px width first.
- Malay + English copy. Keep primary labels English, sprinkle Malay (e.g. "Rezeki hari ni: RM142").
- Dark mode default. Riders use phones in sunlight but also at night — dark mode reads both ways.
- Use shadcn/ui components. Don't roll your own design system.
