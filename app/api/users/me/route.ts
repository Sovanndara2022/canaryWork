// GET, PATCH /api/users/me — own profile (design doc, Section 9.1)

import { handle, ok, readJson, ApiError } from "@/lib/api/response";
import { requireRole } from "@/lib/auth/requireRole";
import { dbError } from "@/lib/data/errors";
import { updateProfileSchema } from "@/lib/validators/user";

export const GET = handle(async () => {
  const { profile } = await requireRole();
  return ok(profile);
});

export const PATCH = handle(async (request: Request) => {
  const { supabase, profile } = await requireRole();

  const parsed = updateProfileSchema.safeParse(await readJson(request));
  if (!parsed.success) throw new ApiError("VALIDATION_FAILED", parsed.error.issues[0].message);

  const { data, error } = await supabase
    .from("users")
    .update(parsed.data)
    .eq("id", profile.id)
    .select("id, email, full_name, avatar_url, role, bio")
    .single();
  if (error) dbError(error);

  return ok(data);
});
