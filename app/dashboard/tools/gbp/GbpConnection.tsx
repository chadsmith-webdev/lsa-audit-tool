"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  connected: boolean;
  googleEmail?: string | null;
  status?: string | null; // ?gbp=... query param from callback
};

export default function GbpConnection({
  connected,
  googleEmail,
  status,
}: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function handleDisconnect() {
    if (
      !confirm("Disconnect Google Business Profile? You can reconnect anytime.")
    )
      return;
    setBusy(true);
    try {
      const res = await fetch("/api/gbp/disconnect", { method: "POST" });
      if (!res.ok) throw new Error("Disconnect failed");
      router.refresh();
    } catch {
      alert("Could not disconnect. Try again.");
    } finally {
      setBusy(false);
    }
  }

  const errorMessage = errorFromStatus(status);

  return (
    <section
      className='card card-default'
      style={{
        padding: "var(--space-5) var(--space-6)",
        marginBottom: "var(--space-6)",
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "var(--space-4)",
      }}
    >
      <div style={{ minWidth: 0 }}>
        <span
          style={{
            display: "inline-block",
            fontSize: "var(--text-xs)",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            color: "var(--carolina)",
            marginBottom: "var(--space-1)",
          }}
        >
          Google Business Profile
        </span>
        {connected ? (
          <p className='text-small' style={{ margin: 0, color: "var(--text)" }}>
            <span
              aria-hidden
              style={{
                display: "inline-block",
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: "var(--status-green)",
                marginRight: "var(--space-2)",
                verticalAlign: "middle",
              }}
            />
            Connected
            {googleEmail && (
              <span style={{ color: "var(--text-secondary)" }}>
                {" "}
                as{" "}
                <strong style={{ color: "var(--text)" }}>{googleEmail}</strong>
              </span>
            )}
          </p>
        ) : (
          <p
            className='text-small'
            style={{ margin: 0, color: "var(--text-secondary)" }}
          >
            Connect to enable one-click posting and direct profile updates.
          </p>
        )}
        {status === "connected" && !errorMessage && (
          <p
            style={{
              margin: "var(--space-2) 0 0",
              fontSize: "var(--text-xs)",
              color: "var(--status-green)",
            }}
          >
            ✓ Connection saved.
          </p>
        )}
        {errorMessage && (
          <p
            style={{
              margin: "var(--space-2) 0 0",
              fontSize: "var(--text-xs)",
              color: "var(--status-red)",
            }}
          >
            {errorMessage}
          </p>
        )}
      </div>

      {connected ? (
        <button
          type='button'
          onClick={handleDisconnect}
          disabled={busy}
          className='btn btn-secondary btn-sm'
        >
          {busy ? "Disconnecting…" : "Disconnect"}
        </button>
      ) : (
        <a
          href='/api/gbp/oauth/start'
          className='btn btn-primary'
          style={{ whiteSpace: "nowrap" }}
        >
          Connect Google Business Profile
        </a>
      )}
    </section>
  );
}

function errorFromStatus(status?: string | null): string | null {
  switch (status) {
    case "denied":
      return "You declined the Google permission prompt. Connection cancelled.";
    case "state_mismatch":
      return "Security check failed. Try connecting again.";
    case "exchange_failed":
      return "Google rejected the connection. Try again or check that the app is approved for your account.";
    case "no_refresh":
      return "Google didn't return a refresh token. Disconnect from your Google Account permissions and reconnect.";
    case "db_error":
      return "Could not save your connection. Try again.";
    default:
      return null;
  }
}
