import { Tags } from "lucide-react";
import { CategoryForm } from "@/components/admin/category-form";
import { EmptyState } from "@/components/ui/empty-state";
import { requirePageRole } from "@/lib/auth/requireRole";
import { listCategories } from "@/lib/data/admin";

export const metadata = { title: "Categories · Admin" };

export default async function AdminCategoriesPage() {
  const { supabase } = await requirePageRole("admin");
  const categories = await listCategories(supabase);

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-semibold tracking-tight">Categories</h1>
      <p className="mt-1 text-sm text-muted-foreground">Instructors pick one of these for every lesson; students filter the catalog by them.</p>

      <div className="mt-6">
        <CategoryForm />
      </div>

      <div className="mt-6">
        {categories.length > 0 ? (
          <ul className="divide-y rounded-xl border">
            {categories.map((category) => (
              <li key={category.id} className="flex items-center justify-between px-4 py-3 text-sm">
                <span className="font-medium">{category.name}</span>
                <code className="text-xs text-muted-foreground">{category.slug}</code>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState icon={Tags} title="No categories yet">
            Add one above, or run supabase/seed.sql to create the defaults.
          </EmptyState>
        )}
      </div>
    </div>
  );
}
