-- 0004_security_fixes.sql
-- Lightning Lessons — closes gaps in 0002/0003 where a signed-in user could
-- bypass the API by calling Supabase directly with the (public) anon key.

-- ── 1. Users can't change their own role ────────────────────────────
-- "users update own or admin" allowed updating every column, including
-- role — so a student could run update users set role = 'admin'.
-- Limit what a user session may write to the profile fields. Role changes
-- go through become_instructor() (security definer) or the admin API
-- route using the service-role client (lib/supabase/admin.ts).
revoke update on public.users from anon, authenticated;
grant update (full_name, avatar_url, bio) on public.users to authenticated;

-- ── 2. Only students can self-upgrade; pin search_path ─────────────
create or replace function public.become_instructor()
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  update public.users set role = 'instructor'
  where id = auth.uid() and role = 'student';
end;
$$;

create or replace function public.is_admin()
returns boolean
language sql security definer stable set search_path = ''
as $$
  select exists (select 1 from public.users where id = auth.uid() and role = 'admin');
$$;

alter function public.handle_new_user() set search_path = '';

-- ── 3. Lessons: instructors can't approve their own work ───────────
-- Inserts must be a fresh draft by an instructor (students could insert
-- a lesson with status = 'approved' before).
drop policy if exists "instructor creates own lessons" on public.lessons;
create policy "instructor creates own draft lessons" on public.lessons
  for insert with check (
    instructor_id = auth.uid()
    and status = 'draft'
    and reviewed_by is null
    and view_count = 0
    and exists (select 1 from public.users u
                where u.id = auth.uid() and u.role in ('instructor', 'admin'))
  );

-- Updates by the owner: only while draft/rejected, only to draft/pending,
-- and never touching review, view-count, or Mux fields. Admins and
-- server-side calls with no user (service role: Mux webhook) are exempt.
create or replace function public.guard_lesson_update()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if auth.uid() is null or public.is_admin() then
    return new;
  end if;

  if old.status not in ('draft', 'rejected') then
    raise exception 'Lessons can only be edited while draft or rejected.'
      using errcode = '42501';
  end if;

  if new.status not in ('draft', 'pending') then
    raise exception 'Only an admin can approve or reject a lesson.'
      using errcode = '42501';
  end if;

  if new.instructor_id    is distinct from old.instructor_id
  or new.reviewed_by      is distinct from old.reviewed_by
  or new.reviewed_at      is distinct from old.reviewed_at
  or new.view_count       is distinct from old.view_count
  or new.mux_asset_id     is distinct from old.mux_asset_id
  or new.mux_playback_id  is distinct from old.mux_playback_id
  or new.duration_seconds is distinct from old.duration_seconds then
    raise exception 'That field is managed by the platform.'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

create trigger guard_lesson_update
  before update on public.lessons
  for each row execute procedure public.guard_lesson_update();

-- ── 4. Categories had no RLS at all ─────────────────────────────────
alter table public.categories enable row level security;

create policy "anyone reads categories" on public.categories
  for select using (true);
create policy "admin manages categories" on public.categories
  for all using (public.is_admin()) with check (public.is_admin());
