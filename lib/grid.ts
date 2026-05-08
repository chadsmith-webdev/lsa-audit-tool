// Geo-grid math utilities

const MILES_PER_DEGREE_LAT = 69.0;

/**
 * Generate a square grid of lat/lng points centered on a given coordinate.
 * @param centerLat  Center latitude
 * @param centerLng  Center longitude
 * @param radiusMiles Distance in miles from center to edge midpoint
 * @param gridSize   Number of points per side (e.g. 5 = 5x5 = 25 points)
 */
export function buildGrid(
  centerLat: number,
  centerLng: number,
  radiusMiles: number,
  gridSize: number,
): { lat: number; lng: number; index: number }[] {
  const milesPerDegreeLng =
    MILES_PER_DEGREE_LAT * Math.cos((centerLat * Math.PI) / 180);

  const stepMiles = (radiusMiles * 2) / (gridSize - 1);
  const stepLat = stepMiles / MILES_PER_DEGREE_LAT;
  const stepLng = stepMiles / milesPerDegreeLng;

  const halfSteps = (gridSize - 1) / 2;
  const points: { lat: number; lng: number; index: number }[] = [];

  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      const lat = centerLat + (halfSteps - row) * stepLat;
      const lng = centerLng + (col - halfSteps) * stepLng;
      points.push({ lat, lng, index: row * gridSize + col });
    }
  }

  return points;
}

/**
 * Rank color for display.
 * 1–3   green
 * 4–10  yellow
 * 11+   red
 * null  gray (not found)
 */
export function rankColor(rank: number | null): string {
  if (rank === null) return "#4b5563"; // gray
  if (rank <= 3) return "#16a34a";    // green
  if (rank <= 10) return "#ca8a04";   // yellow
  return "#dc2626";                   // red
}

export function rankLabel(rank: number | null): string {
  if (rank === null) return "–";
  return String(rank);
}
