import Link from "next/link";
import { Search, SearchX } from "lucide-react";
import { cn } from "cn";
import { LessonCard, LessonGrid } from "@/components/lessons/lesson-card";
import { Pagination } from "@/components/layout/pagination";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { parsePage } from "@/lib/api/response";
import { getSession, getSupabase } from "@/lib/auth/getSession";
import { listCategories } from "@/lib/data/admin";
import { listCatalog } from "@/lib/data/lessons";
import { lessonSortSchema } from "@/lib/validators/lesson";

const PER_PAGE = 12;

function first(value: string | string[] | undefined) {
  return (Array.isArray(value) ? value[0] : value) || undefined;
}

export default async function CatalogPage(props: PageProps<"/">) {
  const searchParams = await props.searchParams;
  const sort = lessonSortSchema.parse(first(searchParams.sort));
  const category = first(searchParams.category);
  const q = first(searchParams.q)?.trim().slice(0, 80);
  const range = parsePage(searchParams, PER_PAGE);

  const supabase = await getSupabase();
  const [session, categories, { rows, total }] = await Promise.all([
    getSession(),
    listCategories(supabase),
    listCatalog(supabase, { sort, category, q, ...range }),
  ]);

  const params = { sort: sort === "newest" ? undefined : sort, category, q };
  const hrefWith = (next: Partial<typeof params>) => {
    const query = new URLSearchParams(
      Object.entries({ ...params, ...next }).filter((entry): entry is [string, string] => Boolean(entry[1]))
    ).toString();
    return query ? `/?${query}` : "/";
  };
  const activeCategory = categories.find((c) => c.slug === category);

  return (
    <>
      <section className="max-w-2xl">
        <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          {session ? `Welcome back${session.profile.full_name ? `, ${session.profile.full_name.split(" ")[0]}` : ""}.` : "Learn something useful in ten minutes."}
        </h1>
        <p className="mt-3 text-muted-foreground">
          Short video lessons from people who do the work. Every lesson is reviewed before it&apos;s published.
        </p>

        <form action="/" className="relative mt-6">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input name="q" type="search" defaultValue={q} placeholder="Search lessons" aria-label="Search lessons" className="h-11 pl-9" />
          {category && <input type="hidden" name="category" value={category} />}
          {sort !== "newest" && <input type="hidden" name="sort" value={sort} />}
        </form>
      </section>

      <div className="mt-10 flex flex-col gap-4 border-b pb-4 sm:flex-row sm:items-center sm:justify-between">
        <nav aria-label="Categories" className="-mx-1 flex gap-1 overflow-x-auto px-1">
          {[{ slug: undefined, name: "All" }, ...categories].map((c) => (
            <Link
              key={c.slug ?? "all"}
              href={hrefWith({ category: c.slug })}
              aria-current={category === c.slug ? "page" : undefined}
              className="rounded-full border px-3 py-1 text-sm whitespace-nowrap text-muted-foreground transition-colors hover:text-foreground aria-[current=page]:border-foreground aria-[current=page]:bg-foreground aria-[current=page]:text-background"
            >
              {c.name}
            </Link>
          ))}
        </nav>

        <div className="flex shrink-0 self-start rounded-lg border p-0.5 text-sm sm:self-auto" role="group" aria-label="Sort lessons">
          {(["newest", "trending"] as const).map((option) => (
            <Link
              key={option}
              href={hrefWith({ sort: option === "newest" ? undefined : option })}
              aria-current={sort === option ? "true" : undefined}
              className={cn(
                "rounded-md px-3 py-1 capitalize text-muted-foreground transition-colors hover:text-foreground",
                sort === option && "bg-muted text-foreground"
              )}
            >
              {option}
            </Link>
          ))}
        </div>
      </div>

      <p className="mt-6 mb-5 text-sm text-muted-foreground">
        {total} {total === 1 ? "lesson" : "lessons"}
        {activeCategory && <> in {activeCategory.name}</>}
        {q && <> matching “{q}”</>}
      </p>

      {rows.length > 0 ? (
        <LessonGrid>
          {rows.map((lesson) => (
            <LessonCard key={lesson.id} lesson={lesson} />
          ))}
        </LessonGrid>
      ) : (
        <EmptyState
          icon={SearchX}
          title={q || category ? "No lessons match" : "No lessons published yet"}
          action={
            q || category ? (
              <Link href="/" className="text-sm font-medium underline underline-offset-4">
                Clear filters
              </Link>
            ) : undefined
          }
        >
          {q || category
            ? "Try a different search or category."
            : "Approved lessons will appear here. Instructors can create one from the Teach page."}
        </EmptyState>
      )}

      <Pagination meta={{ page: range.page, per_page: range.perPage, total }} basePath="/" params={params} />
    </>
  );
}
