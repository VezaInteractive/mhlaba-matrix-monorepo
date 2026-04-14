/**
 * /api/maritime/stream
 *
 * Server-Sent Events proxy for AISStream.io real-time AIS data.
 * Keeps the API key server-side. Merges PositionReport + ShipStaticData
 * per MMSI and emits enriched VesselRecord batches every 5 seconds.
 *
 * Falls back gracefully to simulation signal if AISSTREAM_API_KEY is unset.
 */

import { NextRequest } from 'next/server';
import WebSocket from 'ws';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// ── Vessel type name lookup (AIS ship type codes 0–99) ─────────────────────
function resolveTypeName(type: number): string {
  if (type === 0) return 'Unknown';
  if (type >= 20 && type <= 29) return 'Wing in Ground';
  if (type === 30) return 'Fishing';
  if (type === 31 || type === 32) return 'Tug / Supply';
  if (type === 33) return 'Dredging';
  if (type === 34) return 'Dive Ops';
  if (type === 35) return 'Military';
  if (type === 36) return 'Sailing';
  if (type === 37) return 'Pleasure Craft';
  if (type >= 40 && type <= 49) return 'High Speed Craft';
  if (type === 50) return 'Pilot';
  if (type === 51) return 'Search & Rescue';
  if (type === 52) return 'Tug';
  if (type === 53) return 'Port Tender';
  if (type === 55) return 'Law Enforcement';
  if (type === 58) return 'Medical Transport';
  if (type >= 60 && type <= 69) return 'Passenger';
  if (type >= 70 && type <= 79) return 'Cargo';
  if (type >= 80 && type <= 89) return 'Tanker';
  if (type >= 90 && type <= 99) return 'Other';
  return 'Unknown';
}

// VesselFinder-style color per type
function resolveColor(type: number): string {
  if (type >= 70 && type <= 79) return '#4FC3F7'; // Cargo: sky blue
  if (type >= 80 && type <= 89) return '#EF5350'; // Tanker: red
  if (type >= 60 && type <= 69) return '#66BB6A'; // Passenger: green
  if (type >= 40 && type <= 49) return '#FFA726'; // High Speed: orange
  if (type === 35) return '#CE93D8';              // Military: purple
  if (type === 36) return '#26C6DA';              // Sailing: teal
  if (type === 30) return '#D4E157';              // Fishing: yellow-green
  if (type === 52 || type === 31 || type === 32) return '#FF7043'; // Tug: deep orange
  return '#78909C';                               // Unknown/other: steel grey
}

// NAV status string
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

