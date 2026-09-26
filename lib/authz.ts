import { createClient } from "@/lib/server";

export type AppRole = "user" | "admin";

export function appRoleFromClaims(claims: unknown): AppRole {
  if (claims === null || typeof claims !== "object") return "user";

  const appMetadata = (claims as { app_metadata?: unknown }).app_metadata;
  if (appMetadata === null || typeof appMetadata !== "object") return "user";

  return (appMetadata as { role?: unknown }).role === "admin" ? "admin" : "user";
}

export function isJobType(value: unknown): value is "teacher" | "engineer" | "doctor" {
  return value === "teacher" || value === "engineer" || value === "doctor";
}

export async function getRequestIdentity() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims;

  if (error || !claims || typeof claims.sub !== "string") return null;

  return {
    supabase,
    claims,
    userId: claims.sub,
    role: appRoleFromClaims(claims),
  };
}

export function hasSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  return origin !== null && origin === new URL(request.url).origin;
}