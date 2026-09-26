// POST /api/admin/lessons/:id/approve — pending -> approved

import { handle, ok } from "@/lib/api/response";
import { requireRole } from "@/lib/auth/requireRole";
import { approveLesson } from "@/lib/data/admin";

export const POST = handle(async (_request: Request, ctx: RouteContext<"/api/admin/lessons/[id]/approve">) => {
  const { supabase, profile } = await requireRole("admin");
  const { id } = await ctx.params;
  return ok(await approveLesson(supabase, id, profile.id));
});
