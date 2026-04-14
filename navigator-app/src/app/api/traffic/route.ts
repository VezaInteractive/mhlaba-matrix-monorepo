import { NextResponse } from 'next/server';

// Multiple Overpass mirrors in priority order — server-side fetch has no CORS restriction
const OVERPASS_MIRRORS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.openstreetmap.ru/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
];

// South Africa's national motorway bounding box: [south, west, north, east]
const SA_BBOX = '(-35.0,16.0,-22.0,33.0)';
const OVERPASS_QUERY = `[out:json][timeout:25];way["highway"~"^(motorway|trunk)$"]${SA_BBOX};out geom;`;

export async function GET() {
  let lastError: unknown = null;

  for (const mirror of OVERPASS_MIRRORS) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12_000); // 12s per mirror

      const res = await fetch(
        `${mirror}?data=${encodeURIComponent(OVERPASS_QUERY)}`,
        {
          signal: controller.signal,
          cache: 'no-store',
          headers: {
            'User-Agent': 'MhlabaMatrix/1.0 (navigator-app; contact@mhlaba.co.za)',
          },
        }
      );

      clearTimeout(timeoutId);

      if (!res.ok) {
        throw new Error(`Mirror ${mirror} responded with HTTP ${res.status}`);
      }

      const data = await res.json();

      // Validate that we actually got OSM elements before returning
      if (!data?.elements?.length) {
        throw new Error(`Mirror ${mirror} returned empty elements`);
      }

      return NextResponse.json(data);
    } catch (err) {
      console.warn(`[traffic/route] Mirror failed: ${mirror}`, err);
      lastError = err;
    }
  }

  // All mirrors exhausted — return a structured error so the client can degrade gracefully
  console.error('[traffic/route] All Overpass mirrors failed.', lastError);
  return NextResponse.json(
    { error: 'All Overpass mirrors failed', elements: [] },
    { status: 503 }
  );
}
