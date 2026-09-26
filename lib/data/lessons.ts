// lib/data/lessons.ts
// Lesson reads and instructor-side writes. Every function takes the
// request's Supabase client, so RLS applies to whoever is signed in.

import { ApiError } from "@/lib/api/response";
import type { Supabase } from "@/lib/auth/getSession";
import { dbError, notFound } from "@/lib/data/errors";
import { uuidSchema } from "@/lib/validators/lesson";
import type { Profile } from "@/types/user";
import {
  EDITABLE_STATUSES,
  type InstructorSummary,
  type LessonDetail,
  type LessonResource,
  type LessonStatus,
  type LessonSummary,
} from "@/types/lesson";

export const SUMMARY_COLUMNS =
  "id, title, description, status, thumbnail_url, duration_seconds, view_count, created_at, instructor_id, category:categories(id, name, slug)";

type SummaryRow = Omit<LessonSummary, "instructor">;

function assertUuid(id: string) {
  if (!uuidSchema.safeParse(id).success) notFound();
}

// Instructor names come from the public_profiles view (0005), since the
// users table only exposes your own row.
export async function attachInstructors<T extends { instructor_id: string }>(
  supabase: Supabase,
  rows: T[]
): Promise<(T & { instructor: InstructorSummary | null })[]> {
  const ids = [...new Set(rows.map((row) => row.instructor_id))];
  if (ids.length === 0) return rows.map((row) => ({ ...row, instructor: null }));

  const { data, error } = await supabase.from("public_profiles").select("id, full_name, avatar_url").in("id", ids);
  if (error?.code === "PGRST205" || error?.code === "42P01") {
    console.warn("public_profiles view is missing — run supabase/migrations/0005_app_functions.sql");
    return rows.map((row) => ({ ...row, instructor: null }));
  }
  if (error) dbError(error);

  const byId = new Map((data as InstructorSummary[]).map((profile) => [profile.id, profile]));
  return rows.map((row) => ({ ...row, instructor: byId.get(row.instructor_id) ?? null }));
}

// ── Public catalog: GET /api/lessons ────────────────────────────────
export interface CatalogQuery {
  sort: "trending" | "newest";
  category?: string | null; // slug
  q?: string | null;
  from: number;
  to: number;
}

export async function listCatalog(supabase: Supabase, query: CatalogQuery) {
  let categoryId: string | null = null;
  if (query.category) {
    const { data } = await supabase.from("categories").select("id").eq("slug", query.category).maybeSingle();
    if (!data) return { rows: [] as LessonSummary[], total: 0 };
    categoryId = data.id;
  }

  let request = supabase
    .from("lessons")
    .select(SUMMARY_COLUMNS, { count: "exact" })
    .eq("status", "approved");

  if (categoryId) request = request.eq("category_id", categoryId);
  if (query.q) request = request.ilike("title", `%${query.q.replace(/[%_\\]/g, "\\$&")}%`);

  request =
    query.sort === "trending"
      ? request.order("view_count", { ascending: false }).order("created_at", { ascending: false })
      : request.order("created_at", { ascending: false });

  const { data, count, error } = await request.range(query.from, query.to);
  if (error) dbError(error);

  const rows = await attachInstructors(supabase, data as unknown as SummaryRow[]);
  return { rows, total: count ?? 0 };
}

// ── Detail: GET /api/lessons/:id (RLS decides who can see it) ───────
export async function getLesson(supabase: Supabase, id: string): Promise<LessonDetail> {
  assertUuid(id);
  const { data, error } = await supabase
    .from("lessons")
    .select(
      `${SUMMARY_COLUMNS}, rejection_reason, mux_playback_id, mux_upload_id, category_id, submitted_at, reviewed_at, updated_at,
       resources:lesson_resources(id, lesson_id, type, title, url_or_content, created_at)`
    )
    .eq("id", id)
    .maybeSingle();
  if (error) dbError(error);
  if (!data) notFound();

  const [lesson] = await attachInstructors(supabase, [data as unknown as Omit<LessonDetail, "instructor">]);
  lesson.resources = [...(lesson.resources ?? [])].sort((a, b) => a.created_at.localeCompare(b.created_at));
  return lesson;
}

