// GET /api/dashboard/student

import { handle, ok } from "@/lib/api/response";
import { requireRole } from "@/lib/auth/requireRole";
import { studentDashboard } from "@/lib/data/dashboards";

export const GET = handle(async () => {
  const { supabase, profile } = await requireRole();
  return ok(await studentDashboard(supabase, profile.id));
});
