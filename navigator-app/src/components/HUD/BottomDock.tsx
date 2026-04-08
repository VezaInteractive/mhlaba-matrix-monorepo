"use client";

import { cn } from "@/lib/utils";
import { useAppStore, POIs, POIKey } from "@/store/useAppStore";
import { MapPin, RotateCcw, Clock, ShieldAlert, Cpu, Plane, Ship } from "lucide-react";
import { useState, useEffect } from "react";

const LocationPill = ({
  poiKey,
  label,
  isActive,
  onClick,
}: {
  poiKey: POIKey;
  label: string;
  isActive: boolean;
  onClick: () => void;
}) => {
  const coords = POIs[poiKey];
  return (
    <div className="relative flex flex-col items-center">
      {isActive && (
        <div className="absolute -top-10 font-mono text-primary text-[10px] animate-pulse whitespace-nowrap drop-shadow-md bg-background px-2 py-1 rounded-sm border border-active">
          {coords.lat.toFixed(4)}N {coords.lng.toFixed(4)}E
        </div>
      )}
      <button
        onClick={onClick}
        className={cn(
          "px-6 py-2 rounded-full border transition-all duration-300 text-[12px] uppercase font-bold flex items-center gap-2",
          isActive
            ? "bg-primary border-primary text-black shadow-neon"
            : "bg-surface border-glass text-text hover:border-active"
        )}
      >
        <MapPin className="w-3 h-3" />
        {label}
      </button>
    </div>
  );
};

const CONTINENT_CITIES: Record<string, { poiKey: POIKey; label: string }[]> = {
  AFRICA: [
    { poiKey: "JOBURG", label: "JHB" },
    { poiKey: "CAPETOWN", label: "CPT" },
    { poiKey: "PRETORIA", label: "PTA" },
    { poiKey: "DURBAN", label: "DBN" }
  ],
  EUROPE: [
    { poiKey: "LONDON", label: "LON" },
    { poiKey: "BERLIN", label: "BER" },
    { poiKey: "PARIS", label: "PAR" },
    { poiKey: "ROME", label: "ROM" }
  ],
  NORTH_AMERICA: [
    { poiKey: "NY", label: "NYC" },
    { poiKey: "LA", label: "LAX" },
    { poiKey: "TORONTO", label: "TOR" },
    { poiKey: "MEXICO", label: "MEX" }
  ],
  SOUTH_AMERICA: [
    { poiKey: "SAO", label: "SAO" },
    { poiKey: "BA", label: "BUE" },
    { poiKey: "BOGOTA", label: "BOG" },
    { poiKey: "LIMA", label: "LIM" }
  ],
  ASIA: [
    { poiKey: "TOKYO", label: "TOK" },
    { poiKey: "SHANGHAI", label: "SHA" },
    { poiKey: "MUMBAI", label: "MUM" },
    { poiKey: "SG", label: "SIN" }
  ],
  OCEANIA: [
    { poiKey: "SYDNEY", label: "SYD" },
    { poiKey: "MELB", label: "MEL" },
    { poiKey: "AUCKLAND", label: "AUK" },
    { poiKey: "PERTH", label: "PER" }
  ]
};

