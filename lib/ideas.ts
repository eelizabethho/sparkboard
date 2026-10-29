import "server-only";
import { createClient } from "@/lib/supabase/server";

export type Idea = {
  id: string;
  slug: string;
  title: string;
  pitch: string;
  body: string;
  status: "spark" | "exploring" | "building" | "shipped" | "shelved";
  category: string | null;
  tags: string[];
  links: string[];
  cover_url: string | null;
  is_private: boolean;
  created_at: string;
  updated_at: string;
};

// Request-time (reads cookies): call inside <Suspense>. RLS filters private rows.
export async function listIdeas(): Promise<Idea[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ideas")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function getIdea(slug: string): Promise<Idea | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("ideas").select("*").eq("slug", slug).maybeSingle();
  if (error) throw error;
  return data;
}

// Any logged-in user counts: signups are disabled and RLS enforces the real owner check.
export async function isOwner(): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  return !!data?.claims;
}
