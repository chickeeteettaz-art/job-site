begin;
select plan(8);

insert into auth.users (id, aud, role, email, encrypted_password, raw_app_meta_data, raw_user_meta_data)
values
  ('10000000-0000-4000-8000-000000000001', 'authenticated', 'authenticated', 'owner@example.test', '', '{"provider":"email"}', '{}'),
  ('10000000-0000-4000-8000-000000000002', 'authenticated', 'authenticated', 'other@example.test', '', '{"provider":"email"}', '{}');

insert into public.cvs (id, user_id, owner_email, job_type, file_name, file_size_bytes, file_key, snapshot_key)
values ('20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'owner@example.test', 'engineer', 'resume.pdf', 2048, '10000000-0000-4000-8000-000000000001/30000000-0000-4000-8000-000000000001/resume.pdf', '10000000-0000-4000-8000-000000000001/30000000-0000-4000-8000-000000000001/snapshot.png');

set local role authenticated;
set local request.jwt.claims = '{"sub":"10000000-0000-4000-8000-000000000001","role":"authenticated","app_metadata":{"role":"user"}}';

select throws_ok(
  $$insert into public.cvs (user_id, owner_email, job_type, file_name, file_size_bytes, file_key, snapshot_key)
    values ('10000000-0000-4000-8000-000000000001', 'owner@example.test', 'engineer', 'forged.pdf', 100, '10000000-0000-4000-8000-000000000001/30000000-0000-4000-8000-000000000002/resume.pdf', '10000000-0000-4000-8000-000000000001/30000000-0000-4000-8000-000000000002/snapshot.png')$$,
  '42501',
  null,
  'users cannot bypass server-side upload verification'
);

select results_eq(
  $$select id::text from public.cvs where id = '20000000-0000-4000-8000-000000000001'$$,
  array['20000000-0000-4000-8000-000000000001']::text[],
  'the owner can read their CV'
);

set local request.jwt.claims = '{"sub":"10000000-0000-4000-8000-000000000002","role":"authenticated","app_metadata":{"role":"user"}}';

select is_empty(
  $$select id from public.cvs where id = '20000000-0000-4000-8000-000000000001'$$,
  'another user cannot read the CV'
);

select throws_ok(
  $$delete from public.cvs where id = '20000000-0000-4000-8000-000000000001'$$,
  '42501',
  null,
  'users cannot bypass S3 cleanup by deleting metadata directly'
);

set local request.jwt.claims = '{"sub":"10000000-0000-4000-8000-000000000002","role":"authenticated","app_metadata":{"role":"admin"}}';

select results_eq(
  $$select id::text from public.cvs where id = '20000000-0000-4000-8000-000000000001'$$,
  array['20000000-0000-4000-8000-000000000001']::text[],
  'an admin can read another user CV'
);

select ok(
  not has_table_privilege('authenticated', 'public.cvs', 'update'),
  'CV metadata cannot be changed directly'
);

select results_eq(
  $$select id::text from public.cvs where id = '20000000-0000-4000-8000-000000000001'$$,
  array['20000000-0000-4000-8000-000000000001']::text[],
  'the denied delete left the CV intact'
);

set local request.jwt.claims = '{"sub":"10000000-0000-4000-8000-000000000001","role":"authenticated","app_metadata":{"role":"user"}}';

select ok(
  not has_table_privilege('anon', 'public.cvs', 'select'),
  'anonymous visitors cannot read CVs'
);

select * from finish();
rollback;
