import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Download } from "lucide-react";
import { appRoleFromClaims } from "@/lib/authz";
import { createClient } from "@/lib/server";

type RecruiterCvPageProps = {
  params: Promise<{ id: string }>;
};

const jobTypeLabels = {
  teacher: "Teacher",
  engineer: "Engineer",
  doctor: "Doctor",
} as const;

export default async function RecruiterCvPage({ params }: RecruiterCvPageProps) {
  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getClaims();
  if (authError || !authData?.claims) redirect("/auth/login");
  if (appRoleFromClaims(authData.claims) !== "admin") redirect("/jobs");

  const { id } = await params;
  const { data: cv, error } = await supabase.from("cvs").select("*").eq("id", id).maybeSingle();
  if (error || !cv) notFound();

  return (
    <main className="min-h-screen bg-[#f7f8f5] text-[#1b2824]">
      <header className="border-b border-[#e3e8e2] bg-white">
        <div className="mx-auto flex h-[68px] max-w-[1440px] items-center justify-between px-5 sm:px-8 lg:px-12">
          <Link href="/admin/cvs" className="inline-flex items-center gap-2 text-sm font-medium text-[#315b49] hover:underline"><ArrowLeft size={16} /> Back to CV library</Link>
          <a href={`/api/cvs/${cv.id}/file?download=1`} className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#173f35] px-3 text-sm font-medium text-white transition hover:bg-[#245747]"><Download size={15} /> Download</a>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1440px] gap-6 px-5 py-7 sm:px-8 lg:grid-cols-[minmax(0,1fr)_300px] lg:px-12">
        <section className="overflow-hidden rounded-xl border border-[#e3e8e2] bg-white">
          <div className="flex flex-col justify-between gap-3 border-b border-[#e8ece7] px-5 py-4 sm:flex-row sm:items-center">
            <div className="min-w-0">
              <h1 className="truncate text-sm font-semibold">{cv.file_name}</h1>
              <p className="mt-1 text-xs text-[#7b887f]">PDF preview · signed access expires after 60 seconds</p>
            </div>
            <a href={`/api/cvs/${cv.id}/file?download=1`} className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-lg border border-[#dfe5df] px-3 text-sm font-medium text-[#315b49] hover:bg-[#f3f5f2]"><Download size={15} /> Download PDF</a>
          </div>
          <iframe src={`/api/cvs/${cv.id}/file`} title={`CV document for ${cv.owner_email}`} className="h-[78vh] min-h-[560px] w-full bg-[#f1f3f0]" />
        </section>

        <aside className="space-y-4">
          <section className="rounded-xl border border-[#e3e8e2] bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#53776a]">Applicant</p>
            <p className="mt-2 break-all text-sm font-semibold">{cv.owner_email}</p>
            <dl className="mt-5 space-y-3 border-t border-[#edf0ec] pt-4 text-sm">
              <div className="flex justify-between gap-4"><dt className="text-[#77847b]">Profession</dt><dd className="font-medium">{jobTypeLabels[cv.job_type]}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-[#77847b]">Uploaded</dt><dd className="font-medium">{new Date(cv.uploaded_at).toLocaleDateString()}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-[#77847b]">File size</dt><dd className="font-medium">{(cv.file_size_bytes / (1024 * 1024)).toFixed(1)} MB</dd></div>
            </dl>
          </section>
          <section className="rounded-xl border border-[#e3e8e2] bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#53776a]">Snapshot</p>
              <a href={`/api/cvs/${cv.id}/snapshot`} target="_blank" rel="noreferrer" className="text-xs font-medium text-[#315b49] hover:underline">Open image</a>
            </div>
            <Image src={`/api/cvs/${cv.id}/snapshot`} alt={`First-page snapshot of ${cv.file_name}`} width={600} height={800} unoptimized className="h-auto max-h-[420px] w-full rounded-lg border border-[#edf0ec] bg-[#f4f6f3] object-contain" />
          </section>
        </aside>
      </div>
    </main>
  );
}