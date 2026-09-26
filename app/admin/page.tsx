import { requirePageRole } from "@/lib/auth/requireRole";

const dateFormat = new Intl.DateTimeFormat("en", { dateStyle: "medium", timeZone: "UTC" });

type PendingLesson = {
  id: string;
  title: string;
  submitted_at: string | null;
  // lessons has two FKs to users (instructor_id, reviewed_by), so the embed
  // has to name which one.
  instructor: { full_name: string | null; email: string } | null;
};

export default async function AdminPendingPage() {
  const { supabase } = await requirePageRole("admin");

  const { data: pending } = await supabase
    .from("lessons")
    .select("id, title, submitted_at, instructor:users!lessons_instructor_id_fkey(full_name, email)")
    .eq("status", "pending")
    .order("submitted_at", { ascending: true })
    .returns<PendingLesson[]>();

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">Pending approvals</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Lessons waiting for review, oldest first.
      </p>

      {pending && pending.length > 0 ? (
        <ul className="mt-8 divide-y rounded-xl border">
          {pending.map((lesson) => (
            <li key={lesson.id} className="flex items-center justify-between gap-4 px-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{lesson.title}</p>
                <p className="text-xs text-muted-foreground">
                  {lesson.instructor?.full_name ?? lesson.instructor?.email ?? "Unknown instructor"}
                </p>
              </div>
              {lesson.submitted_at && (
                <span className="shrink-0 text-xs text-muted-foreground">
                  Submitted {dateFormat.format(new Date(lesson.submitted_at))}
                </span>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-8 rounded-xl border border-dashed px-6 py-16 text-center">
          <p className="text-sm font-medium">Nothing to review</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Lessons instructors submit will appear here.
          </p>
        </div>
      )}
    </>
  );
}
