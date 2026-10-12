"use client";
import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";

// Email links land here with the session in the URL fragment (#access_token=…).
// The browser client stores it in cookies, then we go home with a full reload so
// the server sees the new session.
export default function AuthDone() {
  const [message, setMessage] = useState("Signing you in…");

  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.slice(1));
    const linkError = hash.get("error_description");
    if (linkError) {
      window.location.replace(`/login?error=${encodeURIComponent(linkError)}`);
      return;
    }
    const db = supabaseBrowser();
    let done = false;
    const finish = () => { if (!done) { done = true; window.location.replace("/"); } };
    const { data: sub } = db.auth.onAuthStateChange((_event, session) => { if (session) finish(); });
    db.auth.getSession().then(({ data }) => { if (data.session) finish(); });
    const timer = setTimeout(() => {
      if (!done) setMessage("This sign-in link didn't work. It may have expired or been used already. Request a new one.");
    }, 6000);
    return () => { sub.subscription.unsubscribe(); clearTimeout(timer); };
  }, []);

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <p className="text-lg" role="status">{message}</p>
      {message.startsWith("This") && (
        <a href="/login" className="mt-4 inline-block underline underline-offset-4">Back to sign in</a>
      )}
    </div>
  );
}
