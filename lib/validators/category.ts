// lib/validators/category.ts

import { z } from "zod";

export const createCategorySchema = z.strictObject({
  name: z.string().trim().min(2, "Name must be at least 2 characters.").max(40),
});

export const roleSchema = z.enum(["student", "instructor", "admin"]);

export const setRoleSchema = z.strictObject({ role: roleSchema });

// PATCH /api/admin/users/:id — change role and/or disable the account.
export const adminUserPatchSchema = z
  .strictObject({ role: roleSchema, disabled: z.boolean() })
  .partial()
  .refine((body) => body.role !== undefined || body.disabled !== undefined, "Send role and/or disabled.");

export function slugify(name: string) {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_-]+/g, "-");
}
