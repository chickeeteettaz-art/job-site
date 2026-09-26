import { redirect } from "next/navigation";
import { createClient } from "@/lib/server";
import AuthForm from "./auth-form";

type LoginPageProps = {
    searchParams: Promise<{ status?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
    const supabase = await createClient();
    const { data } = await supabase.auth.getClaims();

    if (data?.claims) redirect("/");

    const { status } = await searchParams;
    const confirmationNotice =
        status === "confirmation-failed"
            ? "That confirmation link could not be verified. Try requesting a new one by creating your account again."
            : null;

    return <AuthForm confirmationNotice={confirmationNotice} />;
}