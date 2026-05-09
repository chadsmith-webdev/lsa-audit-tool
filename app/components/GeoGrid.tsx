"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { rankColor, rankLabel } from "@/lib/grid";
import { getSuggestedKeywords } from "@/lib/keywords";

const GeoGridMap = dynamic(() => import("./GeoGridMap"), {
  ssr: false,
  loading: () => (
    <div style={{
      height: 380,
      background: "var(--surface2)",
      borderRadius: "var(--radius-md)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}>
      <p style={{ color: "var(--muted)", fontSize: "var(--text-sm)" }}>Loading map…</p>
    </div>
  ),
});

interface GridResult {
  point_index: number;
  lat: number;
  lng: number;
  rank: number | null;
  competitors: { title: string; rank: number | null }[];
}

interface ScanMeta {
  id: string;
  keyword: string;
  business_name: string;
  center_lat: number;
  center_lng: number;
  radius_miles: number;
  grid_size: number;
  created_at: string;
}

interface Props {
  businessName?: string;
  trade?: string;
  city?: string;
  recentScans?: ScanMeta[];
}

export default function GeoGrid({ businessName = "", trade = "", city = "", recentScans = [] }: Props) {
  const searchParams = useSearchParams();
  const suggestedKeywords = getSuggestedKeywords(trade, city);
  const [keyword, setKeyword] = useState(
    searchParams.get("keyword") ?? suggestedKeywords[0] ?? ""
  );
  const [businessNameInput, setBusinessNameInput] = useState(businessName);
  const [locationInput, setLocationInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<GridResult[] | null>(null);
  const [scan, setScan] = useState<ScanMeta | null>(null);
  const [hovered, setHovered] = useState<GridResult | null>(null);
  // deltas: point_index → positive = improved (rank number went down), negative = worsened, 0 = no change, null = no previous data
  const [deltas, setDeltas] = useState<Record<number, number | null>>({});

  // Find the previous scan for the same keyword+business and compute per-point rank deltas.
  // delta > 0 means rank improved (number dropped), delta < 0 means rank worsened.
  async function computeDeltas(currentResults: GridResult[], currentScanId: string, kw: string, biz: string) {
    const prev = recentScans.find(
      (s) =>
        s.id !== currentScanId &&
        s.keyword.toLowerCase() === kw.toLowerCase() &&
        s.business_name.toLowerCase() === biz.toLowerCase()
    );
    if (!prev) {
      setDeltas({});
      return;
    }
    try {
      const res = await fetch(`/api/grid?scanId=${prev.id}`);
      if (!res.ok) { setDeltas({}); return; }
      const data = await res.json();
      const prevResults: GridResult[] = data.results ?? [];
      const map: Record<number, number | null> = {};
      for (const cur of currentResults) {
        const old = prevResults.find((r) => r.point_index === cur.point_index);
        if (!old) { map[cur.point_index] = null; continue; }
        if (cur.rank === null && old.rank === null) { map[cur.point_index] = 0; continue; }
        if (cur.rank === null) { map[cur.point_index] = -1; continue; } // dropped out
        if (old.rank === null) { map[cur.point_index] = 1; continue; }  // newly appeared
        map[cur.point_index] = old.rank - cur.rank; // positive = improved
      }
      setDeltas(map);
    } catch {
      setDeltas({});
    }
  }

  async function runScan() {
    if (!keyword.trim() || !businessNameInput.trim() || !locationInput.trim()) return;
    setLoading(true);
    setError(null);
    setResults(null);
    setScan(null);

    // Geocode the location via OpenStreetMap Nominatim
    let centerLat: number;
    let centerLng: number;
    try {
      const geoRes = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(locationInput)}&format=json&limit=1`,
        { headers: { "Accept-Language": "en" } }
      );
      if (!geoRes.ok) {
        // Nominatim rate-limits at ~1 req/sec. A 429 here means too many
        // geocoding requests from this browser in quick succession.
        if (geoRes.status === 429) {
          setError("Geocoding rate limit hit — wait a few seconds and try again.");
        } else {
          setError(`Geocoding service error (${geoRes.status}). Try again shortly.`);
        }
        setLoading(false);
        return;
      }
      const geoData = await geoRes.json();
      if (!geoData || geoData.length === 0) {
        setError("Couldn't find that location. Try a more specific address or city name.");
        setLoading(false);
        return;
      }
      centerLat = parseFloat(geoData[0].lat);
      centerLng = parseFloat(geoData[0].lon);
    } catch {
      setError("Geocoding failed. Check your internet connection and try again.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/grid", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          keyword: keyword.trim(),
          businessName: businessNameInput.trim(),
          centerLat,
          centerLng,
          auditId: null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Scan failed. Try again.");
        return;
      }

      setResults(data.results as GridResult[]);
      setScan({
        id: data.scanId,
        keyword: keyword.trim(),
        business_name: businessNameInput.trim(),
        center_lat: centerLat,
        center_lng: centerLng,
        radius_miles: 1,
        grid_size: 5,
        created_at: new Date().toISOString(),
      });
      computeDeltas(data.results as GridResult[], data.scanId, keyword.trim(), businessNameInput.trim());
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  async function loadScan(scanId: string) {
    setLoading(true);
    setError(null);
    setResults(null);
    setScan(null);
    try {
      const res = await fetch(`/api/grid?scanId=${scanId}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to load scan.");
        return;
      }
      setResults(data.results as GridResult[]);
      setScan(data.scan as ScanMeta);
      computeDeltas(data.results as GridResult[], scanId, data.scan.keyword, data.scan.business_name);
    } catch {
      setError("Something went wrong loading that scan.");
    } finally {
      setLoading(false);
    }
  }

  const GRID_SIZE = scan?.grid_size ?? 5;
  const sorted = results
    ? [...results].sort((a, b) => a.point_index - b.point_index)
    : null;

  return (
    <div className="card card-default">

      {/* Header */}
      <div style={{ marginBottom: "var(--space-5)" }}>
        <p className="label" style={{ marginBottom: "var(--space-2)" }}>Geo-Grid Rank Tracker</p>
        <h2 className="heading-3">Local Visibility Map</h2>
        <p className="text-small" style={{ marginTop: "var(--space-2)" }}>
          See where a business ranks across a 5×5 grid of a service area for any keyword.
        </p>
      </div>

      {/* Form */}
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)", marginBottom: "var(--space-5)" }}>
        <input
          type="text"
          value={businessNameInput}
          onChange={(e) => setBusinessNameInput(e.target.value)}
          placeholder="Business name (as it appears on Google Maps)"
          disabled={loading}
          className="form-input"
        />
        <input
          type="text"
          value={locationInput}
          onChange={(e) => setLocationInput(e.target.value)}
          placeholder="Service area center (e.g. Siloam Springs, AR)"
          disabled={loading}
          className="form-input"
        />
        {suggestedKeywords.length > 0 && (
          <div>
            <p className="text-small" style={{ marginBottom: "var(--space-2)", color: "var(--muted)" }}>
              Suggested keywords
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-2)" }}>
              {suggestedKeywords.map((kw) => (
                <button
                  key={kw}
                  onClick={() => setKeyword(kw)}
                  disabled={loading}
                  className="btn btn-ghost btn-sm"
                  style={{
                    border: keyword === kw ? "1px solid var(--carolina)" : "1px solid var(--surface2)",
                    color: keyword === kw ? "var(--carolina)" : "var(--muted)",
                    borderRadius: "var(--radius-full)",
                    fontSize: "0.75rem",
                  }}
                >
                  {kw}
                </button>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: "flex", gap: "var(--space-3)" }}>
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && runScan()}
            placeholder="Keyword (e.g. HVAC repair Siloam Springs AR)"
            disabled={loading}
            className="form-input"
            style={{ flex: 1 }}
          />
          <button
            onClick={runScan}
            disabled={loading || !keyword.trim() || !businessNameInput.trim() || !locationInput.trim()}
            className="btn btn-primary"
          >
            {loading ? "Scanning…" : "Run Scan"}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <p style={{
          padding: "var(--space-3) var(--space-4)",
          background: "rgba(255,77,77,0.08)",
          border: "1px solid rgba(255,77,77,0.2)",
          borderRadius: "var(--radius-md)",
          color: "var(--status-red)",
          fontSize: "var(--text-sm)",
          marginBottom: "var(--space-5)",
        }}>
          {error}
        </p>
      )}

      {/* Loading state */}
      {loading && (
        <div style={{ textAlign: "center", padding: "var(--space-10) 0" }}>
          <p className="text-small">Checking 25 grid points… this takes ~30 seconds.</p>
        </div>
      )}

      {/* Grid */}
      {sorted && scan && !loading && (
        <div>
          {/* Scan summary */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--space-3)",
            marginBottom: "var(--space-4)",
            flexWrap: "wrap",
          }}>
            <span className="text-small">
              <strong style={{ color: "var(--text)" }}>{scan.business_name}</strong>
            </span>
            <span style={{ color: "var(--border-strong)" }}>·</span>
            <span className="text-small">{scan.keyword}</span>
          </div>

          {/* Legend */}
          <div style={{
            display: "flex",
            gap: "var(--space-4)",
            marginBottom: "var(--space-4)",
            flexWrap: "wrap",
          }}>
            {[
              { color: "#00c96b", label: "Rank 1–3" },
              { color: "#f5c000", label: "Rank 4–10" },
              { color: "#ff4d4d", label: "Rank 11–20" },
              { color: "var(--surface2)", label: "Not found" },
            ].map(({ color, label }) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                <span style={{
                  width: "12px",
                  height: "12px",
                  borderRadius: "var(--radius-xs)",
                  background: color,
                  flexShrink: 0,
                }} />
                <span className="text-small">{label}</span>
              </div>
            ))}
          </div>

          {/* Map overlay */}
          <div style={{ marginBottom: "var(--space-4)" }}>
            <GeoGridMap
              results={sorted}
              scan={scan}
              hovered={hovered}
              deltas={deltas}
              onHover={setHovered}
              height={380}
            />
          </div>

          {/* Tooltip panel */}
          {hovered && (
            <div style={{
              background: "var(--surface2)",
              border: "1px solid var(--border-strong)",
              borderRadius: "var(--radius-md)",
              padding: "var(--space-4)",
            }}>
              <p style={{
                fontFamily: "var(--font-mono)",
                fontSize: "var(--text-xs)",
                color: "var(--muted)",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                marginBottom: "var(--space-2)",
              }}>
                Grid point {hovered.point_index + 1} · {hovered.lat.toFixed(4)}, {hovered.lng.toFixed(4)}
              </p>

              {hovered.rank !== null ? (
                <p style={{ fontSize: "var(--text-sm)", color: "var(--text)", marginBottom: "var(--space-3)" }}>
                  <strong style={{ color: rankColor(hovered.rank) }}>#{hovered.rank}</strong>
                  {" \u2014 "}{scan.business_name}
                  {(() => {
                    const d = deltas[hovered.point_index] ?? null;
                    if (d === null || d === 0) return null;
                    return (
                      <span style={{ marginLeft: 8, fontSize: "0.75rem", fontWeight: 700, color: d > 0 ? "#4ade80" : "#f87171" }}>
                        {d > 0 ? `↑${d} since last scan` : `↓${Math.abs(d)} since last scan`}
                      </span>
                    );
                  })()}
                </p>
              ) : (
                <p style={{ fontSize: "var(--text-sm)", color: "var(--muted)", marginBottom: "var(--space-3)" }}>
                  {scan.business_name} not found in top 20
                </p>
              )}

              {hovered.competitors.length > 0 && (
                <>
                  <p style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "var(--text-xs)",
                    color: "var(--muted)",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    marginBottom: "var(--space-2)",
                  }}>
                    Top results at this point
                  </p>
                  <ol style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
                    {hovered.competitors.map((c, i) => (
                      <li key={i} style={{ display: "flex", alignItems: "baseline", gap: "var(--space-2)", fontSize: "var(--text-sm)" }}>
                        <span style={{ fontFamily: "var(--font-mono)", color: "var(--muted)", fontSize: "var(--text-xs)", minWidth: "20px" }}>
                          #{c.rank ?? i + 1}
                        </span>
                        <span style={{ color: "var(--text-secondary)" }}>{c.title}</span>
                      </li>
                    ))}
                  </ol>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Scan history */}
      {recentScans.length > 0 && (
        <div style={{ marginTop: "var(--space-6)", borderTop: "1px solid var(--border)", paddingTop: "var(--space-5)" }}>
          <p className="label" style={{ marginBottom: "var(--space-3)" }}>Recent Scans</p>
          <ul style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)", listStyle: "none" }}>
            {recentScans.map((s) => {
              const date = new Date(s.created_at).toLocaleDateString("en-US", {
                month: "short", day: "numeric", year: "numeric",
              });
              const isActive = scan?.id === s.id;
              return (
                <li key={s.id}>
                  <button
                    onClick={() => loadScan(s.id)}
                    disabled={loading}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      background: isActive ? "var(--surface2)" : "transparent",
                      border: `1px solid ${isActive ? "var(--carolina)" : "var(--border)"}`,
                      borderRadius: "var(--radius-md)",
                      padding: "var(--space-3) var(--space-4)",
                      cursor: loading ? "not-allowed" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "var(--space-3)",
                    }}
                  >
                    <div>
                      <span style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--text)", display: "block" }}>
                        {s.business_name}
                      </span>
                      <span className="text-small" style={{ color: "var(--muted)" }}>
                        {s.keyword}
                      </span>
                    </div>
                    <span className="text-small" style={{ flexShrink: 0, color: "var(--muted)" }}>
                      {date}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
