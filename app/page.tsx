import { redirect } from "next/navigation";
import { appRoleFromClaims } from "@/lib/authz";
import { createClient } from "@/lib/server";

export default async function Home() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims) redirect("/auth/login");

  redirect(appRoleFromClaims(data.claims) === "admin" ? "/admin/cvs" : "/jobs");
}
