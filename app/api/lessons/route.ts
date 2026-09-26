// GET /api/lessons?sort=trending|newest&category=<slug>&q=&page= — approved only
// POST /api/lessons — instructor creates a draft

import { ApiError, created, handle, okList, parsePage, readJson } from "@/lib/api/response";
import { getSupabase } from "@/lib/auth/getSession";
import { requireRole } from "@/lib/auth/requireRole";
import { createLesson, listCatalog } from "@/lib/data/lessons";
import { createLessonSchema, lessonSortSchema } from "@/lib/validators/lesson";

export const GET = handle(async (request: Request) => {
  const params = new URL(request.url).searchParams;
  const range = parsePage(params);
  const { rows, total } = await listCatalog(await getSupabase(), {
    sort: lessonSortSchema.parse(params.get("sort")),
    category: params.get("category"),
    q: params.get("q"),
    ...range,
  });
  return okList(rows, { page: range.page, per_page: range.perPage, total });
});

export const POST = handle(async (request: Request) => {
  const { supabase, profile } = await requireRole("instructor", "admin");
  const parsed = createLessonSchema.safeParse(await readJson(request));
  if (!parsed.success) throw new ApiError("VALIDATION_FAILED", parsed.error.issues[0].message);
  return created(await createLesson(supabase, profile.id, parsed.data));
});
