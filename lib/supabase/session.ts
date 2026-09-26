// lib/supabase/session.ts
// RENAMED from the old (empty) lib/supabase/middleware.ts.
// Next.js 16 deprecates the root `middleware.ts` convention in favor of
// `proxy.ts` (see /proxy.ts). This file is just the implementation this
// project's proxy.ts calls into — the filename itself has no special
// meaning to Next.js, so it's renamed to avoid confusion with the
// deprecated concept.

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refreshes the auth token if it's expired — required for SSR
  // cookie-based auth sessions to stay valid across requests.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isProtected = ["/instructor", "/admin", "/on-board", "/library", "/settings"].some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`)
  );

  if (isProtected && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/sign-in";
    return NextResponse.redirect(url);
  }

  return response;
}
