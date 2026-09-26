// lib/api/response.ts
// Response shapes from the design doc, Section 7:
//   success -> { data }
//   error   -> { error: { code, message } }

import { NextResponse } from "next/server";

export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ data }, { status });
}

export type ErrorCode =
  | "VALIDATION_FAILED"
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "SERVER_ERROR";

const statusFor: Record<ErrorCode, number> = {
  VALIDATION_FAILED: 400,
  UNAUTHENTICATED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  SERVER_ERROR: 500,
};

export function fail(code: ErrorCode, message: string) {
  return NextResponse.json({ error: { code, message } }, { status: statusFor[code] });
}
