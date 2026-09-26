// lib/data/page.ts — helpers for Server Components that call lib/data.

import { notFound } from "next/navigation";
import { ApiError } from "@/lib/api/response";

// A NOT_FOUND ApiError (missing, or hidden by RLS) renders the 404 page.
export async function orNotFound<T>(promise: Promise<T>): Promise<T> {
  try {
    return await promise;
  } catch (error) {
    if (error instanceof ApiError && (error.code === "NOT_FOUND" || error.code === "FORBIDDEN")) notFound();
    throw error;
  }
}
