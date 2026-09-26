// lib/validators/category.ts

import { z } from "zod";

export const createCategorySchema = z.strictObject({
  name: z.string().trim().min(2, "Name must be at least 2 characters.").max(40),
});

export const setRoleSchema = z.strictObject({
  role: z.enum(["student", "instructor", "admin"]),
});

export function slugify(name: string) {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_-]+/g, "-");
}
