"use client";

import { useAppStore } from "@/store/useAppStore";
import { Video, Plane, Satellite, Car, X, Camera, Ship, Wind, Activity, Building2, Home } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

const ToggleCard = ({
  icon: Icon,
  label,
  value,
  isActive,
  onClick,
}: {
  icon: any;
  label: string;
  value: string;
  isActive: boolean;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={cn(
      "relative h-12 w-full flex items-center justify-between px-4 rounded-md border transition-all duration-300 overflow-hidden group",
      isActive
        ? "border-active bg-primary/10 text-primary shadow-neon"
        : "border-glass bg-surface text-text hover:bg-surface/20"
    )}
  >
    {/* Background fill transition */}
    <div
      className={cn(
        "absolute inset-0 bg-primary/10 transition-transform duration-500 origin-left z-0",
        isActive ? "scale-x-100" : "scale-x-0"
      )}
    />
    <div className="relative z-10 flex items-center gap-3">
      <Icon className={cn("w-5 h-5", isActive ? "text-primary" : "text-muted")} />
      <span className="font-body font-medium text-sm drop-shadow-md">{label}</span>
    </div>
    <div className={cn("relative z-10 font-mono text-sm", isActive ? "text-primary" : "text-muted")}>
      {value}
    </div>
  </button>
);

import { ToggleLeft as ToggleCardProps } from "lucide-react"; // Cleanup unused import if any

export default function LeftPanel() {
  const { layers, toggleLayer, selectedCCTV, setSelectedCCTV, searchQuery, setSearchQuery, triggerSearch } = useAppStore();
  const [flightCount, setFlightCount] = useState(0);

  // Poll flight count if layers.flights is true
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (layers.flights) {
      // Stub flight count just for UI. MapViewer handles real rendering.
      setFlightCount(Math.floor(Math.random() * 50) + 300);
      interval = setInterval(() => {
        setFlightCount((prev) => prev + Math.floor(Math.random() * 10 - 5));
      }, 5000);
    } else {
      setFlightCount(0);
    }
    return () => clearInterval(interval);
  }, [layers.flights]);

  // Live feed timestamp tick to auto-refresh the snapshot image every 10 seconds
  const [imgTimestamp, setImgTimestamp] = useState(Date.now());
  useEffect(() => {
    if (!layers.cctv || !selectedCCTV) return;
    const interval = setInterval(() => setImgTimestamp(Date.now()), 1500);
    return () => clearInterval(interval);
  }, [layers.cctv, selectedCCTV]);

  return (
    <div className="fixed left-6 top-6 bottom-24 w-80 flex flex-col gap-4 pointer-events-auto z-50">
      
      {/* Animated Brand Header */}
      <div className="bg-[#05070A] shadow-2xl border border-white/10 rounded-lg w-full h-28 shrink-0 flex items-center justify-center p-2 relative overflow-hidden group">
        {/* Subtle backplate glow on hover */}
        <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-2xl" />
        <img 
          src="/mhlaba-logo.svg" 
          alt="Mhlaba Matrix Logo" 
          className="w-full h-full object-contain relative z-10 drop-shadow-md transition-transform duration-500 group-hover:scale-105"
        />
      </div>

      <div className="bg-[#0b0f19] shadow-2xl border border-white/10 rounded-lg w-full h-full p-6 flex flex-col gap-4">
        {/* Search Console */}
        <div className="relative w-full">
          <input
            type="text"
            placeholder="SEARCH ASSETS / NORAD_ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && triggerSearch(searchQuery)}
            className="w-full bg-[#05070a] border border-[#00FF00]/30 rounded-md py-2.5 pl-3 pr-10 text-[10px] uppercase font-mono tracking-widest text-[#00FF00] placeholder-[#00FF00]/40 focus:outline-none focus:border-[#00FF00] focus:shadow-[0_0_15px_rgba(0,255,0,0.2)] transition-all"
          />
          <button 
            onClick={() => triggerSearch(searchQuery)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-[#00FF00]/60 hover:text-[#00FF00] transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </button>
        </div>

        <div className="border-b border-glass pb-2 mt-2">
          <h2 className="font-display font-bold text-lg uppercase tracking-widest text-text">
            DATA LAYERS
          </h2>
        </div>

        <div className="flex flex-col gap-4 mt-2 overflow-y-auto scrollbar-none flex-1 pr-1" style={{ minHeight: '200px' }}>
          <ToggleCard
            icon={Video}
            label="CCTV"
            value={layers.cctv ? "LIVE" : "OFF"}
            isActive={layers.cctv}
            onClick={() => toggleLayer("cctv")}
          />
          <ToggleCard
            icon={Plane}
            label="Live Flights"
            value={layers.flights ? flightCount.toString() : "0"}
            isActive={layers.flights}
            onClick={() => toggleLayer("flights")}
          />
          <ToggleCard
            icon={Satellite}
            label="Satellites"
            value={layers.satellites ? "ORBIT" : "SLEEP"}
            isActive={layers.satellites}
            onClick={() => toggleLayer("satellites")}
          />
          <ToggleCard
            icon={Car}
            label="National Traffic"
            value={layers.traffic ? "ACTIVE" : "OFF"}
            isActive={layers.traffic}
            onClick={() => toggleLayer("traffic")}
          />
          <ToggleCard
            icon={Ship}
            label="Ocean Traffic"
            value={layers.maritime ? "FLOW" : "OFF"}
            isActive={layers.maritime}
            onClick={() => toggleLayer("maritime")}
          />
          <ToggleCard
            icon={Wind}
            label="Climate Forces"
            value={layers.climate ? "LIVE" : "OFF"}
            isActive={layers.climate}
            onClick={() => toggleLayer("climate")}
          />

          <ToggleCard
            icon={Building2}
            label="Businesses"
            value={layers.businesses ? "DEPLOYED" : "HIDDEN"}
            isActive={layers.businesses}
            onClick={() => toggleLayer("businesses")}
          />
          <ToggleCard
            icon={Home}
            label="Real Estate"
            value={layers.realEstate ? "LISTED" : "HIDDEN"}
            isActive={layers.realEstate}
            onClick={() => toggleLayer("realEstate")}
          />
        </div>
        {/* Live Camera Feed Panel */}
        {selectedCCTV && layers.cctv && (
          <div className="mt-auto animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-hidden flex flex-col gap-3 pt-4 border-t border-glass">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-primary">
                <Camera className="w-4 h-4" />
                <h3 className="font-mono text-xs truncate max-w-[180px] uppercase font-bold" title={selectedCCTV.name}>
                  {selectedCCTV.name}
                </h3>
              </div>
              <button 
                onClick={() => setSelectedCCTV(null)}
                className="text-muted hover:text-white transition-colors"
                title="Close Feed"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="relative w-full aspect-video bg-black border border-[#FF0055]/40 overflow-hidden flex items-center justify-center rounded-sm shadow-[0_0_15px_rgba(255,0,85,0.15)] group">
              <img 
                src={`/api/cctv/${selectedCCTV.id}?tick=${imgTimestamp}`} 
                alt={`CCTV Frame ${selectedCCTV.name}`}
                className="w-full h-full object-cover mix-blend-screen opacity-90 filter contrast-125 saturate-50 sepia-[.3] hue-rotate-[-30deg]"
                crossOrigin="anonymous"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg" width="300" height="150" viewBox="0 0 100 50"><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="monospace" font-size="6" fill="#FF0055">NO SIGNAL</text></svg>');
                }}
              />
              
              {/* Scanline CRT overlay effect */}
              <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%] z-10" />
              
              {/* Static noise overlay */}
              <div className="absolute inset-0 pointer-events-none opacity-5 bg-noise animate-[noise_0.2s_infinite] mix-blend-overlay z-20"></div>

              {/* Scrolling tracking bar */}
              <div className="absolute w-full h-[2px] bg-[#FF0055]/40 top-0 left-0 animate-[scan_3s_linear_infinite] z-30 shadow-[0_0_8px_#FF0055]"></div>
              
              {/* Live indicator overlay */}
              <div className="absolute top-2 left-2 bg-[#FF0055]/90 backdrop-blur-sm text-white text-[9px] font-bold px-1.5 py-0.5 rounded tracking-widest flex items-center gap-1 shadow-md z-40">
                <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                LIVE
              </div>
              
              <div className="absolute bottom-1 right-1 bg-black/60 px-1 z-40">
                <span className="text-[#FF0055] font-mono text-[8px] animate-pulse">REC: {new Date().toLocaleTimeString('en-ZA', { hour12: false })}</span>
              </div>
            </div>
          </div>
        )}      </div>
    </div>
  );
}
