-- 0002_rls_policies.sql
-- Lightning Lessons — Row Level Security
-- Enforced at the database layer, independent of API-route role checks.

alter table users enable row level security;
alter table lessons enable row level security;
alter table lesson_resources enable row level security;
alter table bookmarks enable row level security;
alter table watch_progress enable row level security;
alter table lesson_views enable row level security;

create or replace function is_admin() returns boolean as $$
  select exists (select 1 from users where id = auth.uid() and role = 'admin');
$$ language sql security definer stable;

-- ── USERS: everyone can see their own row, admin sees all ──────────
create policy "users read own or admin" on users
  for select using (auth.uid() = id or is_admin());
create policy "users update own or admin" on users
  for update using (auth.uid() = id or is_admin());

-- ── LESSONS: public sees only approved; owner and admin see all ────
create policy "read approved or own or admin" on lessons
  for select using (status = 'approved' or instructor_id = auth.uid() or is_admin());
create policy "instructor creates own lessons" on lessons
  for insert with check (instructor_id = auth.uid());
create policy "instructor or admin updates lessons" on lessons
  for update using (instructor_id = auth.uid() or is_admin());

-- ── LESSON_RESOURCES: visible if the parent lesson is visible ──────
create policy "resources follow parent lesson visibility" on lesson_resources
  for select using (
    exists (select 1 from lessons l where l.id = lesson_id
            and (l.status = 'approved' or l.instructor_id = auth.uid() or is_admin()))
  );
create policy "instructor manages own resources" on lesson_resources
  for all using (
    exists (select 1 from lessons l where l.id = lesson_id and l.instructor_id = auth.uid())
  );

-- ── BOOKMARKS / WATCH_PROGRESS: strictly own rows ───────────────────
create policy "own bookmarks only" on bookmarks
  for all using (user_id = auth.uid());
create policy "own progress only" on watch_progress
  for all using (user_id = auth.uid());

-- ── LESSON_VIEWS: anyone can log a view, only admin reads the raw log ─
create policy "insert own view (or anonymous)" on lesson_views
  for insert with check (user_id = auth.uid() or user_id is null);
create policy "admin reads view logs" on lesson_views
  for select using (is_admin());
