import { describe, expect, it } from "vitest";
import { adminUserPatchSchema, createCategorySchema, slugify } from "@/lib/validators/category";
import { createLessonSchema, progressSchema, rejectLessonSchema, updateLessonSchema } from "@/lib/validators/lesson";
import { createResourceSchema } from "@/lib/validators/resource";
import { updateProfileSchema } from "@/lib/validators/user";

const categoryId = "5f3e0c2a-1b2c-4d5e-8f90-123456789abc";

describe("lesson validators", () => {
  it("accepts a valid new lesson", () => {
    expect(createLessonSchema.safeParse({ title: "Intro to SQL Joins", category_id: categoryId }).success).toBe(true);
  });

  it("rejects short titles, bad category ids and unknown fields", () => {
    expect(createLessonSchema.safeParse({ title: "ab", category_id: categoryId }).success).toBe(false);
    expect(createLessonSchema.safeParse({ title: "Valid title", category_id: "nope" }).success).toBe(false);
    // status can never be set by the client
    expect(createLessonSchema.safeParse({ title: "Valid title", category_id: categoryId, status: "approved" }).success).toBe(false);
  });

  it("requires at least one field on update", () => {
    expect(updateLessonSchema.safeParse({}).success).toBe(false);
    expect(updateLessonSchema.safeParse({ description: null }).success).toBe(true);
  });

  it("requires a real rejection reason", () => {
    expect(rejectLessonSchema.safeParse({ reason: "no" }).success).toBe(false);
    expect(rejectLessonSchema.safeParse({ reason: "Audio is too quiet — please re-record." }).success).toBe(true);
  });

  it("validates progress", () => {
    expect(progressSchema.safeParse({ progress_seconds: 210, completed: false }).success).toBe(true);
    expect(progressSchema.safeParse({ progress_seconds: -1, completed: false }).success).toBe(false);
    expect(progressSchema.safeParse({ progress_seconds: 1.5, completed: false }).success).toBe(false);
  });
});

describe("resource validator", () => {
  it("accepts http(s) links and slides", () => {
    expect(createResourceSchema.safeParse({ type: "slide", title: "Deck", url_or_content: "https://x.com/deck.pdf" }).success).toBe(true);
  });

  it("rejects javascript: and other non-http URLs (stored XSS)", () => {
    for (const url of ["javascript:alert(1)", "data:text/html,hi", "ftp://x.com/file"]) {
      expect(createResourceSchema.safeParse({ type: "link", title: "Bad", url_or_content: url }).success).toBe(false);
    }
  });

  it("allows free text for notes", () => {
    expect(createResourceSchema.safeParse({ type: "note", title: "Takeaways", url_or_content: "Joins combine rows." }).success).toBe(true);
  });
});

describe("profile validator", () => {
  it("refuses role and email changes", () => {
    expect(updateProfileSchema.safeParse({ role: "admin" }).success).toBe(false);
    expect(updateProfileSchema.safeParse({ email: "x@y.com" }).success).toBe(false);
  });

  it("accepts profile fields", () => {
    expect(updateProfileSchema.safeParse({ full_name: "Jane Lee", bio: null }).success).toBe(true);
    expect(updateProfileSchema.safeParse({ avatar_url: "javascript:alert(1)" }).success).toBe(false);
  });
});

describe("admin validators", () => {
  it("needs a role or disabled flag", () => {
    expect(adminUserPatchSchema.safeParse({}).success).toBe(false);
    expect(adminUserPatchSchema.safeParse({ role: "instructor" }).success).toBe(true);
    expect(adminUserPatchSchema.safeParse({ disabled: true }).success).toBe(true);
    expect(adminUserPatchSchema.safeParse({ role: "owner" }).success).toBe(false);
  });

  it("slugifies category names", () => {
    expect(slugify("Data Science & AI")).toBe("data-science-ai");
    expect(createCategorySchema.safeParse({ name: "A" }).success).toBe(false);
  });
});
