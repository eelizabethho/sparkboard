"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { slugify } from "@/lib/slug";
import { createClient } from "@/lib/supabase/server";

export type LoginState = { status: "idle" | "sent" | "error" };

async function requestOrigin() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  return h.get("origin") ?? `${h.get("x-forwarded-proto") ?? "https"}://${host}`;
}

export async function signIn(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return { status: "error" };
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: false, emailRedirectTo: `${await requestOrigin()}/auth/callback` },
  });
  // Unknown emails also error (shouldCreateUser: false); answer "sent" so /login can't confirm the owner's email.
  return { status: error?.status === 429 ? "error" : "sent" };
}

// Sign-ups are off in Supabase, so only the existing owner account can finish this.
export async function signInWithGoogle() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${await requestOrigin()}/auth/callback` },
  });
  redirect(error || !data.url ? "/login?error=1" : data.url);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

const STATUSES = ["spark", "exploring", "building", "shipped", "shelved"] as const;

export type IdeaInput = {
  title: string;
  pitch: string;
  body: string;
  status: (typeof STATUSES)[number];
  category: string | null;
  tags: string[];
  links: string[];
  cover_url: string | null;
  is_private: boolean;
};
export type ActionResult = { error: string } | undefined;

const isHttp = (u: string) => {
  try {
    return ["http:", "https:"].includes(new URL(u).protocol);
  } catch {
    return false;
  }
};
const strings = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : []);

// Trust boundary: the client form is never trusted.
function parse(raw: unknown): { error: string } | { value: IdeaInput } {
  const r = (raw ?? {}) as Record<string, unknown>;
  const title = typeof r.title === "string" ? r.title.trim() : "";
  if (!title) return { error: "Title is required." };
  if (title.length > 200) return { error: "Title must be 200 characters or fewer." };
  if (!STATUSES.includes(r.status as IdeaInput["status"])) return { error: "Invalid status." };
  const cover = typeof r.cover_url === "string" && r.cover_url ? r.cover_url : null;
  if (cover && !isHttp(cover)) return { error: "Invalid cover URL." };
  const category = typeof r.category === "string" ? r.category.trim().slice(0, 60) : "";
  return {
    value: {
      title,
      pitch: typeof r.pitch === "string" ? r.pitch.trim().slice(0, 500) : "",
      body: typeof r.body === "string" ? r.body : "",
      status: r.status as IdeaInput["status"],
      category: category || null,
      tags: [...new Set(strings(r.tags).map((t) => t.trim().toLowerCase()).filter(Boolean))],
      links: [...new Set(strings(r.links).map((l) => l.trim()).filter(isHttp))],
      cover_url: cover,
      is_private: r.is_private !== false,
    },
  };
}

async function authed() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  return data?.claims ? supabase : null;
}

export async function createIdea(raw: IdeaInput): Promise<ActionResult> {
  const parsed = parse(raw);
  if ("error" in parsed) return parsed;
  const supabase = await authed();
  if (!supabase) return { error: "Not signed in." };

  const base = slugify(parsed.value.title);
  let slug = base;
  for (let n = 2; ; n++) {
    const { data, error } = await supabase.from("ideas").select("id").eq("slug", slug).maybeSingle();
    if (error) return { error: "Could not save." };
    if (!data) break;
    slug = `${base}-${n}`;
  }
  const { error } = await supabase.from("ideas").insert({ ...parsed.value, slug });
  if (error) return { error: "Could not save." };
  revalidatePath("/");
  redirect(`/ideas/${slug}`);
}

export async function updateIdea(id: string, raw: IdeaInput): Promise<ActionResult> {
  const parsed = parse(raw);
  if ("error" in parsed) return parsed;
  const supabase = await authed();
  if (!supabase) return { error: "Not signed in." };

  // Slug is deliberately not updated. RLS makes a non-owner update match 0 rows -> single() errors.
  const { data, error } = await supabase.from("ideas").update(parsed.value).eq("id", id).select("slug").single();
  if (error || !data) return { error: "Could not save." };
  revalidatePath("/");
  revalidatePath(`/ideas/${data.slug}`);
  redirect(`/ideas/${data.slug}`);
}

export async function deleteIdea(id: string): Promise<ActionResult> {
  const supabase = await authed();
  if (!supabase) return { error: "Not signed in." };
  const { data, error } = await supabase.from("ideas").delete().eq("id", id).select("slug").single();
  if (error || !data) return { error: "Could not delete." };
  revalidatePath("/");
  revalidatePath(`/ideas/${data.slug}`);
  redirect("/");
}
