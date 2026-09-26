# canaryWork → Lightning Lessons

This fills in every empty file from the repo audit, fixes the broken
sign-in page, and adapts the whole thing to your actual stack
(Next.js 16, Base UI, shadcn "base-nova" style, Tailwind v4) rather than
the generic scaffold from earlier in this chat.

## 1. Apply the patch

```bash
git clone https://github.com/NaAtWerk/canaryWork.git
cd canaryWork
```

Unzip this package's contents directly on top — every path here matches
a real path in your repo:

```bash
unzip -o ~/Downloads/canaryWork-lightning-lessons-patch.zip -d .
```

Then delete the old placeholder — it's superseded by `proxy.ts` +
`lib/supabase/session.ts`:

```bash
rm lib/supabase/middleware.ts
```

## 2. Install what's new

```bash
npm install zod
```

Everything else (`@supabase/ssr`, `@supabase/supabase-js`) was already
in your `package.json`.

## 3. Env vars

Same three from the backend setup — add a `.env.local` if you haven't:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

(`NEXT_PUBLIC_SITE_URL` is new — the sign-up email-confirmation link
needs an absolute URL to redirect back to.)

## 4. Run it

```bash
npm run dev
```

Visit `/` → `/sign-up` → check your email if you used
email/password, or `/sign-in` → "Continue with Google". Either path
should land you on `/on-board`, which reads your real profile row and
shows the "Start teaching" option only if you're still a student.

## What changed and why

| File | Status | Why |
|---|---|---|
| `lib/supabase/client.ts` | filled in | was empty |
| `lib/supabase/server.ts` | filled in | was empty; awaits `cookies()` (required in Next.js 16) |
| `lib/supabase/middleware.ts` → `lib/supabase/session.ts` | **renamed** | Next.js 16 deprecates the `middleware.ts` concept in favor of `proxy.ts`; kept the helper's logic but renamed the file so it doesn't imply the deprecated pattern |
| `proxy.ts` | **new**, root-level | Next.js 16's replacement for `middleware.ts` — refreshes the session, gates `/instructor`, `/admin`, `/on-board` |
| `types/user.ts` | filled in | was empty |
| `types/lesson.ts` | new | didn't exist; follows the same per-domain convention as `types/user.ts` |
| `actions/auth.ts` | filled in | was empty; email/password sign-in/up (an addition beyond the doc's Google-only spec, since the UI was already built for it), sign-out, and the self-serve `become_instructor` action |
| `components/forms/login-forms.tsx` | filled in | was empty; `<SignInForm />` and `<SignUpForm />`, using React 19's `useActionState` |
| `app/(auth)/sign-in/page.tsx` | **fixed** | previously called `signIn("credentials", …)` / `signIn("google", …)` — that's NextAuth's API, not installed, and `signIn` wasn't even imported. This wouldn't compile. Now renders `<SignInForm />` |
| `app/(auth)/sign-up/page.tsx` | filled in | was empty |
| `app/(public)/on-board/page.tsx` | filled in | was empty; welcome + "Start teaching" per design doc Section 6.1 |
| `app/auth/callback/route.ts` | new | OAuth/email-confirmation callback, didn't exist |
| `app/page.tsx` | rewritten | copy was "the banking infrastructure you can rely on" (unrelated to Lightning Lessons); also referenced `/logo.png`, which doesn't exist in `public/` — replaced with a ⚡ mark for now |
| `app/globals.css` | one line added | `font-reckless` (used on the homepage headline) was never registered as a Tailwind theme token, so it silently did nothing — added `--font-reckless: var(--font-Reckless);` |

## A deliberate deviation from the design doc

The doc specifies Google Sign-In only. This patch keeps that working
*and* adds email/password, because your sign-in page already had a
password form built — tearing it out felt like the wrong call. If you'd
rather match the doc exactly, delete the email/password `Field`s from
`login-forms.tsx` and keep only `<GoogleButton />`.

## What's still not here

This repo has no catalog, lesson detail, or instructor/admin dashboard
pages yet — auth is the only thing that existed (even if broken) before
this patch, so that's what got fixed first. The pages from the earlier
`lightning-lessons-frontend.zip` cover that ground, but they're styled
for a different design system (plain Tailwind) than this repo's actual
one (Base UI + shadcn "base-nova"). Say the word and I'll port them over
in this repo's real style instead of just re-sending the old ones.
