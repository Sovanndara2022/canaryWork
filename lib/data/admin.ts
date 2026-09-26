// lib/data/admin.ts
// Review queue, approve/reject, user management, categories.
// Callers must already have checked role === "admin"; RLS (is_admin())
// enforces it again in the database.

import { ApiError } from "@/lib/api/response";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Supabase } from "@/lib/auth/getSession";
import { dbError, notFound } from "@/lib/data/errors";
import { attachInstructors, getLesson, SUMMARY_COLUMNS } from "@/lib/data/lessons";
import { slugify } from "@/lib/validators/category";
import type { Category, LessonStatus, LessonSummary } from "@/types/lesson";
import type { UserRole } from "@/types/user";

// ── Lessons by status (pending = review queue, oldest first) ────────
export async function listLessonsForReview(
  supabase: Supabase,
  status: LessonStatus | "all",
  range: { from: number; to: number }
) {
  let request = supabase
    .from("lessons")
    .select(`${SUMMARY_COLUMNS}, submitted_at`, { count: "exact" });

  if (status !== "all") request = request.eq("status", status);
  request =
    status === "pending"
      ? request.order("submitted_at", { ascending: true, nullsFirst: false })
      : request.order("created_at", { ascending: false });

  const { data, count, error } = await request.range(range.from, range.to);
  if (error) dbError(error);

  const rows = await attachInstructors(
    supabase,
    data as unknown as (Omit<LessonSummary, "instructor"> & { submitted_at: string | null })[]
  );
  return { rows, total: count ?? 0 };
}

async function review(
  supabase: Supabase,
  id: string,
  adminId: string,
  patch: { status: "approved" | "rejected"; rejection_reason: string | null }
) {
  const lesson = await getLesson(supabase, id);
  if (lesson.status !== "pending") {
    throw new ApiError("INVALID_STATE", `Only lessons waiting for review can be ${patch.status}.`);
  }
  const { data, error } = await supabase
    .from("lessons")
    .update({ ...patch, reviewed_by: adminId, reviewed_at: new Date().toISOString() })
    .eq("id", id)
    .select("id, status, rejection_reason, reviewed_at")
    .single();
  if (error) dbError(error);
  return data;
}

export const approveLesson = (supabase: Supabase, id: string, adminId: string) =>
  review(supabase, id, adminId, { status: "approved", rejection_reason: null });

export const rejectLesson = (supabase: Supabase, id: string, adminId: string, reason: string) =>
  review(supabase, id, adminId, { status: "rejected", rejection_reason: reason });

// ── Users ───────────────────────────────────────────────────────────
export interface AdminUserRow {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  created_at: string;
}

export async function listUsers(
  supabase: Supabase,
  filters: { q?: string | null; role?: UserRole | null },
  range: { from: number; to: number }
) {
  let request = supabase
    .from("users")
    .select("id, email, full_name, role, created_at", { count: "exact" })
    .order("created_at", { ascending: false });

  if (filters.role) request = request.eq("role", filters.role);
  // Characters that would break PostgREST's or() syntax are dropped.
  const q = filters.q?.replace(/[,()*%\\]/g, " ").trim();
  if (q) request = request.or(`full_name.ilike.*${q}*,email.ilike.*${q}*`);

  const { data, count, error } = await request.range(range.from, range.to);
  if (error) dbError(error);
  return { rows: data as AdminUserRow[], total: count ?? 0 };
}

export async function setUserRole(supabase: Supabase, userId: string, role: UserRole) {
  const { error } = await supabase.rpc("admin_set_user_role", { p_user_id: userId, p_role: role });
  if (error) dbError(error);
  return { id: userId, role };
}

// Disabling bans the account in Supabase Auth: the user can't sign in or
// refresh their session, but their data stays. Needs the service-role key.
const FOREVER = "876000h"; // ~100 years

export async function setUserDisabled(userId: string, disabled: boolean, actingAdminId: string) {
  if (userId === actingAdminId) throw new ApiError("FORBIDDEN", "You can't disable your own account.");
  const { error } = await createAdminClient().auth.admin.updateUserById(userId, {
    ban_duration: disabled ? FOREVER : "none",
  });
  if (error?.status === 404) throw new ApiError("NOT_FOUND", "User not found.");
  if (error) throw new ApiError("SERVER_ERROR", "Couldn't update the account.");
  return { id: userId, disabled };
}

// Which of these users are currently disabled (banned in Supabase Auth).
export async function disabledUserIds(userIds: string[]): Promise<Set<string>> {
  const admin = createAdminClient();
  const results = await Promise.all(userIds.map((id) => admin.auth.admin.getUserById(id)));
  const now = Date.now();
  return new Set(
    results
      .map((result) => result.data.user)
      .filter((user) => user?.banned_until && new Date(user.banned_until).getTime() > now)
      .map((user) => user!.id)
  );
}

// ── Categories ──────────────────────────────────────────────────────
export async function listCategories(supabase: Supabase) {
  const { data, error } = await supabase.from("categories").select("id, name, slug").order("name");
  if (error) dbError(error);
  return data as Category[];
}

export async function createCategory(supabase: Supabase, name: string) {
  const slug = slugify(name);
  if (!slug) throw new ApiError("VALIDATION_FAILED", "Use letters or numbers in the name.");
  const { data, error } = await supabase.from("categories").insert({ name, slug }).select("id, name, slug").single();
  if (error?.code === "23505") throw new ApiError("CONFLICT", "A category with that name already exists.");
  if (error) dbError(error);
  return data as Category;
}

// ── Views: POST /api/lessons/:id/view ───────────────────────────────
export async function logView(supabase: Supabase, lessonId: string) {
  const { data, error } = await supabase.rpc("log_lesson_view", { p_lesson_id: lessonId });
  if (error) dbError(error);
  if (data === null) notFound();
  return { lesson_id: lessonId, view_count: data as number };
}
