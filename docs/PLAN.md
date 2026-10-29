# Sparkboard — v1 plan

A blog-style board for Liz's AI ideas. Public to read, only Liz writes.
Creator: **Liz** ([@eelizabethho](https://github.com/eelizabethho)).

Execution: one orchestrator session, one Sonnet subagent per phase, a commit per task,
a review subagent after each phase, and a stop for Liz to check in the browser.
Tick boxes as you go.

## Decisions (settled)

- **Visibility:** visitors only read public ideas; no visible login, no sign-up. Liz logs in at the unlisted `/login` with a magic link. Saving in the editor updates the live site immediately (no redeploy).
- **Private = draft:** one `is_private` flag, **defaults to true**.
- **Idea fields:** title, pitch (one line), body (markdown), status (`spark → exploring → building → shipped | shelved`), category (free text, one per idea), tags, cover image, links, created/updated.
- **Categories:** no preset list. Editor has a combobox: pick an existing category or type a new one. Home filter pills = categories used by visible ideas.
- **Cover:** optional upload (Supabase Storage, public bucket `covers`, max 5 MB, `accept="image/*"` so phones offer the camera). No upload → deterministic gradient from the title. Body images only via pasted `![](url)`.
- **Pages:** `/` home, `/ideas/[slug]` detail, `/new` + `/ideas/[slug]/edit` editor (owner only), `/login`. Nothing else in v1 (no comments, likes, newsletter, analytics).
- **Search/sort:** load all visible ideas, filter/search/sort in the browser. Sorts: Latest, Recently updated, Status.
- **Slug:** from the title at creation, never changes on rename (append `-2`, `-3` on collision).
- **Share previews:** `generateMetadata` OG tags (title, pitch, cover). No generated OG images.
- **AI features:** none in v1. v2 candidates: suggest tags/category/pitch on save. No placeholder columns.
- **Stack:** Next.js (App Router, the installed version — read `node_modules/next/dist/docs/` first), Tailwind v4, shadcn/ui, `@supabase/supabase-js` + `@supabase/ssr`, `react-markdown` + `remark-gfm`, Sonner. CSS columns for masonry. No animation library.
- **Look (Apple-style, see `apple-design` skill):** system font stack (`-apple-system, BlinkMacSystemFont, system-ui, sans-serif`), tighter tracking on large headings; light bg `#f5f5f7`, text `#1d1d1f`, white cards, black accents (buttons, active pill); dark mode bg `#000`, cards `#1c1c1e`, toggle in header. Sticky frosted header (`backdrop-filter: blur(20px) saturate(180%)`) holding title, filter pills, search, sort. Cards: very rounded (`rounded-3xl`), image-first, category chip, round ↗ arrow button (AshGray); `:active` scale 0.97, gentle hover lift. Honour `prefers-reduced-motion` and `prefers-reduced-transparency`.
- **Deploy:** public GitHub repo, Vercel Hobby on `*.vercel.app`, Supabase free tier, daily Vercel cron hitting `/api/keepalive` so the project doesn't pause.

## Data model

```sql
create table ideas (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  pitch text not null default '',
  body text not null default '',
  status text not null default 'spark'
    check (status in ('spark','exploring','building','shipped','shelved')),
  category text,
  tags text[] not null default '{}',
  links text[] not null default '{}',
  cover_url text,
  is_private boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

Owner check: `public.is_owner()` returns `auth.uid() = '<OWNER_UUID>'` (Liz's auth user id, not secret).
RLS: select where `not is_private or is_owner()`; insert/update/delete where `is_owner()`.
Storage `covers`: public read; insert/update/delete only `is_owner()`.
`updated_at` set by a trigger.

## Phase 0 — Liz (accounts) ⛔ needs Liz
- [ ] Create a Supabase project (free tier).
- [ ] Auth → Providers → Email: keep enabled; **turn off "Allow new users to sign up"**.
- [ ] Auth → Users → Add user → your email. Copy the user's UUID.
- [ ] Auth → URL Configuration: add `http://localhost:3000/**` (and later the vercel.app URL) to redirect URLs.
- [ ] Put `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local` (Project Settings → API).

## Phase 1 — Scaffold + Apple theme
- [x] `create-next-app` (TS, Tailwind, ESLint, App Router).
- [x] shadcn/ui init (neutral), add: button, input, textarea, badge, select, command/popover (combobox), dropdown-menu, switch, label, sonner.
- [x] Theme tokens in `app/globals.css` (light + dark, values above); system font; `next-themes` toggle.
- [x] Layout shell: sticky frosted header with "Sparkboard" wordmark + theme toggle; footer "Made by Liz".
- [x] Static mock home with 6 hard-coded cards to prove the look (masonry via CSS columns, gradient fallback util).
- **Check:** `npm run lint && npm run build`; screenshot at desktop + 375px wide in light + dark.

## Phase 2 — Supabase
- [x] `supabase/migrations/0001_init.sql`: table, trigger, `is_owner()`, RLS, `covers` bucket + policies (OWNER_UUID placeholder).
- [x] `lib/supabase/{server,client}.ts` via `@supabase/ssr`; session refresh per the installed Next docs (middleware/proxy).
- [x] `lib/ideas.ts`: `Idea` type, `listIdeas()`, `getIdea(slug)`, `isOwner()`.
- [ ] ⛔ Liz runs the SQL in the Supabase SQL editor with her UUID filled in.
- **Check:** build passes; anon select returns only public rows.

## Phase 3 — Home
- [x] Server page loads visible ideas; client component does pills / search (title, pitch, tags) / sort.
- [x] Card: cover or gradient, category chip, status, title, pitch, ↗ button → detail.
- [x] Empty state.
- **Check:** filter, search, sort work; layout at 375px.

## Phase 4 — Detail
- [x] `/ideas/[slug]`: cover, title, pitch, status, category, tags, links, markdown body (react-markdown + remark-gfm, no raw HTML), dates.
- [x] 404 for missing or private-to-visitor ideas. `generateMetadata` OG tags.
- [x] Owner sees Edit button.

## Phase 5 — Login + editor
- [ ] `/login`: email field → `signInWithOtp({ shouldCreateUser: false })` → `/auth/callback` route exchanges the code.
- [ ] Owner-only `/new` and `/ideas/[slug]/edit`: all fields, category combobox, tags input, links list, private switch (default on), cover upload (≤5 MB, image/*), markdown textarea with live preview tab, delete with confirm.
- [ ] Server actions validate input and rely on RLS; `revalidatePath` after save; Sonner toasts.
- [ ] Header shows "+ New" and Log out only to the owner.
- **Check:** create → appears on home; private hidden when logged out; edit keeps slug.

## Phase 6 — Deploy
- [ ] `/api/keepalive` (cheap select) + `vercel.json` daily cron.
- [ ] README: what it is, creator credit, setup steps.
- [ ] ⛔ Liz: import the repo in Vercel, add the two env vars, add the vercel.app URL to Supabase redirect URLs.
- **Check:** production login + create works.
