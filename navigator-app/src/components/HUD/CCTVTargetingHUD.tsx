import { useAppStore } from "@/store/useAppStore";
import { useEffect, useState, useRef } from "react";

export default function CCTVTargetingHUD() {
  const selectedCCTV = useAppStore((state) => state.selectedCCTV);
  const cctvScreenPos = useAppStore((state) => state.cctvScreenPos);
  
  const [imageTick, setImageTick] = useState(0);

  // Poll exactly every 1.5 seconds to simulate a live 1-FPS frame loop
  useEffect(() => {
    if (!selectedCCTV) return;
    const interval = setInterval(() => {
      setImageTick((prev) => prev + 1);
    }, 1500);
    return () => clearInterval(interval);
  }, [selectedCCTV]);

  if (!selectedCCTV || !cctvScreenPos) return null;

  return (
    <div 
      className="absolute pointer-events-none z-50 transition-all duration-75"
      style={{
        left: cctvScreenPos.x,
        top: cctvScreenPos.y,
        transform: 'translate(-50%, -50%)' // Center the anchor on the point
      }}
    >
      {/* Anchor targeting box on the point */}
      <svg className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 text-[#FF0055]" viewBox="0 0 100 100" fill="none">
        <rect x="10" y="10" width="80" height="80" stroke="currentColor" strokeWidth="2" strokeDasharray="10 10" className="animate-[spin_6s_linear_infinite]" />
        <rect x="25" y="25" width="50" height="50" stroke="currentColor" strokeWidth="1" className="opacity-50" />
        <circle cx="50" cy="50" r="4" fill="currentColor" />
      </svg>

      {/* Glassmorphic Live Feed Panel */}
      <div className="absolute top-8 left-10 w-[300px] bg-[#1a050d]/80 backdrop-blur-md border border-[#FF0055]/50 p-3 shadow-[0_0_25px_rgba(255,0,85,0.2)] rounded-sm pointer-events-auto">
        <div className="flex justify-between items-center mb-2 border-b border-[#FF0055]/30 pb-1">
          <span className="text-[#FF0055] font-mono text-xs font-bold tracking-widest leading-none">SYS.OPTIC_LINK //</span>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 bg-[#FF0055] rounded-full animate-pulse"></div>
            <span className="text-[#FF0055] font-mono text-[10px] tracking-wider">LIVE</span>
          </div>
        </div>
        
        <div className="space-y-1 mb-3">
          <div className="flex justify-between items-end">
            <span className="text-[#FF0055]/60 font-mono text-[10px] tracking-wider">NODE ID</span>
            <span className="text-white font-mono text-sm">{selectedCCTV.id}</span>
          </div>
          <div className="flex justify-between items-end border-b border-[#FF0055]/20 pb-1">
            <span className="text-[#FF0055]/60 font-mono text-[10px] tracking-wider">ZONE</span>
            <span className="text-white font-mono text-xs truncate max-w-[200px] text-right">{selectedCCTV.name}</span>
          </div>
        </div>

        {/* CRT/Glitch Container for the actual image feed */}
        <div className="relative w-full h-[160px] bg-black border border-[#FF0055]/40 overflow-hidden flex items-center justify-center">
          <img 
            src={`/api/cctv/${selectedCCTV.id}?tick=${imageTick}`} 
            alt={`CCTV Frame ${selectedCCTV.id}`}
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
          
          {/* Timestamp dynamic overlay inside the feed */}
          <div className="absolute bottom-1 right-1 bg-black/60 px-1 z-40">
            <span className="text-[#FF0055] font-mono text-[8px] animate-pulse">REC: {new Date().toLocaleTimeString('en-ZA', { hour12: false })}</span>
          </div>
        </div>
        
        {/* Decorative HUD brackets */}
        <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-[#FF0055]"></div>
        <div className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-[#FF0055]"></div>
      </div>
    </div>
  );
}
