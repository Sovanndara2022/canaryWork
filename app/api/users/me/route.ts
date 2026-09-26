// GET, PATCH /api/users/me — own profile (design doc, Section 9.1)

import { ok, fail } from "@/lib/api/response";
import { requireRole } from "@/lib/auth/requireRole";
import { updateProfileSchema } from "@/lib/validators/user";

export async function GET() {
  const auth = await requireRole();
  if (!auth.ok) return auth.response;

  return ok(auth.session.profile);
}

export async function PATCH(request: Request) {
  const auth = await requireRole();
  if (!auth.ok) return auth.response;

  const body = await request.json().catch(() => null);
  const parsed = updateProfileSchema.safeParse(body);
  if (!parsed.success) {
    return fail("VALIDATION_FAILED", parsed.error.issues[0].message);
  }

  const { supabase, profile } = auth.session;
  const { data, error } = await supabase
    .from("users")
    .update(parsed.data)
    .eq("id", profile.id)
    .select("id, email, full_name, avatar_url, role, bio")
    .single();
  if (error) return fail("SERVER_ERROR", "Couldn't update your profile.");

  return ok(data);
}
