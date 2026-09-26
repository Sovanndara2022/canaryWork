import Link from "next/link";
import { cn } from "cn";
import { Inbox } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { AdminLessonTable } from "@/components/admin/lesson-table";
import { Pagination } from "@/components/layout/pagination";
import { EmptyState } from "@/components/ui/empty-state";
import { parsePage } from "@/lib/api/response";
import { requirePageRole } from "@/lib/auth/requireRole";
import { listLessonsForReview } from "@/lib/data/admin";
import type { LessonStatus } from "@/types/lesson";

export const metadata = { title: "Lessons · Admin" };

const tabs: { value: LessonStatus | "all"; label: string }[] = [
  { value: "pending", label: "Waiting for review" },
  { value: "approved", label: "Published" },
  { value: "rejected", label: "Sent back" },
  { value: "draft", label: "Drafts" },
  { value: "all", label: "All" },
];

export default async function AdminLessonsPage(props: PageProps<"/admin/lessons">) {
  const { supabase } = await requirePageRole("admin");
  const searchParams = await props.searchParams;
  const status = tabs.find((t) => t.value === searchParams.status)?.value ?? "pending";
  const range = parsePage(searchParams, 15);
  const { rows, total } = await listLessonsForReview(supabase, status, range);

  return (
    <>
      <PageHeader eyebrow="Admin" title="Lessons" description="Open a lesson to watch it and approve or send it back." />

      <div className="mt-6 mb-6 flex gap-1 overflow-x-auto border-b">
        {tabs.map((tab) => (
          <Link
            key={tab.value}
            href={`/admin/lessons?status=${tab.value}`}
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

      {rows.length > 0 ? (
        <AdminLessonTable rows={rows} />
      ) : (
        <EmptyState icon={Inbox} title={status === "pending" ? "All caught up" : "No lessons here"} />
      )}

      <Pagination meta={{ page: range.page, per_page: range.perPage, total }} basePath="/admin/lessons" params={{ status }} />
    </>
  );
}
