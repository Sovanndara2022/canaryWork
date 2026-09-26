// GET /api/lessons/:id/video — owner/admin; reports the video's state.
// Doubles as the webhook fallback from the design doc's risk table
// (Section 14): if the upload finished but the webhook never arrived —
// always the case on localhost — it fetches the asset from Mux and
// attaches it to the lesson.

import { handle, ok } from "@/lib/api/response";
import { requireRole } from "@/lib/auth/requireRole";
import { getOwnedLesson } from "@/lib/data/lessons";
import { getAsset, getUpload, lessonVideoFields, muxConfigured } from "@/lib/mux";
import { adminConfigured, createAdminClient } from "@/lib/supabase/admin";

type VideoState = "none" | "uploading" | "processing" | "ready" | "errored";

export const GET = handle(async (_request: Request, ctx: RouteContext<"/api/lessons/[id]/video">) => {
  const { supabase, profile } = await requireRole("instructor", "admin");
  const { id } = await ctx.params;
  const lesson = await getOwnedLesson(supabase, id, profile);

  const respond = (state: VideoState, extra: object = {}) =>
    ok({ state, playback_id: lesson.mux_playback_id, duration_seconds: lesson.duration_seconds, ...extra });

  if (!lesson.mux_upload_id) return respond(lesson.mux_playback_id ? "ready" : "none");
  if (!muxConfigured()) return respond(lesson.mux_playback_id ? "ready" : "none");

  const upload = await getUpload(lesson.mux_upload_id);
  if (upload.status === "waiting") return respond("uploading");
  if (upload.status !== "asset_created" || !upload.asset_id) return respond("errored");

  const asset = await getAsset(upload.asset_id);
  if (asset.status === "errored") return respond("errored");
  if (asset.status !== "ready") return respond("processing");

  const fields = lessonVideoFields(asset);
  if (!fields) return respond("errored");
  if (fields.mux_playback_id === lesson.mux_playback_id) return respond("ready");

  // Webhook hasn't delivered this asset yet — attach it ourselves.
  if (!adminConfigured()) {
    return respond("processing", { hint: "Set SUPABASE_SERVICE_ROLE_KEY so finished videos can be attached." });
  }
  const { error } = await createAdminClient().from("lessons").update(fields).eq("id", lesson.id);
  if (error) throw error;

  return ok({ state: "ready" as VideoState, playback_id: fields.mux_playback_id, duration_seconds: fields.duration_seconds });
});
