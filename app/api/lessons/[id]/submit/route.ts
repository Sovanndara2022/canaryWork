// POST /api/lessons/:id/submit — draft/rejected -> pending

import { handle, ok } from "@/lib/api/response";
import { requireRole } from "@/lib/auth/requireRole";
import { submitLesson } from "@/lib/data/lessons";

export const POST = handle(async (_request: Request, ctx: RouteContext<"/api/lessons/[id]/submit">) => {
  const { supabase, profile } = await requireRole("instructor", "admin");
  const { id } = await ctx.params;
  return ok(await submitLesson(supabase, id, profile));
});
