import { useAppStore } from "@/store/useAppStore";

export default function SatelliteTargetingHUD() {
  const selectedSatellite = useAppStore((state) => state.selectedSatellite);
  const satelliteScreenPos = useAppStore((state) => state.satelliteScreenPos);

  if (!selectedSatellite || !satelliteScreenPos) return null;

  return (
    <div 
      className="absolute pointer-events-none z-50 transition-all duration-75"
      style={{
        left: satelliteScreenPos.x,
        top: satelliteScreenPos.y,
        transform: 'translate(-50%, -50%)'
      }}
    >
      {/* Target Crosshair Bracket */}
      <svg className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 text-[#00FF00]" style={{ animation: "spin 20s linear infinite reverse" }} viewBox="0 0 100 100" fill="none">
        <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="0.5" strokeDasharray="2 8" />
        <path d="M 50 2 L 50 12" stroke="currentColor" strokeWidth="2" />
        <path d="M 50 98 L 50 88" stroke="currentColor" strokeWidth="2" />
        <path d="M 2 50 L 12 50" stroke="currentColor" strokeWidth="2" />
        <path d="M 98 50 L 88 50" stroke="currentColor" strokeWidth="2" />
      </svg>
      {/* Inner Static Dot */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-[#00FF00] rounded-sm shadow-[0_0_12px_#00FF00]"></div>

      {/* Glassmorphic Data Panel */}
      <div className="absolute top-12 left-16 w-[220px] bg-[#001000]/80 backdrop-blur-md border border-[#00FF00]/40 p-3 shadow-[0_0_20px_rgba(0,255,0,0.15)] rounded-sm">
        <div className="flex justify-between items-center mb-1 border-b border-[#00FF00]/30 pb-1">
          <span className="text-[#00FF00] font-mono text-[10px] font-bold tracking-widest leading-none">SAT_LINK //</span>
          <span className="text-[#00FF00] font-mono text-[10px] animate-pulse">ESTABLISHED</span>
        </div>
        
        <div className="space-y-1 mt-2">
          <div className="flex justify-between items-end border-b border-white/10 pb-1">
            <span className="text-[#00FF00]/70 font-mono text-[9px] tracking-wider">NORAD ID</span>
            <span className="text-white font-mono text-xs">{selectedSatellite.id}</span>
          </div>
          <div className="flex justify-between items-end border-b border-white/10 pb-1">
            <span className="text-[#00FF00]/70 font-mono text-[9px] tracking-wider">DESIGNATION</span>
            <span className="text-white font-mono pl-2 text-right truncate text-[10px]">{selectedSatellite.name}</span>
          </div>
          <div className="flex justify-between items-end border-b border-white/10 pb-1">
            <span className="text-[#00FF00]/70 font-mono text-[9px] tracking-wider">APO / PERI</span>
            <span className="text-white font-mono text-xs">{selectedSatellite.apogee.toFixed(0)} / {selectedSatellite.perigee.toFixed(0)} km</span>
          </div>
          <div className="flex justify-between items-end">
            <span className="text-[#00FF00]/70 font-mono text-[9px] tracking-wider">INCLINATION</span>
            <span className="text-white font-mono text-xs">{selectedSatellite.inc.toFixed(2)}°</span>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute -bottom-1 -left-1 w-2 h-2 border-b border-l border-[#00FF00]"></div>
        <div className="absolute -top-1 -right-1 w-2 h-2 border-t border-r border-[#00FF00]"></div>
      </div>
    </div>
  );
}
