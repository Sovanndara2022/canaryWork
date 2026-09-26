import Link from "next/link";
import { ArrowLeft, CheckCircle2, ExternalLink, Film, XCircle } from "lucide-react";
import { ReviewActions } from "@/components/admin/review-actions";
import { DeleteLessonButton } from "@/components/instructor/lesson-actions";
import { Alert } from "@/components/ui/alert";
import { Avatar } from "@/components/ui/avatar";
import { buttonVariants } from "@/components/ui/button";
import { PreviewPlayer } from "@/components/lessons/preview-player";
import { ResourceList } from "@/components/lessons/resource-list";
import { StatusBadge } from "@/components/lessons/status-badge";
import { requirePageRole } from "@/lib/auth/requireRole";
import { getLesson } from "@/lib/data/lessons";
import { orNotFound } from "@/lib/data/page";
import { formatDate, formatDuration } from "@/lib/format";

export default async function AdminReviewPage(props: PageProps<"/admin/lessons/[id]">) {
  const { id } = await props.params;
  const { supabase } = await requirePageRole("admin");
  const lesson = await orNotFound(getLesson(supabase, id));

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="min-w-0">
        <Link href="/admin/lessons?status=pending" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Review queue
        </Link>

        <div className="mt-4">
          {lesson.mux_playback_id ? (
            <PreviewPlayer playbackId={lesson.mux_playback_id} />
          ) : (
            <div className="flex aspect-video flex-col items-center justify-center rounded-xl bg-muted text-center">
              <Film className="size-8 text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">No video uploaded.</p>
            </div>
          )}
        </div>

        <h1 className="mt-6 text-2xl font-semibold tracking-tight text-balance">{lesson.title}</h1>
        <div className="mt-3 flex items-center gap-3 text-sm">
          <Avatar name={lesson.instructor?.full_name} src={lesson.instructor?.avatar_url} />
          <div>
            <p className="font-medium">{lesson.instructor?.full_name ?? "Instructor"}</p>
            <p className="text-muted-foreground">
              {[lesson.category?.name ?? "No category", formatDuration(lesson.duration_seconds)].filter(Boolean).join(" · ")}
            </p>
          </div>
        </div>

        <div className="mt-6 rounded-xl bg-muted/50 p-4">
          <p className="text-sm leading-6 whitespace-pre-line">{lesson.description || <span className="text-muted-foreground">No description.</span>}</p>
        </div>

        <section className="mt-8">
          <h2 className="mb-3 text-sm font-semibold">Resources</h2>
          {lesson.resources.length > 0 ? <ResourceList resources={lesson.resources} /> : <p className="text-sm text-muted-foreground">None.</p>}
        </section>
      </div>

      <aside className="space-y-6 lg:pt-9">
        <div className="rounded-xl border bg-card shadow-xs p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Review</h2>
            <StatusBadge status={lesson.status} />
          </div>
          <dl className="mt-4 grid grid-cols-[6.5rem_1fr] gap-y-2 text-sm">
            <dt className="text-muted-foreground">Created</dt>
            <dd>{formatDate(lesson.created_at)}</dd>
            <dt className="text-muted-foreground">Submitted</dt>
            <dd>{formatDate(lesson.submitted_at)}</dd>
            <dt className="text-muted-foreground">Decided</dt>
            <dd>{formatDate(lesson.reviewed_at)}</dd>
            <dt className="text-muted-foreground">Video</dt>
            <dd>{lesson.mux_playback_id ? "Uploaded" : "Missing"}</dd>
          </dl>

          <div className="mt-5 border-t pt-5">
            {lesson.status === "pending" && <ReviewActions lessonId={lesson.id} />}
            {lesson.status === "approved" && (
              <Alert tone="success" icon={CheckCircle2} title="Published">
                <Link href={`/lessons/${lesson.id}`} className="inline-flex items-center gap-1 underline underline-offset-4">
                  Open in catalog <ExternalLink className="size-3" />
                </Link>
              </Alert>
            )}
            {lesson.status === "rejected" && (
              <Alert tone="danger" icon={XCircle} title="Sent back">
                <p className="whitespace-pre-line">{lesson.rejection_reason}</p>
              </Alert>
            )}
            {lesson.status === "draft" && <p className="text-sm text-muted-foreground">The instructor hasn&apos;t submitted this lesson yet.</p>}
          </div>
        </div>

        <div className="rounded-xl border bg-card shadow-xs p-5">
          <h2 className="text-sm font-semibold">Danger zone</h2>
          <p className="mt-1 mb-3 text-xs text-muted-foreground">Removes the lesson, its resources, bookmarks and progress.</p>
          <DeleteLessonButton lessonId={lesson.id} redirectTo="/admin/lessons?status=all" />
        </div>

        <Link href={`/lessons/${lesson.id}`} className={buttonVariants({ variant: "outline", className: "w-full" })}>
          Preview as a student <ExternalLink />
        </Link>
      </aside>
    </div>
  );
}