export default function BottomDock() {
  const { activeContinent, activePOI, setActivePOI, timeMultiplier, setTimeMultiplier } = useAppStore();
  const selectedFlight = useAppStore((state) => state.selectedFlight);
  const selectedMaritime = useAppStore((state) => state.selectedMaritime);

  const [ping, setPing] = useState(12);

  // Fake Ping fluctuation for aesthetics
  useEffect(() => {
    const interval = setInterval(() => {
      setPing(12 + Math.floor(Math.random() * 8 - 4));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  let shipColor = 'text-[#00FFFF]';
  if (selectedMaritime && selectedMaritime.type) {
    const t = selectedMaritime.type.toUpperCase();
    if (t.includes('CARGO')) shipColor = 'text-[#FF8C00]';
    else if (t.includes('TANKER')) shipColor = 'text-[#FF0000]';
    else if (t.includes('PASSENGER')) shipColor = 'text-[#0000FF]';
  }

  const renderCenterContent = () => {
    if (selectedFlight) {
      return (
        <div className="flex items-center gap-8 animate-in fade-in zoom-in-95 duration-300">
          <div className="flex items-center gap-3 border-r border-white/10 pr-6">
            <Plane className="w-5 h-5 text-[#FFCC00]" />
            <div className="flex flex-col">
              <span className="text-[9px] font-mono text-muted uppercase tracking-widest">Aviation Intercept</span>
              <span className="text-sm font-mono text-[#FFCC00] font-bold tracking-widest uppercase">{selectedFlight.callsign || 'UNK'}</span>
            </div>
          </div>
          <div className="flex flex-col min-w-[120px]">
            <span className="text-[8px] font-mono text-muted uppercase">Airline</span>
            <span className="text-xs font-mono text-white font-bold truncate">{selectedFlight.airline || 'UNK'}</span>
          </div>
          <div className="flex flex-col min-w-[120px]">
            <span className="text-[8px] font-mono text-muted uppercase">Origin</span>
            <span className="text-xs font-mono text-[#00FFFF] font-bold truncate">{selectedFlight.origin || 'UNK'}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[8px] font-mono text-muted uppercase">Altitude</span>
            <span className="text-xs font-mono font-bold text-white">{(selectedFlight.alt || 0).toLocaleString()} m</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[8px] font-mono text-muted uppercase">Speed</span>
            <span className="text-xs font-mono font-bold text-[#FF0055]">M {(selectedFlight.mach || 0).toFixed(3)}</span>
          </div>
        </div>
      );
    }

    if (selectedMaritime) {
      return (
        <div className="flex items-center gap-8 animate-in fade-in zoom-in-95 duration-300">
          <div className="flex items-center gap-3 border-r border-white/10 pr-6">
            <Ship className={`w-5 h-5 ${shipColor}`} />
            <div className="flex flex-col">
              <span className="text-[9px] font-mono text-muted uppercase tracking-widest">Vessel Uplink</span>
              <span className={`text-sm font-mono ${shipColor} font-bold tracking-widest uppercase truncate max-w-[120px]`}>{selectedMaritime.type || 'UNK'}</span>
            </div>
          </div>
          <div className="flex flex-col min-w-[120px]">
            <span className="text-[8px] font-mono text-muted uppercase">MMSI</span>
            <span className="text-xs font-mono text-white font-bold">{selectedMaritime.id || 'UNK'}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[8px] font-mono text-muted uppercase">Speed</span>
            <span className="text-xs font-mono font-bold text-[#FF0055]">{(selectedMaritime.speed || 0).toFixed(1)} kts</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[8px] font-mono text-muted uppercase">Heading</span>
            <span className="text-xs font-mono font-bold text-[#FFCC00]">{Math.round(selectedMaritime.heading || 0)}°</span>
          </div>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-6">
        <div className="flex flex-col">
          <span className="text-[8px] font-mono text-muted uppercase">Global Ping</span>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 bg-[#00FF00] rounded-full animate-pulse" />
            <span className="text-xs font-mono text-[#00FF00]">{ping}ms</span>
          </div>
        </div>
        <div className="flex flex-col">
          <span className="text-[8px] font-mono text-muted uppercase">System Status</span>
          <div className="flex items-center gap-1.5 text-[#00FFFF]">
            <ShieldAlert className="w-3 h-3" />
            <span className="text-xs font-mono font-bold">SECURE_LINK</span>
          </div>
        </div>
        <div className="flex flex-col">
          <span className="text-[8px] font-mono text-muted uppercase">Active Vectors</span>
          <div className="flex items-center gap-1.5 text-primary">
            <Cpu className="w-3 h-3" />
            <span className="text-xs font-mono tracking-widest font-bold animate-[pulse_3s_ease-in-out_infinite]">9,824</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 w-full flex justify-center pointer-events-none z-50">
      <div className="bg-[#0b0f19]/95 backdrop-blur-md border-t border-white/10 w-full h-16 flex items-center justify-between px-8 pointer-events-auto shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">

        {/* Left: Location Jumps */}
        <div className="flex items-center gap-3 w-80">
          {(CONTINENT_CITIES[activeContinent] || CONTINENT_CITIES.AFRICA).map((city) => (
            <LocationPill
              key={city.poiKey}
              poiKey={city.poiKey}
              label={city.label}
              isActive={activePOI === city.poiKey}
              onClick={() => setActivePOI(city.poiKey)}
            />
          ))}
          <div className="h-6 w-[1px] bg-white/20 mx-1" />
          <button
            onClick={() => setActivePOI(null)}
            className="p-1.5 rounded-full bg-surface border border-glass hover:bg-surface/50 transition-colors"
            title="Reset View"
          >
            <RotateCcw className="w-3.5 h-3.5 text-muted hover:text-white" />
          </button>
        </div>

        {/* Center: Dynamic Information or Analytics */}
        <div className="flex items-center gap-6 border-x border-white/10 px-8 flex-1 justify-center min-w-[400px]">
          {renderCenterContent()}
        </div>

        {/* Right: Time Domain Orbital Controller */}
        <div className="flex items-center gap-4 bg-black/40 border border-white/5 rounded-md px-4 py-1.5">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#00F0FF]" />
            <span className="text-[10px] font-mono uppercase text-muted tracking-widest">Orbital Time-Shift</span>
          </div>

          <input
            type="range"
            min="1"
            max="120"
            step="1"
            value={timeMultiplier}
            onChange={(e) => setTimeMultiplier(parseInt(e.target.value, 10))}
            className="w-32 accent-[#00F0FF] cursor-pointer"
          />

          <span className="font-mono text-xs text-[#00F0FF] w-8 text-right font-bold tracking-wider">
            {timeMultiplier}x
          </span>
        </div>

      </div>
    </div>
  );
}
