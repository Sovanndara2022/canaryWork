// GET /api/bookmarks/mine?page= — saved lessons, newest first

import { handle, okList, parsePage } from "@/lib/api/response";
import { requireRole } from "@/lib/auth/requireRole";
import { listBookmarks } from "@/lib/data/learning";

export const GET = handle(async (request: Request) => {
  const { supabase, profile } = await requireRole();
  const range = parsePage(new URL(request.url).searchParams);
  const { rows, total } = await listBookmarks(supabase, profile.id, range);
  return okList(rows, { page: range.page, per_page: range.perPage, total });
});
