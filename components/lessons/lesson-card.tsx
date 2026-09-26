import Link from "next/link";
import { formatViews } from "@/lib/format";
import { LessonThumbnail } from "@/components/lessons/lesson-thumbnail";
import type { LessonSummary } from "@/types/lesson";

export function LessonCard({ lesson, footer }: { lesson: LessonSummary; footer?: React.ReactNode }) {
  return (
    <article className="group">
      <Link href={`/lessons/${lesson.id}`} className="block rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
        <LessonThumbnail
          src={lesson.thumbnail_url}
          title={lesson.title}
          tintKey={lesson.category?.slug ?? lesson.id}
          durationSeconds={lesson.duration_seconds}
          className="transition-opacity group-hover:opacity-90"
        />
        <h3 className="mt-3 line-clamp-2 text-sm leading-snug font-medium group-hover:underline group-hover:underline-offset-2">
          {lesson.title}
        </h3>
      </Link>
      <p className="mt-1 truncate text-xs text-muted-foreground">
        {lesson.instructor?.full_name ?? "Instructor"}
        {lesson.category && <> · {lesson.category.name}</>}
      </p>
      <p className="mt-0.5 text-xs text-muted-foreground">{formatViews(lesson.view_count)}</p>
      {footer}
    </article>
  );
}

export function LessonGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{children}</div>;
}
