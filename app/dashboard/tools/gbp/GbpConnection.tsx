"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Location = {
  accountName: string;
  accountLabel: string;
  locationName: string;
  title: string;
  addressLine: string;
};

type Props = {
  connected: boolean;
  googleEmail?: string | null;
  status?: string | null;
  selectedLocationName?: string | null;
  selectedLocationTitle?: string | null;
};

export default function GbpConnection({
  connected,
  googleEmail,
  status,
  selectedLocationName,
  selectedLocationTitle,
}: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [picking, setPicking] = useState(false);
  const [locations, setLocations] = useState<Location[] | null>(null);
  const [loadingLocs, setLoadingLocs] = useState(false);
  const [locError, setLocError] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    if (connected && !selectedLocationName && status === "connected") {
      setPicking(true);
    }
  }, [connected, selectedLocationName, status]);

  async function loadLocations() {
    setLoadingLocs(true);
    setLocError(null);
    setLocations(null);
    try {
      const res = await fetch("/api/gbp/locations");
      const data = (await res.json()) as {
        locations?: Location[];
        error?: string;
      };
      if (!res.ok) throw new Error(data.error ?? "Failed to load locations");
      setLocations(data.locations ?? []);
    } catch (err) {
      setLocError(
        err instanceof Error ? err.message : "Failed to load locations",
      );
    } finally {
      setLoadingLocs(false);
    }
  }

  function openPicker() {
    setPicking(true);
    if (!locations) loadLocations();
  }

  async function handleSelect(loc: Location) {
    setSaving(loc.locationName);
    setLocError(null);
    try {
      const res = await fetch("/api/gbp/select-location", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountName: loc.accountName,
          locationName: loc.locationName,
        }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) throw new Error(data.error ?? "Save failed");
      setPicking(false);
      router.refresh();
    } catch (err) {
      setLocError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(null);
    }
  }

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

  if (!connected) {
    return (
      <section className='card card-default' style={connectCardStyle}>
        <div style={{ minWidth: 0 }}>
          <Eyebrow />
          <p
            className='text-small'
            style={{ margin: 0, color: "var(--text-secondary)" }}
          >
            Connect to enable direct profile updates and one-click posting.
          </p>
          {errorMessage && <p style={errMsgStyle}>{errorMessage}</p>}
        </div>
        <a
          href='/api/gbp/oauth/start'
          className='btn btn-primary'
          style={{ whiteSpace: "nowrap" }}
        >
          Connect Google Business Profile
        </a>
      </section>
    );
  }

  return (
    <section
      className='card card-default'
      style={{
        padding: "var(--space-5) var(--space-6)",
        marginBottom: "var(--space-6)",
      }}
    >
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "var(--space-4)",
        }}
      >
        <div style={{ minWidth: 0 }}>
          <Eyebrow />
          <p className='text-small' style={{ margin: 0, color: "var(--text)" }}>
            <Dot color='var(--status-green)' />
            Connected
            {googleEmail && (
              <span style={{ color: "var(--text-secondary)" }}>
                {" "}
                as{" "}
                <strong style={{ color: "var(--text)" }}>{googleEmail}</strong>
              </span>
            )}
          </p>
          {selectedLocationTitle ? (
            <p
              style={{
                margin: "var(--space-2) 0 0",
                fontSize: "var(--text-sm)",
                color: "var(--text-secondary)",
              }}
            >
              Managing:{" "}
              <strong style={{ color: "var(--text)" }}>
                {selectedLocationTitle}
              </strong>
            </p>
          ) : (
            <p
              style={{
                margin: "var(--space-2) 0 0",
                fontSize: "var(--text-sm)",
                color: "var(--status-yellow)",
              }}
            >
              Pick a location to enable write actions.
            </p>
          )}
          {status === "connected" && !errorMessage && (
            <p style={{ ...errMsgStyle, color: "var(--status-green)" }}>
              ✓ Connection saved.
            </p>
          )}
          {errorMessage && <p style={errMsgStyle}>{errorMessage}</p>}
        </div>

        <div style={{ display: "flex", gap: "var(--space-2)" }}>
          <button
            type='button'
            onClick={openPicker}
            className='btn btn-secondary btn-sm'
          >
            {selectedLocationName ? "Change location" : "Pick a location"}
          </button>
          <button
            type='button'
            onClick={handleDisconnect}
            disabled={busy}
            className='btn btn-ghost btn-sm'
          >
            {busy ? "Disconnecting…" : "Disconnect"}
          </button>
        </div>
      </div>

      {picking && (
        <div
          style={{
            marginTop: "var(--space-5)",
            paddingTop: "var(--space-5)",
            borderTop: "1px solid var(--border)",
          }}
        >
          <header
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              marginBottom: "var(--space-3)",
            }}
          >
            <strong style={{ fontSize: "var(--text-sm)", fontWeight: 600 }}>
              Choose a Google Business Profile location
            </strong>
            <button
              type='button'
              onClick={() => setPicking(false)}
              className='btn btn-ghost btn-sm'
            >
              Close
            </button>
          </header>

          {loadingLocs && (
            <p
              style={{
                fontSize: "var(--text-sm)",
                color: "var(--text-secondary)",
                margin: 0,
              }}
            >
              Loading locations from Google…
            </p>
          )}

          {locError && (
            <p style={{ ...errMsgStyle, marginTop: 0 }}>
              {locError}{" "}
              <button
                type='button'
                onClick={loadLocations}
                style={{
                  background: "none",
                  border: "none",
                  padding: 0,
                  color: "var(--carolina)",
                  textDecoration: "underline",
                  cursor: "pointer",
                  fontSize: "inherit",
                }}
              >
                Try again
              </button>
            </p>
          )}

          {locations && locations.length === 0 && (
            <p
              style={{
                fontSize: "var(--text-sm)",
                color: "var(--text-secondary)",
                margin: 0,
              }}
            >
              No locations found on this Google account. If you manage a
              business in GBP under a different Google account, disconnect and
              reconnect with that one.
            </p>
          )}

          {locations && locations.length > 0 && (
            <ul
              style={{
                listStyle: "none",
                padding: 0,
                margin: 0,
                display: "flex",
                flexDirection: "column",
                gap: "var(--space-2)",
              }}
            >
              {locations.map((loc) => {
                const isSelected = loc.locationName === selectedLocationName;
                const isSaving = saving === loc.locationName;
                return (
                  <li key={loc.locationName}>
                    <button
                      type='button'
                      onClick={() => handleSelect(loc)}
                      disabled={isSaving}
                      style={{
                        width: "100%",
                        textAlign: "left",
                        padding: "var(--space-3) var(--space-4)",
                        background: isSelected
                          ? "var(--carolina)"
                          : "var(--surface2)",
                        color: isSelected ? "#fff" : "var(--text)",
                        border: `1px solid ${
                          isSelected ? "var(--carolina)" : "var(--border)"
                        }`,
                        borderRadius: "var(--radius-md)",
                        cursor: isSaving ? "wait" : "pointer",
                        transition: "all 0.15s ease",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "baseline",
                          gap: "var(--space-3)",
                        }}
                      >
                        <strong
                          style={{
                            fontSize: "var(--text-sm)",
                            fontWeight: 600,
                          }}
                        >
                          {loc.title}
                        </strong>
                        {isSelected && (
                          <span style={{ fontSize: "var(--text-xs)" }}>
                            ✓ Selected
                          </span>
                        )}
                        {isSaving && (
                          <span style={{ fontSize: "var(--text-xs)" }}>
                            Saving…
                          </span>
                        )}
                      </div>
                      {loc.addressLine && (
                        <p
                          style={{
                            margin: "2px 0 0",
                            fontSize: "var(--text-xs)",
                            opacity: 0.85,
                          }}
                        >
                          {loc.addressLine}
                        </p>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}

const connectCardStyle: React.CSSProperties = {
  padding: "var(--space-5) var(--space-6)",
  marginBottom: "var(--space-6)",
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "var(--space-4)",
};

const errMsgStyle: React.CSSProperties = {
  margin: "var(--space-2) 0 0",
  fontSize: "var(--text-xs)",
  color: "var(--status-red)",
};

function Eyebrow() {
  return (
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
  );
}

function Dot({ color }: { color: string }) {
  return (
    <span
      aria-hidden
      style={{
        display: "inline-block",
        width: "8px",
        height: "8px",
        borderRadius: "50%",
        background: color,
        marginRight: "var(--space-2)",
        verticalAlign: "middle",
      }}
    />
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
