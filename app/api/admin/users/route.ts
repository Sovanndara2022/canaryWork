// GET /api/admin/users?q=&role=&page=&per_page= — list/search users

import { handle, okList, parsePage } from "@/lib/api/response";
import { requireRole } from "@/lib/auth/requireRole";
import { listUsers } from "@/lib/data/admin";
import { setRoleSchema } from "@/lib/validators/category";

export const GET = handle(async (request: Request) => {
  const { supabase } = await requireRole("admin");
  const params = new URL(request.url).searchParams;
  const range = parsePage(params);
  const role = setRoleSchema.shape.role.safeParse(params.get("role"));

  const { rows, total } = await listUsers(supabase, { q: params.get("q"), role: role.success ? role.data : null }, range);
  return okList(rows, { page: range.page, per_page: range.perPage, total });
});
