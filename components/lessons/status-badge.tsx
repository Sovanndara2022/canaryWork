import { cn } from "cn";
import type { LessonStatus } from "@/types/lesson";

const styles: Record<LessonStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  pending: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200",
  approved: "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200",
  rejected: "bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-200",
};

export function StatusBadge({ status }: { status: LessonStatus }) {
  return (
    <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium capitalize", styles[status])}>
      {status}
    </span>
  );
}
