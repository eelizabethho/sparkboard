"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type LoginState = { status: "idle" | "sent" | "error" };

export async function signIn(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return { status: "error" };
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const origin = h.get("origin") ?? `${h.get("x-forwarded-proto") ?? "https"}://${host}`;
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: false, emailRedirectTo: `${origin}/auth/callback` },
  });
  // Same answer whether or not the email exists, so nothing leaks.
  return { status: error ? "error" : "sent" };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
