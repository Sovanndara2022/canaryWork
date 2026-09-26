import Link from "next/link";
import { ArrowRight, BookOpen, GraduationCap, Inbox, Timer, Users } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { AdminLessonTable } from "@/components/admin/lesson-table";
import { EmptyState } from "@/components/ui/empty-state";
import { Stat } from "@/components/ui/stat";
import { requirePageRole } from "@/lib/auth/requireRole";
import { adminDashboard } from "@/lib/data/dashboards";
import { listLessonsForReview } from "@/lib/data/admin";

export const metadata = { title: "Admin · Lightning Lessons" };

export default async function AdminOverviewPage() {
  const { supabase } = await requirePageRole("admin");
  const [stats, queue] = await Promise.all([
    adminDashboard(supabase),
    listLessonsForReview(supabase, "pending", { from: 0, to: 4 }),
  ]);

  return (
    <>
      <PageHeader eyebrow="Admin" title="Overview" description="Review submissions and keep an eye on the platform." />

      <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Stat label="Waiting for review" value={stats.pending_approvals} icon={Inbox} />
        <Stat label="Lessons" value={stats.total_lessons} icon={BookOpen} />
        <Stat label="Users" value={stats.total_users} icon={Users} />
        <Stat label="Instructors" value={stats.total_instructors} icon={GraduationCap} />
        <Stat
          icon={Timer}
          label="Avg. review time"
          value={stats.avg_approval_turnaround_hours === null ? "—" : `${stats.avg_approval_turnaround_hours}h`}
          hint="submitted → decided"
        />
      </div>

      <section className="mt-12">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">Review queue</h2>
          {queue.total > 0 && (
            <Link href="/admin/lessons?status=pending" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
              View all {queue.total} <ArrowRight className="size-4" />
            </Link>
          )}
        </div>
        {queue.rows.length > 0 ? (
          <AdminLessonTable rows={queue.rows} />
        ) : (
          <EmptyState icon={Inbox} title="All caught up">
            New submissions from instructors will appear here, oldest first.
          </EmptyState>
        )}
      </section>
    </>
  );
}
