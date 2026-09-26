import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowUpRight, BriefcaseBusiness, FileText, LogOut, Search } from "lucide-react";
import { appRoleFromClaims, isJobType } from "@/lib/authz";
import { signOut } from "@/app/auth/actions";
import CvUploadForm from "./cv-upload-form";
import { createClient } from "@/lib/server";

type JobsPageProps = {
  searchParams: Promise<{ q?: string; type?: string }>;
};

const jobTypeLabels = {
  teacher: "Teacher",
  engineer: "Engineer",
  doctor: "Doctor",
} as const;

export default async function JobsPage({ searchParams }: JobsPageProps) {
  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getClaims();
  if (authError || !authData?.claims) redirect("/auth/login");
  if (appRoleFromClaims(authData.claims) === "admin") redirect("/admin/cvs");

  const email = typeof authData.claims.email === "string" ? authData.claims.email : "";
  const { q = "", type = "" } = await searchParams;
  const search = q.replace(/[,%_*()\\]/g, "").trim().slice(0, 80);
  const jobType = isJobType(type) ? type : null;

  let jobsQuery = supabase.from("jobs").select("*").eq("is_active", true).order("created_at", { ascending: false });
  if (jobType) jobsQuery = jobsQuery.eq("job_type", jobType);
  if (search) {
    jobsQuery = jobsQuery.or(`title.ilike.%${search}%,company.ilike.%${search}%,location.ilike.%${search}%`);
  }

  const [{ data: jobs }, { data: cvs, error: cvsError }] = await Promise.all([
    jobsQuery,
    supabase.from("cvs").select("id, job_type, file_name, file_size_bytes, uploaded_at").eq("user_id", authData.claims.sub).order("uploaded_at", { ascending: false }).limit(20),
  ]);

  return (
    <main className="min-h-screen bg-[#f7f8f5] text-[#1b2824]">
      <header className="border-b border-[#e3e8e2] bg-white">
        <div className="mx-auto flex h-[72px] max-w-[1440px] items-center justify-between px-5 sm:px-8 lg:px-12">
          <Link href="/jobs" className="flex items-center gap-2.5" aria-label="Northstar jobs">
            <span className="grid size-9 place-items-center rounded-[10px] bg-[#173f35] text-white"><BriefcaseBusiness size={18} /></span>
            <span className="font-heading text-[21px] font-semibold">northstar</span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="hidden text-sm text-[#69756f] sm:block">{email}</span>
            <form action={signOut}>
              <button type="submit" title="Sign out" aria-label="Sign out" className="grid size-10 place-items-center rounded-lg border border-[#e3e8e2] text-[#53635c] transition hover:bg-[#f4f6f3]">
                <LogOut size={17} />
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1440px] px-5 py-8 sm:px-8 sm:py-10 lg:px-12">
        <section className="flex flex-col justify-between gap-5 border-b border-[#e3e8e2] pb-7 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#53776a]">Applicant workspace</p>
            <h1 className="mt-2 font-heading text-3xl font-medium sm:text-[38px]">Find your next role.</h1>
            <p className="mt-2 text-sm text-[#69756f]">Explore opportunities and keep your CV ready to share.</p>
          </div>
          <a href="#cv" className="inline-flex h-10 items-center justify-center gap-2 self-start rounded-lg bg-[#173f35] px-4 text-sm font-medium text-white transition hover:bg-[#245747] sm:self-auto">
            <FileText size={16} /> Add your CV
          </a>
        </section>

        <section className="grid gap-8 py-8 xl:grid-cols-[minmax(0,1.45fr)_minmax(330px,0.75fr)]">
          <div>
            <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#53776a]">Opportunities</p>
                <h2 className="mt-2 font-heading text-2xl font-medium">Roles to explore</h2>
              </div>
              <form action="/jobs" method="get" className="flex w-full gap-2 sm:max-w-[510px]">
                <label className="relative min-w-0 flex-1">
                  <span className="sr-only">Search jobs</span>
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#849087]" />
                  <input name="q" defaultValue={q} placeholder="Role, company, or location" className="h-10 w-full rounded-lg border border-[#dfe5df] bg-white pl-9 pr-3 text-sm outline-none focus:border-[#53776a] focus:ring-2 focus:ring-[#53776a]/15" />
                </label>
                <label className="sr-only" htmlFor="job-type">Filter by profession</label>
                <select id="job-type" name="type" defaultValue={jobType ?? ""} className="h-10 w-[118px] rounded-lg border border-[#dfe5df] bg-white px-2 text-sm outline-none focus:border-[#53776a] sm:w-[140px]">
                  <option value="">All fields</option>
                  {Object.entries(jobTypeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
                <button type="submit" aria-label="Apply job filters" title="Apply filters" className="grid size-10 shrink-0 place-items-center rounded-lg bg-[#e8eee8] text-[#315b49] transition hover:bg-[#dce7dd]"><Search size={16} /></button>
              </form>
            </div>

            <div className="divide-y divide-[#edf0ec] rounded-xl border border-[#e3e8e2] bg-white">
              {jobs?.map((job) => (
                <article key={job.id} className="p-5 sm:px-6">
                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-semibold">{job.title}</h3>
                        {job.is_sample && <span className="rounded bg-[#f5f1e8] px-2 py-1 text-[10px] font-medium uppercase tracking-wide text-[#8a7042]">Sample listing</span>}
                      </div>
                      <p className="mt-1 text-sm text-[#607067]">{job.company} <span className="px-1 text-[#bcc5bd]">·</span> {job.location}</p>
                    </div>
                    <div className="flex items-center gap-2 self-start">
                      <span className="rounded-md bg-[#eef4ef] px-2.5 py-1.5 text-xs font-medium text-[#416b58]">{jobTypeLabels[job.job_type]}</span>
                      <span className="rounded-md bg-[#f3f5f2] px-2.5 py-1.5 text-xs text-[#617067]">{job.employment_type}</span>
                    </div>
                  </div>
                  <p className="mt-3 max-w-3xl text-sm leading-6 text-[#69756f]">{job.description}</p>
                  <span className="mt-4 inline-flex items-center gap-1.5 text-xs text-[#7b887f]"><ArrowUpRight size={14} /> Listing details coming soon</span>
                </article>
              ))}
              {(!jobs || jobs.length === 0) && (
                <div className="px-6 py-12 text-center">
                  <p className="text-sm font-medium text-[#405249]">No matching roles yet</p>
                  <p className="mt-1 text-sm text-[#7a857f]">Try another search or check back for new listings.</p>
                </div>
              )}
            </div>
          </div>

          <aside className="space-y-7">
            <section id="cv" className="rounded-xl border border-[#e3e8e2] bg-white p-5 sm:p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#53776a]">Your profile</p>
              <h2 className="mt-2 font-heading text-2xl font-medium">Add a CV</h2>
              <p className="mb-5 mt-2 text-sm leading-5 text-[#69756f]">We save the document and its first-page snapshot in private storage.</p>
              <CvUploadForm />
            </section>

            <section>
              <div className="mb-3 flex items-end justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#53776a]">Private documents</p>
                  <h2 className="mt-1 font-heading text-xl font-medium">My CVs</h2>
                </div>
                <span className="text-xs text-[#7a857f]">{cvs?.length ?? 0}</span>
              </div>
              {cvsError ? (
                <p className="rounded-lg border border-[#eadfd0] bg-white p-4 text-sm text-[#7a6347]">Your CV workspace is not available yet. The application database migration needs to be applied.</p>
              ) : cvs?.length ? (
                <div className="space-y-2">
                  {cvs.map((cv) => (
                    <article key={cv.id} className="flex items-center gap-3 rounded-lg border border-[#e3e8e2] bg-white p-3">
                      <Image src={`/api/cvs/${cv.id}/snapshot`} alt={`First-page snapshot of ${cv.file_name}`} width={42} height={56} unoptimized className="h-14 w-[42px] rounded border border-[#e5eae4] object-cover" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{cv.file_name}</p>
                        <p className="mt-1 text-xs capitalize text-[#7b887f]">{jobTypeLabels[cv.job_type]} · {new Date(cv.uploaded_at).toLocaleDateString()}</p>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="rounded-lg border border-[#e3e8e2] bg-white p-4 text-sm text-[#7a857f]">Your uploaded CVs will appear here.</p>
              )}
            </section>
          </aside>
        </section>
      </div>
    </main>
  );
}