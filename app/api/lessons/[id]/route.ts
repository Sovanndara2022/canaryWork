// GET /api/lessons/:id — public (approved) / owner / admin, with resources
// PATCH /api/lessons/:id — owner, while draft or rejected
// DELETE /api/lessons/:id — owner (draft/rejected) or admin

import { ApiError, handle, ok, readJson } from "@/lib/api/response";
import { getSupabase } from "@/lib/auth/getSession";
import { requireRole } from "@/lib/auth/requireRole";
import { deleteLesson, getLesson, updateLesson } from "@/lib/data/lessons";
import { updateLessonSchema } from "@/lib/validators/lesson";

type Ctx = RouteContext<"/api/lessons/[id]">;

export const GET = handle(async (_request: Request, ctx: Ctx) => {
  const { id } = await ctx.params;
  return ok(await getLesson(await getSupabase(), id));
});

export const PATCH = handle(async (request: Request, ctx: Ctx) => {
  const { supabase, profile } = await requireRole("instructor", "admin");
  const { id } = await ctx.params;
  const parsed = updateLessonSchema.safeParse(await readJson(request));
  if (!parsed.success) throw new ApiError("VALIDATION_FAILED", parsed.error.issues[0].message);
  return ok(await updateLesson(supabase, id, profile, parsed.data));
});

export const DELETE = handle(async (_request: Request, ctx: Ctx) => {
  const { supabase, profile } = await requireRole("instructor", "admin");
  const { id } = await ctx.params;
  return ok(await deleteLesson(supabase, id, profile));
});
