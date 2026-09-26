import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { BriefcaseBusiness, Download, LogOut, Search } from "lucide-react";
import { appRoleFromClaims, isJobType } from "@/lib/authz";
import { signOut } from "@/app/auth/actions";
import { createClient } from "@/lib/server";

type RecruiterPageProps = {
  searchParams: Promise<{ q?: string; type?: string; after?: string; before?: string }>;
};

const jobTypeLabels = {
  teacher: "Teacher",
  engineer: "Engineer",
  doctor: "Doctor",
} as const;

function validDate(value: string | undefined) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value ? null : date;
}

export default async function RecruiterCvsPage({ searchParams }: RecruiterPageProps) {
  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getClaims();
  if (authError || !authData?.claims) redirect("/auth/login");
  if (appRoleFromClaims(authData.claims) !== "admin") redirect("/jobs");

  const { q = "", type = "", after = "", before = "" } = await searchParams;
  const search = q.replace(/[,%_*()\\]/g, "").trim().slice(0, 80);
  const category = isJobType(type) ? type : null;
  const afterDate = validDate(after);
  const beforeDate = validDate(before);

  let cvsQuery = supabase.from("cvs").select("*").order("uploaded_at", { ascending: false }).limit(50);
  if (category) cvsQuery = cvsQuery.eq("job_type", category);
  if (afterDate) cvsQuery = cvsQuery.gte("uploaded_at", afterDate.toISOString());
  if (beforeDate) {
    const nextDay = new Date(`${before}T00:00:00.000Z`);
    nextDay.setUTCDate(nextDay.getUTCDate() + 1);
    cvsQuery = cvsQuery.lt("uploaded_at", nextDay.toISOString());
  }
  if (search) cvsQuery = cvsQuery.or(`owner_email.ilike.%${search}%,file_name.ilike.%${search}%`);

  const { data: cvs, error } = await cvsQuery;
  const email = typeof authData.claims.email === "string" ? authData.claims.email : "Recruiter";

  return (
    <main className="min-h-screen bg-[#f7f8f5] text-[#1b2824]">
      <header className="border-b border-[#e3e8e2] bg-white">
        <div className="mx-auto flex h-[72px] max-w-[1440px] items-center justify-between px-5 sm:px-8 lg:px-12">
          <Link href="/admin/cvs" className="flex items-center gap-2.5" aria-label="Northstar recruiter workspace">
            <span className="grid size-9 place-items-center rounded-[10px] bg-[#173f35] text-white"><BriefcaseBusiness size={18} /></span>
            <span className="font-heading text-[21px] font-semibold">northstar</span>
            <span className="ml-1 hidden rounded bg-[#eef4ef] px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-[#416b58] sm:inline">Recruiter</span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="hidden text-sm text-[#69756f] sm:block">{email}</span>
            <form action={signOut}>
              <button type="submit" title="Sign out" aria-label="Sign out" className="grid size-10 place-items-center rounded-lg border border-[#e3e8e2] text-[#53635c] transition hover:bg-[#f4f6f3]"><LogOut size={17} /></button>
            </form>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1440px] px-5 py-8 sm:px-8 sm:py-10 lg:px-12">
        <div className="mb-7 flex flex-col justify-between gap-5 border-b border-[#e3e8e2] pb-7 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#53776a]">Recruiter workspace</p>
            <h1 className="mt-2 font-heading text-3xl font-medium sm:text-[38px]">CV library</h1>
            <p className="mt-2 text-sm text-[#69756f]">Search private applicant profiles by profession and upload date.</p>
          </div>
          <div className="rounded-lg border border-[#e3e8e2] bg-white px-4 py-2.5 text-sm text-[#627067]">
            <span className="font-semibold text-[#24372e]">{cvs?.length ?? 0}</span> CVs in this view
          </div>
        </div>

        <form action="/admin/cvs" method="get" className="mb-6 grid gap-3 rounded-xl border border-[#e3e8e2] bg-white p-4 sm:grid-cols-2 lg:grid-cols-[minmax(220px,1fr)_160px_160px_160px_auto] lg:items-end">
          <label className="block text-xs font-medium text-[#617067]">
            Email or file name
            <span className="relative mt-1.5 block">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#89948c]" />
              <input name="q" defaultValue={q} placeholder="Search by prefix" className="h-10 w-full rounded-lg border border-[#dfe5df] bg-white pl-9 pr-3 text-sm outline-none focus:border-[#53776a] focus:ring-2 focus:ring-[#53776a]/15" />
            </span>
          </label>
          <label className="block text-xs font-medium text-[#617067]">
            Profession
            <select name="type" defaultValue={category ?? ""} className="mt-1.5 h-10 w-full rounded-lg border border-[#dfe5df] bg-white px-3 text-sm outline-none focus:border-[#53776a]">
              <option value="">All professions</option>
              {Object.entries(jobTypeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <label className="block text-xs font-medium text-[#617067]">Uploaded after<input type="date" name="after" defaultValue={after} className="mt-1.5 h-10 w-full rounded-lg border border-[#dfe5df] bg-white px-3 text-sm outline-none focus:border-[#53776a]" /></label>
          <label className="block text-xs font-medium text-[#617067]">Uploaded before<input type="date" name="before" defaultValue={before} className="mt-1.5 h-10 w-full rounded-lg border border-[#dfe5df] bg-white px-3 text-sm outline-none focus:border-[#53776a]" /></label>
          <button type="submit" className="h-10 rounded-lg bg-[#173f35] px-4 text-sm font-medium text-white transition hover:bg-[#245747]">Apply filters</button>
        </form>

        {error ? (
          <p className="rounded-xl border border-[#eadfd0] bg-white p-5 text-sm text-[#7a6347]">The CV index is unavailable. Apply the database migration and confirm recruiter access is configured.</p>
        ) : cvs?.length ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {cvs.map((cv) => (
              <article key={cv.id} className="overflow-hidden rounded-xl border border-[#e3e8e2] bg-white">
                <Link href={`/admin/cvs/${cv.id}`} className="group block bg-[#eef1ed] p-3" aria-label={`Review ${cv.file_name}`}>
                  <Image
                    src={`/api/cvs/${cv.id}/snapshot`}
                    alt={`First-page snapshot of ${cv.file_name}`}
                    width={600}
                    height={800}
                    unoptimized
                    className="mx-auto h-[230px] w-full rounded-lg bg-white object-contain shadow-sm transition group-hover:shadow-md"
                  />
                </Link>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="truncate text-sm font-semibold">{cv.owner_email}</h2>
                      <p className="mt-1 truncate text-xs text-[#6f7b73]">{cv.file_name}</p>
                    </div>
                    <span className="shrink-0 rounded-md bg-[#eef4ef] px-2 py-1 text-[11px] font-medium text-[#416b58]">{jobTypeLabels[cv.job_type]}</span>
                  </div>
                  <div className="mt-4 flex items-center justify-between border-t border-[#edf0ec] pt-3">
                    <time dateTime={cv.uploaded_at} className="text-xs text-[#7b887f]">{new Date(cv.uploaded_at).toLocaleDateString()}</time>
                    <div className="flex items-center gap-3">
                      <Link href={`/admin/cvs/${cv.id}`} className="text-xs font-medium text-[#315b49] hover:underline">View CV</Link>
                      <a href={`/api/cvs/${cv.id}/file?download=1`} title={`Download ${cv.file_name}`} aria-label={`Download ${cv.file_name}`} className="grid size-8 place-items-center rounded-md text-[#647269] hover:bg-[#f3f5f2]"><Download size={15} /></a>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-[#e3e8e2] bg-white px-6 py-14 text-center">
            <p className="text-sm font-medium text-[#405249]">No CVs match these filters</p>
            <p className="mt-1 text-sm text-[#7a857f]">Try clearing a profession, date, or search filter.</p>
          </div>
        )}
      </div>
    </main>
  );
}