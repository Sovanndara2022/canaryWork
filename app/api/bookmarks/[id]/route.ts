// DELETE /api/bookmarks/:id — owner only (RLS)

import { handle, ok } from "@/lib/api/response";
import { requireRole } from "@/lib/auth/requireRole";
import { removeBookmark } from "@/lib/data/learning";

export const DELETE = handle(async (_request: Request, ctx: RouteContext<"/api/bookmarks/[id]">) => {
  const { supabase } = await requireRole();
  const { id } = await ctx.params;
  return ok(await removeBookmark(supabase, id));
});
