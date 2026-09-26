// POST /api/webhooks/mux — called by Mux, never by the browser.
// Verified with MUX_WEBHOOK_SECRET; writes with the service-role client
// because there is no user session (design doc, Sections 7 and 10.2).

import { handle, ok, fail } from "@/lib/api/response";
import { createAdminClient } from "@/lib/supabase/admin";
import { lessonVideoFields, verifyMuxSignature, type MuxAsset } from "@/lib/mux";
import { uuidSchema } from "@/lib/validators/lesson";

export const POST = handle(async (request: Request) => {
  const secret = process.env.MUX_WEBHOOK_SECRET;
  if (!secret) return fail("NOT_CONFIGURED", "MUX_WEBHOOK_SECRET is not set.");

  const rawBody = await request.text();
  if (!verifyMuxSignature(rawBody, request.headers.get("mux-signature"), secret)) {
    return fail("UNAUTHENTICATED", "Invalid webhook signature.");
  }

  const event = JSON.parse(rawBody) as { type: string; data: MuxAsset };
  if (event.type !== "video.asset.ready") return ok({ received: true, ignored: event.type });

  const lessonId = event.data.passthrough;
  const fields = lessonVideoFields(event.data);
  if (!lessonId || !uuidSchema.safeParse(lessonId).success || !fields) {
    return ok({ received: true, ignored: "no lesson attached" });
  }

  const { error } = await createAdminClient().from("lessons").update(fields).eq("id", lessonId);
  if (error) throw error;

  return ok({ received: true, lesson_id: lessonId });
});
