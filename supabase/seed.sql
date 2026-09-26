-- seed.sql
-- Lightning Lessons — starter data.
-- Run after migrations: `supabase db reset` (local) applies this automatically,
-- or `psql -f supabase/seed.sql` / paste into the Supabase SQL editor.

insert into categories (name, slug) values
  ('Data', 'data'),
  ('Design', 'design'),
  ('Business', 'business'),
  ('Programming', 'programming'),
  ('Marketing', 'marketing')
on conflict (name) do nothing;

-- ── Demo lessons (optional) ──────────────────────────────────────────
-- lessons.instructor_id is a foreign key into users -> auth.users, so a
-- lesson can't be seeded until at least one real account has signed in
-- and been promoted to instructor. Once you have one:
--
--   1. Sign in once via the app (creates the auth.users + users row).
--   2. update users set role = 'instructor' where email = 'you@example.com';
--   3. Grab that id:  select id from users where role = 'instructor' limit 1;
--   4. Uncomment and fill in below:
--
-- insert into lessons (instructor_id, category_id, title, description, status)
-- select
--   '00000000-0000-0000-0000-000000000000', -- <- replace with real instructor id
--   c.id,
--   'Intro to SQL Joins',
--   'A 10-minute primer on inner, left, and right joins.',
--   'approved'
-- from categories c where c.slug = 'data';
