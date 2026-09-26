"use client";

// components/forms/login-forms.tsx
// Two forms: <SignInForm /> and <SignUpForm />, both backed by the Server
// Actions in actions/auth.ts, plus a Google button that calls Supabase's
// client SDK directly (matches the design doc's documented Google flow).

import { useActionState, useState } from "react";
import { Loader2, MailCheck } from "lucide-react";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import {
  signInAction,
  signUpAction,
  type AuthActionState,
} from "@/actions/auth";

const initialState: AuthActionState = { error: null };

const inputClass = "h-10 px-3";
const buttonClass = "h-10 w-full";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

function GoogleButton() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function continueWithGoogle() {
    setPending(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    // On success the browser is already navigating to Google.
    if (error) {
      setError("Couldn't reach Google. Please try again.");
      setPending(false);
    }
  }

  return (
    <Field>
      <Button
        type="button"
        variant="outline"
        onClick={continueWithGoogle}
        disabled={pending}
        className={buttonClass}
      >
        {pending ? <Loader2 className="animate-spin" /> : <GoogleIcon />}
        Continue with Google
      </Button>
      {error && <FieldError>{error}</FieldError>}
    </Field>
  );
}

function SubmitButton({ pending, label, pendingLabel }: { pending: boolean; label: string; pendingLabel: string }) {
  return (
    <Button type="submit" disabled={pending} className={buttonClass}>
      {pending && <Loader2 className="animate-spin" />}
      {pending ? pendingLabel : label}
    </Button>
  );
}

export function SignInForm() {
  const [state, formAction, pending] = useActionState(signInAction, initialState);

  return (
    <FieldGroup className="gap-6">
      <GoogleButton />

      <FieldSeparator>or</FieldSeparator>

      <form action={formAction}>
        <FieldGroup className="gap-4">
          <Field>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              required
              className={inputClass}
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className={inputClass}
            />
          </Field>

          {state.error && <FieldError>{state.error}</FieldError>}

          <SubmitButton pending={pending} label="Sign in" pendingLabel="Signing in…" />
        </FieldGroup>
      </form>
    </FieldGroup>
  );
}

export function SignUpForm() {
  const [state, formAction, pending] = useActionState(signUpAction, initialState);

  if (state.confirmEmail) {
    return (
      <div role="status" className="rounded-lg border bg-muted/50 p-4">
        <MailCheck className="size-5 text-muted-foreground" />
        <p className="mt-3 text-sm font-medium">Check your email</p>
        <p className="mt-1 text-sm text-muted-foreground">
          We sent a confirmation link to <span className="font-medium text-foreground">{state.confirmEmail}</span>.
          Open it to finish creating your account.
        </p>
      </div>
    );
  }

  return (
    <FieldGroup className="gap-6">
      <GoogleButton />

      <FieldSeparator>or</FieldSeparator>

      <form action={formAction}>
        <FieldGroup className="gap-4">
          <Field>
            <FieldLabel htmlFor="full_name">Full name</FieldLabel>
            <Input
              id="full_name"
              name="full_name"
              type="text"
              autoComplete="name"
              required
              className={inputClass}
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              required
              className={inputClass}
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
              className={inputClass}
            />
            <FieldDescription>At least 8 characters.</FieldDescription>
          </Field>

          {state.error && <FieldError>{state.error}</FieldError>}

          <SubmitButton pending={pending} label="Create account" pendingLabel="Creating account…" />
        </FieldGroup>
      </form>
    </FieldGroup>
  );
}
