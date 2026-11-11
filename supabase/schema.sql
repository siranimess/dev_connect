-- DevConnect / CodePath HobbyHub
-- Run once in Supabase Dashboard > SQL Editor > New query > Run.
-- Safe to rerun on this project: tables and policies are created idempotently.
-- IMPORTANT: Keep Row Level Security ON. Do not put a service-role/secret key in Vite.

create extension if not exists pgcrypto with schema extensions;

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 1 and 160),
  content text check (content is null or char_length(content) <= 10000),
  image_url text,
  video_url text,
  flag text not null default 'Discussion' check (flag in ('Question', 'Discussion', 'Opinion', 'Showcase')),
  repost_id uuid references public.posts(id) on delete set null,
  upvotes integer not null default 0 check (upvotes >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint posts_no_self_repost check (repost_id is distinct from id)
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  author_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  content text not null check (char_length(btrim(content)) between 1 and 2000),
  created_at timestamptz not null default now()
);

create index if not exists posts_created_at_idx on public.posts (created_at desc);
create index if not exists posts_upvotes_idx on public.posts (upvotes desc);
create index if not exists posts_flag_idx on public.posts (flag);
create index if not exists posts_author_id_idx on public.posts (author_id);
create index if not exists comments_post_id_created_at_idx on public.comments (post_id, created_at);
create index if not exists comments_author_id_idx on public.comments (author_id);

create or replace function public.touch_post_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists posts_update_timestamp on public.posts;
create trigger posts_update_timestamp before update on public.posts
for each row execute function public.touch_post_updated_at();

-- Explicit RLS, even for Supabase Auth anonymous users. These users have the
-- 'authenticated' database role and their own auth.uid() UUID.
alter table public.posts enable row level security;
alter table public.comments enable row level security;

drop policy if exists "posts_read" on public.posts;
create policy "posts_read" on public.posts for select to authenticated using (true);

drop policy if exists "posts_create_own" on public.posts;
create policy "posts_create_own" on public.posts for insert to authenticated
with check (author_id = (select auth.uid()) and upvotes = 0);

drop policy if exists "posts_edit_own" on public.posts;
create policy "posts_edit_own" on public.posts for update to authenticated
using (author_id = (select auth.uid()))
with check (author_id = (select auth.uid()));

drop policy if exists "posts_delete_own" on public.posts;
create policy "posts_delete_own" on public.posts for delete to authenticated
using (author_id = (select auth.uid()));

drop policy if exists "comments_read" on public.comments;
create policy "comments_read" on public.comments for select to authenticated using (true);

drop policy if exists "comments_create_own" on public.comments;
create policy "comments_create_own" on public.comments for insert to authenticated
with check (author_id = (select auth.uid()));

drop policy if exists "comments_delete_own" on public.comments;
create policy "comments_delete_own" on public.comments for delete to authenticated
using (author_id = (select auth.uid()));

-- Explicit table/column grants: a post author cannot directly set upvotes,
-- author_id, timestamps, or ID. The single-purpose RPC below handles votes.
revoke all privileges on table public.posts from public, anon, authenticated;
revoke all privileges on table public.comments from public, anon, authenticated;
grant usage on schema public to authenticated;
grant select, delete on public.posts to authenticated;
grant insert (title, content, image_url, video_url, flag, repost_id) on public.posts to authenticated;
grant update (title, content, image_url, video_url, flag, repost_id) on public.posts to authenticated;
grant select, delete on public.comments to authenticated;
grant insert (post_id, content) on public.comments to authenticated;

-- This is intentionally narrow: arbitrary users can add exactly 1 vote,
-- atomically, while they cannot modify any other post fields.
-- Function in exposed public schema: audit before any production deployment.
create or replace function public.upvote_post(p_post_id uuid)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare result_count integer;
begin
  if (select auth.uid()) is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;
  update public.posts as p set upvotes = p.upvotes + 1
  where p.id = p_post_id
  returning p.upvotes into result_count;
  if result_count is null then
    raise exception 'Post not found' using errcode = 'P0002';
  end if;
  return result_count;
end;
$$;
revoke all on function public.upvote_post(uuid) from public, anon, authenticated;
grant execute on function public.upvote_post(uuid) to authenticated;
revoke all on function public.touch_post_updated_at() from public, anon, authenticated;

-- Public image bucket. Public downloads are allowed by bucket configuration,
-- but only the signed-in user may upload into their own UUID directory.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('post-images', 'post-images', true, 5242880, array['image/jpeg','image/png','image/webp','image/gif'])
on conflict (id) do nothing;

drop policy if exists "devconnect_upload_own_image" on storage.objects;
create policy "devconnect_upload_own_image" on storage.objects
for insert to authenticated
with check (
  bucket_id = 'post-images'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

-- No UPDATE policy: uploaded objects cannot be overwritten through the API.
-- Since this bucket is public, public image delivery doesn't need a SELECT policy.
