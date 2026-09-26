"use client";

import { useEffect, useState, type FormEvent, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowUpFromLine, FileText, Image as ImageIcon } from "lucide-react";
import type { JobType } from "@/lib/database.types";
import { createPdfSnapshot } from "@/lib/pdf-snapshot";

const maxFileSize = 10 * 1024 * 1024;

const jobTypes: { value: JobType; label: string }[] = [
  { value: "teacher", label: "Teacher" },
  { value: "engineer", label: "Engineer" },
  { value: "doctor", label: "Doctor" },
];

type UploadUrlResponse = {
  error?: string;
  uploadId: string;
  fileKey: string;
  snapshotKey: string;
  filePutUrl: string;
  snapshotPutUrl: string;
};

function getApiError(body: unknown, fallback: string) {
  return body && typeof body === "object" && "error" in body && typeof body.error === "string"
    ? body.error
    : fallback;
}

export default function CvUploadForm() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [snapshot, setSnapshot] = useState<File | null>(null);
  const [snapshotUrl, setSnapshotUrl] = useState<string | null>(null);
  const [jobType, setJobType] = useState<JobType>("engineer");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    return () => {
      if (snapshotUrl) URL.revokeObjectURL(snapshotUrl);
    };
  }, [snapshotUrl]);

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const selected = event.currentTarget.files?.[0] ?? null;
    setError("");
    setStatus("");
    setFile(null);
    setSnapshot(null);
    setSnapshotUrl(null);

    if (!selected) return;
    if (!selected.name.toLowerCase().endsWith(".pdf") || selected.size > maxFileSize) {
      setError("Choose a PDF file smaller than 10 MB.");
      event.currentTarget.value = "";
      return;
    }

    setFile(selected);
    setStatus("Preparing first-page preview...");

    try {
      const preview = await createPdfSnapshot(selected);
      setSnapshot(preview);
      setSnapshotUrl(URL.createObjectURL(preview));
      setStatus("");
    } catch {
      setFile(null);
      setError("This PDF could not be previewed. Try exporting it again and uploading the new file.");
      event.currentTarget.value = "";
      setStatus("");
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file || !snapshot) {
      setError("Choose a PDF so we can prepare its preview.");
      return;
    }

    setBusy(true);
    setError("");

    try {
      setStatus("Preparing secure upload...");
      const urlResponse = await fetch("/api/cvs/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contentType: "application/pdf",
          fileSizeBytes: file.size,
          snapshotSizeBytes: snapshot.size,
        }),
      });
      const urlResult = (await urlResponse.json()) as UploadUrlResponse;
      if (!urlResponse.ok) throw new Error(getApiError(urlResult, "Could not start the CV upload."));

      setStatus("Uploading your CV and preview...");
      const [fileResponse, snapshotResponse] = await Promise.all([
        fetch(urlResult.filePutUrl, {
          method: "PUT",
          headers: { "Content-Type": "application/pdf" },
          body: file,
        }),
        fetch(urlResult.snapshotPutUrl, {
          method: "PUT",
          headers: { "Content-Type": "image/png" },
          body: snapshot,
        }),
      ]);

      if (!fileResponse.ok || !snapshotResponse.ok) {
        throw new Error("S3 could not store both files. Please try again.");
      }

      setStatus("Saving your CV details...");
      const saveResponse = await fetch("/api/cvs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uploadId: urlResult.uploadId,
          fileName: file.name.replace(/[\\/\u0000-\u001f]/g, "_").slice(0, 160),
          fileSizeBytes: file.size,
          jobType,
        }),
      });
      const saveResult: unknown = await saveResponse.json();
      if (!saveResponse.ok) throw new Error(getApiError(saveResult, "Could not save the CV record."));

      event.currentTarget.reset();
      setFile(null);
      setSnapshot(null);
      setSnapshotUrl(null);
      setStatus("CV uploaded. Your profile now includes its first-page preview.");
      router.refresh();
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "The CV upload failed.");
      setStatus("");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_220px]">
      <div className="space-y-4">
        <label htmlFor="cv-job-type" className="block text-sm font-medium text-[#35443d]">
          CV job type
          <select
            id="cv-job-type"
            value={jobType}
            onChange={(event) => setJobType(event.target.value as JobType)}
            className="mt-2 h-11 w-full rounded-lg border border-[#d9e0d9] bg-white px-3 text-sm outline-none focus:border-[#53776a] focus:ring-2 focus:ring-[#53776a]/15"
          >
            {jobTypes.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
          </select>
        </label>

        <label htmlFor="cv-file" className="block cursor-pointer rounded-lg border border-dashed border-[#bac9bd] bg-[#f8faf7] p-4 transition hover:border-[#53776a] hover:bg-[#f3f7f2]">
          <span className="flex items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-white text-[#53776a] shadow-sm">
              {file ? <FileText size={18} /> : <ArrowUpFromLine size={18} />}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium text-[#263830]">{file?.name ?? "Choose a CV PDF"}</span>
              <span className="mt-1 block text-xs text-[#77847b]">PDF · up to 10 MB</span>
            </span>
          </span>
          <input id="cv-file" type="file" accept="application/pdf,.pdf" onChange={handleFileChange} className="sr-only" />
        </label>

        {error && <p role="alert" className="text-sm text-[#9a4235]">{error}</p>}
        {status && <p role="status" className="text-sm text-[#496b56]">{status}</p>}

        <button
          type="submit"
          disabled={busy || !file || !snapshot}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#173f35] px-4 text-sm font-medium text-white transition hover:bg-[#245747] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ArrowUpFromLine size={16} />
          {busy ? "Uploading..." : "Upload CV"}
        </button>
      </div>

      <div className="min-h-48 overflow-hidden rounded-lg border border-[#e4e9e3] bg-[#f4f6f3] p-3">
        <p className="mb-2 flex items-center gap-2 text-xs font-medium text-[#66756b]">
          <ImageIcon size={14} /> First-page snapshot
        </p>
        {snapshotUrl ? (
          <Image
            src={snapshotUrl}
            alt="First page of your selected CV"
            width={520}
            height={736}
            unoptimized
            className="mx-auto max-h-56 w-auto max-w-full rounded border border-[#e1e6e0] object-contain shadow-sm"
          />
        ) : (
          <div className="grid min-h-36 place-items-center text-center text-xs text-[#88938b]">Your PDF preview will appear here.</div>
        )}
      </div>
    </form>
  );
}