// app/auth/callback/route.ts
// Google (and the email-confirmation link) redirect here with a one-time
// ?code=, which we exchange for a real session.

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { data } = await supabase.auth.exchangeCodeForSession(code);

    // First sign-in ever (no prior sessions) -> send to onboarding.
    // A simple heuristic: created_at and last_sign_in_at are within a
    // few seconds of each other only on the very first sign-in.
    const user = data.user;
    if (user && user.created_at && user.last_sign_in_at) {
      const justCreated =
        Math.abs(new Date(user.last_sign_in_at).getTime() - new Date(user.created_at).getTime()) <
        10_000;
      if (justCreated) return NextResponse.redirect(`${origin}/on-board`);
    }
  }

  return NextResponse.redirect(`${origin}/`);
}
