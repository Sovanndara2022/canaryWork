// lib/auth/getSession.ts
// Reads the signed-in user and their profile row (with role) for this
// request. Wrapped in React's cache() so a layout and page that both ask
// only hit Supabase once per render.

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Profile, UserRole } from "@/types/user";

// One cookie-bound Supabase client per request (anonymous if signed out).
export const getSupabase = cache(createClient);

export const getSession = cache(async () => {
  const supabase = await getSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("users")
    .select("id, email, full_name, avatar_url, role, bio")
    .eq("id", user.id)
    .single<Profile>();
  if (!profile) return null;

  return { supabase, user, profile };
});

export type Session = NonNullable<Awaited<ReturnType<typeof getSession>>>;
export type Supabase = Awaited<ReturnType<typeof createClient>>;

// Where each role lands after signing in.
export function homePathFor(role: UserRole) {
  if (role === "admin") return "/admin";
  if (role === "instructor") return "/instructor";
  return "/";
}
