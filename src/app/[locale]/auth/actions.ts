"use server";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function signIn(formData: FormData) {
  const supabase = await createClient();
  const email = String(formData.get("email"));
  const password = String(formData.get("password"));
  const locale = String(formData.get("locale") || "fr");
  const next = String(formData.get("next") || `/${locale}`);
  const { error, data } = await supabase.auth.signInWithPassword({ email, password });
  if (error) redirect(`/${locale}/auth/login?error=${encodeURIComponent(error.message)}`);
  const { data: prof } = await supabase.from("profiles").select("role").eq("id", data.user.id).single<{ role: string }>();
  if (prof?.role === "admin") redirect(`/${locale}/admin`);
  redirect(next.startsWith("/") ? next : `/${locale}`);
}

export async function signUp(formData: FormData) {
  const supabase = await createClient();
  const email = String(formData.get("email"));
  const password = String(formData.get("password"));
  const role = (String(formData.get("role")) === "architect" ? "architect" : "client");
  const first_name = String(formData.get("first_name") || "").trim();
  const last_name = String(formData.get("last_name") || "").trim();
  const locale = String(formData.get("locale") || "fr");
  const { error } = await supabase.auth.signUp({
    email, password,
    options: {
      data: { role, first_name, last_name, locale },
      emailRedirectTo: `${process.env.SITE_URL}/${locale}/auth/callback`,
    },
  });
  if (error) redirect(`/${locale}/auth/register?role=${role}&error=${encodeURIComponent(error.message)}`);
  if (role === "architect") redirect(`/${locale}/architectes/rejoindre`);
  redirect(`/${locale}/projets/initier`);
}

export async function signOut(locale: string) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect(`/${locale}`);
}

export async function forgot(formData: FormData) {
  const supabase = await createClient();
  const email = String(formData.get("email"));
  const locale = String(formData.get("locale") || "fr");
  await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${process.env.SITE_URL}/${locale}/auth/callback?type=recovery` });
  redirect(`/${locale}/auth/login?sent=1`);
}
