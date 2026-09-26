import Link from "next/link";
import { ArrowRight, Search, SearchX, ShieldCheck } from "lucide-react";
import { cn } from "cn";
import { LessonCard, LessonGrid } from "@/components/lessons/lesson-card";
import { Pagination } from "@/components/layout/pagination";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { parsePage } from "@/lib/api/response";
import { getSession, getSupabase } from "@/lib/auth/getSession";
import { listCategories } from "@/lib/data/admin";
import { listHistory } from "@/lib/data/learning";
import { catalogStats, listCatalog } from "@/lib/data/lessons";
import { lessonSortSchema } from "@/lib/validators/lesson";

const PER_PAGE = 12;

function first(value: string | string[] | undefined) {
  return (Array.isArray(value) ? value[0] : value) || undefined;
}

function progressPercent(seconds: number, duration: number | null) {
  return duration ? Math.min(100, Math.round((seconds / duration) * 100)) : 0;
}

export default async function CatalogPage(props: PageProps<"/">) {
  const searchParams = await props.searchParams;
  const sort = lessonSortSchema.parse(first(searchParams.sort));
  const category = first(searchParams.category);
  const q = first(searchParams.q)?.trim().slice(0, 80);
  const range = parsePage(searchParams, PER_PAGE);
  const filtering = Boolean(q || category || range.page > 1);

  const supabase = await getSupabase();
  const session = await getSession();
  const [categories, { rows, total }, stats, history] = await Promise.all([
    listCategories(supabase),
    listCatalog(supabase, { sort, category, q, ...range }),
    filtering ? null : catalogStats(supabase),
    session && !filtering ? listHistory(supabase, session.profile.id, { from: 0, to: 7 }) : null,
  ]);
  const continueWatching = (history?.rows ?? []).filter((row) => !row.completed).slice(0, 4);

  const params = { sort: sort === "newest" ? undefined : sort, category, q };
  const hrefWith = (next: Partial<typeof params>) => {
    const query = new URLSearchParams(
      Object.entries({ ...params, ...next }).filter((entry): entry is [string, string] => Boolean(entry[1]))
    ).toString();
    return query ? `/?${query}` : "/";
  };
  const activeCategory = categories.find((c) => c.slug === category);
  const firstName = session?.profile.full_name?.split(" ")[0];

  const searchForm = (
    <form action="/" className="flex gap-2">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          name="q"
          type="search"
          defaultValue={q}
          placeholder="Search lessons"
          aria-label="Search lessons"
          className="h-11 bg-background pl-10 text-sm"
        />
      </div>
      {category && <input type="hidden" name="category" value={category} />}
      {sort !== "newest" && <input type="hidden" name="sort" value={sort} />}
      <Button type="submit" className="h-11 px-5">
        Search
      </Button>
    </form>
  );

  return (
    <>
      {filtering ? (
        <div className="max-w-2xl">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {q ? <>Results for “{q}”</> : activeCategory ? activeCategory.name : "All lessons"}
          </h1>
          <div className="mt-5">{searchForm}</div>
        </div>
      ) : (
        <section className="relative overflow-hidden rounded-2xl border bg-card px-6 py-10 shadow-xs sm:px-10 sm:py-14">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-24 -right-24 size-96 rounded-full bg-primary/15 blur-3xl dark:bg-primary/20"
          />
          <div className="relative max-w-2xl">
            <span className="inline-flex items-center gap-1.5 rounded-full border bg-brand-soft px-2.5 py-1 text-xs font-medium text-brand-soft-foreground">
              <ShieldCheck className="size-3.5" /> Free · Every lesson reviewed before it&apos;s published
            </span>
            <h1 className="mt-5 text-3xl font-semibold tracking-tight text-balance sm:text-5xl">
              {firstName ? (
                <>
                  Welcome back, <span className="text-primary">{firstName}</span>.
                </>
              ) : (
                <>
                  Learn something useful in <span className="text-primary">ten minutes</span>.
                </>
              )}
            </h1>
            <p className="mt-4 max-w-xl text-base text-muted-foreground sm:text-lg">
              Short video lessons from people who do the work — pick a topic, press play, and come back to your progress any time.
            </p>
            <div className="mt-7 max-w-xl">{searchForm}</div>
            {stats && (
              <dl className="mt-8 flex flex-wrap gap-x-8 gap-y-3 text-sm">
                {[
                  [stats.lessons, stats.lessons === 1 ? "lesson" : "lessons"],
                  [stats.instructors, stats.instructors === 1 ? "instructor" : "instructors"],
                  [stats.categories, "topics"],
                ].map(([value, label]) => (
                  <div key={String(label)} className="flex items-baseline gap-1.5">
                    <dt className="sr-only">{label}</dt>
                    <dd className="text-lg font-semibold tabular-nums">{value}</dd>
                    <span className="text-muted-foreground">{label}</span>
                  </div>
                ))}
              </dl>
            )}
          </div>
        </section>
      )}

      {continueWatching.length > 0 && (
        <section className="mt-12">
          <div className="mb-5 flex items-end justify-between gap-4">
            <h2 className="text-lg font-semibold tracking-tight">Continue watching</h2>
            <Link href="/library" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
              My learning <ArrowRight className="size-4" />
            </Link>
          </div>
          <LessonGrid>
            {continueWatching.map(({ lesson, progress_seconds }) => (
              <LessonCard key={lesson.id} lesson={lesson} progress={progressPercent(progress_seconds, lesson.duration_seconds)} />
            ))}
          </LessonGrid>
        </section>
      )}

      <section className="mt-12">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <nav aria-label="Categories" className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
            {[{ slug: undefined, name: "All" }, ...categories].map((c) => (
              <Link
                key={c.slug ?? "all"}
                href={hrefWith({ category: c.slug })}
                aria-current={category === c.slug ? "page" : undefined}
                className="rounded-full border bg-card px-3.5 py-1.5 text-sm whitespace-nowrap text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground aria-[current=page]:border-primary aria-[current=page]:bg-primary aria-[current=page]:text-primary-foreground"
              >
                {c.name}
              </Link>
            ))}
          </nav>

          <div className="flex shrink-0 self-start rounded-lg border bg-card p-0.5 text-sm sm:self-auto" role="group" aria-label="Sort lessons">
            {(["newest", "trending"] as const).map((option) => (
              <Link
                key={option}
                href={hrefWith({ sort: option === "newest" ? undefined : option })}
                aria-current={sort === option ? "true" : undefined}
                className={cn(
                  "rounded-md px-3 py-1 capitalize text-muted-foreground transition-colors hover:text-foreground",
                  sort === option && "bg-muted font-medium text-foreground"
                )}
              >
                {option}
              </Link>
            ))}
          </div>
        </div>

        <p className="mt-6 mb-6 text-sm text-muted-foreground">
          {total} {total === 1 ? "lesson" : "lessons"}
          {activeCategory && !filtering && <> in {activeCategory.name}</>}
          {sort === "trending" && " · most viewed first"}
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
                <Link href="/" className="text-sm font-medium text-primary underline-offset-4 hover:underline">
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
      </section>
    </>
  );
}
