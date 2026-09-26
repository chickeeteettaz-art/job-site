import { redirect } from "next/navigation";
import Link from "next/link";
import {
  ArrowUpRight,
  Bookmark,
  BriefcaseBusiness,
  FileText,
  LogOut,
  Search,
  Sparkles,
} from "lucide-react";
import { signOut } from "@/app/auth/actions";
import { createClient } from "@/lib/server";

const suggestedRoles = [
  {
    company: "Linear",
    title: "Product Designer",
    location: "Remote · North America",
    type: "Full time",
    initials: "L",
    color: "bg-violet-100 text-violet-800",
  },
  {
    company: "Figma",
    title: "Design Systems Lead",
    location: "New York · Hybrid",
    type: "Full time",
    initials: "F",
    color: "bg-orange-100 text-orange-800",
  },
  {
    company: "Webflow",
    title: "Senior UX Researcher",
    location: "Remote · United States",
    type: "Full time",
    initials: "W",
    color: "bg-sky-100 text-sky-800",
  },
];

export default async function Home() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims) redirect("/auth/login");

  const email = typeof data.claims.email === "string" ? data.claims.email : "there";

  return (
    <main className="min-h-screen bg-[#f7f8f5] text-[#1b2824]">
      <header className="border-b border-[#e3e8e2] bg-white">
        <div className="mx-auto flex h-[72px] max-w-[1440px] items-center justify-between px-5 sm:px-8 lg:px-12">
          <Link href="/" className="flex items-center gap-2.5" aria-label="Northstar home">
            <span className="grid size-9 place-items-center rounded-[10px] bg-[#173f35] text-white">
              <BriefcaseBusiness size={18} strokeWidth={1.8} />
            </span>
            <span className="font-heading text-[21px] font-semibold">northstar</span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="hidden text-sm text-[#69756f] sm:block">{email}</span>
            <form action={signOut}>
              <button
                type="submit"
                title="Sign out"
                aria-label="Sign out"
                className="grid size-10 place-items-center rounded-lg border border-[#e3e8e2] text-[#53635c] transition hover:bg-[#f4f6f3] hover:text-[#173f35]"
              >
                <LogOut size={17} />
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1440px] px-5 py-8 sm:px-8 sm:py-10 lg:px-12">
        <section className="flex flex-col justify-between gap-6 border-b border-[#e3e8e2] pb-8 sm:flex-row sm:items-end">
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-[#53776a]">Your workspace</p>
            <h1 className="font-heading text-3xl font-medium tracking-tight sm:text-[38px]">
              Good to have you here.
            </h1>
            <p className="mt-2 text-sm text-[#69756f]">A clearer way to move your career forward.</p>
          </div>
          <a
            href="#recommended"
            className="inline-flex h-11 items-center justify-center gap-2 self-start rounded-lg bg-[#173f35] px-4 text-sm font-medium text-white transition hover:bg-[#245747] sm:self-auto"
          >
            <Search size={16} />
            Explore jobs
          </a>
        </section>

        <section className="grid gap-5 py-7 lg:grid-cols-[1.25fr_0.75fr]">
          <div className="relative overflow-hidden rounded-xl bg-[#173f35] p-6 text-white sm:p-8">
            <div className="pointer-events-none absolute -right-12 -top-16 size-64 rounded-full border border-white/10" />
            <div className="pointer-events-none absolute -right-2 -top-6 size-44 rounded-full border border-white/10" />
            <div className="relative max-w-[560px]">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs text-[#e3eee8]">
                <Sparkles size={13} /> Built around your next move
              </span>
              <h2 className="mt-5 max-w-lg font-heading text-[28px] leading-tight sm:text-[34px]">
                Find work that fits the life you want.
              </h2>
              <p className="mt-3 max-w-md text-sm leading-6 text-[#d0dfd8]">
                Keep promising roles, track your search, and make your next step with confidence.
              </p>
              <a href="#recommended" className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-white hover:text-[#d7f0df]">
                See roles picked for you <ArrowUpRight size={16} />
              </a>
            </div>
          </div>

          <div className="flex flex-col justify-between gap-5 rounded-xl border border-[#e3e8e2] bg-white p-6 sm:p-7">
            <div>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold">Build your profile</p>
                  <p className="mt-1 text-sm leading-5 text-[#69756f]">A few details help us find better matches.</p>
                </div>
                <span className="rounded-md bg-[#eef4ef] px-2.5 py-1 text-xs font-medium text-[#416b58]">Getting started</span>
              </div>
              <div className="mt-6 h-1.5 overflow-hidden rounded-full bg-[#edf0ec]">
                <div className="h-full w-1/3 rounded-full bg-[#5b9074]" />
              </div>
              <p className="mt-2 text-xs text-[#7a857f]">1 of 3 steps complete</p>
            </div>
            <div className="flex items-center gap-3 border-t border-[#edf0ec] pt-4">
              <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-[#f2f5f0] text-[#53776a]">
                <FileText size={18} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">Add your CV</p>
                <p className="mt-0.5 text-xs text-[#7a857f]">Make your profile ready to share</p>
              </div>
              <span title="CV upload setup is coming next" className="grid size-9 place-items-center rounded-lg text-[#75827a]">
                <ArrowUpRight size={16} />
              </span>
            </div>
          </div>
        </section>

        <section id="recommended" className="pt-5">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#53776a]">A starting point</p>
              <h2 className="mt-2 font-heading text-2xl font-medium">Roles to explore</h2>
            </div>
            <button type="button" className="hidden items-center gap-2 rounded-lg border border-[#dfe5df] bg-white px-3.5 py-2.5 text-sm text-[#53635c] sm:inline-flex">
              <Bookmark size={15} /> Saved roles
            </button>
          </div>
          <div className="divide-y divide-[#edf0ec] rounded-xl border border-[#e3e8e2] bg-white">
            {suggestedRoles.map((role) => (
              <article key={role.company} className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:px-5">
                <span className={`grid size-11 shrink-0 place-items-center rounded-[10px] text-sm font-semibold ${role.color}`}>
                  {role.initials}
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-semibold">{role.title}</h3>
                  <p className="mt-1 text-sm text-[#69756f]">{role.company} <span className="px-1 text-[#bbc2bc]">·</span> {role.location}</p>
                </div>
                <div className="flex items-center justify-between gap-4 sm:justify-end">
                  <span className="rounded-md bg-[#f3f5f2] px-2.5 py-1.5 text-xs text-[#617067]">{role.type}</span>
                  <button type="button" title={`View ${role.title}`} aria-label={`View ${role.title}`} className="grid size-9 place-items-center rounded-lg text-[#65736b] transition hover:bg-[#f3f5f2] hover:text-[#173f35]">
                    <ArrowUpRight size={17} />
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
