// GET /api/lessons/mine?status=&page= — instructor's own lessons, any status

import { handle, okList, parsePage } from "@/lib/api/response";
import { requireRole } from "@/lib/auth/requireRole";
import { listMyLessons } from "@/lib/data/lessons";
import type { LessonStatus } from "@/types/lesson";

const statuses: LessonStatus[] = ["draft", "pending", "approved", "rejected"];

export const GET = handle(async (request: Request) => {
  const { supabase, profile } = await requireRole("instructor", "admin");
  const params = new URL(request.url).searchParams;
  const range = parsePage(params);
  const status = statuses.find((s) => s === params.get("status"));

  const { rows, total } = await listMyLessons(supabase, profile.id, range, status);
  return okList(rows, { page: range.page, per_page: range.perPage, total });
});
