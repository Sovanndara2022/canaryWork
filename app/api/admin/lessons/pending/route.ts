// GET /api/admin/lessons/pending — review queue, oldest submission first

import { handle, okList, parsePage } from "@/lib/api/response";
import { requireRole } from "@/lib/auth/requireRole";
import { listLessonsForReview } from "@/lib/data/admin";

export const GET = handle(async (request: Request) => {
  const { supabase } = await requireRole("admin");
  const range = parsePage(new URL(request.url).searchParams);
  const { rows, total } = await listLessonsForReview(supabase, "pending", range);
  return okList(rows, { page: range.page, per_page: range.perPage, total });
});
