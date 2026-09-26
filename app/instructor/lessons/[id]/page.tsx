import Link from "next/link";
import { ArrowLeft, CheckCircle2, Clock, ExternalLink, XCircle } from "lucide-react";
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
import { formatDate } from "@/lib/format";
import { muxConfigured } from "@/lib/mux";
import { adminConfigured } from "@/lib/supabase/admin";
import { EDITABLE_STATUSES } from "@/types/lesson";

export default async function EditLessonPage(props: PageProps<"/instructor/lessons/[id]">) {
  const { id } = await props.params;
  const { supabase, profile } = await requirePageRole("instructor", "admin");
  const [lesson, categories] = await Promise.all([
    orNotFound(getOwnedLesson(supabase, id, profile)),
    listCategories(supabase),
  ]);

  const editable = EDITABLE_STATUSES.includes(lesson.status);
  const isOwner = lesson.instructor_id === profile.id;
  const submitBlocker = !lesson.category_id ? "Choose a category before submitting." : undefined;

  return (
    <div className="max-w-3xl">
      <Link href="/instructor" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Back to Teach
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <StatusBadge status={lesson.status} />
            <span className="text-xs text-muted-foreground">Created {formatDate(lesson.created_at)}</span>
          </div>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-balance">{lesson.title}</h1>
        </div>
        <Link href={`/lessons/${lesson.id}`} className={buttonVariants({ variant: "outline", className: "h-9 px-3" })}>
          {lesson.status === "approved" ? "View lesson" : "Preview"} <ExternalLink />
        </Link>
      </div>

      <div className="mt-6">
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
      </div>

      <section className="mt-10">
        <h2 className="text-base font-semibold">Details</h2>
        <div className="mt-4 rounded-xl border p-5 sm:p-6">
          <LessonForm categories={categories} lesson={lesson} disabled={!editable} />
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-base font-semibold">Video</h2>
        <div className="mt-4">
          <VideoUploader
            lessonId={lesson.id}
            playbackId={lesson.mux_playback_id}
            durationSeconds={lesson.duration_seconds}
            hasPendingUpload={Boolean(lesson.mux_upload_id)}
            editable={editable}
            configured={muxConfigured() && adminConfigured()}
          />
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-base font-semibold">Resources</h2>
        <p className="mt-1 text-sm text-muted-foreground">Slides, links, or notes shown next to the video.</p>
        <div className="mt-4">
          <ResourcesEditor lessonId={lesson.id} resources={lesson.resources} editable={editable} />
        </div>
      </section>

      {editable && (
        <section className="mt-10 flex flex-col-reverse gap-4 border-t pt-6 sm:flex-row sm:items-start sm:justify-between">
          <DeleteLessonButton lessonId={lesson.id} redirectTo="/instructor" />
          {isOwner && (
            <div className="flex flex-col items-start gap-2 sm:items-end">
              {!lesson.mux_playback_id && (
                <p className="text-xs text-muted-foreground">Tip: lessons without a video are usually sent back.</p>
              )}
              <SubmitLessonButton lessonId={lesson.id} disabledReason={submitBlocker} />
            </div>
          )}
        </section>
      )}
    </div>
  );
}