// Country flag emoji from MMSI MID (first 3 digits)
const MMSI_FLAG_MAP: Record<string, string> = {
  '201': '🇦🇱', '202': '🇦🇩', '203': '🇦🇹', '205': '🇧🇪', '206': '🇧🇾',
  '207': '🇧🇬', '208': '🇻🇦', '209': '🇨🇾', '210': '🇨🇾', '211': '🇩🇪',
  '212': '🇨🇾', '213': '🇬🇪', '214': '🇲🇩', '215': '🇲🇹', '216': '🇦🇲',
  '218': '🇩🇪', '219': '🇩🇰', '220': '🇩🇰', '224': '🇪🇸', '225': '🇪🇸',
  '226': '🇫🇷', '227': '🇫🇷', '228': '🇫🇷', '229': '🇲🇹', '230': '🇫🇮',
  '231': '🇫🇴', '232': '🇬🇧', '233': '🇬🇧', '234': '🇬🇧', '235': '🇬🇧',
  '236': '🇬🇮', '237': '🇬🇷', '238': '🇭🇷', '239': '🇬🇷', '240': '🇬🇷',
  '241': '🇬🇷', '242': '🇲🇦', '243': '🇭🇺', '244': '🇳🇱', '245': '🇳🇱',
  '246': '🇳🇱', '247': '🇮🇹', '248': '🇲🇹', '249': '🇲🇹', '250': '🇮🇪',
  '251': '🇮🇸', '252': '🇱🇮', '253': '🇱🇺', '254': '🇲🇨', '255': '🇵🇹',
  '256': '🇲🇹', '257': '🇳🇴', '258': '🇳🇴', '259': '🇳🇴', '261': '🇵🇱',
  '262': '🇲🇪', '263': '🇵🇹', '264': '🇷🇴', '265': '🇸🇪', '266': '🇸🇪',
  '267': '🇸🇰', '268': '🇸🇲', '269': '🇨🇭', '270': '🇨🇿', '271': '🇹🇷',
  '272': '🇺🇦', '273': '🇷🇺', '274': '🇲🇰', '275': '🇱🇻', '276': '🇪🇪',
  '277': '🇱🇹', '278': '🇸🇮', '279': '🇷🇸', '301': '🇦🇮', '303': '🇺🇸',
  '304': '🇦🇬', '305': '🇦🇬', '306': '🇨🇼', '307': '🇦🇼', '308': '🇧🇸',
  '309': '🇧🇸', '310': '🇧🇲', '311': '🇧🇸', '312': '🇧🇿', '314': '🇧🇧',
  '316': '🇨🇦', '319': '🇰🇾', '321': '🇨🇷', '323': '🇨🇺', '325': '🇩🇲',
  '327': '🇩🇴', '329': '🇬🇵', '330': '🇬🇩', '331': '🇬🇱', '332': '🇬🇹',
  '334': '🇭🇳', '336': '🇭🇹', '338': '🇺🇸', '339': '🇯🇲', '341': '🇸🇹',
  '343': '🇲🇶', '345': '🇲🇽', '347': '🇲🇸', '348': '🇳🇦', '350': '🇳🇮',
  '351': '🇵🇦', '352': '🇵🇦', '353': '🇵🇦', '354': '🇵🇦', '355': '🇵🇦',
  '356': '🇵🇦', '357': '🇵🇦', '358': '🇵🇷', '359': '🇸🇻', '361': '🇵🇲',
  '362': '🇹🇹', '364': '🇹🇨', '366': '🇺🇸', '367': '🇺🇸', '368': '🇺🇸',
  '369': '🇺🇸', '370': '🇵🇦', '371': '🇵🇦', '372': '🇵🇦', '373': '🇵🇦',
  '374': '🇵🇦', '375': '🇻🇨', '376': '🇻🇬', '377': '🇻🇮', '378': '🇻🇬',
  '401': '🇦🇫', '403': '🇸🇦', '405': '🇧🇩', '408': '🇧🇭', '410': '🇧🇭',
  '412': '🇨🇳', '413': '🇨🇳', '414': '🇨🇳', '416': '🇹🇼', '422': '🇮🇷',
  '423': '🇦🇿', '425': '🇮🇶', '428': '🇮🇱', '431': '🇯🇵', '432': '🇯🇵',
  '434': '🇹🇲', '436': '🇰🇿', '438': '🇯🇴', '440': '🇰🇷', '441': '🇰🇷',
  '443': '🇵🇸', '445': '🇰🇵', '447': '🇰🇼', '450': '🇱🇧', '453': '🇲🇴',
  '455': '🇲🇻', '457': '🇲🇳', '459': '🇲🇲', '461': '🇰🇵', '463': '🇴🇲',
  '466': '🇵🇰', '468': '🇵🇭', '470': '🇶🇦', '472': '🇸🇾', '477': '🇭🇰',
  '478': '🇰🇭', '503': '🇦🇺', '506': '🇲🇾', '508': '🇳🇷', '510': '🇵🇼',
  '511': '🇵🇳', '512': '🇳🇿', '514': '🇸🇧', '515': '🇸🇧', '516': '🇨🇽',
  '518': '🇨🇰', '520': '🇫🇯', '523': '🇨🇨', '525': '🇮🇩', '529': '🇰🇮',
  '531': '🇱🇦', '533': '🇲🇾', '536': '🇲🇵', '538': '🇲🇭', '540': '🇳🇨',
  '542': '🇳🇿', '544': '🇳🇺', '546': '🇵🇫', '548': '🇵🇬', '550': '🇵🇭',
  '553': '🇵🇼', '555': '🇵🇳', '557': '🇼🇸', '559': '🇼🇸', '561': '🇸🇧',
  '563': '🇸🇬', '564': '🇸🇬', '565': '🇸🇬', '566': '🇸🇬', '567': '🇹🇭',
  '570': '🇹🇴', '572': '🇹🇻', '574': '🇻🇳', '576': '🇻🇺', '578': '🇼🇫',
  '601': '🇿🇦', '603': '🇦🇴', '605': '🇩🇿', '607': '🇸🇹', '608': '🇧🇮',
  '609': '🇧🇯', '610': '🇧🇫', '611': '🇨🇲', '612': '🇨🇻', '613': '🇰🇲',
  '614': '🇨🇬', '615': '🇰🇲', '616': '🇨🇬', '617': '🇩🇯', '618': '🇪🇬',
  '619': '🇪🇷', '620': '🇪🇹', '621': '🇬🇦', '622': '🇬🇳', '623': '🇬🇳',
  '624': '🇬🇭', '625': '🇬🇳', '626': '🇬🇼', '627': '🇬🇳', '628': '🇨🇮',
  '629': '🇰🇪', '630': '🇱🇸', '631': '🇱🇷', '632': '🇱🇾', '633': '🇲🇬',
  '634': '🇲🇼', '635': '🇲🇱', '636': '🇲🇷', '637': '🇲🇺', '638': '🇾🇹',
  '642': '🇲🇦', '644': '🇳🇦', '645': '🇲🇿', '647': '🇳🇪', '649': '🇳🇬',
  '650': '🇬🇧', '654': '🇸🇳', '655': '🇸🇱', '656': '🇸🇴', '657': '🇿🇦',
  '659': '🇸🇩', '660': '🇸🇩', '661': '🇸🇿', '662': '🇹🇿', '663': '🇹🇳',
  '664': '🇹🇬', '665': '🇺🇬', '666': '🇦🇴', '667': '🇿🇿', '668': '🇿🇲',
  '669': '🇿🇼',
};

