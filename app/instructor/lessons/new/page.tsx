import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { LessonForm } from "@/components/instructor/lesson-form";
import { requirePageRole } from "@/lib/auth/requireRole";
import { listCategories } from "@/lib/data/admin";

export const metadata = { title: "New lesson · Lightning Lessons" };

export default async function NewLessonPage() {
  const { supabase } = await requirePageRole("instructor", "admin");
  const categories = await listCategories(supabase);

  return (
    <div className="max-w-2xl">
      <Link href="/instructor" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Back to Teach
      </Link>
      <div className="mt-4">
        <PageHeader title="New lesson" description="This creates a draft only you can see." />
      </div>

      <ol className="mt-6 grid gap-2 text-sm sm:grid-cols-3">
        {["Title & category", "Upload video & resources", "Submit for review"].map((step, index) => (
          <li
            key={step}
            className={`flex items-center gap-2 rounded-lg border px-3 py-2 ${index === 0 ? "border-primary bg-brand-soft font-medium text-brand-soft-foreground" : "bg-card text-muted-foreground"}`}
          >
            <span
              className={`flex size-5 shrink-0 items-center justify-center rounded-full text-xs font-medium ${index === 0 ? "bg-primary text-primary-foreground" : "bg-muted"}`}
            >
              {index + 1}
            </span>
            {step}
          </li>
        ))}
      </ol>

      <div className="mt-6 rounded-xl border bg-card shadow-xs p-5 sm:p-6">
        <LessonForm categories={categories} />
      </div>
    </div>
  );
}
