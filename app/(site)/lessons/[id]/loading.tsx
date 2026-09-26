import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div role="status" aria-label="Loading" className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div>
        <Skeleton className="h-4 w-40" />
        <Skeleton className="mt-4 aspect-video rounded-xl" />
        <Skeleton className="mt-6 h-8 w-2/3" />
        <Skeleton className="mt-4 h-10 w-64" />
        <Skeleton className="mt-6 h-32 rounded-xl" />
      </div>
      <div className="space-y-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-40 rounded-xl" />
      </div>
    </div>
  );
}
