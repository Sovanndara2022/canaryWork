// lib/auth/requireRole.ts
// The guard every protected route imports first (design doc, Section 8).
// RLS still enforces access in the database; this gives the API a clean
// 401/403 before any query runs.
//
// Route handlers (inside handle()):
//   const { supabase, profile } = await requireRole("instructor", "admin");
//
// Server Components / layouts:
//   const session = await requirePageRole("admin");

import { redirect } from "next/navigation";
import { ApiError } from "@/lib/api/response";
import { getSession, homePathFor, type Session } from "@/lib/auth/getSession";
import type { UserRole } from "@/types/user";

// No roles = any signed-in user. Throws ApiError (401/403).
export async function requireRole(...roles: UserRole[]): Promise<Session> {
  const session = await getSession();
  if (!session) throw new ApiError("UNAUTHENTICATED", "Sign in to continue.");
  if (roles.length > 0 && !roles.includes(session.profile.role)) {
    throw new ApiError("FORBIDDEN", "Your account doesn't have access to this.");
  }
  return session;
}

// Same check for pages: redirects instead of throwing.
export async function requirePageRole(...roles: UserRole[]): Promise<Session> {
  const session = await getSession();
  if (!session) redirect("/sign-in");
  if (roles.length > 0 && !roles.includes(session.profile.role)) {
    redirect(homePathFor(session.profile.role));
  }
  return session;
}
