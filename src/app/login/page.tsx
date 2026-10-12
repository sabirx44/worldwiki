"use client";
import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState("");

  async function send(e: React.FormEvent) {
    e.preventDefault();
    setState("sending");
    const { error } = await supabaseBrowser().auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${location.origin}/auth/callback` },
    });
    if (error) { setError(error.message); setState("error"); } else setState("sent");
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="font-display text-4xl">Sign in</h1>
      {state === "sent" ? (
        <p className="mt-6 rounded-xl border border-line bg-card p-5">
          Check <b>{email}</b> for a sign-in link. You can close this tab.
        </p>
      ) : (
        <form onSubmit={send} className="mt-6 space-y-4">
          <label className="block">
            <span className="text-sm text-muted">Email</span>
            <input
              type="email" required autoComplete="email" inputMode="email" value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-line bg-card px-3 py-2.5 text-base"
            />
          </label>
          <button disabled={state === "sending"} className="w-full rounded-lg bg-ink px-4 py-3 font-medium text-paper hover:bg-link disabled:opacity-60">
            {state === "sending" ? "Sending…" : "Email me a sign-in link"}
          </button>
          {state === "error" && <p role="alert" className="text-sm text-link">{error}</p>}
          <p className="text-sm text-muted">No password. We send a one-time link to your inbox.</p>
        </form>
      )}
    </div>
  );
}
