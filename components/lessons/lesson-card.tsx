import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { LessonThumbnail } from "@/components/lessons/lesson-thumbnail";
import { formatViews } from "@/lib/format";
import type { LessonSummary } from "@/types/lesson";

export function LessonCard({
  lesson,
  progress,
  footer,
}: {
  lesson: LessonSummary;
  /** 0–100 watch progress, shown on the thumbnail. */
  progress?: number | null;
  footer?: React.ReactNode;
}) {
  return (
    <article className="group relative">
      <LessonThumbnail
        src={lesson.thumbnail_url}
        title={lesson.title}
        tintKey={lesson.category?.slug ?? lesson.id}
        durationSeconds={lesson.duration_seconds}
        label={lesson.category?.name}
        progress={progress}
        className="shadow-xs transition-shadow group-hover:shadow-md"
      />
      <div className="mt-3 flex gap-3">
        <Avatar name={lesson.instructor?.full_name} src={lesson.instructor?.avatar_url} className="mt-0.5 size-8" />
        <div className="min-w-0">
          <h3 className="line-clamp-2 text-sm leading-snug font-semibold">
            <Link
              href={`/lessons/${lesson.id}`}
              className="outline-none after:absolute after:inset-0 after:rounded-xl focus-visible:after:ring-3 focus-visible:after:ring-ring/50 group-hover:text-primary"
            >
              {lesson.title}
            </Link>
          </h3>
          <p className="mt-1 truncate text-xs text-muted-foreground">{lesson.instructor?.full_name ?? "Instructor"}</p>
          <p className="text-xs text-muted-foreground">{formatViews(lesson.view_count)}</p>
          {footer}
        </div>
      </div>
    </article>
  );
}

export function LessonGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-x-6 gap-y-9 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{children}</div>;
}

export function LessonCardSkeleton() {
  return (
    <div aria-hidden="true">
      <div className="aspect-video animate-pulse rounded-xl bg-muted" />
      <div className="mt-3 flex gap-3">
        <div className="size-8 shrink-0 animate-pulse rounded-full bg-muted" />
        <div className="flex-1 space-y-2">
          <div className="h-3.5 w-4/5 animate-pulse rounded bg-muted" />
          <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
        </div>
      </div>
    </div>
  );
}
