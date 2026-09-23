"use client";


import { Button } from "@base-ui/react";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export default function SignUpPage() {
  return (
    <main className="min-h-screen grid place-items-center bg-[#e8e8e8] px-5 py-8 text-[#111]">
      <section className="grid min-h-[620px] w-full max-w-[980px] overflow-hidden rounded-[28px] bg-white shadow-[0_20px_60px_rgba(17,17,17,0.08)] md:grid-cols-[1.05fr_1fr]">
        <aside className="relative isolate flex min-h-[280px] flex-col justify-between p-7">
          <div
            aria-hidden="true"
            className="absolute inset-4 -z-10 rounded-[22px]"
            style={{
              background:
                "radial-gradient(120% 90% at 12% 8%, #fff7ef 0%, transparent 42%), radial-gradient(90% 80% at 80% 18%, #ffd0b0 0%, transparent 46%), linear-gradient(165deg, #f6d7c2 0%, #f3b48a 48%, #ef8f55 100%)",
            }}
          />
          <header className="flex items-center gap-2 px-1.5 py-2">
            <span className="text-[15px] font-semibold tracking-tight">
             Canary
            </span>
          </header>
          <div className="max-w-[360px] px-[18px] pb-[22px]">
            <p className="mb-2.5 text-[15px]">You can easily</p>
            <h2 className="m-0 text-[28px] font-bold leading-[1.22] tracking-tight">
              Get access your personal
              <br />
              hub for clarity and
              <br />
              productivity.
            </h2>
          </div>
        </aside>

        <div className="relative flex flex-col px-7 pb-7 pt-14 md:px-14 md:pt-[72px]">
          <span className="absolute left-7 top-[22px] text-[28px] font-bold leading-none text-[#ff5a1f] md:left-14 md:top-[34px]">
            *
          </span>
          <h1 className="mb-3 mt-2 text-[34px] font-bold tracking-tight">
            Sign in
          </h1>
          <p className="mb-9 text-[14px] leading-[1.55] text-[#8a8a8a]">
            Access your tasks, notes, and projects anytime,
            <br />
            anywhere — and keep everything flowing in one place.
          </p>

          <form
            className="flex flex-col"
            onSubmit={(event) => {
              event.preventDefault();
              const form = event.currentTarget;
              const email = new FormData(form).get("email");
              const password = new FormData(form).get("password");

              void signIn("credentials", {
                email,
                password,
                callbackUrl: "/",
              });
            }}
          >
            <FieldGroup className="gap-5">
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@brightnest.app"
                  required
                  className="h-12 rounded-[10px] border-[#e4e4e4] bg-white px-3.5 text-[14px] shadow-none focus-visible:border-[#111827] focus-visible:ring-[#111827]/10"
                />
              </Field>

              <Field>
                <div className="flex items-center justify-between gap-3">
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                  <a
                    href="/forgot-password"
                    className="text-[12px] font-medium text-[#8a8a8a] transition hover:text-[#111]"
                  >
                    Forgot password?
                  </a>
                </div>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  required
                  className="h-12 rounded-[10px] border-[#e4e4e4] bg-white px-3.5 text-[14px] shadow-none focus-visible:border-[#111827] focus-visible:ring-[#111827]/10"
                />
                <FieldDescription>
                  Use the email tied to your BrightNest workspace.
                </FieldDescription>
              </Field>

              <Field>
                <Button
                  type="submit"
                  className="h-12 w-full rounded-[10px] bg-[#111827] text-[14px] font-semibold text-white shadow-[0_10px_18px_rgba(17,24,39,0.18)] transition hover:-translate-y-px hover:bg-black"
                >
                  Sign in
                </Button>
              </Field>

              <FieldSeparator>or continue with</FieldSeparator>

              <Field>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => signIn("google", { callbackUrl: "/" })}
                  className="inline-flex h-12 w-full items-center justify-center gap-2.5 rounded-[10px] border-[#e4e4e4] bg-white text-[14px] font-semibold text-[#111] shadow-none transition hover:-translate-y-px hover:bg-[#f7f7f7]"
                >
                  Continue with Google
                </Button>
              </Field>
            </FieldGroup>
          </form>
        </div>
      </section>
    </main>
  );
}
