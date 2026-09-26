// DELETE /api/lessons/:id/resources/:resourceId — owner, while editable.
// (Not in the design doc's table; needed so instructors can fix mistakes.)

import { handle, ok } from "@/lib/api/response";
import { requireRole } from "@/lib/auth/requireRole";
import { deleteResource } from "@/lib/data/lessons";

export const DELETE = handle(
  async (_request: Request, ctx: RouteContext<"/api/lessons/[id]/resources/[resourceId]">) => {
    const { supabase, profile } = await requireRole("instructor", "admin");
    const { id, resourceId } = await ctx.params;
    return ok(await deleteResource(supabase, id, resourceId, profile));
  }
);
