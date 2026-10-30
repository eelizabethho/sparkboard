import "server-only";
import { createClient } from "@/lib/supabase/server";

export type Idea = {
  id: string;
  slug: string;
  title: string;
  pitch: string;
  body: string;
  /** BlockNote blocks; null for posts written before the block editor (render `body` markdown). */
  content: unknown[] | null;
  status: "spark" | "exploring" | "building" | "shipped" | "shelved";
  category: string | null;
  tags: string[];
  links: string[];
  cover_url: string | null;
  /** Cover focal point, 0 (top) – 100 (bottom); used as object-position. */
  cover_y: number;
  is_private: boolean;
  created_at: string;
  updated_at: string;
};

// Card/list fields only: post bodies stay off the home page payload.
const SUMMARY = "id, slug, title, pitch, status, category, tags, cover_url, cover_y, is_private, created_at, updated_at";
export type IdeaSummary = Omit<Idea, "body" | "content" | "links">;

// Request-time (reads cookies): call inside <Suspense>. RLS filters private rows.
export async function listIdeas(): Promise<IdeaSummary[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ideas")
    .select(SUMMARY)
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
