// PATCH /api/admin/users/:id — body { role?, disabled? }
// Change a user's role and/or disable (ban) their account.

import { ApiError, handle, ok, readJson } from "@/lib/api/response";
import { requireRole } from "@/lib/auth/requireRole";
import { setUserDisabled, setUserRole } from "@/lib/data/admin";
import { adminUserPatchSchema } from "@/lib/validators/category";
import { uuidSchema } from "@/lib/validators/lesson";

export const PATCH = handle(async (request: Request, ctx: RouteContext<"/api/admin/users/[id]">) => {
  const { supabase, profile } = await requireRole("admin");
  const { id } = await ctx.params;
  if (!uuidSchema.safeParse(id).success) throw new ApiError("NOT_FOUND", "User not found.");

  const parsed = adminUserPatchSchema.safeParse(await readJson(request));
  if (!parsed.success) throw new ApiError("VALIDATION_FAILED", parsed.error.issues[0].message);

  const result: { id: string; role?: string; disabled?: boolean } = { id };
  if (parsed.data.role) Object.assign(result, await setUserRole(supabase, id, parsed.data.role));
  if (parsed.data.disabled !== undefined) Object.assign(result, await setUserDisabled(id, parsed.data.disabled, profile.id));

  return ok(result);
});
