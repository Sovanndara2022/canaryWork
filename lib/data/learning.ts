// lib/data/learning.ts
// Bookmarks, watch progress and history — always the signed-in user's
// own rows (RLS: "own bookmarks only", "own progress only").

import { ApiError } from "@/lib/api/response";
import type { Supabase } from "@/lib/auth/getSession";
import { dbError, notFound } from "@/lib/data/errors";
import { attachInstructors } from "@/lib/data/lessons";
import { uuidSchema } from "@/lib/validators/lesson";
import type { LessonSummary } from "@/types/lesson";

const LESSON_EMBED =
  "lesson:lessons(id, title, description, status, thumbnail_url, duration_seconds, view_count, created_at, instructor_id, category:categories(id, name, slug))";

type EmbeddedLesson = Omit<LessonSummary, "instructor">;

async function withLessons<T extends { lesson: EmbeddedLesson | null }>(supabase: Supabase, rows: T[]) {
  // A lesson that was unpublished since comes back null (RLS) — hide it.
  const visible = rows.filter((row): row is T & { lesson: EmbeddedLesson } => row.lesson !== null);
  const lessons = await attachInstructors(supabase, visible.map((row) => row.lesson));
  return visible.map((row, index) => ({ ...row, lesson: lessons[index] as LessonSummary }));
}

// ── Bookmarks ───────────────────────────────────────────────────────
export async function addBookmark(supabase: Supabase, userId: string, lessonId: string) {
  if (!uuidSchema.safeParse(lessonId).success) throw new ApiError("VALIDATION_FAILED", "lesson_id must be a lesson id.");

  const { data: lesson } = await supabase.from("lessons").select("id").eq("id", lessonId).eq("status", "approved").maybeSingle();
  if (!lesson) notFound();

  const { data, error } = await supabase
    .from("bookmarks")
    .insert({ user_id: userId, lesson_id: lessonId })
    .select("id, lesson_id, created_at")
    .single();
  if (error?.code === "23505") throw new ApiError("ALREADY_BOOKMARKED", "You've already saved this lesson.");
  if (error) dbError(error);
  return data as { id: string; lesson_id: string; created_at: string };
}

export async function removeBookmark(supabase: Supabase, bookmarkId: string) {
  if (!uuidSchema.safeParse(bookmarkId).success) notFound("Bookmark");
  const { error, count } = await supabase.from("bookmarks").delete({ count: "exact" }).eq("id", bookmarkId);
  if (error) dbError(error);
  if (!count) notFound("Bookmark");
  return { id: bookmarkId };
}

export async function getBookmarkFor(supabase: Supabase, userId: string, lessonId: string) {
  const { data } = await supabase.from("bookmarks").select("id").eq("user_id", userId).eq("lesson_id", lessonId).maybeSingle();
  return (data?.id as string | undefined) ?? null;
}

export async function listBookmarks(supabase: Supabase, userId: string, range: { from: number; to: number }) {
  const { data, count, error } = await supabase
    .from("bookmarks")
    .select(`id, created_at, ${LESSON_EMBED}`, { count: "exact" })
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .range(range.from, range.to);
  if (error) dbError(error);
  const rows = await withLessons(supabase, data as unknown as { id: string; created_at: string; lesson: EmbeddedLesson | null }[]);
  return { rows, total: count ?? 0 };
}

// ── Progress & history ─────────────────────────────────────────────
export interface Progress {
  lesson_id: string;
  progress_seconds: number;
  completed: boolean;
}

export async function getProgress(supabase: Supabase, userId: string, lessonId: string): Promise<Progress | null> {
  const { data } = await supabase
    .from("watch_progress")
    .select("lesson_id, progress_seconds, completed")
    .eq("user_id", userId)
    .eq("lesson_id", lessonId)
    .maybeSingle();
  return (data as Progress | null) ?? null;
}

export async function saveProgress(
  supabase: Supabase,
  userId: string,
  lessonId: string,
  input: { progress_seconds: number; completed: boolean }
) {
  if (!uuidSchema.safeParse(lessonId).success) notFound();
  const { data: lesson } = await supabase.from("lessons").select("id").eq("id", lessonId).maybeSingle();
  if (!lesson) notFound();

  // Once a lesson is completed it stays completed, even on a rewatch.
  const existing = await getProgress(supabase, userId, lessonId);
  const { data, error } = await supabase
    .from("watch_progress")
    .upsert(
      {
        user_id: userId,
        lesson_id: lessonId,
        progress_seconds: input.progress_seconds,
        completed: input.completed || Boolean(existing?.completed),
        last_watched_at: new Date().toISOString(),
      },
      { onConflict: "user_id,lesson_id" }
    )
    .select("lesson_id, progress_seconds, completed")
    .single();
  if (error) dbError(error);
  return data as Progress;
}

export async function listHistory(supabase: Supabase, userId: string, range: { from: number; to: number }) {
  const { data, count, error } = await supabase
    .from("watch_progress")
    .select(`progress_seconds, completed, last_watched_at, ${LESSON_EMBED}`, { count: "exact" })
    .eq("user_id", userId)
    .order("last_watched_at", { ascending: false })
    .range(range.from, range.to);
  if (error) dbError(error);
  const rows = await withLessons(
    supabase,
    data as unknown as { progress_seconds: number; completed: boolean; last_watched_at: string; lesson: EmbeddedLesson | null }[]
  );
  return { rows, total: count ?? 0 };
}
