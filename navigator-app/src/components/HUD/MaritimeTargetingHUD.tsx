"use client";

import { useAppStore } from "@/store/useAppStore";
import { useEffect, useState, useCallback } from "react";
import { Navigation, AlertTriangle, MapPin, ExternalLink, X, Image as ImageIcon } from "lucide-react";
import { VesselRecord } from "@/hooks/useMaritimeTelemetry";

interface VesselEnriched {
  found: boolean;
  mmsi: number;
  name: string;
  flag: string;
  yearBuilt: string | number;
  photo?: string | null;
  vesselUrl: string;
}

export default function MaritimeTargetingHUD() {
  const selectedMaritime = useAppStore((state) => state.selectedMaritime) as VesselRecord | null;
  const maritimeScreenPos = useAppStore((state) => state.maritimeScreenPos);
  const layers = useAppStore((state) => state.layers);
  
  const [enriched, setEnriched] = useState<VesselEnriched | null>(null);
  const [isEnriching, setIsEnriching] = useState(false);

  const fetchEnrichment = useCallback(async (mmsi: number) => {
    setIsEnriching(true);
    try {
      const res = await fetch(`/api/vessel/${mmsi}`);
      if (res.ok) {
        const data = await res.json();
        setEnriched(data.found ? data : null);
      } else {
        setEnriched(null);
      }
    } catch {
      setEnriched(null);
    } finally {
      setIsEnriching(false);
    }
  }, []);

  useEffect(() => {
    if (selectedMaritime?.mmsi) {
      setEnriched(null);
      fetchEnrichment(selectedMaritime.mmsi);
    }
  }, [selectedMaritime, fetchEnrichment]);

  if (!selectedMaritime || !maritimeScreenPos || !layers.maritime) return null;

  const color = selectedMaritime.colorHex || '#00CCFF';
  const name = enriched?.name || selectedMaritime.name || "UNKNOWN VESSEL";
  const sog = Number(selectedMaritime.sog || selectedMaritime.speed || 0).toFixed(1);
  const heading = Number(selectedMaritime.heading || selectedMaritime.cog || 0).toFixed(0);
  const navStatus = selectedMaritime.navStatusText || "UNDERWAY";
  const flag = enriched?.flag || selectedMaritime.flag || "🏳️";
  const typeName = selectedMaritime.typeName || selectedMaritime.type || "UNKNOWN TYPE";

  return (
    <div 
      className="absolute z-50 pointer-events-auto"
      style={{
        left: 0,
        top: 0,
        transform: `translate3d(calc(${Math.round(maritimeScreenPos.x)}px + 30px), calc(${Math.round(maritimeScreenPos.y)}px - 50%), 0)`,
        transition: 'transform 0.05s linear',
        willChange: 'transform'
      }}
    >
      {/* Target Line Connector */}
      <div 
        className="absolute w-[30px] h-[2px] bg-white text-transparent opacity-50" 
        style={{ right: '100%', top: '50%', background: `linear-gradient(90deg, transparent, ${color})` }}
      />
      
      {/* HUD Dossier Block */}
      <div 
        className="relative w-64 bg-[#05070a]/95 backdrop-blur-md border shadow-[0_0_20px_rgba(0,0,0,0.8)] overflow-hidden rounded-md flex flex-col"
        style={{ borderColor: `${color}66` }}
      >
        {/* Dynamic Image / Skeleton Block */}
        <div className="w-full h-28 bg-black/60 relative border-b border-white/5 flex items-center justify-center overflow-hidden shrink-0">
          {isEnriching ? (
            <div className="absolute inset-0 bg-white/5 animate-pulse flex items-center justify-center">
               <span className="text-[10px] font-mono text-[#00F0FF] animate-pulse tracking-widest">[ DECRYPTING_IMAGE ]</span>
            </div>
          ) : enriched?.photo ? (
            <img src={enriched.photo} alt={name} className="w-full h-full object-cover opacity-80 mix-blend-screen" />
          ) : (
            <div className="flex flex-col items-center justify-center opacity-30">
              <ImageIcon className="w-6 h-6 mb-1" />
              <span className="text-[8px] font-mono uppercase tracking-widest">NO_OPTICAL_FEED</span>
            </div>
          )}
          {/* Bottom Gradient Fade for Image Block integration to Header */}
          <div className="absolute inset-0 top-1/2 bg-gradient-to-t from-[#05070a] to-transparent mix-blend-multiply" />
        </div>

        {/* Header Ribbon - Pulled up slightly over the image gradient */}
        <div 
          className="px-3 py-2 flex items-start justify-between border-b relative z-10"
          style={{ background: `linear-gradient(90deg, ${color}22, ${color}11)`, borderColor: `${color}44`, marginTop: '-12px' }}
        >
          <div className="flex flex-col w-[85%]">
            <div className="flex items-center gap-1.5 overflow-hidden">
               <span className="text-[14px] shrink-0 leading-none pb-0.5">{flag}</span>
               <h3 className="font-display font-bold text-[14px] uppercase tracking-wider text-white truncate drop-shadow-md" title={name}>
                 {name}
               </h3>
            </div>
            <div className="flex items-center gap-2 text-[9px] font-mono tracking-widest mt-0.5 truncate">
               <span style={{ color }}>{typeName}</span>
               <span className="text-white/40">MMSI:{selectedMaritime.mmsi}</span>
            </div>
          </div>
          <button 
            onClick={() => useAppStore.getState().setSelectedMaritime(null)}
            className="text-white/40 hover:text-white transition-colors flex-shrink-0 pt-0.5 bg-black/50 rounded-full p-0.5"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Data Grid */}
        <div className="p-3 space-y-2 font-mono text-[10px] bg-gradient-to-b from-[#05070a] to-[#010203]">
          {/* Kinematics */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-white/5 p-1.5 rounded-sm border border-white/5 flex flex-col gap-0.5 group hover:bg-white/10 transition-colors">
              <span className="text-gray-500 uppercase text-[8px] flex items-center gap-1"><Navigation size={9} /> SOG</span>
              <div className="flex items-end gap-1">
                 <span className="text-[#00FF00] font-bold text-xs leading-none">{sog}</span>
                 <span className="text-[#00FF00]/50 text-[8px] leading-none mb-[1px]">KTS</span>
              </div>
            </div>
            
            <div className="bg-white/5 p-1.5 rounded-sm border border-white/5 flex flex-col gap-0.5 group hover:bg-white/10 transition-colors">
              <span className="text-gray-500 uppercase text-[8px] flex items-center gap-1"><Navigation size={9} className="rotate-45" /> COG</span>
              <div className="flex items-end gap-1">
                 <span className="text-[#00F0FF] font-bold text-xs leading-none">{heading}°</span>
                 <span className="text-[#00F0FF]/50 text-[8px] leading-none mb-[1px]">TRU</span>
              </div>
            </div>
          </div>

          {/* Location & Status */}
          <div className="bg-white/5 p-1.5 rounded-sm border border-white/5 flex flex-col gap-1.5 mt-2 transition-colors hover:bg-white/10">
             <div className="flex justify-between items-center bg-black/40 px-1.5 py-1 rounded">
               <span className="text-gray-500 uppercase text-[8px] flex items-center gap-1"><AlertTriangle size={8} /> STATUS</span>
               <span className="text-[#FFA726] font-bold truncate max-w-[120px] text-[9px] uppercase">
                 {navStatus}
               </span>
             </div>
             
             {selectedMaritime.destination && (
               <div className="flex justify-between items-center bg-black/40 px-1.5 py-1 rounded">
                 <span className="text-gray-500 uppercase text-[8px] flex items-center gap-1"><MapPin size={8} /> DEST</span>
                 <span className="text-white font-bold truncate max-w-[130px] text-right tracking-widest text-[8px] uppercase">
                   {selectedMaritime.destination}
                 </span>
               </div>
             )}

             {(selectedMaritime.length > 0 || selectedMaritime.draught > 0) && (
               <div className="flex justify-between items-center bg-black/40 px-1.5 py-1 rounded">
                 <span className="text-gray-500 uppercase text-[8px] flex items-center gap-1">DIM</span>
                 <span className="text-[#00CCFF] font-bold text-right tracking-widest text-[8px] uppercase">
                   {selectedMaritime.length ? `${selectedMaritime.length}m` : '-'} × {selectedMaritime.width ? `${selectedMaritime.width}m` : '-'} | DRGT: {selectedMaritime.draught ? `${selectedMaritime.draught}m` : '-'}
                 </span>
               </div>
             )}
          </div>
          
          {/* Action Footer */}
          {(!isEnriching && enriched?.vesselUrl) && (
            <div className="pt-2 text-right">
               <a
                href={enriched.vesselUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-[9px] uppercase tracking-widest font-mono hover:animate-pulse transition-colors"
                style={{ color }}
              >
                OPEN VESSEL LOG <ExternalLink size={10} />
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
