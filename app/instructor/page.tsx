import Link from "next/link";
import { cn } from "cn";
import { CheckCircle2, Clock, Eye, PencilLine, Plus, Video } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Stat } from "@/components/ui/stat";
import { LessonThumbnail } from "@/components/lessons/lesson-thumbnail";
import { StatusBadge } from "@/components/lessons/status-badge";
import { Pagination } from "@/components/layout/pagination";
import { parsePage } from "@/lib/api/response";
import { requirePageRole } from "@/lib/auth/requireRole";
import { instructorDashboard } from "@/lib/data/dashboards";
import { listMyLessons } from "@/lib/data/lessons";
import { formatDate, formatViews } from "@/lib/format";
import type { LessonStatus } from "@/types/lesson";

export const metadata = { title: "Teach · Lightning Lessons" };

const tabs: { value?: LessonStatus; label: string }[] = [
  { label: "All" },
  { value: "draft", label: "Drafts" },
  { value: "pending", label: "In review" },
  { value: "rejected", label: "Needs changes" },
  { value: "approved", label: "Published" },
];

export default async function InstructorDashboardPage(props: PageProps<"/instructor">) {
  const { supabase, profile } = await requirePageRole("instructor", "admin");
  const searchParams = await props.searchParams;
  const status = tabs.find((t) => t.value && t.value === searchParams.status)?.value;
  const range = parsePage(searchParams, 10);

  const [dashboard, lessons] = await Promise.all([
    instructorDashboard(supabase, profile.id),
    listMyLessons(supabase, profile.id, range, status),
  ]);
  const byStatus = dashboard.lessons_by_status;
  const totalLessons = Object.values(byStatus).reduce((a, b) => a + b, 0);

  return (
    <>
      <PageHeader
        eyebrow="Instructor"
        title="Teach"
        description="Create lessons, send them for review, and see how they're doing."
        actions={
          <Link href="/instructor/lessons/new" className={buttonVariants({ className: "h-10 px-4" })}>
            <Plus /> New lesson
          </Link>
        }
      />

      <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Published" value={byStatus.approved} icon={CheckCircle2} />
        <Stat label="In review" value={byStatus.pending} icon={Clock} />
        <Stat label="Drafts & changes" value={byStatus.draft + byStatus.rejected} icon={PencilLine} hint={byStatus.rejected ? `${byStatus.rejected} need changes` : undefined} />
        <Stat label="Total views" value={dashboard.total_views.toLocaleString("en")} icon={Eye} />
      </div>

      <div className="mt-10 flex gap-1 overflow-x-auto border-b">
        {tabs.map((tab) => (
          <Link
            key={tab.label}
            href={tab.value ? `/instructor?status=${tab.value}` : "/instructor"}
            aria-current={status === tab.value ? "page" : undefined}
            className={cn(
              "-mb-px border-b-2 border-transparent px-3 py-2 text-sm whitespace-nowrap text-muted-foreground transition-colors hover:text-foreground",
              status === tab.value && "border-primary font-medium text-foreground"
            )}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {lessons.rows.length > 0 ? (
        <ul className="mt-4 divide-y rounded-xl border bg-card shadow-xs">
          {lessons.rows.map((lesson) => (
            <li key={lesson.id}>
              <Link href={`/instructor/lessons/${lesson.id}`} className="group flex items-center gap-4 px-3 py-3 transition-colors first:rounded-t-xl last:rounded-b-xl hover:bg-muted/50 sm:px-4">
                <LessonThumbnail
                  src={lesson.thumbnail_url}
                  title={lesson.title}
                  tintKey={lesson.category?.slug ?? lesson.id}
                  durationSeconds={lesson.duration_seconds}
                  className="w-28 shrink-0 sm:w-36"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium group-hover:text-primary">{lesson.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {[lesson.category?.name ?? "No category", `Created ${formatDate(lesson.created_at)}`, lesson.status === "approved" && formatViews(lesson.view_count)]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
                <StatusBadge status={lesson.status} />
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-6">
          <EmptyState
            icon={Video}
            title={totalLessons === 0 ? "Create your first lesson" : "Nothing here"}
            action={
              totalLessons === 0 && (
                <Link href="/instructor/lessons/new" className={buttonVariants({ className: "h-9 px-4" })}>
                  <Plus /> New lesson
                </Link>
              )
            }
          >
            {totalLessons === 0
              ? "Start with a title and category. You can add the video and resources next, then send it for review."
              : "No lessons with this status."}
          </EmptyState>
        </div>
      )}

      <Pagination
        meta={{ page: range.page, per_page: range.perPage, total: lessons.total }}
        basePath="/instructor"
        params={{ status }}
      />
    </>
  );
}
