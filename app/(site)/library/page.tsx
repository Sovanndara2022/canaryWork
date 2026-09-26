import Link from "next/link";
import { Bookmark, CheckCircle2, History, PlayCircle } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { LessonCard, LessonGrid } from "@/components/lessons/lesson-card";
import { Pagination } from "@/components/layout/pagination";
import { EmptyState } from "@/components/ui/empty-state";
import { Stat } from "@/components/ui/stat";
import { parsePage } from "@/lib/api/response";
import { requirePageRole } from "@/lib/auth/requireRole";
import { studentDashboard } from "@/lib/data/dashboards";
import { listBookmarks } from "@/lib/data/learning";

export const metadata = { title: "My learning · Lightning Lessons" };

export default async function LibraryPage(props: PageProps<"/library">) {
  const { supabase, profile } = await requirePageRole();
  const searchParams = await props.searchParams;
  const range = parsePage(searchParams, 8);

  const [dashboard, saved] = await Promise.all([
    studentDashboard(supabase, profile.id),
    listBookmarks(supabase, profile.id, range),
  ]);

  return (
    <>
      <PageHeader title="My learning" description="Pick up where you left off and find the lessons you saved." />

      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        <Stat label="Completed" value={dashboard.completed_count} icon={CheckCircle2} />
        <Stat label="In progress" value={dashboard.in_progress_count} icon={PlayCircle} />
        <Stat label="Saved" value={dashboard.bookmarks_count} icon={Bookmark} />
      </div>

      <section className="mt-12">
        <h2 className="mb-4 text-lg font-semibold tracking-tight">Continue watching</h2>
        {dashboard.recent_history.length > 0 ? (
          <LessonGrid>
            {dashboard.recent_history.map(({ lesson, progress_seconds, completed }) => {
              const percent = lesson.duration_seconds
                ? Math.min(100, Math.round((progress_seconds / lesson.duration_seconds) * 100))
                : 0;
              return (
                <LessonCard
                  key={lesson.id}
                  lesson={lesson}
                  progress={completed ? 100 : percent}
                  footer={
                    completed ? (
                      <p className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                        <CheckCircle2 className="size-3.5" /> Completed
                      </p>
                    ) : (
                      <p className="mt-1.5 text-xs font-medium text-primary">{percent}% watched · Resume</p>
                    )
                  }
                />
              );
            })}
          </LessonGrid>
        ) : (
          <EmptyState
            icon={History}
            title="Nothing watched yet"
            action={<Link href="/" className="text-sm font-medium text-primary underline-offset-4 hover:underline">Browse lessons</Link>}
          >
            Lessons you start watching show up here with your progress.
          </EmptyState>
        )}
      </section>

      <section className="mt-12">
        <h2 className="mb-4 text-lg font-semibold tracking-tight">Saved lessons</h2>
        {saved.rows.length > 0 ? (
          <>
            <LessonGrid>
              {saved.rows.map(({ id, lesson }) => (
                <LessonCard key={id} lesson={lesson} />
              ))}
            </LessonGrid>
            <Pagination meta={{ page: range.page, per_page: range.perPage, total: saved.total }} basePath="/library" params={{}} />
          </>
        ) : (
          <EmptyState icon={Bookmark} title="No saved lessons">
            Use the Save button on any lesson to keep it here.
          </EmptyState>
        )}
      </section>
    </>
  );
}
