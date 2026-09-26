create table public.jobs (
	id uuid primary key default gen_random_uuid(),
	company text not null check (char_length(company) between 1 and 120),
	title text not null check (char_length(title) between 1 and 160),
	location text not null check (char_length(location) <= 160),
	job_type text not null check (job_type in ('teacher', 'engineer', 'doctor')),
	employment_type text not null check (employment_type in ('Full time', 'Part time', 'Contract')),
	description text not null check (char_length(description) <= 2000),
	is_active boolean not null default true,
	is_sample boolean not null default false,
	created_at timestamptz not null default now()
);

create table public.cvs (
	id uuid primary key default gen_random_uuid(),
	user_id uuid not null references auth.users (id) on delete cascade,
	owner_email text not null check (char_length(owner_email) <= 320),
	job_type text not null check (job_type in ('teacher', 'engineer', 'doctor')),
	file_name text not null check (char_length(file_name) between 1 and 160),
	file_size_bytes bigint not null check (file_size_bytes between 1 and 10485760),
	file_key text not null unique,
	snapshot_key text not null unique,
	uploaded_at timestamptz not null default now(),
	constraint cvs_pdf_key check (file_key ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}/resume\.pdf$'),
	constraint cvs_snapshot_key check (snapshot_key ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}/snapshot\.png$')
);

create index jobs_active_type_created_idx
	on public.jobs (job_type, created_at desc)
	where is_active;

create index cvs_user_uploaded_idx
	on public.cvs (user_id, uploaded_at desc);

create index cvs_type_uploaded_idx
	on public.cvs (job_type, uploaded_at desc);

create index cvs_uploaded_idx
	on public.cvs (uploaded_at desc);

alter table public.jobs enable row level security;
alter table public.cvs enable row level security;

revoke all on table public.jobs from anon, authenticated;
revoke all on table public.cvs from anon, authenticated;
grant select on table public.jobs to authenticated;
grant all on table public.jobs to service_role;
grant select on table public.cvs to authenticated;
grant all on table public.cvs to service_role;

create policy "Signed-in users can read active jobs"
	on public.jobs for select to authenticated
	using (is_active);

create policy "Owners and admins can read CV metadata"
	on public.cvs for select to authenticated
	using (
		user_id = (select auth.uid())
		or (select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
	);

insert into public.jobs (company, title, location, job_type, employment_type, description, is_sample)
values
	('Cedar Creek Schools', 'Elementary School Teacher', 'Portland, OR · On-site', 'teacher', 'Full time', 'Support a collaborative elementary teaching team focused on thoughtful, inclusive learning.', true),
	('Northline Energy', 'Civil Engineer', 'Denver, CO · Hybrid', 'engineer', 'Full time', 'Help plan and deliver resilient infrastructure projects with a multidisciplinary engineering group.', true),
	('Harbor Community Health', 'Primary Care Physician', 'Boston, MA · On-site', 'doctor', 'Part time', 'Provide patient-centered primary care in a community clinic with a coordinated care team.', true);
