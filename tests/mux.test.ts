import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { lessonVideoFields, verifyMuxSignature } from "@/lib/mux";

const secret = "whsec_test";
const body = JSON.stringify({ type: "video.asset.ready" });
const sign = (t: number, payload = body) => `t=${t},v1=${createHmac("sha256", secret).update(`${t}.${payload}`).digest("hex")}`;
const now = () => Math.floor(Date.now() / 1000);

describe("verifyMuxSignature", () => {
  it("accepts a correctly signed, fresh request", () => {
    expect(verifyMuxSignature(body, sign(now()), secret)).toBe(true);
  });

  it("rejects a tampered body, wrong secret, missing header, or old timestamp", () => {
    expect(verifyMuxSignature(body + " ", sign(now()), secret)).toBe(false);
    expect(verifyMuxSignature(body, sign(now()), "other")).toBe(false);
    expect(verifyMuxSignature(body, null, secret)).toBe(false);
    expect(verifyMuxSignature(body, sign(now() - 3600), secret)).toBe(false);
    expect(verifyMuxSignature(body, "garbage", secret)).toBe(false);
  });
});

describe("lessonVideoFields", () => {
  it("maps a ready asset onto lesson columns", () => {
    expect(
      lessonVideoFields({ id: "a1", status: "ready", duration: 56.7, playback_ids: [{ id: "pb1", policy: "public" }] })
    ).toEqual({
      mux_asset_id: "a1",
      mux_playback_id: "pb1",
      duration_seconds: 57,
      thumbnail_url: "https://image.mux.com/pb1/thumbnail.webp?width=640&time=2",
    });
  });

  it("returns null without a playback id", () => {
    expect(lessonVideoFields({ id: "a1", status: "ready" })).toBeNull();
  });
});
