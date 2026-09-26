// lib/supabase/server.ts
// Server client — use in Server Components, Route Handlers, and Server
// Actions. cookies() must be awaited: Next.js 16 fully removed the
// synchronous compatibility shim that Next.js 15 still allowed.

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component with no response to write to —
            // fine as long as proxy.ts is refreshing the session (it is).
          }
        },
      },
    }
  );
}
