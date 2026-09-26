"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/server";

export type AuthActionState = {
    error: string | null;
    message: string | null;
};

function getCredentials(formData: FormData) {
    const email = formData.get("email");
    const password = formData.get("password");

    if (
        typeof email !== "string" ||
        !/^\S+@\S+\.\S+$/.test(email) ||
        typeof password !== "string" ||
        password.length === 0
    ) {
        return null;
    }

    return { email: email.trim(), password };
}

export async function signInAction(
    _previousState: AuthActionState,
    formData: FormData,
): Promise<AuthActionState> {
    const credentials = getCredentials(formData);

    if (!credentials) {
        return { error: "Enter a valid email address and password.", message: null };
    }

    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword(credentials);

    if (error) {
        return { error: "That email and password combination wasn't recognized.", message: null };
    }

    redirect("/");
}

export async function signUpAction(
    _previousState: AuthActionState,
    formData: FormData,
): Promise<AuthActionState> {
    const credentials = getCredentials(formData);

    if (!credentials) {
        return { error: "Enter a valid email address and password.", message: null };
    }

    if (credentials.password.length < 8) {
        return { error: "Use a password with at least 8 characters.", message: null };
    }

    const supabase = await createClient();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
    const { data, error } = await supabase.auth.signUp({
        ...credentials,
        options: {
            emailRedirectTo: new URL("/auth/callback", siteUrl).toString(),
        },
    });

    if (error) {
        return { error: error.message, message: null };
    }

    if (data.session) redirect("/");

    return {
        error: null,
        message: "Check your inbox for a confirmation link. You can sign in after verifying your email.",
    };
}

export async function signOut() {
    const supabase = await createClient();
    await supabase.auth.signOut({ scope: "local" });
    redirect("/auth/login");
}