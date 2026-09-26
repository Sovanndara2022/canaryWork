# Lightning Lessons — running it locally

Next.js 16 + Supabase (Postgres, Auth, RLS) + Mux video, as described in the
Backend Architecture & Technical Design Document.

## 1. Install and configure

```bash
npm install
cp .env.example .env.local   # then fill in the values below
npm run dev                  # http://localhost:3000
```

| Variable | Where to find it | Needed for |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API | everything |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` locally | email-confirmation links |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API → `service_role` (secret, server-only) | attaching finished videos to lessons |
| `MUX_TOKEN_ID`, `MUX_TOKEN_SECRET` | Mux → Settings → Access Tokens (Mux Video, read + write) | video upload |
| `MUX_WEBHOOK_SECRET` | Mux → Settings → Webhooks | only once deployed |

Without the Mux and service-role keys the whole app works except video upload;
the lesson editor says so where the upload button would be.

## 2. Database

Run these in the Supabase SQL editor, **in order**, once each:

1. `supabase/migrations/0001_init.sql` — tables
2. `supabase/migrations/0002_rls_policies.sql` — row level security
3. `supabase/migrations/0003_auth_trigger.sql` — profile row on sign-up
4. `supabase/migrations/0004_security_fixes.sql` — blocks role self-escalation and self-approval
5. `supabase/migrations/0005_app_functions.sql` — view counting, admin role changes, public instructor profiles, delete policy
6. `supabase/seed.sql` — categories

If a page says "The database is missing a migration", a step above was skipped.

## 3. Make an admin

Sign up in the app, then in the SQL editor:

```sql
update users set role = 'admin' where email = 'you@example.com';
```

## 4. Walk through the whole flow

1. **Instructor** — sign up a second account → *Start teaching* → **Teach → New lesson** → pick a category → upload a video → add a resource → **Submit for review**.
2. **Admin** — **Admin → Lessons** → open the lesson → watch it → **Approve & publish** (or **Request changes** with a reason; the instructor sees it and can resubmit).
3. **Student** — the lesson now appears on **Browse**. Filter by category, sort by Trending/Newest, open it, press play (counts a view), **Save** it, watch past 90% (marks it completed). **My learning** shows progress and saved lessons.

## Video on localhost

Mux can't call a webhook on `localhost`. After an upload, the lesson editor
polls `GET /api/lessons/:id/video`, which asks Mux for the asset and attaches
it once it's ready — the fallback from the design doc's risk table. Once
deployed, point a Mux webhook at `https://<your-domain>/api/webhooks/mux`
and set `MUX_WEBHOOK_SECRET`.

## Where things live

| Path | What |
|---|---|
| `app/api/**` | Every endpoint in design doc Section 9 (same paths, same `{ data }` / `{ error }` shapes) |
| `lib/data/*` | Queries shared by the API routes and the server-rendered pages |
| `lib/auth/requireRole.ts` | Role guard for routes (`requireRole`) and pages (`requirePageRole`) |
| `lib/validators/*` | zod schemas for every POST/PATCH body |
| `lib/mux.ts` | Mux direct uploads, asset lookup, webhook signature check |
| `app/(site)` | Catalog, lesson page, My learning, settings |
| `app/instructor`, `app/admin` | Role-gated areas |

## Deviations from the design doc

- **Email/password sign-in** in addition to Google.
- **Progress and bookmarks** are open to any signed-in user, not only students (instructors and admins watch lessons too).
- **`DELETE /api/lessons/:id/resources/:resourceId`** added so instructors can remove a resource.
- **`GET /api/lessons/:id/video`** added as the Mux webhook fallback.
- **Account disabling** (`PATCH /api/admin/users/:id`) is not implemented — it needs Supabase's Auth admin API; role changes are.
