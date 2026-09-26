import Link from "next/link";
import { StatusBadge } from "@/components/lessons/status-badge";
import { LessonThumbnail } from "@/components/lessons/lesson-thumbnail";
import { formatDate } from "@/lib/format";
import type { LessonSummary } from "@/types/lesson";

type Row = LessonSummary & { submitted_at?: string | null };

export function AdminLessonTable({ rows }: { rows: Row[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border">
      <table className="w-full min-w-[640px] text-sm">
        <thead className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
          <tr>
            <th className="px-4 py-2.5 font-medium">Lesson</th>
            <th className="px-4 py-2.5 font-medium">Instructor</th>
            <th className="px-4 py-2.5 font-medium">Submitted</th>
            <th className="px-4 py-2.5 font-medium">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {rows.map((lesson) => (
            <tr key={lesson.id} className="transition-colors hover:bg-muted/30">
              <td className="px-4 py-3">
                <Link href={`/admin/lessons/${lesson.id}`} className="flex items-center gap-3">
                  <LessonThumbnail
                    src={lesson.thumbnail_url}
                    title={lesson.title}
                    tintKey={lesson.category?.slug ?? lesson.id}
                    durationSeconds={lesson.duration_seconds}
                    className="w-20 shrink-0"
                  />
                  <span className="min-w-0">
                    <span className="line-clamp-2 font-medium hover:underline hover:underline-offset-2">{lesson.title}</span>
                    <span className="text-xs text-muted-foreground">{lesson.category?.name ?? "No category"}</span>
                  </span>
                </Link>
              </td>
              <td className="px-4 py-3 text-muted-foreground">{lesson.instructor?.full_name ?? "—"}</td>
              <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">{formatDate(lesson.submitted_at)}</td>
              <td className="px-4 py-3">
                <StatusBadge status={lesson.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
