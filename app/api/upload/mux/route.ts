// POST /api/upload/mux — body { lesson_id }
// Returns a Mux direct-upload URL; the browser PUTs the file straight to
// Mux (design doc, Section 10.2).

import { ApiError, handle, ok, readJson } from "@/lib/api/response";
import { requireRole } from "@/lib/auth/requireRole";
import { dbError } from "@/lib/data/errors";
import { getOwnedLesson } from "@/lib/data/lessons";
import { createDirectUpload } from "@/lib/mux";

export const POST = handle(async (request: Request) => {
  const { supabase, profile } = await requireRole("instructor", "admin");
  const body = (await readJson(request)) as { lesson_id?: unknown } | null;
  if (typeof body?.lesson_id !== "string") throw new ApiError("VALIDATION_FAILED", "lesson_id is required.");

  const lesson = await getOwnedLesson(supabase, body.lesson_id, profile, { editable: true });
  const upload = await createDirectUpload(lesson.id, new URL(request.url).origin);

  const { error } = await supabase.from("lessons").update({ mux_upload_id: upload.id }).eq("id", lesson.id);
  if (error) dbError(error);

  return ok({ upload_url: upload.url, upload_id: upload.id });
});
