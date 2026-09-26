"use server";

// actions/auth.ts
// The design doc only specifies Google Sign-In, but sign-in/page.tsx
// already had an email/password form scaffolded, so this adds working
// email/password auth alongside it rather than ripping that UI out.
// Google OAuth itself is kicked off client-side (see login-forms.tsx) —
// there's no server action for it, since it has to redirect the browser
// to Google.

import { z } from "zod";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { homePathFor } from "@/lib/auth/getSession";
import type { UserRole } from "@/types/user";

const credentialsSchema = z.object({
  email: z.string().email("Enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

export interface AuthActionState {
  error: string | null;
  // Set when sign-up succeeded but Supabase is waiting on email confirmation.
  confirmEmail?: string;
}

export async function signInAction(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const parsed = credentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: "Incorrect email or password." };

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", data.user.id)
    .single<{ role: UserRole }>();
  redirect(profile ? homePathFor(profile.role) : "/on-board");
}

export async function signUpAction(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const parsed = credentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const fullName = formData.get("full_name");
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      // Matches the shape the 0003_auth_trigger.sql profile trigger reads
      // for Google sign-ins, so email/password sign-ups get a full_name too.
      data: { full_name: typeof fullName === "string" ? fullName : undefined },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  });
  if (error) return { error: error.message };

  // With "Confirm email" on (Supabase's default) there's no session yet, so
  // /on-board would just bounce to /sign-in. Tell the user to check their inbox.
  if (!data.session) return { error: null, confirmEmail: parsed.data.email };

  redirect("/on-board");
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

// Backs the "Start teaching" action on /on-board (design doc, Section 6.1).
// Calls the become_instructor() function from 0003_auth_trigger.sql.
export async function becomeInstructorAction(): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("become_instructor");
  if (error) {
    throw new Error("Couldn't update your account. Please try again.");
  }
  redirect("/instructor");
}
