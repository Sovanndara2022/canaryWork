-- 0003_auth_trigger.sql
-- Lightning Lessons — automatic profile provisioning on sign-up.
-- Runs inside Supabase itself, so it fires no matter which client
-- triggers the sign-up (Google OAuth) — the app code never has to
-- remember to create the profile row.

create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── Self-serve "become an instructor" ───────────────────────────────
-- Every new sign-in defaults to role = 'student' (set above).
-- This function backs POST /api/users/become-instructor — call it
-- with the RPC below from a route handler, scoped to the caller only.
create or replace function public.become_instructor()
returns void as $$
begin
  update public.users set role = 'instructor' where id = auth.uid();
end;
$$ language plpgsql security definer;

-- Usage from the API route (via the server-side Supabase client):
--   await supabase.rpc('become_instructor')
