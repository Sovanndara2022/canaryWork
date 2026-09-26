// proxy.ts
// Next.js 16 renamed the root request-interception file from
// middleware.ts to proxy.ts, and it now runs in the Node.js runtime
// rather than the Edge runtime. The exported function is named `proxy`
// (not `middleware`).

import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/session";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Run on every path except static assets and image optimization files,
     * so the session cookie stays fresh across the whole app.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
