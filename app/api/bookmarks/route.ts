// POST /api/bookmarks — body { lesson_id }; 409 ALREADY_BOOKMARKED if saved

import { ApiError, created, handle, readJson } from "@/lib/api/response";
import { requireRole } from "@/lib/auth/requireRole";
import { addBookmark } from "@/lib/data/learning";

export const POST = handle(async (request: Request) => {
  const { supabase, profile } = await requireRole();
  const body = (await readJson(request)) as { lesson_id?: unknown } | null;
  if (typeof body?.lesson_id !== "string") throw new ApiError("VALIDATION_FAILED", "lesson_id is required.");
  return created(await addBookmark(supabase, profile.id, body.lesson_id));
});
