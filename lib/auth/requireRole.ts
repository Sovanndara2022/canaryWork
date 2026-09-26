// lib/auth/requireRole.ts
// The guard every protected route imports first (design doc, Section 8).
// RLS still enforces access in the database; this gives the API a clean
// 401/403 before any query runs.
//
// Route handlers:
//   const auth = await requireRole("admin");
//   if (!auth.ok) return auth.response;
//   auth.session.supabase.from(...)
//
// Server Components / layouts:
//   const session = await requirePageRole("instructor", "admin");

import { redirect } from "next/navigation";
import type { NextResponse } from "next/server";
import { fail } from "@/lib/api/response";
import { getSession, homePathFor, type Session } from "@/lib/auth/getSession";
import type { UserRole } from "@/types/user";

type RequireRoleResult =
  | { ok: true; session: Session }
  | { ok: false; response: NextResponse };

// No roles = any signed-in user.
export async function requireRole(...roles: UserRole[]): Promise<RequireRoleResult> {
  const session = await getSession();
  if (!session) {
    return { ok: false, response: fail("UNAUTHENTICATED", "Sign in to continue.") };
  }
  if (roles.length > 0 && !roles.includes(session.profile.role)) {
    return {
      ok: false,
      response: fail("FORBIDDEN", "Your account doesn't have access to this."),
    };
  }
  return { ok: true, session };
}

export async function requirePageRole(...roles: UserRole[]): Promise<Session> {
  const session = await getSession();
  if (!session) redirect("/sign-in");
  if (roles.length > 0 && !roles.includes(session.profile.role)) {
    redirect(homePathFor(session.profile.role));
  }
  return session;
}
