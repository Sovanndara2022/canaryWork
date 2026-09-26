// types/user.ts
// Mirrors the `users` table in supabase/migrations/0001_init.sql.

export type UserRole = "student" | "instructor" | "admin";

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  bio: string | null;
}
