// lib/validators/lesson.ts — zod schemas for lesson create/edit and review.

import { z } from "zod";

const title = z.string().trim().min(3, "Title must be at least 3 characters.").max(120, "Title must be 120 characters or fewer.");
const description = z.string().trim().max(2000, "Description must be 2000 characters or fewer.");
const categoryId = z.uuid("Choose a category.");

export const createLessonSchema = z.strictObject({
  title,
  description: description.optional().nullable(),
  category_id: categoryId,
});

export const updateLessonSchema = z
  .strictObject({
    title,
    description: description.nullable(),
    category_id: categoryId,
  })
  .partial()
  .refine((body) => Object.keys(body).length > 0, "Nothing to update.");

export const rejectLessonSchema = z.strictObject({
  reason: z.string().trim().min(5, "Give the instructor a reason (at least 5 characters).").max(1000),
});

export const lessonSortSchema = z.enum(["trending", "newest"]).catch("newest");

export const progressSchema = z.strictObject({
  progress_seconds: z.number().int().min(0).max(24 * 60 * 60),
  completed: z.boolean(),
});

export const uuidSchema = z.uuid();
