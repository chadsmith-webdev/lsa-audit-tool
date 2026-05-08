"use client";

import { useState } from "react";
import { createBrowserClient } from "@/lib/supabase";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createBrowserClient();
    const redirectTo =
      process.env.NEXT_PUBLIC_SITE_URL
        ? `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`
        : `${window.location.origin}/auth/callback`;

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectTo,
      },
    });

    setLoading(false);

    if (error) {
      setError("Something went wrong. Try again or contact Chad directly.");
      return;
    }

    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="text-center">
        <p className="text-[#f0f0f0] text-lg mb-2">Check your email.</p>
        <p className="text-[#888888] text-sm">
          We sent a sign-in link to <span className="text-[#7bafd4]">{email}</span>.
          Click it to access your dashboard.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label
          htmlFor="email"
          className="text-[#888888] text-xs uppercase tracking-widest font-semibold"
        >
          Email address
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="bg-[#1e1e1e] border border-[#2e2e2e] rounded-lg px-4 py-3 text-[#f0f0f0] text-sm placeholder:text-[#444] focus:outline-none focus:border-[#7bafd4] transition-colors"
        />
      </div>

      {error && (
        <p className="text-red-400 text-sm">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="bg-[#7bafd4] hover:bg-[#4A6B8A] disabled:opacity-50 disabled:cursor-not-allowed text-[#0a0a0a] font-semibold rounded-lg px-4 py-3 text-sm transition-colors"
      >
        {loading ? "Sending…" : "Send me a sign-in link"}
      </button>

      <p className="text-[#888888] text-xs text-center">
        No password. No account setup. Just click the link in your email.
      </p>
    </form>
  );
}
