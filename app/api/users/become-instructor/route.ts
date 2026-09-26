// POST /api/users/become-instructor — self-serve role upgrade
// (design doc, Sections 6.1 and 9.1). Students only.

import { handle, ok } from "@/lib/api/response";
import { requireRole } from "@/lib/auth/requireRole";
import { dbError } from "@/lib/data/errors";

export const POST = handle(async () => {
  const { supabase, profile } = await requireRole("student");

  const { error } = await supabase.rpc("become_instructor");
  if (error) dbError(error);

  return ok({ id: profile.id, role: "instructor" as const });
});