function getFlagEmoji(mmsi: number): string {
  const mid = String(mmsi).substring(0, 3);
  return MMSI_FLAG_MAP[mid] ?? '🏳️';
}

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
  sog: number;
  cog: number;
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

// ── Shared vessel store (in-memory, server-lifetime) ─────────────────────────
const vesselStore = new Map<number, VesselRecord>();
let wsConnected = false;

function startAISStream(apiKey: string) {
  if (wsConnected) return;
  wsConnected = true;

  function connect() {
    const ws = new WebSocket('wss://stream.aisstream.io/v0/stream');

    ws.on('open', () => {
      const subscription = {
        APIKey: apiKey,
        BoundingBoxes: [
          // Global ocean coverage (split into zones to avoid inland vessels)
          [[-60, -180], [90, 180]], // North Atlantic, Pacific, Arctic
          [[-90, -180], [-60, 180]], // Southern Ocean
          [[-60, -80], [60, 80]],   // Indian Ocean, Med
        ],
        FilterMessageTypes: ['PositionReport', 'ShipStaticData'],
      };
      ws.send(JSON.stringify(subscription));
      console.log('[AISStream] Connected and subscribed globally');
    });

    ws.on('message', (raw: Buffer) => {
      try {
        const msg = JSON.parse(raw.toString());
        const { MessageType, Message, MetaData } = msg;

        if (MessageType === 'PositionReport') {
          const pos = Message.PositionReport;
          const mmsi = MetaData?.MMSI ?? pos.UserID;
          const lat = MetaData?.latitude ?? pos.Latitude;
          const lng = MetaData?.longitude ?? pos.Longitude;

          // Filter out invalid/land positions
          if (!lat || !lng || lat === 0 || lng === 0) return;
          if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return;

          const existing = vesselStore.get(mmsi) ?? {
            mmsi,
            name: MetaData?.ShipName?.trim() || `VESSEL ${mmsi}`,
            imo: 0, callsign: '', flag: getFlagEmoji(mmsi),
            shipType: 0, typeName: 'Unknown',
            lat, lng, sog: 0, cog: 0, heading: 0,
            navStatus: 15, navStatusText: 'Undefined',
            destination: '', eta: '', draught: 0, length: 0, width: 0,
            colorHex: '#78909C', lastUpdate: Date.now(), simulated: false,
          } as VesselRecord;

          vesselStore.set(mmsi, {
            ...existing,
            lat,
            lng,
            sog: pos.Sog ?? existing.sog,
            cog: pos.Cog ?? existing.cog,
            heading: pos.TrueHeading < 511 ? pos.TrueHeading : (pos.Cog ?? existing.heading),
            navStatus: pos.NavigationalStatus ?? existing.navStatus,
            navStatusText: resolveNavStatus(pos.NavigationalStatus ?? existing.navStatus),
            lastUpdate: Date.now(),
            simulated: false,
          });
        }

        if (MessageType === 'ShipStaticData') {
          const stat = Message.ShipStaticData;
          const mmsi = MetaData?.MMSI ?? stat.UserID;
          const dim = stat.Dimension ?? {};

          const existing = vesselStore.get(mmsi);
          const shipType = stat.Type ?? 0;
          const update: Partial<VesselRecord> = {
            name: stat.Name?.trim().replace(/@+$/, '') || existing?.name || `VESSEL ${mmsi}`,
            imo: stat.ImoNumber ?? existing?.imo ?? 0,
            callsign: stat.CallSign?.trim() ?? existing?.callsign ?? '',
            shipType,
            typeName: resolveTypeName(shipType),
            colorHex: resolveColor(shipType),
            destination: stat.Destination?.trim().replace(/@+$/, '') ?? existing?.destination ?? '',
            eta: stat.Eta ? `${stat.Eta.Month}/${stat.Eta.Day} ${String(stat.Eta.Hour).padStart(2,'0')}:${String(stat.Eta.Minute).padStart(2,'0')} UTC` : (existing?.eta ?? ''),
            draught: stat.MaximumStaticDraught ?? existing?.draught ?? 0,
            length: ((dim.A ?? 0) + (dim.B ?? 0)) || existing?.length || 0,
            width: ((dim.C ?? 0) + (dim.D ?? 0)) || existing?.width || 0,
          };

          if (existing) {
            vesselStore.set(mmsi, { ...existing, ...update });
          }
        }
      } catch {
        // ignore malformed messages
      }
    });

    ws.on('error', (err) => {
      console.error('[AISStream] WS error:', (err as Error).message);
    });

    ws.on('close', () => {
      console.warn('[AISStream] Connection closed. Reconnecting in 10s…');
      wsConnected = false;
      setTimeout(() => {
        wsConnected = false;
        connect();
      }, 10_000);
    });
  }

  connect();
}

