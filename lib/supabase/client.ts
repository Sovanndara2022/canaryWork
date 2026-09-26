// lib/supabase/client.ts
// Browser client — use inside Client Components ("use client").
// Safe to ship the anon key to the browser; RLS policies (see your
// Supabase migrations) do the real access control.

import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
