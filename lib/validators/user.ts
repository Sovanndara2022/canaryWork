// lib/validators/user.ts
// PATCH /api/users/me body. Strict, so sending "role" or "email" is a 400
// rather than silently ignored (the database would refuse it anyway —
// see 0004_security_fixes.sql).

import { z } from "zod";

export const updateProfileSchema = z
  .strictObject({
    full_name: z.string().trim().min(1, "Name can't be empty.").max(100),
    avatar_url: z.url("Avatar must be a URL.").nullable(),
    bio: z.string().trim().max(500, "Bio must be 500 characters or fewer.").nullable(),
  })
  .partial()
  .refine((body) => Object.keys(body).length > 0, "Nothing to update.");

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
