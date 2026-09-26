import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import type { PageMeta } from "@/lib/api/response";

// Server-rendered prev/next links that keep the current query string.
export function Pagination({
  meta,
  basePath,
  params,
}: {
  meta: PageMeta;
  basePath: string;
  params: Record<string, string | undefined>;
}) {
  const lastPage = Math.max(1, Math.ceil(meta.total / meta.per_page));
  if (lastPage <= 1) return null;

  const href = (page: number) => {
    const query = new URLSearchParams(
      Object.entries({ ...params, page: page > 1 ? String(page) : undefined }).filter(
        (entry): entry is [string, string] => Boolean(entry[1])
      )
    );
    const qs = query.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };

  const linkClass = buttonVariants({ variant: "outline", size: "sm" });
  const disabled = "pointer-events-none opacity-40";

  return (
    <nav aria-label="Pagination" className="mt-10 flex items-center justify-between gap-4">
      <p className="text-sm text-muted-foreground">
        Page {meta.page} of {lastPage}
      </p>
      <div className="flex gap-2">
        <Link href={href(meta.page - 1)} aria-disabled={meta.page <= 1} className={`${linkClass} ${meta.page <= 1 ? disabled : ""}`}>
          <ChevronLeft /> Previous
        </Link>
        <Link
          href={href(meta.page + 1)}
          aria-disabled={meta.page >= lastPage}
          className={`${linkClass} ${meta.page >= lastPage ? disabled : ""}`}
        >
          Next <ChevronRight />
        </Link>
      </div>
    </nav>
  );
}
