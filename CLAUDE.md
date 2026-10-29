@AGENTS.md

# Sparkboard

Created by Liz (@eelizabethho). The plan and every product decision live in `docs/PLAN.md` — read it first and tick boxes as you finish tasks.

- Next.js here is newer than your training data: read the matching guide in `node_modules/next/dist/docs/` before using a Next API.
- Smallest change that does the job. No new dependency unless the plan lists it.
- Apple-style look (see PLAN "Look"): system font, `#f5f5f7` / `#1d1d1f`, white rounded cards, black accents, frosted sticky header, no animation library.
- Writes are protected by Supabase RLS (`is_owner()`); never use the service-role key in app code.
- Before calling a task done: `npm run lint && npm run build`.
- One commit per task, message like `phase 3: home filter pills`.
