import 'server-only';

/**
 * The streets and parks around a building, from OpenStreetMap (through the
 * Overpass API), as SVG path data in metres from the building: x east, y
 * south. Fetched once, when the admin places the building, and stored with
 * the project, so the page draws its map in the site's own colours without
 * calling any map service when someone views it.
 */

export type StreetMap = { major: string; minor: string; parks: string };

/** How far the data reaches from the building, in metres (the map's widest view). */
export const MAP_REACH = { x: 1150, y: 820 };

const ENDPOINTS = ['https://overpass-api.de/api/interpreter', 'https://overpass.kumi.systems/api/interpreter'];
const MAJOR = new Set(['motorway', 'trunk', 'primary', 'secondary', 'tertiary', 'motorway_link', 'trunk_link', 'primary_link', 'secondary_link']);

type Way = { tags?: Record<string, string>; geometry?: { lat: number; lon: number }[] };

export async function buildStreetMap(lat: number, lng: number): Promise<StreetMap> {
  const metresPerLat = 110_574;
  const metresPerLng = 111_320 * Math.cos((lat * Math.PI) / 180);
  const dLat = MAP_REACH.y / metresPerLat;
  const dLng = MAP_REACH.x / metresPerLng;
  const bbox = [lat - dLat, lng - dLng, lat + dLat, lng + dLng].map((n) => n.toFixed(6)).join(',');
  const query =
    `[out:json][timeout:50];(` +
    `way["highway"~"^(motorway|trunk|primary|secondary|tertiary|motorway_link|trunk_link|primary_link|secondary_link|residential|unclassified|living_street|pedestrian)$"](${bbox});` +
    `way["leisure"="park"](${bbox});way["landuse"~"^(grass|recreation_ground)$"](${bbox});` +
    `);out geom;`;

  let ways: Way[] | null = null;
  for (const endpoint of ENDPOINTS) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'WingsSiteAdmin/1.0' },
        body: `data=${encodeURIComponent(query)}`,
        cache: 'no-store',
        signal: AbortSignal.timeout(55_000),
      });
      if (!response.ok) continue;
      ways = ((await response.json()) as { elements: Way[] }).elements;
      break;
    } catch {
      // Busy or slow: try the next server.
    }
  }
  if (!ways) throw new Error('streets unavailable');

  const project = (p: { lat: number; lon: number }) => [Math.round((p.lon - lng) * metresPerLng), Math.round((lat - p.lat) * metresPerLat)] as const;
  const toPath = (geometry: { lat: number; lon: number }[], close: boolean) => {
    const points: (readonly [number, number])[] = [];
    for (const g of geometry) {
      const pt = project(g);
      const last = points[points.length - 1];
      // Points closer than 4 m add nothing at this scale.
      if (!last || Math.abs(pt[0] - last[0]) + Math.abs(pt[1] - last[1]) >= 4) points.push(pt);
    }
    if (points.length < 2) return '';
    return `M${points.map(([x, y]) => `${x} ${y}`).join('L')}${close ? 'Z' : ''}`;
  };

  const major: string[] = [];
  const minor: string[] = [];
  const parks: string[] = [];
  for (const way of ways) {
    if (!way.geometry?.length) continue;
    const highway = way.tags?.highway;
    if (highway) (MAJOR.has(highway) ? major : minor).push(toPath(way.geometry, false));
    else parks.push(toPath(way.geometry, true));
  }
  return { major: major.join(''), minor: minor.join(''), parks: parks.join('') };
}
