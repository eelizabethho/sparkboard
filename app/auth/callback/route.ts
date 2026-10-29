import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// The magic-link email template points here with ?token_hash=…&type=email, which works in any browser.
// ?code= (PKCE) is kept as a fallback for the default template; it only works in the requesting browser.
export async function GET(request: NextRequest) {
  const { origin, searchParams } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const code = searchParams.get("code");
  const supabase = await createClient();
  const { error } = tokenHash
    ? await supabase.auth.verifyOtp({ type: "email", token_hash: tokenHash })
    : code
      ? await supabase.auth.exchangeCodeForSession(code)
      : { error: new Error("missing token") };
  if (!error) return NextResponse.redirect(`${origin}/`);
  console.error("auth callback:", error.name, error.message);
  return NextResponse.redirect(`${origin}/login?error=1`);
}
