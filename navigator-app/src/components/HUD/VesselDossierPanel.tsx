'use client';

import { useAppStore } from '@/store/useAppStore';
import { useEffect, useState } from 'react';
import {
  X, ExternalLink, Anchor, Navigation, MapPin,
  Gauge, Compass, Clock, Package, Layers, Flag,
  Radio, Hash, Ruler, AlertCircle, CheckCircle2,
} from 'lucide-react';

// Nav status colour coding
function navStatusColor(status: number): string {
  if (status === 0) return '#22c55e'; // underway — green
  if (status === 1) return '#f59e0b'; // anchored — amber
  if (status === 5) return '#6366f1'; // moored — indigo
  if (status === 2 || status === 3) return '#ef4444'; // restricted — red
  return '#94a3b8';                   // other — slate
}

// Heading indicator widget
function HeadingDial({ heading }: { heading: number }) {
  const h = Math.round(heading);
  return (
    <div className="relative w-10 h-10 flex-shrink-0">
      <svg viewBox="0 0 40 40" className="w-full h-full">
        <circle cx="20" cy="20" r="18" fill="none" stroke="#1e293b" strokeWidth="2" />
        <circle cx="20" cy="20" r="18" fill="none" stroke="#00FFFF22" strokeWidth="1" strokeDasharray="4 4" />
        {/* N/S/E/W ticks */}
        {[0, 90, 180, 270].map((a) => (
          <line key={a}
            x1={20 + 14 * Math.sin((a * Math.PI) / 180)}
            y1={20 - 14 * Math.cos((a * Math.PI) / 180)}
            x2={20 + 17 * Math.sin((a * Math.PI) / 180)}
            y2={20 - 17 * Math.cos((a * Math.PI) / 180)}
            stroke="#00FFFF88" strokeWidth="1.5"
          />
        ))}
        {/* Heading arrow */}
        <line
          x1={20 - 7 * Math.sin((h * Math.PI) / 180)}
          y1={20 + 7 * Math.cos((h * Math.PI) / 180)}
          x2={20 + 12 * Math.sin((h * Math.PI) / 180)}
          y2={20 - 12 * Math.cos((h * Math.PI) / 180)}
          stroke="#00FFFF" strokeWidth="2" strokeLinecap="round"
        />
        <circle cx="20" cy="20" r="2" fill="#00FFFF" />
      </svg>
    </div>
  );
}

// Single data row
function Row({
  icon: Icon, label, value, mono = true, accent,
}: {
  icon: any; label: string; value: string | number | undefined; mono?: boolean; accent?: string;
}) {
  if (!value && value !== 0) return null;
  return (
    <div className="flex items-center gap-2 py-[5px] border-b border-white/5 last:border-0">
      <Icon size={12} className="flex-shrink-0 text-[#00FFFF]/50" />
      <span className="text-[10px] font-mono text-white/40 uppercase tracking-wider w-24 flex-shrink-0">{label}</span>
      <span
        className={`text-[11px] flex-1 truncate ${mono ? 'font-mono' : 'font-medium'}`}
        style={{ color: accent ?? '#e2e8f0' }}
      >
        {value}
      </span>
    </div>
  );
}

