import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/response";

const getSession = vi.fn();
vi.mock("@/lib/auth/getSession", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/auth/getSession")>()),
  getSession: () => getSession(),
}));

const { requireRole } = await import("@/lib/auth/requireRole");

const sessionAs = (role: "student" | "instructor" | "admin") => ({
  supabase: {},
  user: { id: "u1" },
  profile: { id: "u1", email: "a@b.c", full_name: "A", avatar_url: null, bio: null, role },
});

describe("requireRole", () => {
  beforeEach(() => getSession.mockReset());

  it("throws 401 when signed out", async () => {
    getSession.mockResolvedValue(null);
    await expect(requireRole()).rejects.toMatchObject({ code: "UNAUTHENTICATED" });
  });

  it("throws 403 for the wrong role", async () => {
    getSession.mockResolvedValue(sessionAs("student"));
    const error = await requireRole("admin").catch((e) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect(error.code).toBe("FORBIDDEN");
  });

  it("returns the session for an allowed role", async () => {
    getSession.mockResolvedValue(sessionAs("instructor"));
    await expect(requireRole("instructor", "admin")).resolves.toMatchObject({ profile: { role: "instructor" } });
  });

  it("allows any signed-in user when no roles are given", async () => {
    getSession.mockResolvedValue(sessionAs("student"));
    await expect(requireRole()).resolves.toBeTruthy();
  });
});
