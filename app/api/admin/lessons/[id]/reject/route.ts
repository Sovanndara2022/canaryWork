// POST /api/admin/lessons/:id/reject — body { reason }, pending -> rejected

import { ApiError, handle, ok, readJson } from "@/lib/api/response";
import { requireRole } from "@/lib/auth/requireRole";
import { rejectLesson } from "@/lib/data/admin";
import { rejectLessonSchema } from "@/lib/validators/lesson";

export const POST = handle(async (request: Request, ctx: RouteContext<"/api/admin/lessons/[id]/reject">) => {
  const { supabase, profile } = await requireRole("admin");
  const { id } = await ctx.params;

  const parsed = rejectLessonSchema.safeParse(await readJson(request));
  if (!parsed.success) throw new ApiError("VALIDATION_FAILED", parsed.error.issues[0].message);

  return ok(await rejectLesson(supabase, id, profile.id, parsed.data.reason));
});
