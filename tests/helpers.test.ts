import { describe, expect, it } from "vitest";
import { parsePage } from "@/lib/api/response";
import { formatDuration, formatViews, initials } from "@/lib/format";

describe("parsePage", () => {
  it("defaults and clamps", () => {
    expect(parsePage(new URLSearchParams())).toEqual({ page: 1, perPage: 20, from: 0, to: 19 });
    expect(parsePage(new URLSearchParams("page=3&per_page=10"))).toMatchObject({ page: 3, from: 20, to: 29 });
    expect(parsePage(new URLSearchParams("page=-2&per_page=500"))).toMatchObject({ page: 1, perPage: 50 });
    expect(parsePage({ page: "abc" })).toMatchObject({ page: 1 });
  });
});

describe("format helpers", () => {
  it("formats durations", () => {
    expect(formatDuration(57)).toBe("0:57");
    expect(formatDuration(3725)).toBe("1:02:05");
    expect(formatDuration(null)).toBeNull();
  });

  it("formats views and initials", () => {
    expect(formatViews(1)).toBe("1 view");
    expect(formatViews(2450)).toBe("2.5K views");
    expect(initials("Sovandara Phallim")).toBe("SP");
    expect(initials(null)).toBe("?");
  });
});
