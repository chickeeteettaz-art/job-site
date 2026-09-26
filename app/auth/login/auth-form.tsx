"use client";

import { useActionState, useState } from "react";
import {
    ArrowRight,
    BriefcaseBusiness,
    Check,
    FileText,
    LockKeyhole,
    Search,
    Sparkles,
} from "lucide-react";
import { signInAction, signUpAction, type AuthActionState } from "@/app/auth/actions";

type AuthFormProps = {
    confirmationNotice: string | null;
};

type CredentialsFormProps = {
    mode: "sign-in" | "sign-up";
    confirmationNotice: string | null;
    onModeChange: (mode: "sign-in" | "sign-up") => void;
};

const initialState: AuthActionState = { error: null, message: null };

function CredentialsForm({ mode, confirmationNotice, onModeChange }: CredentialsFormProps) {
    const action = mode === "sign-in" ? signInAction : signUpAction;
    const [state, formAction, isPending] = useActionState(action, initialState);
    const isSignUp = mode === "sign-up";

    return (
        <>
            <div className="mb-8">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#53776a]">
                    {isSignUp ? "Start your search" : "Welcome back"}
                </p>
                <h1 className="mt-3 font-heading text-[34px] font-medium leading-tight text-[#1b2824]">
                    {isSignUp ? "Make your next move." : "Pick up where you left off."}
                </h1>
                <p className="mt-2 text-sm leading-6 text-[#68756e]">
                    {isSignUp
                        ? "Create an account to build your career workspace."
                        : "Sign in to get back to your career workspace."}
                </p>
            </div>

            {(state.error || confirmationNotice) && (
                <p role="alert" className="mb-5 rounded-lg border border-[#f0d2ca] bg-[#fff7f4] px-3.5 py-3 text-sm leading-5 text-[#8c3e2e]">
                    {state.error ?? confirmationNotice}
                </p>
            )}
            {state.message && (
                <p role="status" className="mb-5 rounded-lg border border-[#cfe1d3] bg-[#f2f8f2] px-3.5 py-3 text-sm leading-5 text-[#315b40]">
                    {state.message}
                </p>
            )}

            <form action={formAction} className="space-y-4">
                <label className="block text-sm font-medium text-[#35443d]" htmlFor="email">
                    Email address
                    <input
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        required
                        placeholder="you@example.com"
                        className="mt-2 h-12 w-full rounded-lg border border-[#d9e0d9] bg-white px-3.5 text-[15px] text-[#1b2824] outline-none transition placeholder:text-[#a1aaa4] focus:border-[#53776a] focus:ring-2 focus:ring-[#53776a]/15"
                    />
                </label>
                <label className="block text-sm font-medium text-[#35443d]" htmlFor="password">
                    Password
                    <input
                        id="password"
                        name="password"
                        type="password"
                        autoComplete={isSignUp ? "new-password" : "current-password"}
                        minLength={isSignUp ? 8 : undefined}
                        required
                        placeholder={isSignUp ? "At least 8 characters" : "Enter your password"}
                        className="mt-2 h-12 w-full rounded-lg border border-[#d9e0d9] bg-white px-3.5 text-[15px] text-[#1b2824] outline-none transition placeholder:text-[#a1aaa4] focus:border-[#53776a] focus:ring-2 focus:ring-[#53776a]/15"
                    />
                </label>
                <button
                    type="submit"
                    disabled={isPending}
                    className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#173f35] px-4 text-sm font-semibold text-white transition hover:bg-[#245747] disabled:cursor-wait disabled:opacity-65"
                >
                    {isPending ? "Please wait..." : isSignUp ? "Create account" : "Sign in"}
                    {!isPending && <ArrowRight size={16} />}
                </button>
            </form>

            <p className="mt-6 text-center text-sm text-[#68756e]">
                {isSignUp ? "Already have an account?" : "New to Northstar?"}{" "}
                <button
                    type="button"
                    onClick={() => onModeChange(isSignUp ? "sign-in" : "sign-up")}
                    className="font-semibold text-[#315b49] underline decoration-[#b1c4b7] underline-offset-4 hover:text-[#173f35]"
                >
                    {isSignUp ? "Sign in" : "Create an account"}
                </button>
            </p>
            <div className="mt-8 flex items-center justify-center gap-2 border-t border-[#e8ece7] pt-5 text-xs text-[#859089]">
                <LockKeyhole size={13} /> Your account is protected with secure authentication
            </div>
        </>
    );
}

