// POST /api/users/become-instructor — self-serve role upgrade
// (design doc, Sections 6.1 and 9.1). Students only.

import { ok, fail } from "@/lib/api/response";
import { requireRole } from "@/lib/auth/requireRole";

export async function POST() {
  const auth = await requireRole("student");
  if (!auth.ok) return auth.response;

  const { supabase, profile } = auth.session;
  const { error } = await supabase.rpc("become_instructor");
  if (error) return fail("SERVER_ERROR", "Couldn't update your account.");

  return ok({ id: profile.id, role: "instructor" as const });
}
