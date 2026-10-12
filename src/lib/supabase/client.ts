"use client";
import { createBrowserClient } from "@supabase/ssr";

// Implicit flow: the email link carries the session in the URL fragment, so it
// works in whichever browser opens it. (The code flow needs the tab that asked
// for the link, and Supabase's free plan doesn't allow editing email templates
// to use the server-side token-hash route instead.)
export function supabaseBrowser() {
  return createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { flowType: "implicit", detectSessionInUrl: true },
  });
}