// ─────────────────────────────────────────────────────────────────────────────
// GET handler — returns SSE stream of vessel batch
// ─────────────────────────────────────────────────────────────────────────────
export async function GET(_req: NextRequest) {
  const apiKey = process.env.AISSTREAM_API_KEY;

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      function send(data: object) {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch {
          // client disconnected
        }
      }

      if (!apiKey) {
        // Signal to client to use simulation fallback
        send({ fallback: true });
        controller.close();
        return;
      }

      // Start AISStream WS (singleton, won't reconnect if already running)
      startAISStream(apiKey);

      // Emit current snapshot immediately, then every 5 seconds
      function emitBatch() {
        const staleThreshold = Date.now() - 10 * 60 * 1000; // 10 min

        // Prune stale vessels
        for (const [mmsi, v] of vesselStore) {
          if (v.lastUpdate < staleThreshold) vesselStore.delete(mmsi);
        }

        const validVessels = Array.from(vesselStore.values())
          .filter((v) => v.lat !== 0 && v.lng !== 0);

        // Balance actively moving ships and moored ships. Handle missing sog gracefully.
        const moving = validVessels.filter((v) => (v.sog || 0) > 0.5).slice(0, 1000);
        const docked = validVessels.filter((v) => (v.sog || 0) <= 0.5).slice(0, 1000);
        const vessels = [...moving, ...docked];

        send({ vessels, count: vesselStore.size });
      }

      emitBatch();
      const interval = setInterval(emitBatch, 5000);

      // Heartbeat ping to keep connection alive
      const ping = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': ping\n\n'));
        } catch {
          clearInterval(interval);
          clearInterval(ping);
        }
      }, 20_000);

      // Cleanup on disconnect
      _req.signal.addEventListener('abort', () => {
        clearInterval(interval);
        clearInterval(ping);
        try { controller.close(); } catch {}
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
