// types/lesson.ts
// Mirrors the `lessons` / `categories` / `lesson_resources` tables.

export type LessonStatus = "draft" | "pending" | "approved" | "rejected";
export type ResourceType = "link" | "slide" | "note";

export interface Category {
  id: string;
  name: string;
  slug: string;
}

export interface LessonResource {
  id: string;
  lesson_id: string;
  type: ResourceType;
  title: string;
  url_or_content: string;
}

export interface Lesson {
  id: string;
  title: string;
  description: string | null;
  status: LessonStatus;
  rejection_reason: string | null;
  mux_playback_id: string | null;
  thumbnail_url: string | null;
  duration_seconds: number | null;
  view_count: number;
  category: Category | null;
  instructor: { id: string; full_name: string | null };
  resources?: LessonResource[];
  created_at: string;
}
