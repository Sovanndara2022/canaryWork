import { StatusBadge } from "@/components/lessons/status-badge";
import { requirePageRole } from "@/lib/auth/requireRole";
import type { LessonStatus } from "@/types/lesson";

const dateFormat = new Intl.DateTimeFormat("en", { dateStyle: "medium", timeZone: "UTC" });

export default async function InstructorLessonsPage() {
  const { supabase, profile } = await requirePageRole("instructor", "admin");

  const { data: lessons } = await supabase
    .from("lessons")
    .select("id, title, status, updated_at")
    .eq("instructor_id", profile.id)
    .order("updated_at", { ascending: false })
    .returns<{ id: string; title: string; status: LessonStatus; updated_at: string }[]>();

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">My lessons</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Drafts, lessons in review, and everything you&apos;ve published.
      </p>

      {lessons && lessons.length > 0 ? (
        <ul className="mt-8 divide-y rounded-xl border">
          {lessons.map((lesson) => (
            <li key={lesson.id} className="flex items-center justify-between gap-4 px-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{lesson.title}</p>
                <p className="text-xs text-muted-foreground">
                  Updated {dateFormat.format(new Date(lesson.updated_at))}
                </p>
              </div>
              <StatusBadge status={lesson.status} />
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-8 rounded-xl border border-dashed px-6 py-16 text-center">
          <p className="text-sm font-medium">No lessons yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Lessons you create will show up here with their review status.
          </p>
        </div>
      )}
    </>
  );
}
