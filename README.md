# Lightning Lessons

A free platform for short video lessons. Instructors upload lessons, admins
review them, and students watch, save, and track their progress.

Graduation project — Chanthana HEM & Sovandara Phallim. Built from the
*Backend Architecture & Technical Design Document*.

**Stack:** Next.js 16 (App Router) · Supabase (Postgres, Auth, Row Level Security) · Mux (video) · Tailwind CSS 4 · TypeScript

---

## Quick start (already have access to our Supabase project)

The database, admin account and videos live in **our shared Supabase and Mux
projects**, not in git — so once your `.env.local` points at them you see
exactly the same data as everyone else. Nothing to set up in the database.

```bash
git clone https://github.com/NaAtWerk/canaryWork.git
cd canaryWork
npm install
cp .env.example .env.local      # then paste the values (see "Environment variables")
npm run dev                     # → http://localhost:3000
```

Sign in with your own account (sign up at `/sign-up`), or ask for the shared
admin login.

---

## 1. What you need installed

| Tool | Version | Check with |
|---|---|---|
| [Node.js](https://nodejs.org) | **22 or newer** | `node -v` |
| npm | comes with Node | `npm -v` |
| Git | any recent | `git --version` |

You also need access to the **Supabase** project (and **Mux** if you'll upload
videos) — ask Sovandara for an invite, or for the keys below.

## 2. Environment variables

Copy `.env.example` to `.env.local` and fill it in. **`.env.local` is never
committed** — share these values privately (direct message or password
manager), never in git, a group chat, or a screenshot.

| Variable | Where to find it | Needed for |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API | everything |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API (`anon` / public) | everything |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` locally | email confirmation links |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API (`service_role`, **secret**) | attaching videos, disabling accounts, `create-admin`, e2e tests |
| `MUX_TOKEN_ID` / `MUX_TOKEN_SECRET` | Mux → Settings → Access Tokens (Mux Video, Read + Write) | uploading videos |
| `MUX_WEBHOOK_SECRET` | Mux → Settings → Webhooks | **leave empty locally**; only for the deployed site |

Without the Mux and service-role keys the app still works — you just can't
upload videos. **Restart `npm run dev` after changing `.env.local`.**

## 3. Run it

```bash
npm run dev
```

Open http://localhost:3000.

## 4. Accounts and roles

| Role | How you get it | What you can do |
|---|---|---|
| Student | Every new sign-up | Browse, watch, save lessons, track progress (**My learning**) |
| Instructor | Click **Start teaching** (on `/on-board` or **Settings**) | **Teach**: create lessons, upload video, add resources, submit for review |
| Admin | Created at setup (below), or promoted by another admin | **Admin**: approve / request changes, manage users and roles, disable accounts, categories |

Public sign-up can never create an admin. To create one:

```bash
npm run create-admin -- --email you@example.com --name "Your Name" --password "a-strong-password"
```

Run it from the `canaryWork` folder. Running it again for the same email
promotes that account or resets its password. After that, admins can promote
anyone from **Admin → Users**.

## 5. Try the whole flow

1. **Instructor** — sign in, **Teach → New lesson** → title + category → **Create draft & continue** → **Upload video** → add a resource → **Submit for review**.
2. **Admin** — **Admin → Lessons** → open the lesson → watch it → **Approve & publish** (or **Request changes** with a reason; the instructor sees it and can resubmit).
3. **Student** — the lesson appears on **Browse**. Search, filter by category, sort by Trending/Newest, open it and press play (counts a view), **Save** it, watch past 90% (marks it completed). **My learning** shows progress and saved lessons.

Tip: use a normal window for one account and an Incognito window (⌘⇧N) for another to switch roles quickly.

## 6. Tests

| Command | What it does |
|---|---|
| `npm test` | Unit tests (Vitest): role guard, validators, Mux webhook signatures, helpers |
| `npm run test:e2e` | Full walkthrough against the real Supabase project with `npm run dev` running — 69 checks across all three roles, including direct-to-database attacks RLS must block. Creates three temporary `ll-e2e-…@example.com` users and deletes them after. Needs `SUPABASE_SERVICE_ROLE_KEY`. |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript |
| `npm run build` | Production build |

GitHub Actions (`.github/workflows/ci.yml`) runs lint, typecheck, unit tests
and a build on every push and pull request.

## 7. Working together

- Create a branch for each change: `git checkout -b feat/short-name`.
- Commit, push, and open a pull request into `main`; CI must pass before merging.
- Don't commit `.env.local` or any key.
- If you can't push to `NaAtWerk/canaryWork`, fork it and open the PR from your fork (or ask to be added as a collaborator).

---

## Setting up a brand-new Supabase project

Only needed if you're **not** using our shared project (e.g. your own test copy).

1. Create a project at [supabase.com](https://supabase.com) and put its URL and keys in `.env.local`.
2. In **SQL Editor**, run these files **in order**, once each:
   1. `supabase/migrations/0001_init.sql` — tables
   2. `supabase/migrations/0002_rls_policies.sql` — row level security
   3. `supabase/migrations/0003_auth_trigger.sql` — profile row on sign-up
   4. `supabase/migrations/0004_security_fixes.sql` — blocks role self-escalation and self-approval
   5. `supabase/migrations/0005_app_functions.sql` — view counting, admin role changes, public instructor profiles, delete policy (safe to re-run)
   6. `supabase/seed.sql` — starter categories
3. **Authentication → URL Configuration**: add `http://localhost:3000/auth/callback` to Redirect URLs.
4. Optional — **Authentication → Providers → Google**: add a Google OAuth client for "Continue with Google".
5. `npm run create-admin -- --email … --password …`

## Video on localhost

Mux can't call a webhook on `localhost`. After an upload, the lesson editor
polls `GET /api/lessons/:id/video`, which asks Mux for the finished asset and
attaches it (the fallback from the design doc's risk table). Once deployed,
add a Mux webhook pointing to `https://<your-domain>/api/webhooks/mux` and set
`MUX_WEBHOOK_SECRET` in the host's environment variables.

## Troubleshooting

| You see | Fix |
|---|---|
| `npm error enoent Could not read package.json` | You're in the wrong folder — `cd canaryWork` first. |
| "The database is missing a migration" | A step in *Setting up a brand-new Supabase project* was skipped; run the missing file (usually `0005`). |
| "Video uploads aren't set up" in the lesson editor | Add `MUX_TOKEN_ID`, `MUX_TOKEN_SECRET` and `SUPABASE_SERVICE_ROLE_KEY`, then restart `npm run dev`. |
| Sign-up says "Check your email" but nothing arrives | Supabase's built-in email is rate-limited (a few per hour). Check spam, or for testing turn off **Authentication → Sign In / Providers → Email → Confirm email**. |
| Hydration warning mentioning `<html>` or `style` in the console | Usually a browser extension (Dark Reader, Grammarly…). Try an Incognito window. |
| Changed `.env.local` but nothing happened | Restart `npm run dev`. |

## Project structure

| Path | What's there |
|---|---|
| `app/(site)` | Catalog (`/`), lesson page, My learning, settings |
| `app/(auth)` | Sign in / sign up |
| `app/instructor` | Teach dashboard, new lesson, lesson editor |
| `app/admin` | Overview, lessons review, users, categories |
| `app/api/**` | Every endpoint in design doc Section 9 — same paths and `{ data }` / `{ error }` shapes |
| `lib/data/*` | Database queries shared by API routes and pages |
| `lib/auth/requireRole.ts` | Role guard: `requireRole` (API) and `requirePageRole` (pages) |
| `lib/validators/*` | zod schemas for every POST/PATCH body |
| `lib/mux.ts` | Mux uploads, asset lookup, webhook signature check |
| `supabase/` | SQL migrations and seed data |
| `scripts/` | `create-admin`, end-to-end test |
| `tests/` | Unit tests |

## Deviations from the design doc

- **Email/password sign-in** in addition to Google.
- **Progress and bookmarks** work for any signed-in user, not only students (instructors and admins watch lessons too).
- **Extra routes:** `DELETE /api/lessons/:id/resources/:resourceId` (remove a resource) and `GET /api/lessons/:id/video` (Mux webhook fallback).
- **Account disabling** uses Supabase Auth's ban (needs `SUPABASE_SERVICE_ROLE_KEY`).
