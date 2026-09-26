// scripts/e2e.mjs — end-to-end check of the full Lightning Lessons flow against the real
// Supabase project + running dev server. Creates 3 temporary users and
// deletes them (and everything they created) at the end.
// Run from the project root with the dev server up: npm run test:e2e
// Needs SUPABASE_SERVICE_ROLE_KEY in .env.local (used to create/delete the test users).
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";

const PROJECT = process.cwd();
const require = createRequire(`${PROJECT}/package.json`);
const { createClient } = require("@supabase/supabase-js");
const { createServerClient } = require("@supabase/ssr");

const env = Object.fromEntries(
  readFileSync(`${PROJECT}/.env.local`, "utf8")
    .split("\n")
    .filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1)])
);
const URL_ = env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const APP = "http://localhost:3000";
const service = createClient(URL_, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

let passed = 0;
let failed = 0;
function check(name, condition, detail) {
  if (condition) {
    passed++;
    console.log(`  ✓ ${name}`);
  } else {
    failed++;
    console.log(`  ✗ ${name}${detail !== undefined ? `  →  ${typeof detail === "string" ? detail : JSON.stringify(detail).slice(0, 300)}` : ""}`);
  }
}

const stamp = Date.now();
const password = `E2e-${stamp}-pw!`;
const users = {};

async function makeUser(key, name) {
  const email = `ll-e2e-${key}-${stamp}@example.com`;
  const { data, error } = await service.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: name },
  });
  if (error) throw error;
  users[key] = { id: data.user.id, email, name };
}

async function signIn(key) {
  const jar = new Map();
  const client = createServerClient(URL_, ANON, {
    cookies: {
      getAll: () => [...jar].map(([name, value]) => ({ name, value })),
      setAll: (list) => list.forEach(({ name, value }) => (value ? jar.set(name, value) : jar.delete(name))),
    },
  });
  const { data, error } = await client.auth.signInWithPassword({ email: users[key].email, password });
  if (error) return { error };
  users[key].cookie = [...jar].map(([n, v]) => `${n}=${v}`).join("; ");
  // A plain supabase-js client acting as this user, for direct-to-database attacks.
  users[key].db = createClient(URL_, ANON, {
    auth: { persistSession: false },
    global: { headers: { Authorization: `Bearer ${data.session.access_token}` } },
  });
  return { error: null };
}

