import { NextResponse, type NextRequest } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

// The magic-link email lands here with a one-time code; swap it for a session.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const failed = (reason: string) => {
    console.error("[auth/callback]", reason);
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(reason)}`);
  };
  if (!code) return failed(searchParams.get("error_description") ?? "missing code");
  const db = await supabaseServer();
  const { error } = await db.auth.exchangeCodeForSession(code);
  if (error) return failed(error.message);
  return NextResponse.redirect(`${origin}/`);
}
