// scripts/create-admin.mjs — create (or promote) an admin account at setup
// time, without going through the public sign-up page. Public sign-ups are
// always students; this is how the first admin is provisioned.
//
//   npm run create-admin -- --email admin@example.com --name "Site Admin"
//   npm run create-admin -- --email admin@example.com --password "chosen-password"
//
// Omit --password to get a strong random one printed once. Running it again
// for an existing email promotes that account to admin (and resets the
// password only if --password is given). Needs SUPABASE_SERVICE_ROLE_KEY.

import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { randomBytes } from "node:crypto";

const require = createRequire(`${process.cwd()}/package.json`);
const { createClient } = require("@supabase/supabase-js");

function arg(name) {
  const index = process.argv.indexOf(`--${name}`);
  return index === -1 ? undefined : process.argv[index + 1];
}

const env = { ...process.env };
try {
  for (const line of readFileSync(".env.local", "utf8").split("\n")) {
    const at = line.indexOf("=");
    if (at > 0 && !line.startsWith("#") && !env[line.slice(0, at)]) env[line.slice(0, at)] = line.slice(at + 1);
  }
} catch {
  // no .env.local — rely on the environment
}

const email = arg("email")?.trim().toLowerCase();
const name = arg("name") ?? "Administrator";
const chosenPassword = arg("password");

if (!email || !email.includes("@")) {
  console.error('Usage: npm run create-admin -- --email you@example.com [--name "Name"] [--password "..."]');
  process.exit(1);
}
if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set (see SETUP.md).");
  process.exit(1);
}
if (chosenPassword && chosenPassword.length < 8) {
  console.error("Password must be at least 8 characters.");
  process.exit(1);
}

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function findUserByEmail(target) {
  for (let page = 1; ; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    const match = data.users.find((user) => user.email?.toLowerCase() === target);
    if (match || data.users.length < 1000) return match ?? null;
  }
}

let user = await findUserByEmail(email);
let passwordToShow = null;

if (user) {
  const { error } = await supabase.auth.admin.updateUserById(user.id, {
    email_confirm: true,
    ...(chosenPassword && { password: chosenPassword }),
  });
  if (error) throw error;
  console.log(`Account ${email} already exists — promoting it to admin.`);
} else {
  passwordToShow = chosenPassword ? null : randomBytes(12).toString("base64url");
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password: chosenPassword ?? passwordToShow,
    email_confirm: true,
    user_metadata: { full_name: name },
  });
  if (error) throw error;
  user = data.user;
  console.log(`Created account ${email}.`);
}

// The auth trigger (0003) creates the profile row; set its role.
const { data: profile, error } = await supabase
  .from("users")
  .update({ role: "admin" })
  .eq("id", user.id)
  .select("email, role")
  .single();
if (error) throw error;

console.log(`Role: ${profile.role}`);
if (passwordToShow) console.log(`Password: ${passwordToShow}   ← save this now; it won't be shown again`);
console.log("Sign in at /sign-in with this email and password.");