// ── Instructor: own lessons ─────────────────────────────────────────
export async function listMyLessons(
  supabase: Supabase,
  instructorId: string,
  range: { from: number; to: number },
  status?: LessonStatus
) {
  let request = supabase
    .from("lessons")
    .select(SUMMARY_COLUMNS, { count: "exact" })
    .eq("instructor_id", instructorId)
    .order("created_at", { ascending: false });
  if (status) request = request.eq("status", status);

  const { data, count, error } = await request.range(range.from, range.to);
  if (error) dbError(error);
  const rows = (data as unknown as SummaryRow[]).map((row) => ({ ...row, instructor: null }));
  return { rows: rows as LessonSummary[], total: count ?? 0 };
}

export async function createLesson(
  supabase: Supabase,
  instructorId: string,
  input: { title: string; description?: string | null; category_id: string }
) {
  const { data, error } = await supabase
    .from("lessons")
    .insert({ ...input, description: input.description || null, instructor_id: instructorId })
    .select("id, title, status, created_at")
    .single();
  if (error) dbError(error);
  return data as { id: string; title: string; status: LessonStatus; created_at: string };
}

// Loads a lesson the caller owns (admins pass too) and, optionally,
// insists it's still editable (draft or rejected).
export async function getOwnedLesson(supabase: Supabase, id: string, profile: Profile, { editable = false } = {}) {
  const lesson = await getLesson(supabase, id);
  if (lesson.instructor_id !== profile.id && profile.role !== "admin") {
    throw new ApiError("FORBIDDEN", "You can only manage your own lessons.");
  }
  if (editable && !EDITABLE_STATUSES.includes(lesson.status)) {
    throw new ApiError(
      "INVALID_STATE",
      lesson.status === "pending"
        ? "This lesson is waiting for review and can't be edited right now."
        : "Published lessons can't be edited."
    );
  }
  return lesson;
}

export async function updateLesson(
  supabase: Supabase,
  id: string,
  profile: Profile,
  input: { title?: string; description?: string | null; category_id?: string }
) {
  await getOwnedLesson(supabase, id, profile, { editable: true });
  const patch = { ...input, ...(input.description !== undefined && { description: input.description || null }) };
  const { data, error } = await supabase
    .from("lessons")
    .update(patch)
    .eq("id", id)
    .select("id, title, description, category_id, status, updated_at")
    .single();
  if (error) dbError(error);
  return data;
}

export async function deleteLesson(supabase: Supabase, id: string, profile: Profile) {
  const lesson = await getOwnedLesson(supabase, id, profile, { editable: profile.role !== "admin" });
  const { error, count } = await supabase.from("lessons").delete({ count: "exact" }).eq("id", lesson.id);
  if (error) dbError(error);
  if (!count) throw new ApiError("FORBIDDEN", "This lesson can't be deleted.");
  return { id: lesson.id };
}

// draft/rejected -> pending (design doc, Section 10.1)
export async function submitLesson(supabase: Supabase, id: string, profile: Profile) {
  const lesson = await getOwnedLesson(supabase, id, profile, { editable: true });
  if (lesson.instructor_id !== profile.id) {
    throw new ApiError("FORBIDDEN", "Only the lesson's instructor can submit it.");
  }
  if (!lesson.category_id) {
    throw new ApiError("VALIDATION_FAILED", "Choose a category before submitting.");
  }
  const { data, error } = await supabase
    .from("lessons")
    .update({ status: "pending", submitted_at: new Date().toISOString(), rejection_reason: null })
    .eq("id", id)
    .select("id, status, submitted_at")
    .single();
  if (error) dbError(error);
  return data;
}

// ── Resources ───────────────────────────────────────────────────────
export async function addResource(
  supabase: Supabase,
  lessonId: string,
  profile: Profile,
  input: Pick<LessonResource, "type" | "title" | "url_or_content">
) {
  await getOwnedLesson(supabase, lessonId, profile, { editable: true });
  const { data, error } = await supabase
    .from("lesson_resources")
    .insert({ ...input, lesson_id: lessonId })
    .select("id, lesson_id, type, title, url_or_content, created_at")
    .single();
  if (error) dbError(error);
  return data as LessonResource;
}

export async function deleteResource(supabase: Supabase, lessonId: string, resourceId: string, profile: Profile) {
  assertUuid(resourceId);
  await getOwnedLesson(supabase, lessonId, profile, { editable: true });
  const { error, count } = await supabase
    .from("lesson_resources")
    .delete({ count: "exact" })
    .eq("id", resourceId)
    .eq("lesson_id", lessonId);
  if (error) dbError(error);
  if (!count) notFound("Resource");
  return { id: resourceId };
}
