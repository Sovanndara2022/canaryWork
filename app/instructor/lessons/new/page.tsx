import Link from "next/link";
import { ArrowLeft } from "lucide-react";
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
      <h1 className="mt-4 text-2xl font-semibold tracking-tight">New lesson</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        This creates a draft only you can see. You&apos;ll add the video and resources on the next page.
      </p>
      <div className="mt-8 rounded-xl border p-5 sm:p-6">
        <LessonForm categories={categories} />
      </div>
    </div>
  );
}
