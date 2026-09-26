// lib/data/dashboards.ts — numbers for the three dashboards (Section 9.6).

import type { Supabase } from "@/lib/auth/getSession";
import { dbError } from "@/lib/data/errors";
import { listHistory } from "@/lib/data/learning";
import type { LessonStatus } from "@/types/lesson";

async function count(request: PromiseLike<{ count: number | null; error: unknown }>) {
  const { count, error } = await request;
  if (error) dbError(error as never);
  return count ?? 0;
}

export async function studentDashboard(supabase: Supabase, userId: string) {
  const head = { count: "exact" as const, head: true };
  const [completed, inProgress, bookmarks, recent] = await Promise.all([
    count(supabase.from("watch_progress").select("id", head).eq("user_id", userId).eq("completed", true)),
    count(supabase.from("watch_progress").select("id", head).eq("user_id", userId).eq("completed", false)),
    count(supabase.from("bookmarks").select("id", head).eq("user_id", userId)),
    listHistory(supabase, userId, { from: 0, to: 5 }),
  ]);
  return {
    completed_count: completed,
    in_progress_count: inProgress,
    bookmarks_count: bookmarks,
    recent_history: recent.rows,
  };
}

export async function instructorDashboard(supabase: Supabase, instructorId: string) {
  const { data, error } = await supabase
    .from("lessons")
    .select("id, title, status, view_count, created_at")
    .eq("instructor_id", instructorId)
    .order("created_at", { ascending: false });
  if (error) dbError(error);

  const lessons = data as { id: string; title: string; status: LessonStatus; view_count: number; created_at: string }[];
  const lessonsByStatus: Record<LessonStatus, number> = { draft: 0, pending: 0, approved: 0, rejected: 0 };
  for (const lesson of lessons) lessonsByStatus[lesson.status] += 1;

  return {
    lessons_by_status: lessonsByStatus,
    total_views: lessons.reduce((sum, lesson) => sum + lesson.view_count, 0),
    recent_lessons: lessons.slice(0, 5).map(({ id, title, status }) => ({ id, title, status })),
  };
}

export async function adminDashboard(supabase: Supabase) {
  const head = { count: "exact" as const, head: true };
  const [pending, users, instructors, lessons, reviewed] = await Promise.all([
    count(supabase.from("lessons").select("id", head).eq("status", "pending")),
    count(supabase.from("users").select("id", head)),
    count(supabase.from("users").select("id", head).eq("role", "instructor")),
    count(supabase.from("lessons").select("id", head)),
    supabase
      .from("lessons")
      .select("submitted_at, reviewed_at")
      .not("reviewed_at", "is", null)
      .not("submitted_at", "is", null)
      .order("reviewed_at", { ascending: false })
      .limit(200),
  ]);
  if (reviewed.error) dbError(reviewed.error);

  const turnarounds = (reviewed.data as { submitted_at: string; reviewed_at: string }[])
    .map((row) => (new Date(row.reviewed_at).getTime() - new Date(row.submitted_at).getTime()) / 3_600_000)
    .filter((hours) => hours >= 0);
  const average = turnarounds.length ? turnarounds.reduce((a, b) => a + b, 0) / turnarounds.length : null;

  return {
    pending_approvals: pending,
    total_users: users,
    total_instructors: instructors,
    total_lessons: lessons,
    avg_approval_turnaround_hours: average === null ? null : Math.round(average * 10) / 10,
  };
}
