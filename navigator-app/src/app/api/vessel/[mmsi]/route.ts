/**
 * /api/vessel/[mmsi]
 *
 * Server-side proxy to the VesselFinder API.
 * Fetches live, enriched data for a single vessel by MMSI.
 * Keeps the API key server-side.
 */

import { NextRequest, NextResponse } from 'next/server';

const VESSELFINDER_API_KEY = process.env.VESSELFINDER_API_KEY || 'aa4cab3177b62f366822ebbc59522fb964ef2862';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: NextRequest,
  { params }: { params: { mmsi: string } }
) {
  const { mmsi } = params;

  if (!mmsi || isNaN(Number(mmsi))) {
    return NextResponse.json({ error: 'Invalid MMSI' }, { status: 400 });
  }

  try {
    // VesselFinder AIS API v2 — single vessel by MMSI
    const url = `https://api.vesselfinder.com/vessels?userkey=${VESSELFINDER_API_KEY}&mmsi=${mmsi}`;
    const res = await fetch(url, {
      headers: { 'Accept': 'application/json' },
      next: { revalidate: 30 }, // Cache for 30 seconds max
    });

    if (!res.ok) {
      // Return a graceful empty record so the HUD doesn't crash
      console.warn(`[VesselFinder] HTTP ${res.status} for MMSI ${mmsi}`);
      return NextResponse.json({ found: false, mmsi: Number(mmsi) }, { status: 200 });
    }

    const data = await res.json();

    // VesselFinder returns an array of vessel objects
    // Structure: [{ AIS: { MMSI, NAME, LATITUDE, LONGITUDE, SPEED, HEADING, COURSE, ... }, ... }]
    if (!Array.isArray(data) || data.length === 0) {
      return NextResponse.json({ found: false, mmsi: Number(mmsi) }, { status: 200 });
    }

    const v = data[0];
    const ais = v?.AIS ?? v;

    const enriched = {
      found: true,
      mmsi: Number(mmsi),
      name: ais.NAME?.trim() || ais.SHIPNAME?.trim() || `VESSEL ${mmsi}`,
      flag: ais.FLAG || ais.COUNTRY || '',
      lat: ais.LATITUDE ?? ais.LAT ?? 0,
      lng: ais.LONGITUDE ?? ais.LON ?? 0,
      sog: ais.SPEED ?? ais.SOG ?? 0,
      cog: ais.COURSE ?? ais.COG ?? 0,
      heading: ais.HEADING ?? ais.HDG ?? 0,
      destination: ais.DESTINATION?.trim() || '',
      eta: ais.ETA || '',
      imo: ais.IMO ?? 0,
      callsign: ais.CALLSIGN?.trim() ?? '',
      shipType: ais.SHIPTYPE ?? ais.TYPE ?? 0,
      typeName: ais.TYPE_NAME ?? ais.TYPENAME ?? '',
      draught: ais.DRAUGHT ?? ais.T ?? 0,
      length: ais.LENGTH ?? ais.A ?? 0,
      width: ais.WIDTH ?? ais.W ?? 0,
      yearBuilt: ais.YEAR_BUILT ?? ais.BUILT ?? 'Unknown',
      navStatus: ais.NAVSTAT ?? ais.STATUS ?? 0,
      navStatusText: ais.STATUS_LABEL ?? resolveNavStatus(ais.NAVSTAT ?? ais.STATUS ?? 15),
      // VesselFinder extras
      photo: v.PHOTOTHUMB ?? v.PHOTO ?? null,
      vesselUrl: `https://www.vesselfinder.com/vessels/details/${mmsi}`,
    };

    return NextResponse.json(enriched);
  } catch (err: any) {
    console.error('[VesselFinder] Fetch error:', err?.message ?? err);
    return NextResponse.json({ found: false, mmsi: Number(mmsi), error: err?.message }, { status: 200 });
  }
}

function resolveNavStatus(status: number): string {
  const map: Record<number, string> = {
    0: 'Underway using engine',
    1: 'At anchor',
    2: 'Not under command',
    3: 'Restricted maneuverability',
    4: 'Constrained by draught',
    5: 'Moored',
    6: 'Aground',
    7: 'Engaged in fishing',
    8: 'Underway sailing',
    15: 'Undefined',
  };
  return map[status] ?? 'Undefined';
}
