# Sparkboard

A blog-style board for my AI ideas — sparks, experiments, and things I'm building.

Created by **Liz** ([@eelizabethho](https://github.com/eelizabethho)).

Built with Next.js, Tailwind, shadcn/ui and Supabase. See [docs/PLAN.md](docs/PLAN.md) for the plan.

## Setup

1. Create a Supabase project. In Auth, turn off sign-ups, add your own user, and add `http://localhost:3000/**` to the redirect URLs.
2. In Auth → Emails → Magic Link, set the link to `{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=email` so links work in any browser.
3. Open [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql), replace `OWNER_UUID` with your user's UUID, and run it in the Supabase SQL editor.
4. Run locally:

```bash
npm install
cp .env.example .env.local   # fill in your Supabase URL and anon key
npm run dev
```

5. Log in at `/login` (it isn't linked anywhere) to write ideas.

## Deploy

Import the repo in Vercel and add the two `NEXT_PUBLIC_SUPABASE_*` env vars. Then add `https://<your-app>.vercel.app/**` to the Supabase redirect URLs and set it as the Site URL. A daily Vercel cron hits `/api/keepalive` so the free Supabase project doesn't pause.
