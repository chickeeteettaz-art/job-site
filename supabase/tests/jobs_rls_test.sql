begin;
select plan(4);

insert into public.jobs (id, company, title, location, job_type, employment_type, description, is_active)
values
  ('40000000-0000-4000-8000-000000000001', 'Test School', 'Teacher', 'Remote', 'teacher', 'Full time', 'Active test role.', true),
  ('40000000-0000-4000-8000-000000000002', 'Test School', 'Former Teacher', 'Remote', 'teacher', 'Full time', 'Inactive test role.', false);

select ok(
  not has_table_privilege('anon', 'public.jobs', 'select'),
  'anonymous visitors cannot query job listings'
);

set local role authenticated;
set local request.jwt.claims = '{"sub":"10000000-0000-4000-8000-000000000002","role":"authenticated","app_metadata":{"role":"user"}}';

select results_eq(
  $$select title from public.jobs where id = '40000000-0000-4000-8000-000000000001'$$,
  array['Teacher']::text[],
  'signed-in users can read active listings'
);

select is_empty(
  $$select id from public.jobs where id = '40000000-0000-4000-8000-000000000002'$$,
  'inactive listings are hidden'
);

select ok(
  not has_table_privilege('authenticated', 'public.jobs', 'insert')
    and not has_table_privilege('authenticated', 'public.jobs', 'update')
    and not has_table_privilege('authenticated', 'public.jobs', 'delete'),
  'job listings are read-only to users'
);

select * from finish();
rollback;