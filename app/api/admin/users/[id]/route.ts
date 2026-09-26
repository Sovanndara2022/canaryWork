// PATCH /api/admin/users/:id — body { role }

import { ApiError, handle, ok, readJson } from "@/lib/api/response";
import { requireRole } from "@/lib/auth/requireRole";
import { setUserRole } from "@/lib/data/admin";
import { setRoleSchema } from "@/lib/validators/category";
import { uuidSchema } from "@/lib/validators/lesson";

export const PATCH = handle(async (request: Request, ctx: RouteContext<"/api/admin/users/[id]">) => {
  const { supabase } = await requireRole("admin");
  const { id } = await ctx.params;
  if (!uuidSchema.safeParse(id).success) throw new ApiError("NOT_FOUND", "User not found.");

  const parsed = setRoleSchema.safeParse(await readJson(request));
  if (!parsed.success) throw new ApiError("VALIDATION_FAILED", "role must be student, instructor, or admin.");

  return ok(await setUserRole(supabase, id, parsed.data.role));
});
