// lib/api/response.ts
// Response shapes from the design doc, Section 7:
//   success -> { data }            list -> { data, meta: { page, per_page, total } }
//   error   -> { error: { code, message } }

import { NextResponse } from "next/server";

const statusFor = {
  VALIDATION_FAILED: 400,
  UNAUTHENTICATED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  ALREADY_BOOKMARKED: 409,
  INVALID_STATE: 409,
  NOT_CONFIGURED: 503,
  SERVER_ERROR: 500,
} as const;

export type ErrorCode = keyof typeof statusFor;

export class ApiError extends Error {
  constructor(
    public code: ErrorCode,
    message: string
  ) {
    super(message);
  }
}

export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ data }, { status });
}

export function created<T>(data: T) {
  return ok(data, 201);
}

export function okList<T>(data: T[], meta: PageMeta) {
  return NextResponse.json({ data, meta });
}

export function fail(code: ErrorCode, message: string) {
  return NextResponse.json({ error: { code, message } }, { status: statusFor[code] });
}

// Wraps a route handler so thrown ApiErrors become the Section 7 error
// shape, and anything unexpected becomes a logged 500.
export function handle<A extends unknown[]>(handler: (...args: A) => Promise<Response>) {
  return async (...args: A): Promise<Response> => {
    try {
      return await handler(...args);
    } catch (error) {
      if (error instanceof ApiError) return fail(error.code, error.message);
      console.error(error);
      return fail("SERVER_ERROR", "Something went wrong. Please try again.");
    }
  };
}

// ── Pagination (?page=&per_page=) ───────────────────────────────────
export interface PageMeta {
  page: number;
  per_page: number;
  total: number;
}

export function parsePage(params: URLSearchParams | Record<string, string | string[] | undefined>, defaultPerPage = 20) {
  const get = (key: string) => {
    const value = params instanceof URLSearchParams ? params.get(key) : params[key];
    return Array.isArray(value) ? value[0] : value ?? null;
  };
  const page = Math.max(1, Number.parseInt(get("page") ?? "", 10) || 1);
  const perPage = Math.min(50, Math.max(1, Number.parseInt(get("per_page") ?? "", 10) || defaultPerPage));
  return { page, perPage, from: (page - 1) * perPage, to: page * perPage - 1 };
}

export async function readJson(request: Request): Promise<unknown> {
  return request.json().catch(() => null);
}
