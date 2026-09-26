// GET /api/lessons/:id/resources — same visibility as the lesson
// POST /api/lessons/:id/resources — owner adds a link/slide/note

import { ApiError, created, handle, ok, readJson } from "@/lib/api/response";
import { getSupabase } from "@/lib/auth/getSession";
import { requireRole } from "@/lib/auth/requireRole";
import { addResource, getLesson } from "@/lib/data/lessons";
import { createResourceSchema } from "@/lib/validators/resource";

type Ctx = RouteContext<"/api/lessons/[id]/resources">;

export const GET = handle(async (_request: Request, ctx: Ctx) => {
  const { id } = await ctx.params;
  const lesson = await getLesson(await getSupabase(), id);
  return ok(lesson.resources);
});

export const POST = handle(async (request: Request, ctx: Ctx) => {
  const { supabase, profile } = await requireRole("instructor", "admin");
  const { id } = await ctx.params;
  const parsed = createResourceSchema.safeParse(await readJson(request));
  if (!parsed.success) throw new ApiError("VALIDATION_FAILED", parsed.error.issues[0].message);
  return created(await addResource(supabase, id, profile, parsed.data));
});
