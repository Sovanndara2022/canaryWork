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
  created_at: string;
}

export interface InstructorSummary {
  id: string;
  full_name: string | null;
  avatar_url?: string | null;
}

// A row as the catalog, dashboards and cards use it.
export interface LessonSummary {
  id: string;
  title: string;
  description: string | null;
  status: LessonStatus;
  thumbnail_url: string | null;
  duration_seconds: number | null;
  view_count: number;
  created_at: string;
  instructor_id: string;
  category: Pick<Category, "id" | "name" | "slug"> | null;
  instructor: InstructorSummary | null;
}

// Full detail, as GET /api/lessons/:id returns it.
export interface LessonDetail extends LessonSummary {
  rejection_reason: string | null;
  mux_playback_id: string | null;
  mux_upload_id: string | null;
  category_id: string | null;
  submitted_at: string | null;
  reviewed_at: string | null;
  updated_at: string;
  resources: LessonResource[];
}

export const EDITABLE_STATUSES: LessonStatus[] = ["draft", "rejected"];