export default function AuthForm({ confirmationNotice }: AuthFormProps) {
    const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");

    return (
        <main className="grid min-h-screen bg-[#f5f7f3] lg:grid-cols-[1.02fr_0.98fr]">
            <section className="order-2 flex items-center justify-center px-5 py-10 sm:px-10 lg:order-1 lg:px-14 xl:px-20">
                <div className="w-full max-w-[420px] rounded-xl border border-[#e4e9e3] bg-white p-6 shadow-[0_16px_55px_-40px_rgba(29,58,45,0.3)] sm:p-9">
                    <CredentialsForm
                        key={mode}
                        mode={mode}
                        confirmationNotice={confirmationNotice}
                        onModeChange={setMode}
                    />
                </div>
            </section>

            <aside className="order-1 flex min-h-[260px] flex-col justify-between overflow-hidden bg-[#173f35] px-6 py-6 text-white sm:px-10 sm:py-9 lg:order-2 lg:min-h-screen lg:px-14 lg:py-11 xl:px-20">
                <a href="/auth/login" className="flex w-fit items-center gap-2.5" aria-label="Northstar sign in">
                    <span className="grid size-9 place-items-center rounded-[10px] bg-white/10 text-white">
                        <BriefcaseBusiness size={18} strokeWidth={1.8} />
                    </span>
                    <span className="font-heading text-[21px] font-semibold">northstar</span>
                </a>

                <div className="mx-auto w-full max-w-[520px] py-8 lg:py-0">
                    <div className="mb-5 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] text-[#bad2c3]">
                        <Sparkles size={14} /> Your next chapter, in focus
                    </div>
                    <h2 className="max-w-lg font-heading text-[32px] font-medium leading-[1.15] sm:text-[40px]">
                        A job search that feels more like your own.
                    </h2>
                    <p className="mt-4 max-w-md text-sm leading-6 text-[#d1dfd6]">
                        Bring your experience, ambitions, and opportunities into one considered space.
                    </p>

                    <div className="relative mt-8 max-w-[430px] rounded-xl border border-white/15 bg-[#f8faf7] p-4 text-[#25342d] shadow-[0_24px_55px_-30px_rgba(0,0,0,0.6)] sm:mt-10 sm:p-5">
                        <div className="flex items-center justify-between border-b border-[#e7ece6] pb-4">
                            <div className="flex items-center gap-3">
                                <span className="grid size-10 place-items-center rounded-lg bg-[#e6efe7] text-[#416b58]">
                                    <FileText size={19} />
                                </span>
                                <div>
                                    <p className="text-sm font-semibold">Your career workspace</p>
                                    <p className="mt-0.5 text-xs text-[#78847c]">A little progress, every day</p>
                                </div>
                            </div>
                            <span className="grid size-8 place-items-center rounded-full bg-[#e6efe7] text-[#416b58]">
                                <Check size={16} />
                            </span>
                        </div>
                        <div className="space-y-3.5 pt-4">
                            <div className="flex items-center gap-3">
                                <span className="grid size-8 place-items-center rounded-md bg-[#eef2ed] text-[#53776a]"><FileText size={15} /></span>
                                <div className="flex-1">
                                    <div className="h-2 w-28 rounded-full bg-[#b8c7bc]" />
                                    <div className="mt-2 h-1.5 w-40 max-w-full rounded-full bg-[#e1e8e1]" />
                                </div>
                                <span className="text-[11px] text-[#7b887f]">Profile</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="grid size-8 place-items-center rounded-md bg-[#f5eee2] text-[#967344]"><Search size={15} /></span>
                                <div className="flex-1">
                                    <div className="h-2 w-24 rounded-full bg-[#c8d2ca]" />
                                    <div className="mt-2 h-1.5 w-32 max-w-full rounded-full bg-[#e1e8e1]" />
                                </div>
                                <span className="text-[11px] text-[#7b887f]">Opportunities</span>
                            </div>
                        </div>
                    </div>
                </div>

                <p className="hidden text-xs text-[#b9cec1] lg:block">A more thoughtful way to find your next role.</p>
            </aside>
        </main>
    );
}