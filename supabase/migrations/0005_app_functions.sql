-- 0005_app_functions.sql
-- Lightning Lessons — database pieces the app needs on top of 0001–0004.
-- Run after 0004_security_fixes.sql. Safe to run more than once.

-- ── 1. Link a Mux direct upload to its lesson ──────────────────────
-- Set by POST /api/upload/mux; lets the app look up the asset when the
-- webhook can't reach it (e.g. localhost — design doc Section 14 fallback).
alter table public.lessons add column if not exists mux_upload_id text;

-- ── 2. Let trusted server functions bypass the lesson guard ────────
-- Same as 0004, plus an escape hatch that only security-definer
-- functions below can switch on (it's transaction-local and can't be set
-- through the REST API).
create or replace function public.guard_lesson_update()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if auth.uid() is null
     or public.is_admin()
     or current_setting('app.trusted_write', true) = 'on' then
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

-- ── 3. View counting (POST /api/lessons/:id/view) ──────────────────
-- Anyone may count a view on an approved lesson, but nobody may write
-- view_count directly.
create or replace function public.log_lesson_view(p_lesson_id uuid)
returns integer
language plpgsql security definer set search_path = ''
as $$
declare
  new_count integer;
begin
  perform set_config('app.trusted_write', 'on', true);

  update public.lessons
     set view_count = view_count + 1
   where id = p_lesson_id and status = 'approved'
  returning view_count into new_count;

  perform set_config('app.trusted_write', 'off', true);

  if new_count is not null then
    insert into public.lesson_views (lesson_id, user_id) values (p_lesson_id, auth.uid());
  end if;

  return new_count;
end;
$$;

grant execute on function public.log_lesson_view(uuid) to anon, authenticated;

-- ── 4. Admin role changes (PATCH /api/admin/users/:id) ─────────────
-- 0004 removed users' UPDATE privilege on `role`; this is the one door.
create or replace function public.admin_set_user_role(p_user_id uuid, p_role public.user_role)
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Only admins can change roles.' using errcode = '42501';
  end if;
  if p_user_id = auth.uid() then
    raise exception 'You can''t change your own role.' using errcode = '42501';
  end if;

  update public.users set role = p_role where id = p_user_id;
  if not found then
    raise exception 'User not found.' using errcode = 'P0002';
  end if;
end;
$$;

revoke execute on function public.admin_set_user_role(uuid, public.user_role) from public, anon;
grant execute on function public.admin_set_user_role(uuid, public.user_role) to authenticated;

-- ── 5. Public instructor profiles ──────────────────────────────────
-- users RLS only exposes your own row, but the catalog needs instructor
-- names. This view exposes the public fields only (never email) for
-- people who teach.
create or replace view public.public_profiles as
  select u.id, u.full_name, u.avatar_url, u.bio
    from public.users u
   where u.role in ('instructor', 'admin')
      or exists (select 1 from public.lessons l where l.instructor_id = u.id);

grant select on public.public_profiles to anon, authenticated;

-- ── 6. Deleting lessons (DELETE /api/lessons/:id) ──────────────────
-- RLS had no delete policy, so deletes silently affected zero rows.
drop policy if exists "owner deletes unpublished, admin deletes any" on public.lessons;
create policy "owner deletes unpublished, admin deletes any" on public.lessons
  for delete using (
    (instructor_id = auth.uid() and status in ('draft', 'rejected'))
    or public.is_admin()
  );

-- ── 7. Resources are only editable while the lesson is editable ────
-- Previously an instructor could add links to an already-approved lesson.
drop policy if exists "instructor manages own resources" on public.lesson_resources;

drop policy if exists "instructor adds resources to editable lessons" on public.lesson_resources;
create policy "instructor adds resources to editable lessons" on public.lesson_resources
  for insert with check (
    exists (select 1 from public.lessons l
            where l.id = lesson_id and l.instructor_id = auth.uid()
              and l.status in ('draft', 'rejected'))
  );
drop policy if exists "instructor edits resources on editable lessons" on public.lesson_resources;
create policy "instructor edits resources on editable lessons" on public.lesson_resources
  for update using (
    exists (select 1 from public.lessons l
            where l.id = lesson_id and l.instructor_id = auth.uid()
              and l.status in ('draft', 'rejected'))
  );
drop policy if exists "instructor removes resources from editable lessons" on public.lesson_resources;
create policy "instructor removes resources from editable lessons" on public.lesson_resources
  for delete using (
    exists (select 1 from public.lessons l
            where l.id = lesson_id and l.instructor_id = auth.uid()
              and l.status in ('draft', 'rejected'))
  );

-- ── 8. Indexes for the student pages ───────────────────────────────
create index if not exists watch_progress_user_recent_idx
  on public.watch_progress (user_id, last_watched_at desc);
create index if not exists bookmarks_user_recent_idx
  on public.bookmarks (user_id, created_at desc);