export default function VesselDossierPanel() {
  const vessel = useAppStore((s) => s.selectedMaritime);
  const setSelectedMaritime = useAppStore((s) => s.setSelectedMaritime);
  const setMaritimeScreenPos = useAppStore((s) => s.setMaritimeScreenPos);
  const [liveSOG, setLiveSOG] = useState<number>(0);

  useEffect(() => {
    if (vessel) setLiveSOG(vessel.sog);
  }, [vessel]);

  // Simulate SOG drift for realism (±0.2 kn per tick)
  useEffect(() => {
    if (!vessel) return;
    const t = setInterval(() => {
      setLiveSOG((s) => Math.max(0, Math.round((s + (Math.random() - 0.5) * 0.4) * 10) / 10));
    }, 3000);
    return () => clearInterval(t);
  }, [vessel]);

  if (!vessel) return null;

  const dismiss = () => {
    setSelectedMaritime(null);
    setMaritimeScreenPos(null);
  };

  const vesselFinderUrl = vessel.imo && vessel.imo > 0
    ? `https://www.vesselfinder.com/vessels/details/${vessel.imo}`
    : `https://www.vesselfinder.com/vessels?name=${encodeURIComponent(vessel.name)}`;

  const navColor = navStatusColor(vessel.navStatus);

  return (
    <div
      className="fixed top-6 right-[360px] w-[340px] z-[100] pointer-events-auto
        animate-in slide-in-from-right-8 fade-in duration-300"
      role="dialog"
      aria-label={`Vessel dossier for ${vessel.name}`}
    >
      {/* Glow backdrop */}
      <div
        className="absolute inset-0 rounded-xl blur-xl opacity-20 pointer-events-none"
        style={{ background: `radial-gradient(ellipse at bottom, ${vessel.colorHex}55, transparent 70%)` }}
      />

      <div
        className="relative rounded-xl border overflow-hidden shadow-2xl"
        style={{
          background: 'linear-gradient(160deg, #0a0f1eee 0%, #060d1bee 100%)',
          borderColor: `${vessel.colorHex}44`,
          backdropFilter: 'blur(20px)',
        }}
      >
        {/* Scan line */}
        <div
          className="absolute inset-x-0 h-[1px] animate-[scan_4s_linear_infinite] pointer-events-none opacity-40"
          style={{ background: vessel.colorHex }}
        />

        {/* ── Header ────────────────────────────────────────────────── */}
        <div
          className="flex items-center justify-between px-4 py-3 border-b"
          style={{ borderColor: `${vessel.colorHex}22`, background: `${vessel.colorHex}0d` }}
        >
          <div className="flex items-center gap-3 min-w-0">
            {/* Type dot */}
            <div
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ background: vessel.colorHex, boxShadow: `0 0 8px ${vessel.colorHex}` }}
            />
            <div className="min-w-0">
              <h3
                className="font-mono font-bold text-sm truncate tracking-wider"
                style={{ color: vessel.colorHex }}
              >
                {vessel.name || `MMSI ${vessel.mmsi}`}
              </h3>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] font-mono text-white/40 uppercase">
                  {vessel.typeName}
                </span>
                {vessel.flag && (
                  <span className="text-xs">{vessel.flag}</span>
                )}
                {vessel.simulated && (
                  <span className="text-[9px] font-mono text-amber-500/70 border border-amber-500/30 px-1 rounded">
                    SIM
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            {/* VesselFinder link */}
            <a
              href={vesselFinderUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-lg text-white/40 hover:text-[#00FFFF] hover:bg-white/5 transition-all"
              title="View on VesselFinder"
            >
              <ExternalLink size={14} />
            </a>
            <button
              onClick={dismiss}
              className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-all"
              title="Close"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* ── Nav Status bar ──────────────────────────────────────────── */}
        <div
          className="flex items-center gap-2 px-4 py-1.5 border-b"
          style={{ borderColor: `${vessel.colorHex}11`, background: `${navColor}0a` }}
        >
          {vessel.navStatus === 0
            ? <CheckCircle2 size={11} style={{ color: navColor }} />
            : <AlertCircle size={11} style={{ color: navColor }} />}
          <span className="text-[10px] font-mono tracking-widest" style={{ color: navColor }}>
            {vessel.navStatusText.toUpperCase()}
          </span>
        </div>

        {/* ── Body ──────────────────────────────────────────────────── */}
        <div className="px-4 py-3 flex flex-col gap-0">

          {/* Live speed + heading dials */}
          <div
            className="flex items-center gap-3 mb-3 p-3 rounded-lg border"
            style={{ borderColor: `${vessel.colorHex}22`, background: `${vessel.colorHex}08` }}
          >
            <HeadingDial heading={vessel.heading} />
            <div className="flex flex-col flex-1 gap-1">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[9px] font-mono text-white/40 uppercase tracking-widest">Speed (SOG)</div>
                  <div className="text-lg font-mono font-bold" style={{ color: vessel.colorHex }}>
                    {liveSOG.toFixed(1)}
                    <span className="text-[11px] text-white/50 ml-1">kn</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[9px] font-mono text-white/40 uppercase tracking-widest">Heading</div>
                  <div className="text-lg font-mono font-bold text-white">
                    {Math.round(vessel.heading)}°
                    <span className="text-[11px] text-white/50 ml-0.5">T</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Identification */}
          <div className="mb-1">
            <div className="text-[9px] font-mono text-white/25 uppercase tracking-[0.2em] mb-1 px-0.5">
              IDENTIFICATION
            </div>
            <Row icon={Hash} label="MMSI" value={vessel.mmsi} />
            <Row icon={Anchor} label="IMO" value={vessel.imo > 0 ? vessel.imo : undefined} />
            <Row icon={Radio} label="Call Sign" value={vessel.callsign || undefined} />
          </div>

          {/* Position & Course */}
          <div className="mb-1 mt-1">
            <div className="text-[9px] font-mono text-white/25 uppercase tracking-[0.2em] mb-1 px-0.5">
              POSITION
            </div>
            <Row icon={MapPin} label="Latitude" value={`${vessel.lat.toFixed(5)}°`} />
            <Row icon={MapPin} label="Longitude" value={`${vessel.lng.toFixed(5)}°`} />
            <Row icon={Compass} label="COG" value={`${Math.round(vessel.cog)}°`} />
          </div>

          {/* Voyage */}
          {(vessel.destination || vessel.eta || vessel.draught > 0) && (
            <div className="mb-1 mt-1">
              <div className="text-[9px] font-mono text-white/25 uppercase tracking-[0.2em] mb-1 px-0.5">
                VOYAGE
              </div>
              <Row icon={Navigation} label="Destination" value={vessel.destination || undefined} />
              <Row icon={Clock} label="ETA" value={vessel.eta || undefined} />
              <Row icon={Gauge} label="Draught" value={vessel.draught > 0 ? `${vessel.draught.toFixed(1)} m` : undefined} />
            </div>
          )}

          {/* Dimensions */}
          {(vessel.length > 0 || vessel.width > 0) && (
            <div className="mb-1 mt-1">
              <div className="text-[9px] font-mono text-white/25 uppercase tracking-[0.2em] mb-1 px-0.5">
                DIMENSIONS
              </div>
              {vessel.length > 0 && <Row icon={Ruler} label="Length" value={`${vessel.length} m`} />}
              {vessel.width > 0 && <Row icon={Layers} label="Beam" value={`${vessel.width} m`} />}
            </div>
          )}
        </div>

        {/* ── Footer CTA ──────────────────────────────────────────────── */}
        <div className="px-4 py-3 border-t" style={{ borderColor: `${vessel.colorHex}22` }}>
          <a
            href={vesselFinderUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-2 rounded-lg
              font-mono text-[11px] uppercase tracking-widest font-bold
              transition-all duration-200 hover:scale-[1.02] hover:shadow-lg"
            style={{
              background: `${vessel.colorHex}18`,
              border: `1px solid ${vessel.colorHex}44`,
              color: vessel.colorHex,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = `${vessel.colorHex}30`)}
            onMouseLeave={(e) => (e.currentTarget.style.background = `${vessel.colorHex}18`)}
          >
            <ExternalLink size={12} />
            View on VesselFinder
          </a>
        </div>
      </div>
    </div>
  );
}
