// GET /api/categories (public), POST /api/categories (admin)

import { ApiError, created, handle, ok, readJson } from "@/lib/api/response";
import { getSupabase } from "@/lib/auth/getSession";
import { requireRole } from "@/lib/auth/requireRole";
import { createCategory, listCategories } from "@/lib/data/admin";
import { createCategorySchema } from "@/lib/validators/category";

export const GET = handle(async () => {
  return ok(await listCategories(await getSupabase()));
});

export const POST = handle(async (request: Request) => {
  const { supabase } = await requireRole("admin");
  const parsed = createCategorySchema.safeParse(await readJson(request));
  if (!parsed.success) throw new ApiError("VALIDATION_FAILED", parsed.error.issues[0].message);
  return created(await createCategory(supabase, parsed.data.name));
});
