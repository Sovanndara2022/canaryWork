// GET /api/history/mine?page= — watch history, most recent first

import { handle, okList, parsePage } from "@/lib/api/response";
import { requireRole } from "@/lib/auth/requireRole";
import { listHistory } from "@/lib/data/learning";

export const GET = handle(async (request: Request) => {
  const { supabase, profile } = await requireRole();
  const range = parsePage(new URL(request.url).searchParams);
  const { rows, total } = await listHistory(supabase, profile.id, range);
  return okList(rows, { page: range.page, per_page: range.perPage, total });
});
