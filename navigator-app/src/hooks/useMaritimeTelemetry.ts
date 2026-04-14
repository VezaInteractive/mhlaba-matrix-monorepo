/**
 * useMaritimeTelemetry
 *
 * Connects to /api/maritime/stream (SSE) to get real AIS data from AISStream.io.
 * Falls back to the enhanced simulation if the server signals { fallback: true }.
 *
 * Returns a Map<mmsi, VesselRecord> updated in real-time.
 */
'use client';

import { useEffect, useRef, useState } from 'react';

// ── Public vessel type ────────────────────────────────────────────────────────
export interface VesselRecord {
  mmsi: number;
  name: string;
  imo: number;
  callsign: string;
  flag: string;
  shipType: number;
  typeName: string;
  lat: number;
  lng: number;
  sog: number;   // speed over ground (knots)
  cog: number;   // course over ground (degrees)
  heading: number;
  navStatus: number;
  navStatusText: string;
  destination: string;
  eta: string;
  draught: number;
  length: number;
  width: number;
  colorHex: string;
  lastUpdate: number;
  simulated: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// SIMULATION FALLBACK — verified ocean waypoints, 12 global shipping lanes
// ─────────────────────────────────────────────────────────────────────────────
const SHIPPING_LANES: Array<{
  label: string;
  vesselType: number;
  typeName: string;
  colorHex: string;
  waypoints: Array<[number, number]>;
}> = [
  { label: 'Cape of Good Hope', vesselType: 81, typeName: 'Tanker', colorHex: '#EF5350',
    waypoints: [[17.8,-33.5],[18.3,-34.3],[19.2,-35.0],[20.8,-35.2],[22.5,-34.8],[24.0,-34.2]] },
  { label: 'Durban Corridor',   vesselType: 72, typeName: 'Cargo', colorHex: '#4FC3F7',
    waypoints: [[30.8,-30.2],[32.5,-28.5],[34.5,-26.0],[36.0,-23.5],[38.5,-20.0]] },
  { label: 'Mozambique Channel', vesselType: 72, typeName: 'Cargo', colorHex: '#4FC3F7',
    waypoints: [[37.5,-18.5],[39.0,-16.0],[40.5,-13.5],[41.5,-11.5],[43.0,-10.0]] },
  { label: 'Gulf of Aden',      vesselType: 80, typeName: 'Tanker', colorHex: '#EF5350',
    waypoints: [[44.5,12.0],[46.0,11.5],[47.5,11.0],[49.5,10.5],[51.0,11.5],[52.5,12.5]] },
  { label: 'Indian Ocean Mid',  vesselType: 70, typeName: 'Cargo', colorHex: '#4FC3F7',
    waypoints: [[55.0,-15.0],[60.0,-18.0],[65.0,-20.0],[70.0,-18.0],[72.0,-15.0]] },
  { label: 'Malacca Strait',    vesselType: 84, typeName: 'Tanker', colorHex: '#EF5350',
    waypoints: [[100.5,5.5],[101.5,4.0],[102.5,2.5],[103.5,1.5],[104.0,1.0]] },
  { label: 'South China Sea',   vesselType: 73, typeName: 'Cargo', colorHex: '#4FC3F7',
    waypoints: [[110.0,10.0],[113.0,15.0],[116.0,19.0],[118.0,22.0]] },
  { label: 'North Sea',         vesselType: 60, typeName: 'Passenger', colorHex: '#66BB6A',
    waypoints: [[2.0,51.5],[3.5,52.5],[4.5,53.5],[5.5,54.0],[6.5,54.5]] },
  { label: 'Gulf of Guinea',    vesselType: 82, typeName: 'Tanker', colorHex: '#EF5350',
    waypoints: [[-3.0,5.0],[0.5,4.0],[3.5,3.5],[6.5,4.0],[9.0,4.5]] },
  { label: 'Caribbean',         vesselType: 61, typeName: 'Passenger', colorHex: '#66BB6A',
    waypoints: [[-80.0,22.5],[-76.0,19.5],[-72.0,18.5],[-68.0,17.5],[-65.0,18.5],[-61.5,15.0]] },
  { label: 'Atlantic Trade',    vesselType: 71, typeName: 'Cargo', colorHex: '#4FC3F7',
    waypoints: [[-15.0,35.0],[-15.0,25.0],[-14.0,15.0],[-13.0,8.0],[-10.0,3.0]] },
  { label: 'Persian Gulf',      vesselType: 83, typeName: 'Tanker', colorHex: '#EF5350',
    waypoints: [[56.5,24.5],[55.5,26.0],[54.5,26.5],[52.5,27.0],[51.0,26.5],[50.0,26.0]] },
  // ── NEW: Global shipping lanes ──────────────────────────────────────────
  { label: 'Trans-Pacific East', vesselType: 70, typeName: 'Cargo', colorHex: '#4FC3F7',
    waypoints: [[135.0,35.0],[155.0,38.0],[175.0,40.0],[-170.0,42.0],[-150.0,40.0],[-130.0,35.0],[-122.0,34.0]] },
  { label: 'Trans-Pacific West', vesselType: 81, typeName: 'Tanker', colorHex: '#EF5350',
    waypoints: [[-118.0,33.5],[-140.0,30.0],[-160.0,25.0],[-180.0,20.0],[170.0,18.0],[150.0,15.0],[130.0,12.0]] },
  { label: 'Panama Canal Route', vesselType: 73, typeName: 'Cargo', colorHex: '#4FC3F7',
    waypoints: [[-82.0,8.5],[-79.5,9.2],[-77.0,8.0],[-73.0,10.0],[-68.0,12.0],[-60.0,14.0]] },
  { label: 'US East Coast',     vesselType: 60, typeName: 'Passenger', colorHex: '#66BB6A',
    waypoints: [[-74.0,40.5],[-73.5,38.5],[-76.0,36.5],[-79.5,32.5],[-80.0,28.5],[-80.5,25.5]] },
  { label: 'Mediterranean',     vesselType: 61, typeName: 'Passenger', colorHex: '#66BB6A',
    waypoints: [[-5.5,36.0],[-2.0,36.5],[2.0,37.5],[7.0,38.0],[12.0,37.5],[16.0,36.5],[20.0,35.5],[25.0,35.0],[30.0,33.0]] },
  { label: 'Baltic Sea',        vesselType: 72, typeName: 'Cargo', colorHex: '#4FC3F7',
    waypoints: [[10.5,55.0],[13.0,55.5],[15.0,55.5],[18.0,56.0],[20.0,57.5],[22.0,59.0],[25.0,60.0]] },
  { label: 'Suez Canal Route',  vesselType: 80, typeName: 'Tanker', colorHex: '#EF5350',
    waypoints: [[32.5,30.0],[33.5,28.5],[35.0,25.0],[38.0,20.0],[42.0,15.0],[44.0,12.5]] },
  { label: 'East China Sea',    vesselType: 74, typeName: 'Cargo', colorHex: '#4FC3F7',
    waypoints: [[122.0,30.0],[124.0,32.0],[126.0,34.0],[128.0,35.5],[130.0,33.5],[132.0,34.0]] },
  { label: 'Australia East',    vesselType: 70, typeName: 'Cargo', colorHex: '#4FC3F7',
    waypoints: [[151.5,-33.5],[153.0,-28.0],[149.0,-23.0],[146.0,-19.0],[144.0,-15.0]] },
  { label: 'South Atlantic',    vesselType: 82, typeName: 'Tanker', colorHex: '#EF5350',
    waypoints: [[-43.0,-23.0],[-35.0,-18.0],[-25.0,-12.0],[-15.0,-5.0],[-5.0,2.0]] },
  { label: 'North Atlantic',    vesselType: 71, typeName: 'Cargo', colorHex: '#4FC3F7',
    waypoints: [[-74.0,40.0],[-60.0,42.0],[-45.0,45.0],[-30.0,48.0],[-15.0,50.0],[-5.0,51.0]] },
  { label: 'Sea of Japan',      vesselType: 83, typeName: 'Tanker', colorHex: '#EF5350',
    waypoints: [[129.0,35.0],[131.0,37.0],[133.0,39.0],[135.0,40.0],[137.0,42.0],[139.0,43.0]] },
];

const SIM_NAMES = [
  'EVER GIVEN','MSC OSCAR','CSCL GLOBE','OOCL HONG KONG','MSC GULSUN',
  'HMM ALGECIRAS','MADRID MAERSK','MSC AURORA','VALE BRASIL','SEAWISE GIANT',
  'BERG STAHL','PIONEER KNUTSEN','OLYMPIC SPIRIT','NORDIC NORA','NORDIC BOTHNIA',
  'STENA PREMIER','AL WAKRAH','CAPE BAKER','CAPE BIRD','TORM SARA',
  'MINERVA ELENA','NORDIC LUNA','ADVANTAGE SPRING','NORDKAPP','BOREALIS',
  'SCANDINAVIA','PEARL SEAWAYS','PETER PAN','NILS HOLGERSSON','QUEEN OF SCANDINAVIA',
  'PACIFIC ALBA','CAPE JASMINE','SEAMASTER','FORTUNE CARRIER','GLOBAL TRADER',
  'OCEAN HARMONY','ARCTIC BREEZE','SOUTHERN CROSS','INDIAN STAR','PACIFIC DAWN',
  'TROPIC WAVE','ATLANTIC GLORY','GULF LEADER','CORAL SEA','RED HORIZON',
  'BLUE OCEAN','SILVER SEA','GOLD DRIFT','IRON PASSAGE','STEEL NAVIGATOR',
  'CAPE ARAGO','CAPE BIRD','CAPE DOCTOR','CAPE ENDEAVOUR','CAPE FEAR',
  'MARATHA CONQUEST','MARATHA MARINER','MARATHA MESSENGER','MARATHA PRIDE','MARATHA QUEEN',
  'ATLANTIC PIONEER','GOLD MINER','OCEAN PRINCESS','SEA SERPENT','STORM RIDER',
  'TRADE WIND','POLAR STAR','EQUATOR','MERIDIAN','LIGHTHOUSE',
  'ALBATROSS','PELICAN','EAGLE','CONDOR','FALCON',
];

const FLAG_EMOJIS = [
  '🇵🇦','🇱🇷','🇲🇭','🇧🇸','🇸🇬','🇬🇷','🇨🇳','🇺🇸',
  '🇳🇴','🇩🇰','🇬🇧','🇩🇪','🇯🇵','🇰🇷','🇮🇹','🇳🇱',
  '🇿🇦','🇧🇷','🇦🇺','🇮🇳',
];

interface SimVessel {
  mmsi: number;
  laneIndex: number;
  wpIdx: number;
  t: number;
  speed: number;
  nameIdx: number;
  flagIdx: number;
  callsign: string;
}

let simVessels: SimVessel[] | null = null;

function initSim(): SimVessel[] {
  const out: SimVessel[] = [];
  let base = 200_000_000;
  SHIPPING_LANES.forEach((_, li) => {
    for (let v = 0; v < 6; v++) {
      const wpCount = SHIPPING_LANES[li].waypoints.length;
      out.push({
        mmsi: base++,
        laneIndex: li,
        wpIdx: (v * Math.floor(wpCount / 6)) % Math.max(wpCount - 1, 1),
        t: (v / 6),
        speed: 8 + Math.random() * 14,
        nameIdx: (li * 6 + v) % SIM_NAMES.length,
        flagIdx: Math.floor(Math.random() * FLAG_EMOJIS.length),
        callsign: 'SIM' + String(base).slice(-5),
      });
    }
  });
  return out;
}

function tickSim(vessels: SimVessel[], dtSec: number): SimVessel[] {
  return vessels.map((v) => {
    const lane = SHIPPING_LANES[v.laneIndex];
    const wpCount = lane.waypoints.length;
    const cur = lane.waypoints[v.wpIdx];
    const nxt = lane.waypoints[(v.wpIdx + 1) % wpCount];
    const dLen = Math.sqrt((nxt[0]-cur[0])**2 + (nxt[1]-cur[1])**2);
    const degPerSec = (v.speed * 1.852) / (3600 * 111);
    const tStep = dLen > 0 ? (degPerSec * dtSec) / dLen : 0;
    let newT = v.t + tStep;
    let newWP = v.wpIdx;
    while (newT >= 1) { newT -= 1; newWP = (newWP + 1) % Math.max(wpCount - 1, 1); }
    return { ...v, wpIdx: newWP, t: newT };
  });
}

function simToRecords(vessels: SimVessel[]): Map<number, VesselRecord> {
  const map = new Map<number, VesselRecord>();
  vessels.forEach((v) => {
    const lane = SHIPPING_LANES[v.laneIndex];
    const wpCount = lane.waypoints.length;
    const cur = lane.waypoints[v.wpIdx];
    const nxt = lane.waypoints[(v.wpIdx + 1) % wpCount];
    const lat = cur[1] + (nxt[1] - cur[1]) * v.t;
    const lng = cur[0] + (nxt[0] - cur[0]) * v.t;
    const dLng = nxt[0] - cur[0];
    const dLat = nxt[1] - cur[1];
    const heading = ((Math.atan2(dLng, dLat) * 180) / Math.PI + 360) % 360;
    map.set(v.mmsi, {
      mmsi: v.mmsi,
      name: SIM_NAMES[v.nameIdx],
      imo: 9_000_000 + v.mmsi % 999999,
      callsign: v.callsign,
      flag: FLAG_EMOJIS[v.flagIdx],
      shipType: lane.vesselType,
      typeName: lane.typeName,
      lat, lng,
      sog: Math.round(v.speed * 10) / 10,
      cog: heading,
      heading,
      navStatus: 0,
      navStatusText: 'Underway using engine',
      destination: SHIPPING_LANES[(v.laneIndex + 1) % SHIPPING_LANES.length].label.toUpperCase(),
      eta: '',
      draught: 8 + Math.random() * 8,
      length: 200 + Math.floor(Math.random() * 200),
      width: 30 + Math.floor(Math.random() * 30),
      colorHex: lane.colorHex,
      lastUpdate: Date.now(),
      simulated: true,
    });
  });
  return map;
}

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────
export function useMaritimeTelemetry(enabled: boolean): Map<number, VesselRecord> | null {
  const [vessels, setVessels] = useState<Map<number, VesselRecord> | null>(null);
  const esRef = useRef<EventSource | null>(null);
  const simRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastTickRef = useRef<number>(Date.now());

  useEffect(() => {
    if (!enabled) {
      esRef.current?.close();
      esRef.current = null;
      if (simRef.current) { clearInterval(simRef.current); simRef.current = null; }
      setVessels(null);
      return;
    }

    // Connect to the SSE stream
    const es = new EventSource('/api/maritime/stream');
    esRef.current = es;
    let usingSim = false;

    es.onmessage = (e) => {
      try {
        const parsed = JSON.parse(e.data);

        // Server signals no API key → use simulation
        if (parsed.fallback === true) {
          usingSim = true;
          es.close();
          startSim();
          return;
        }

        // Real AIS data — convert array to Map
        if (Array.isArray(parsed.vessels)) {
          const map = new Map<number, VesselRecord>();
          (parsed.vessels as VesselRecord[]).forEach((v) => map.set(v.mmsi, v));

          // If we have real data but few vessels, supplement with simulation
          if (map.size < 10) {
            startSim();
          } else {
            // Merge sim on top of real to bulk up display if needed
            if (simVessels) {
              simToRecords(simVessels).forEach((v, k) => {
                if (!map.has(k)) map.set(k, v);
              });
            }
          }
          setVessels(new Map(map));
        }
      } catch {
        // ignore parse errors
      }
    };

    es.onerror = () => {
      if (!usingSim) {
        usingSim = true;
        startSim();
      }
    };

    function startSim() {
      if (simRef.current) return; // already running
      simVessels = initSim(); // Always re-init to pick up latest lanes
      lastTickRef.current = Date.now();
      setVessels(simToRecords(simVessels!));
      simRef.current = setInterval(() => {
        const now = Date.now();
        const dt = (now - lastTickRef.current) / 1000;
        lastTickRef.current = now;
        simVessels = tickSim(simVessels!, dt);
        setVessels(simToRecords(simVessels!));
      }, 5000);
    }

    return () => {
      es.close();
      esRef.current = null;
      if (simRef.current) { clearInterval(simRef.current); simRef.current = null; }
    };
  }, [enabled]);

  return vessels;
}
