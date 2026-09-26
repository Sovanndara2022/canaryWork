import { cn } from "cn";

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn("animate-pulse rounded-md bg-muted", className)} />;
}

// Page title + stat row + list — the shape of every dashboard page.
export function DashboardSkeleton({ stats = 4 }: { stats?: number }) {
  return (
    <div role="status" aria-label="Loading">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="mt-3 h-4 w-80 max-w-full" />
      <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: stats }, (_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
      <Skeleton className="mt-10 h-72 rounded-xl" />
    </div>
  );
}
