import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

// Email links point here with a one-time token hash. Verifying it on the server
// works in any browser, unlike the code flow, which needs the tab that asked for it.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = (searchParams.get("type") ?? "email") as EmailOtpType;
  const failed = (reason: string) => {
    console.error("[auth/confirm]", reason);
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(reason)}`);
  };
  if (!token_hash) return failed("The sign-in link is incomplete. Request a new one.");
  const db = await supabaseServer();
  const { error } = await db.auth.verifyOtp({ type, token_hash });
  if (error) return failed(error.message);
  return NextResponse.redirect(`${origin}/`);
}
