// lib/data/errors.ts
// Turns Postgres/PostgREST errors into the API's error codes, so a
// database refusal (RLS, the lesson guard trigger) reaches the client as
// a 403/409 with a readable message instead of a 500.

import type { PostgrestError } from "@supabase/supabase-js";
import { ApiError } from "@/lib/api/response";

export function dbError(error: PostgrestError): never {
  switch (error.code) {
    case "42501": // insufficient_privilege — RLS or guard_lesson_update()
      throw new ApiError("FORBIDDEN", error.message || "You don't have access to do that.");
    case "23505": // unique_violation
      throw new ApiError("CONFLICT", "That already exists.");
    case "23503": // foreign_key_violation
      throw new ApiError("VALIDATION_FAILED", "A referenced item doesn't exist.");
    case "P0002": // no_data_found (raised by our functions)
    case "22P02": // invalid_text_representation (bad uuid)
    case "PGRST116": // .single() found no row
      throw new ApiError("NOT_FOUND", "Not found.");
    case "42703": // undefined_column
    case "42883": // undefined_function
    case "PGRST202": // function not in schema cache
    case "PGRST205": // table/view not in schema cache
      console.error("Database schema is behind the app", error);
      throw new ApiError(
        "SERVER_ERROR",
        "The database is missing a migration. Run supabase/migrations/0005_app_functions.sql in the Supabase SQL editor."
      );
    default:
      console.error("Database error", error);
      throw new ApiError("SERVER_ERROR", "Something went wrong. Please try again.");
  }
}

export function notFound(what = "Lesson"): never {
  throw new ApiError("NOT_FOUND", `${what} not found.`);
}
