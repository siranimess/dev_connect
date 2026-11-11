-- READ-ONLY checks. Run AFTER schema.sql in Supabase SQL Editor.
-- These inspect configuration but do not replace a two-user integration test.

-- Both public tables must have row-level security enabled (rowsecurity = true).
select schemaname, tablename, rowsecurity
from pg_tables
where schemaname = 'public' and tablename in ('posts', 'comments');

-- Confirm select/insert/update/delete RLS policy entries.
select tablename, policyname, roles, cmd, qual, with_check
from pg_policies
where schemaname = 'public' and tablename in ('posts', 'comments')
order by tablename, cmd, policyname;

-- Confirm column-level grants: posts.upvotes, author_id and timestamps
-- should NOT have UPDATE privileges for authenticated.
select table_name, column_name, privilege_type, grantee
from information_schema.column_privileges
where table_schema = 'public'
  and table_name in ('posts', 'comments')
  and grantee in ('anon', 'authenticated')
order by table_name, column_name, privilege_type;

-- Verify authenticated (not PUBLIC/anon) has execute permission on RPC.
select
  has_function_privilege('authenticated', 'public.upvote_post(uuid)', 'EXECUTE') as authenticated_can_vote,
  has_function_privilege('anon', 'public.upvote_post(uuid)', 'EXECUTE') as anon_role_can_vote;

-- PUBLIC grants are represented with an empty grantee; should be no EXECUTE grant.
select proacl from pg_proc where oid = 'public.upvote_post(uuid)'::regprocedure;

-- Bucket should be public, limited to 5MB, and allow only image MIME types.
select id, public, file_size_limit, allowed_mime_types
from storage.buckets where id = 'post-images';

-- Verify the owner-directory storage INSERT policy exists.
select policyname, roles, cmd, qual, with_check
from pg_policies
where schemaname = 'storage' and tablename = 'objects'
  and policyname = 'devconnect_upload_own_image';
