// GET /api/dashboard/instructor

import { handle, ok } from "@/lib/api/response";
import { requireRole } from "@/lib/auth/requireRole";
import { instructorDashboard } from "@/lib/data/dashboards";

export const GET = handle(async () => {
  const { supabase, profile } = await requireRole("instructor", "admin");
  return ok(await instructorDashboard(supabase, profile.id));
});
