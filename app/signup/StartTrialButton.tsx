"use client";

import { useState } from "react";

export default function StartTrialButton({
  tier,
  billing,
}: {
  tier: "pro" | "multi_location";
  billing: "monthly" | "annual";
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleStart() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/paypal/start-trial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier, billing }),
      });
      const data = (await res.json()) as {
        approveUrl?: string;
        error?: string;
        detail?: string;
      };
      if (!res.ok || !data.approveUrl) {
        const base =
          data.error ?? "Couldn't start the trial. Try again in a moment.";
        setError(data.detail ? `${base} — ${data.detail}` : base);
        setLoading(false);
        return;
      }
      window.location.href = data.approveUrl;
    } catch {
      setError("Network error. Check your connection and try again.");
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type='button'
        onClick={handleStart}
        disabled={loading}
        style={{
          width: "100%",
          padding: "var(--space-4) var(--space-5)",
          background: "var(--carolina)",
          color: "white",
          border: "none",
          borderRadius: "var(--radius-md)",
          fontSize: "var(--text-md)",
          fontWeight: 700,
          cursor: loading ? "wait" : "pointer",
          opacity: loading ? 0.7 : 1,
          transition: "opacity 0.15s ease",
        }}
      >
        {loading ? "Connecting to PayPal…" : "Continue to PayPal →"}
      </button>
      {error && (
        <p
          role='alert'
          style={{
            marginTop: "var(--space-3)",
            fontSize: "var(--text-sm)",
            color: "var(--status-red)",
          }}
        >
          {error}
        </p>
      )}
    </>
  );
}
