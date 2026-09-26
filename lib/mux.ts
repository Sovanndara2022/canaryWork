// lib/mux.ts
// Mux REST calls and webhook verification (design doc, Sections 10.2 and
// 14). Uses fetch directly rather than the SDK — we only need four calls.

import { createHmac, timingSafeEqual } from "node:crypto";
import { ApiError } from "@/lib/api/response";

const MUX_API = "https://api.mux.com/video/v1";

export function muxConfigured() {
  return Boolean(process.env.MUX_TOKEN_ID && process.env.MUX_TOKEN_SECRET);
}

async function muxFetch<T>(path: string, init?: RequestInit): Promise<T> {
  if (!muxConfigured()) {
    throw new ApiError("NOT_CONFIGURED", "Video uploads aren't set up. Add MUX_TOKEN_ID and MUX_TOKEN_SECRET to .env.local.");
  }
  const auth = Buffer.from(`${process.env.MUX_TOKEN_ID}:${process.env.MUX_TOKEN_SECRET}`).toString("base64");
  const response = await fetch(`${MUX_API}${path}`, {
    ...init,
    headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json", ...init?.headers },
    cache: "no-store",
  });
  if (!response.ok) {
    console.error("Mux API error", response.status, await response.text());
    throw new ApiError("SERVER_ERROR", "The video service returned an error.");
  }
  const body = (await response.json()) as { data: T };
  return body.data;
}

export interface MuxUpload {
  id: string;
  url: string;
  status: "waiting" | "asset_created" | "errored" | "cancelled" | "timed_out";
  asset_id?: string;
}

export interface MuxAsset {
  id: string;
  status: "preparing" | "ready" | "errored";
  duration?: number;
  passthrough?: string;
  playback_ids?: { id: string; policy: string }[];
}

// The lesson id travels as `passthrough`, so the webhook knows which
// lesson the finished asset belongs to.
export function createDirectUpload(lessonId: string, corsOrigin: string) {
  return muxFetch<MuxUpload>("/uploads", {
    method: "POST",
    body: JSON.stringify({
      cors_origin: corsOrigin,
      new_asset_settings: { playback_policy: ["public"], passthrough: lessonId },
    }),
  });
}

export const getUpload = (id: string) => muxFetch<MuxUpload>(`/uploads/${id}`);
export const getAsset = (id: string) => muxFetch<MuxAsset>(`/assets/${id}`);

export function thumbnailUrl(playbackId: string) {
  return `https://image.mux.com/${playbackId}/thumbnail.webp?width=640&time=2`;
}

// Fields to write onto a lesson once its asset is ready.
export function lessonVideoFields(asset: MuxAsset) {
  const playbackId = asset.playback_ids?.find((p) => p.policy === "public")?.id ?? asset.playback_ids?.[0]?.id;
  if (!playbackId) return null;
  return {
    mux_asset_id: asset.id,
    mux_playback_id: playbackId,
    duration_seconds: asset.duration ? Math.round(asset.duration) : null,
    thumbnail_url: thumbnailUrl(playbackId),
  };
}

// Mux-Signature: "t=<unix seconds>,v1=<hex hmac-sha256 of `${t}.${body}`>"
export function verifyMuxSignature(rawBody: string, header: string | null, secret: string, toleranceSeconds = 300) {
  if (!header) return false;
  const parts = Object.fromEntries(header.split(",").map((part) => part.split("=") as [string, string]));
  const timestamp = Number(parts.t);
  if (!parts.v1 || !Number.isFinite(timestamp)) return false;
  if (Math.abs(Date.now() / 1000 - timestamp) > toleranceSeconds) return false;

  const expected = createHmac("sha256", secret).update(`${parts.t}.${rawBody}`).digest("hex");
  const a = Buffer.from(expected, "hex");
  const b = Buffer.from(parts.v1, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}
