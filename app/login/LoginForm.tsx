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

    // Check invite list server-side (service key bypasses RLS)
    try {
      const res = await fetch("/api/auth/check-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.toLowerCase().trim() }),
      });
      const { allowed } = await res.json();
      if (!allowed) {
        setError("This email isn't on the access list. Contact Chad to request access.");
        setLoading(false);
        return;
      }
    } catch {
      // Network error — proceed and let Supabase handle it
    }

    const supabase = createBrowserClient();

    const redirectTo =
      process.env.NEXT_PUBLIC_SITE_URL
        ? `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`
        : `${window.location.origin}/auth/callback`;

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo },
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
      <div style={{ textAlign: "center", padding: "var(--space-4) 0" }}>
        <p style={{ fontSize: "var(--text-md)", fontWeight: 600, color: "var(--text)", marginBottom: "var(--space-2)" }}>
          Check your email.
        </p>
        <p className="text-small">
          We sent a sign-in link to{" "}
          <span style={{ color: "var(--carolina)" }}>{email}</span>.
          Click it to access your dashboard.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>

      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
        <label htmlFor="email" className="label">
          Email address
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          disabled={loading}
          className="form-input"
        />
      </div>

      {error && (
        <div style={{
          padding: "var(--space-3) var(--space-4)",
          background: "rgba(255,77,77,0.08)",
          border: "1px solid rgba(255,77,77,0.2)",
          borderRadius: "var(--radius-md)",
        }}>
          <p style={{ fontSize: "var(--text-sm)", color: "var(--status-red)" }}>{error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="btn btn-primary"
        style={{ width: "100%" }}
      >
        {loading ? "Sending…" : "Send me a sign-in link"}
      </button>

      <p className="text-small" style={{ textAlign: "center" }}>
        No password. No account setup. Just click the link in your email.
      </p>

    </form>
  );
}
