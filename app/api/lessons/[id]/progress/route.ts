// GET, POST /api/lessons/:id/progress — body { progress_seconds, completed }
// Any signed-in user can track their own progress (the doc lists
// "student"; instructors and admins watch lessons too).

import { ApiError, handle, ok, readJson } from "@/lib/api/response";
import { requireRole } from "@/lib/auth/requireRole";
import { getProgress, saveProgress } from "@/lib/data/learning";
import { progressSchema } from "@/lib/validators/lesson";

type Ctx = RouteContext<"/api/lessons/[id]/progress">;

export const GET = handle(async (_request: Request, ctx: Ctx) => {
  const { supabase, profile } = await requireRole();
  const { id } = await ctx.params;
  const progress = await getProgress(supabase, profile.id, id);
  return ok(progress ?? { lesson_id: id, progress_seconds: 0, completed: false });
});

export const POST = handle(async (request: Request, ctx: Ctx) => {
  const { supabase, profile } = await requireRole();
  const { id } = await ctx.params;
  const parsed = progressSchema.safeParse(await readJson(request));
  if (!parsed.success) throw new ApiError("VALIDATION_FAILED", parsed.error.issues[0].message);
  return ok(await saveProgress(supabase, profile.id, id, parsed.data));
});
