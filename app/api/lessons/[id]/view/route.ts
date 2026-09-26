// POST /api/lessons/:id/view — anyone; increments view_count and logs
// lesson_views through the log_lesson_view() function (0005).

import { handle, ok } from "@/lib/api/response";
import { getSupabase } from "@/lib/auth/getSession";
import { logView } from "@/lib/data/admin";
import { uuidSchema } from "@/lib/validators/lesson";
import { notFound } from "@/lib/data/errors";

export const POST = handle(async (_request: Request, ctx: RouteContext<"/api/lessons/[id]/view">) => {
  const { id } = await ctx.params;
  if (!uuidSchema.safeParse(id).success) notFound();
  return ok(await logView(await getSupabase(), id));
});
