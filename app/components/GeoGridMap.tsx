"use client";

import { useEffect, useRef } from "react";
import { rankColor } from "@/lib/grid";

interface GridResult {
  point_index: number;
  lat: number;
  lng: number;
  rank: number | null;
  competitors: { title: string; rank: number | null }[];
}

interface ScanMeta {
  center_lat: number;
  center_lng: number;
  keyword: string;
  business_name: string;
}

interface Props {
  results: GridResult[];
  scan: ScanMeta;
  hovered: GridResult | null;
  deltas: Record<number, number | null>;
  onHover: (point: GridResult | null) => void;
  height?: number;
}

export default function GeoGridMap({
  results,
  scan,
  hovered,
  deltas,
  onHover,
  height = 380,
}: Props) {
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const containerId = "geogrid-map-container";
  const markersRef = useRef<import("leaflet").CircleMarker[]>([]);

  useEffect(() => {
    // Leaflet must be loaded client-side only
    let L: typeof import("leaflet");
    let map: import("leaflet").Map;

    async function init() {
      L = (await import("leaflet")).default;

      // Fix default icon paths broken by webpack
      // @ts-expect-error _getIconUrl is not in types
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const container = document.getElementById(containerId);
      if (!container) return;

      // Don't re-init if already mounted
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }

      map = L.map(container, {
        center: [scan.center_lat, scan.center_lng],
        zoom: 12,
        zoomControl: true,
        scrollWheelZoom: false,
      });

      mapRef.current = map;

      // OpenStreetMap tiles — free, no API key
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      // Plot grid markers
      markersRef.current = [];

      for (const point of results) {
        const color = rankColor(point.rank);
        const rankDisplay = point.rank !== null ? String(point.rank) : "–";

        // Outer ring
        const ring = L.circleMarker([point.lat, point.lng], {
          radius: 18,
          fillColor: color,
          fillOpacity: 1,
          color: "rgba(0,0,0,0.25)",
          weight: 2,
        }).addTo(map);

        // Rank label via divIcon overlay
        const icon = L.divIcon({
          className: "",
          html: `<div style="
            width:36px;
            height:36px;
            display:flex;
            align-items:center;
            justify-content:center;
            font-family:monospace;
            font-size:12px;
            font-weight:700;
            color:${point.rank === null ? "#666" : "#0a0a0a"};
            pointer-events:none;
            user-select:none;
          ">${rankDisplay}</div>`,
          iconSize: [36, 36],
          iconAnchor: [18, 18],
        });

        const label = L.marker([point.lat, point.lng], { icon, interactive: false }).addTo(map);

        // Delta badge
        const delta = deltas[point.point_index] ?? null;
        if (delta !== null && delta !== 0) {
          const deltaIcon = L.divIcon({
            className: "",
            html: `<div style="
              font-size:9px;
              font-weight:800;
              color:${delta > 0 ? "#4ade80" : "#f87171"};
              pointer-events:none;
              white-space:nowrap;
              text-shadow:0 0 3px rgba(0,0,0,0.8);
            ">${delta > 0 ? `↑${delta}` : `↓${Math.abs(delta)}`}</div>`,
            iconSize: [24, 12],
            iconAnchor: [-8, 18],
          });
          L.marker([point.lat, point.lng], { icon: deltaIcon, interactive: false }).addTo(map);
        }

        // Hover interaction on the ring marker
        ring.on("mouseover", () => onHover(point));
        ring.on("mouseout", () => onHover(null));
        ring.on("click", () => onHover(point));

        markersRef.current.push(ring);
      }

      // Center marker
      L.circleMarker([scan.center_lat, scan.center_lng], {
        radius: 5,
        fillColor: "#7bafd4",
        fillOpacity: 1,
        color: "#fff",
        weight: 2,
      })
        .bindTooltip("Center point", { permanent: false })
        .addTo(map);

      // Fit bounds to all points
      if (results.length > 0) {
        const lats = results.map((r) => r.lat);
        const lngs = results.map((r) => r.lng);
        map.fitBounds(
          [
            [Math.min(...lats) - 0.003, Math.min(...lngs) - 0.003],
            [Math.max(...lats) + 0.003, Math.max(...lngs) + 0.003],
          ],
          { animate: false }
        );
      }
    }

    init();

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [results, scan.center_lat, scan.center_lng]);

  // Update marker styles when hovered changes without re-initializing
  useEffect(() => {
    if (!mapRef.current || markersRef.current.length === 0) return;
    results.forEach((point, i) => {
      const marker = markersRef.current[i];
      if (!marker) return;
      const isHov = hovered?.point_index === point.point_index;
      marker.setStyle({
        weight: isHov ? 3 : 2,
        color: isHov ? "#7bafd4" : "rgba(0,0,0,0.25)",
        radius: isHov ? 21 : 18,
      });
    });
  }, [hovered, results]);

  return (
    <>
      {/* Leaflet CSS */}
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        crossOrigin=""
      />
      <div
        id={containerId}
        style={{
          height,
          width: "100%",
          borderRadius: "var(--radius-md)",
          overflow: "hidden",
          background: "var(--surface2)",
        }}
      />
    </>
  );
}
