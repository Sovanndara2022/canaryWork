import { LessonCardSkeleton, LessonGrid } from "@/components/lessons/lesson-card";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div role="status" aria-label="Loading">
      <Skeleton className="h-64 rounded-2xl" />
      <div className="mt-12 flex gap-2">
        {Array.from({ length: 5 }, (_, i) => (
          <Skeleton key={i} className="h-8 w-24 rounded-full" />
        ))}
      </div>
      <div className="mt-10">
        <LessonGrid>
          {Array.from({ length: 8 }, (_, i) => (
            <LessonCardSkeleton key={i} />
          ))}
        </LessonGrid>
      </div>
    </div>
  );
}
