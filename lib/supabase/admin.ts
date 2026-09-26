// lib/supabase/admin.ts
// Service-role client — SERVER-ONLY. Bypasses Row Level Security entirely,
// so never import this into anything that ships to the browser and never
// use it to answer a request on a user's behalf.
//
// Used only where there is no user session: the Mux webhook, and the
// fallback that attaches a finished Mux asset to its lesson.

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { ApiError } from "@/lib/api/response";

export function adminConfigured() {
  return Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export function createAdminClient() {
  if (!adminConfigured()) {
    throw new ApiError(
      "NOT_CONFIGURED",
      "SUPABASE_SERVICE_ROLE_KEY is not set. Add it to .env.local (Supabase → Project Settings → API)."
    );
  }
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
