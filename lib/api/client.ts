// lib/api/client.ts — browser-side calls to our own API routes.
// Unwraps { data } and turns { error: { message } } into a thrown Error.

export class ApiRequestError extends Error {
  constructor(
    message: string,
    public code: string,
    public status: number
  ) {
    super(message);
  }
}

export async function api<T = unknown>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  const response = await fetch(path, {
    method: init.method ?? (init.body === undefined ? "GET" : "POST"),
    headers: init.body === undefined ? undefined : { "Content-Type": "application/json" },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new ApiRequestError(
      payload?.error?.message ?? "Something went wrong. Please try again.",
      payload?.error?.code ?? "SERVER_ERROR",
      response.status
    );
  }
  return payload?.data as T;
}

export function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong. Please try again.";
}
