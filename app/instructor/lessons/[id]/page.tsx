import Link from "next/link";
import { ArrowLeft, Check, CheckCircle2, Circle, Clock, ExternalLink, XCircle } from "lucide-react";
import { cn } from "cn";
import { Alert } from "@/components/ui/alert";
import { buttonVariants } from "@/components/ui/button";
import { DeleteLessonButton, SubmitLessonButton } from "@/components/instructor/lesson-actions";
import { LessonForm } from "@/components/instructor/lesson-form";
import { ResourcesEditor } from "@/components/instructor/resources-editor";
import { VideoUploader } from "@/components/instructor/video-uploader";
import { StatusBadge } from "@/components/lessons/status-badge";
import { requirePageRole } from "@/lib/auth/requireRole";
import { listCategories } from "@/lib/data/admin";
import { getOwnedLesson } from "@/lib/data/lessons";
import { orNotFound } from "@/lib/data/page";
import { formatDate, formatDuration } from "@/lib/format";
import { muxConfigured } from "@/lib/mux";
import { adminConfigured } from "@/lib/supabase/admin";
import { EDITABLE_STATUSES } from "@/types/lesson";

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-base font-semibold">{title}</h2>
      {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function ChecklistItem({ done, optional, children }: { done: boolean; optional?: boolean; children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-2.5 text-sm">
      {done ? (
        <span className="flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Check className="size-3" strokeWidth={3} />
        </span>
      ) : (
        <Circle className="size-5 text-muted-foreground/50" />
      )}
      <span className={cn(!done && "text-muted-foreground")}>{children}</span>
      {optional && <span className="ml-auto text-xs text-muted-foreground">Optional</span>}
    </li>
  );
}

export default async function EditLessonPage(props: PageProps<"/instructor/lessons/[id]">) {
  const { id } = await props.params;
  const { supabase, profile } = await requirePageRole("instructor", "admin");
  const [lesson, categories] = await Promise.all([
    orNotFound(getOwnedLesson(supabase, id, profile)),
    listCategories(supabase),
  ]);

  const editable = EDITABLE_STATUSES.includes(lesson.status);
  const isOwner = lesson.instructor_id === profile.id;
  const hasVideo = Boolean(lesson.mux_playback_id);
  const submitBlocker = !lesson.category_id ? "Choose a category before submitting." : undefined;

  return (
    <>
      <Link href="/instructor" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Back to Teach
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <StatusBadge status={lesson.status} />
            <span className="text-xs text-muted-foreground">Created {formatDate(lesson.created_at)}</span>
          </div>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-balance sm:text-3xl">{lesson.title}</h1>
        </div>
        <Link href={`/lessons/${lesson.id}`} className={buttonVariants({ variant: "outline", className: "h-9 px-3" })}>
          {lesson.status === "approved" ? "View lesson" : "Preview"} <ExternalLink />
        </Link>
      </div>

      <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0 space-y-10">
          {lesson.status === "rejected" && (
            <Alert tone="danger" icon={XCircle} title="Changes requested">
              <p className="whitespace-pre-line">{lesson.rejection_reason ?? "An admin sent this lesson back."}</p>
              <p className="mt-2">Update the lesson below, then submit it again.</p>
            </Alert>
          )}
          {lesson.status === "pending" && (
            <Alert icon={Clock} title="Waiting for review">
              Submitted {formatDate(lesson.submitted_at)}. Editing is locked until an admin approves or returns it.
            </Alert>
          )}
          {lesson.status === "approved" && (
            <Alert tone="success" icon={CheckCircle2} title="Published">
              This lesson is live in the catalog. Published lessons can&apos;t be edited.
            </Alert>
          )}

          <Section title="Details">
            <div className="rounded-xl border bg-card p-5 shadow-xs sm:p-6">
              <LessonForm categories={categories} lesson={lesson} disabled={!editable} />
            </div>
          </Section>

          <Section title="Video" description="Short is good — most lessons are 5 to 15 minutes.">
            <VideoUploader
              lessonId={lesson.id}
              playbackId={lesson.mux_playback_id}
              durationSeconds={lesson.duration_seconds}
              hasPendingUpload={Boolean(lesson.mux_upload_id) && !hasVideo}
              editable={editable}
              configured={muxConfigured() && adminConfigured()}
            />
          </Section>

          <Section title="Resources" description="Slides, links, or notes shown next to the video.">
            <ResourcesEditor lessonId={lesson.id} resources={lesson.resources} editable={editable} />
          </Section>
        </div>

        <aside className="h-fit space-y-4 lg:sticky lg:top-20">
          <div className="rounded-xl border bg-card p-5 shadow-xs">
            <h2 className="text-sm font-semibold">{editable ? "Ready to submit?" : "Lesson status"}</h2>
            <ul className="mt-4 space-y-3">
              <ChecklistItem done={Boolean(lesson.title && lesson.category_id)}>Title &amp; category</ChecklistItem>
              <ChecklistItem done={hasVideo}>
                Video{hasVideo && lesson.duration_seconds ? ` · ${formatDuration(lesson.duration_seconds)}` : ""}
              </ChecklistItem>
              <ChecklistItem done={lesson.resources.length > 0} optional>
                Resources{lesson.resources.length ? ` · ${lesson.resources.length}` : ""}
              </ChecklistItem>
              <ChecklistItem done={lesson.status !== "draft" && lesson.status !== "rejected"}>Submitted for review</ChecklistItem>
              <ChecklistItem done={lesson.status === "approved"}>Published</ChecklistItem>
            </ul>

            {editable && isOwner && (
              <div className="mt-5 border-t pt-5">
                <SubmitLessonButton lessonId={lesson.id} disabledReason={submitBlocker} />
                {!hasVideo && !submitBlocker && (
                  <p className="mt-2 text-xs text-muted-foreground">Lessons without a video are usually sent back.</p>
                )}
              </div>
            )}
          </div>

          {editable && (
            <div className="rounded-xl border bg-card p-5 shadow-xs">
              <h2 className="text-sm font-semibold">Danger zone</h2>
              <p className="mt-1 mb-3 text-xs text-muted-foreground">Deleting removes the lesson, its video link and resources.</p>
              <DeleteLessonButton lessonId={lesson.id} redirectTo="/instructor" />
            </div>
          )}
        </aside>
      </div>
    </>
  );
}
