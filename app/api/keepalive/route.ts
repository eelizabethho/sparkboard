import { createClient } from "@/lib/supabase/server";

// Hit daily by the Vercel cron so the free Supabase project never pauses for inactivity.
export async function GET() {
  const supabase = await createClient();
  const { error } = await supabase.from("ideas").select("id").limit(1);
  return Response.json({ ok: !error }, { status: error ? 500 : 200 });
}
