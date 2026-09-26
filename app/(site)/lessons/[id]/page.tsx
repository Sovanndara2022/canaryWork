import type { Metadata } from "next";
import Link from "next/link";
import { EyeOff, Film } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Avatar } from "@/components/ui/avatar";
import { buttonVariants } from "@/components/ui/button";
import { BookmarkButton } from "@/components/lessons/bookmark-button";
import { LessonCard } from "@/components/lessons/lesson-card";
import { LessonPlayer } from "@/components/lessons/lesson-player";
import { ResourceList } from "@/components/lessons/resource-list";
import { StatusBadge } from "@/components/lessons/status-badge";
import { getSession, getSupabase } from "@/lib/auth/getSession";
import { getBookmarkFor, getProgress } from "@/lib/data/learning";
import { getLesson, listCatalog } from "@/lib/data/lessons";
import { orNotFound } from "@/lib/data/page";
import { formatDate, formatMinutes, formatViews } from "@/lib/format";

export async function generateMetadata(props: PageProps<"/lessons/[id]">): Promise<Metadata> {
  const { id } = await props.params;
  try {
    const lesson = await getLesson(await getSupabase(), id);
    return { title: `${lesson.title} · Lightning Lessons`, description: lesson.description ?? undefined };
  } catch {
    return { title: "Lesson · Lightning Lessons" };
  }
}

export default async function LessonPage(props: PageProps<"/lessons/[id]">) {
  const { id } = await props.params;
  const supabase = await getSupabase();
  const [session, lesson] = await Promise.all([getSession(), orNotFound(getLesson(supabase, id))]);

  const isPublished = lesson.status === "approved";
  const isOwner = session?.profile.id === lesson.instructor_id;
  const [bookmarkId, progress, related] = await Promise.all([
    session ? getBookmarkFor(supabase, session.profile.id, lesson.id) : null,
    session && isPublished ? getProgress(supabase, session.profile.id, lesson.id) : null,
    isPublished && lesson.category
      ? listCatalog(supabase, { sort: "trending", category: lesson.category.slug, from: 0, to: 4 })
      : { rows: [] },
  ]);
  const moreLessons = related.rows.filter((l) => l.id !== lesson.id).slice(0, 4);

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="min-w-0">
        {!isPublished && (
          <Alert tone="warning" icon={EyeOff} title="Preview — not published" className="mb-5">
            <span className="flex flex-wrap items-center gap-2">
              Status: <StatusBadge status={lesson.status} /> Only the instructor and admins can see this page.
            </span>
          </Alert>
        )}

        {lesson.mux_playback_id ? (
          <LessonPlayer
            lessonId={lesson.id}
            playbackId={lesson.mux_playback_id}
            title={lesson.title}
            trackViews={isPublished}
            trackProgress={Boolean(session) && isPublished}
            initialProgress={progress}
          />
        ) : (
          <div className="flex aspect-video flex-col items-center justify-center rounded-xl bg-muted text-center">
            <Film className="size-8 text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground">No video has been uploaded for this lesson yet.</p>
          </div>
        )}

        <h1 className="mt-6 text-2xl font-semibold tracking-tight text-balance sm:text-3xl">{lesson.title}</h1>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Avatar name={lesson.instructor?.full_name} src={lesson.instructor?.avatar_url} className="size-9" />
            <div className="text-sm">
              <p className="font-medium">{lesson.instructor?.full_name ?? "Instructor"}</p>
              <p className="text-muted-foreground">
                {[lesson.category?.name, formatMinutes(lesson.duration_seconds), isPublished && formatViews(lesson.view_count)]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {isOwner && (
              <Link href={`/instructor/lessons/${lesson.id}`} className={buttonVariants({ variant: "outline" })}>
                Edit lesson
              </Link>
            )}
            {isPublished && <BookmarkButton lessonId={lesson.id} initialBookmarkId={bookmarkId} signedIn={Boolean(session)} />}
          </div>
        </div>

        {lesson.description && (
          <div className="mt-6 rounded-xl bg-muted/50 p-4">
            <p className="text-xs text-muted-foreground">Published {formatDate(lesson.reviewed_at ?? lesson.created_at)}</p>
            <p className="mt-2 text-sm leading-6 whitespace-pre-line">{lesson.description}</p>
          </div>
        )}
      </div>

      <aside className="space-y-8">
        <section>
          <h2 className="mb-3 text-sm font-semibold">Resources</h2>
          {lesson.resources.length > 0 ? (
            <ResourceList resources={lesson.resources} />
          ) : (
            <p className="text-sm text-muted-foreground">No extra resources for this lesson.</p>
          )}
        </section>

        {moreLessons.length > 0 && (
          <section>
            <h2 className="mb-3 text-sm font-semibold">More in {lesson.category?.name}</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-1">
              {moreLessons.map((l) => (
                <LessonCard key={l.id} lesson={l} />
              ))}
            </div>
          </section>
        )}
      </aside>
    </div>
  );
}
