// GET /api/dashboard/admin

import { handle, ok } from "@/lib/api/response";
import { requireRole } from "@/lib/auth/requireRole";
import { adminDashboard } from "@/lib/data/dashboards";

export const GET = handle(async () => {
  const { supabase } = await requireRole("admin");
  return ok(await adminDashboard(supabase));
});