async function call(who, method, path, body) {
  const res = await fetch(APP + path, {
    method,
    redirect: "manual",
    headers: {
      ...(who ? { Cookie: users[who].cookie } : {}),
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  let json = null;
  const text = await res.text();
  try {
    json = JSON.parse(text);
  } catch {}
  return { status: res.status, json, text, location: res.headers.get("location") };
}

let lessonId;
try {
  console.log("Setup");
  await makeUser("admin", "E2E Admin");
  await makeUser("teacher", "E2E Teacher");
  await makeUser("student", "E2E Student");
  const { data: rows } = await service.from("users").select("id, role").in("id", Object.values(users).map((u) => u.id));
  check("profile rows created by the auth trigger, all students", rows?.length === 3 && rows.every((r) => r.role === "student"), rows);
  await service.from("users").update({ role: "admin" }).eq("id", users.admin.id);
  for (const key of Object.keys(users)) check(`${key} can sign in`, !(await signIn(key)).error);

  console.log("\nRoles & database security");
  let r = await call("student", "POST", "/api/lessons", { title: "Should fail", category_id: "00000000-0000-0000-0000-000000000000" });
  check("student can't create a lesson (403)", r.status === 403, r.json);

  let attack = await users.student.db.from("users").update({ role: "admin" }).eq("id", users.student.id).select();
  check("student can't make themselves admin directly in the DB", Boolean(attack.error) || attack.data?.length === 0, attack);

  r = await call("teacher", "POST", "/api/users/become-instructor");
  check("become-instructor works for a student", r.status === 200 && r.json?.data?.role === "instructor", r.json);
  await signIn("teacher");
  r = await call("teacher", "POST", "/api/users/become-instructor");
  check("become-instructor refuses non-students (403)", r.status === 403, r.json);

  r = await call("teacher", "GET", "/api/users/me");
  check("GET /api/users/me returns the profile", r.json?.data?.email === users.teacher.email && r.json?.data?.role === "instructor", r.json);
  r = await call("teacher", "PATCH", "/api/users/me", { bio: "I teach SQL." });
  check("PATCH /api/users/me updates the bio", r.json?.data?.bio === "I teach SQL.", r.json);
  r = await call("teacher", "PATCH", "/api/users/me", { role: "admin" });
  check("PATCH /api/users/me rejects role (400)", r.status === 400, r.json);

  console.log("\nInstructor: create, edit, resources");
  const { json: cats } = await call(null, "GET", "/api/categories");
  const category = cats.data.find((c) => c.slug === "data") ?? cats.data[0];
  check("GET /api/categories lists categories", cats.data.length > 0, cats);

  r = await call("teacher", "POST", "/api/lessons", { title: "E2E: Intro to SQL Joins", description: "Primer.", category_id: category.id });
  lessonId = r.json?.data?.id;
  check("POST /api/lessons creates a draft (201)", r.status === 201 && r.json.data.status === "draft", r.json);

  attack = await users.teacher.db.from("lessons").insert({ instructor_id: users.teacher.id, title: "Pre-approved", category_id: category.id, status: "approved" }).select();
  check("instructor can't insert an already-approved lesson directly", Boolean(attack.error), attack.data);

  r = await call("teacher", "PATCH", `/api/lessons/${lessonId}`, { title: "E2E: Intro to SQL Joins (v2)" });
  check("PATCH /api/lessons/:id edits a draft", r.status === 200 && r.json.data.title.endsWith("(v2)"), r.json);
  r = await call("student", "PATCH", `/api/lessons/${lessonId}`, { title: "hijack" });
  check("a student can't edit someone's lesson", r.status === 403 || r.status === 404, r);

  r = await call("teacher", "POST", `/api/lessons/${lessonId}/resources`, { type: "link", title: "Bad", url_or_content: "javascript:alert(1)" });
  check("javascript: resource URL rejected (400)", r.status === 400, r.json);
  r = await call("teacher", "POST", `/api/lessons/${lessonId}/resources`, { type: "slide", title: "Slides", url_or_content: "https://example.com/slides.pdf" });
  const resourceId = r.json?.data?.id;
  check("POST resource (201)", r.status === 201, r.json);
  r = await call("teacher", "POST", `/api/lessons/${lessonId}/resources`, { type: "note", title: "Temp", url_or_content: "delete me" });
  r = await call("teacher", "DELETE", `/api/lessons/${lessonId}/resources/${r.json?.data?.id}`);
  check("DELETE resource", r.status === 200, r.json);

  r = await call(null, "GET", `/api/lessons/${lessonId}`);
  check("draft is hidden from the public (404)", r.status === 404, r.json);
  r = await call("teacher", "GET", "/api/lessons/mine");
  check("GET /api/lessons/mine includes the draft", r.json?.data?.some((l) => l.id === lessonId), r.json);

  console.log("\nSubmit → reject → resubmit → approve");
  attack = await users.teacher.db.from("lessons").update({ status: "approved" }).eq("id", lessonId).select();
  check("instructor can't approve their own lesson directly in the DB", Boolean(attack.error), attack.data);

  r = await call("teacher", "POST", `/api/lessons/${lessonId}/submit`);
  check("submit → pending", r.json?.data?.status === "pending", r.json);
  r = await call("teacher", "PATCH", `/api/lessons/${lessonId}`, { title: "Edit while pending" });
  check("editing is locked while pending (409)", r.status === 409, r.json);
  r = await call("teacher", "POST", `/api/admin/lessons/${lessonId}/approve`);
  check("instructor can't use the approve endpoint (403)", r.status === 403, r.json);

  r = await call("admin", "GET", "/api/admin/lessons/pending");
  check("admin review queue contains the lesson", r.json?.data?.some((l) => l.id === lessonId) && r.json.meta?.total >= 1, r.json);
  r = await call("admin", "POST", `/api/admin/lessons/${lessonId}/reject`, { reason: "Audio too quiet, please re-record." });
  check("admin rejects with a reason", r.json?.data?.status === "rejected", r.json);
  r = await call("teacher", "GET", `/api/lessons/${lessonId}`);
  check("instructor sees the rejection reason", r.json?.data?.rejection_reason?.startsWith("Audio"), r.json);
  r = await call("teacher", "POST", `/api/lessons/${lessonId}/submit`);
  check("instructor resubmits a rejected lesson", r.json?.data?.status === "pending", r.json);
  r = await call("admin", "POST", `/api/admin/lessons/${lessonId}/approve`);
  check("admin approves", r.json?.data?.status === "approved", r.json);
  r = await call("admin", "POST", `/api/admin/lessons/${lessonId}/approve`);
  check("approving twice is refused (409)", r.status === 409, r.json);

  console.log("\nStudent: catalog, views, progress, bookmarks");
  r = await call(null, "GET", `/api/lessons?sort=newest&category=${category.slug}&q=joins`);
  const listed = r.json?.data?.find((l) => l.id === lessonId);
  check("catalog lists it (filter + search) with the instructor's name", listed?.instructor?.full_name === "E2E Teacher", r.json);
  r = await call(null, "GET", `/api/lessons/${lessonId}`);
  check("public lesson detail includes resources", r.json?.data?.resources?.some((x) => x.id === resourceId), r.json);

  r = await call("student", "POST", `/api/lessons/${lessonId}/view`);
  check("view counted", r.json?.data?.view_count === 1, r.json);
  r = await call(null, "POST", `/api/lessons/${lessonId}/view`);
  check("anonymous view counted", r.json?.data?.view_count === 2, r.json);
  attack = await users.student.db.from("lessons").update({ view_count: 9999 }).eq("id", lessonId).select();
  check("student can't write view_count directly", Boolean(attack.error) || attack.data?.length === 0, attack.data);

  r = await call("student", "POST", `/api/lessons/${lessonId}/progress`, { progress_seconds: 30, completed: false });
  check("progress saved", r.json?.data?.progress_seconds === 30, r.json);
  r = await call("student", "POST", `/api/lessons/${lessonId}/progress`, { progress_seconds: 55, completed: true });
  r = await call("student", "POST", `/api/lessons/${lessonId}/progress`, { progress_seconds: 5, completed: false });
  check("completed stays completed on rewatch", r.json?.data?.completed === true, r.json);
  r = await call("student", "GET", "/api/history/mine");
  check("history lists the lesson", r.json?.data?.[0]?.lesson?.id === lessonId, r.json);

  r = await call("student", "POST", "/api/bookmarks", { lesson_id: lessonId });
  const bookmarkId = r.json?.data?.id;
  check("bookmark created (201)", r.status === 201, r.json);
  r = await call("student", "POST", "/api/bookmarks", { lesson_id: lessonId });
  check("duplicate bookmark → 409 ALREADY_BOOKMARKED", r.status === 409 && r.json?.error?.code === "ALREADY_BOOKMARKED", r.json);
  r = await call("teacher", "DELETE", `/api/bookmarks/${bookmarkId}`);
  check("someone else can't delete your bookmark", r.status === 404, r.json);
  r = await call("student", "GET", "/api/bookmarks/mine");
  check("bookmarks/mine lists it", r.json?.data?.length === 1, r.json);

  console.log("\nDashboards");
  r = await call("student", "GET", "/api/dashboard/student");
  check("student dashboard", r.json?.data?.completed_count === 1 && r.json.data.bookmarks_count === 1, r.json);
  r = await call("teacher", "GET", "/api/dashboard/instructor");
  check("instructor dashboard", r.json?.data?.lessons_by_status?.approved === 1 && r.json.data.total_views === 2, r.json);
  r = await call("admin", "GET", "/api/dashboard/admin");
  check("admin dashboard", typeof r.json?.data?.total_users === "number" && r.json.data.avg_approval_turnaround_hours !== undefined, r.json);
  r = await call("student", "GET", "/api/dashboard/admin");
  check("student can't read the admin dashboard (403)", r.status === 403, r.json);

  r = await call("student", "DELETE", `/api/bookmarks/${bookmarkId}`);
  check("student removes their bookmark", r.status === 200, r.json);

  console.log("\nAdmin: users, roles, disabling, categories");
  r = await call("admin", "GET", `/api/admin/users?q=ll-e2e-student-${stamp}`);
  check("admin user search", r.json?.data?.length === 1, r.json);
  r = await call("admin", "PATCH", `/api/admin/users/${users.student.id}`, { role: "instructor" });
  check("admin changes a role", r.json?.data?.role === "instructor", r.json);
  r = await call("admin", "PATCH", `/api/admin/users/${users.admin.id}`, { role: "student" });
  check("admin can't change their own role", r.status === 403, r.json);
  r = await call("admin", "PATCH", `/api/admin/users/${users.student.id}`, { disabled: true });
  check("admin disables an account", r.json?.data?.disabled === true, r.json);
  check("disabled user can't sign in", Boolean((await signIn("student")).error));
  r = await call("admin", "PATCH", `/api/admin/users/${users.student.id}`, { disabled: false });
  check("admin re-enables the account", r.json?.data?.disabled === false, r.json);
  check("re-enabled user can sign in", !(await signIn("student")).error);
  r = await call("teacher", "POST", "/api/categories", { name: "Nope" });
  check("non-admin can't create categories (403)", r.status === 403, r.json);

  console.log("\nPages render for each role");
  const pages = [
    ["admin", "/admin"], ["admin", "/admin/lessons?status=all"], ["admin", `/admin/lessons/${lessonId}`], ["admin", "/admin/users"], ["admin", "/admin/categories"],
    ["teacher", "/instructor"], ["teacher", "/instructor/lessons/new"], ["teacher", `/instructor/lessons/${lessonId}`],
    ["student", "/"], ["student", `/lessons/${lessonId}`], ["student", "/library"], ["student", "/settings"],
  ];
  for (const [who, path] of pages) {
    r = await call(who, "GET", path);
    check(`${who.padEnd(7)} GET ${path} → 200`, r.status === 200, `${r.status} ${r.location ?? ""}`);
  }
  r = await call("teacher", "GET", "/admin");
  check("instructor opening /admin is redirected", r.status === 307 && r.location?.includes("/instructor"), `${r.status} ${r.location}`);
} catch (error) {
  failed++;
  console.error("Unexpected error:", error);
} finally {
  console.log("\nCleanup");
  if (lessonId) await service.from("lessons").delete().eq("id", lessonId);
  for (const { id } of Object.values(users)) await service.auth.admin.deleteUser(id);
  const { data: left } = await service.from("users").select("id").like("email", `ll-e2e-%-${stamp}@example.com`);
  console.log(`  removed test users and data (${left?.length ?? "?"} left)`);
  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
}
