"use client";

import { useAppStore } from "@/store/useAppStore";
import { Ship, Navigation } from "lucide-react";

export default function MaritimeHoverTooltip() {
  const hoveredMaritime = useAppStore((state) => state.hoveredMaritime);
  const maritimeHoverScreenPos = useAppStore((state) => state.maritimeHoverScreenPos);
  const selectedMaritime = useAppStore((state) => state.selectedMaritime);
  const layers = useAppStore((state) => state.layers);

  // DO NOT RENDER if layer is off, no ship is hovered, we don't have screen coordinates,
  // or if the hovered ship is currently the selected one (avoids UI clutter).
  if (!hoveredMaritime || !maritimeHoverScreenPos || !layers.maritime) return null;
  if (selectedMaritime && ((selectedMaritime as any).mmsi === (hoveredMaritime as any).mmsi || selectedMaritime.id === hoveredMaritime.id)) return null;

  const color = (hoveredMaritime as any).colorHex ?? '#00CCFF';
  const name = (hoveredMaritime as any).name ?? `MMSI ${(hoveredMaritime as any).mmsi ?? (hoveredMaritime as any).id}`;
  const sog = ((hoveredMaritime as any).sog ?? (hoveredMaritime as any).speed ?? 0).toFixed(1);
  const typeName = (hoveredMaritime as any).typeName ?? (hoveredMaritime as any).type ?? "UNKNOWN";
  const flag = (hoveredMaritime as any).flag ?? "🏳️";

  return (
    <div 
      className="absolute z-50 pointer-events-none"
      style={{
        left: 0,
        top: 0,
        transform: `translate3d(calc(${Math.round(maritimeHoverScreenPos.x)}px + 15px), calc(${Math.round(maritimeHoverScreenPos.y)}px - 15px), 0)`,
        transition: 'transform 0.05s linear',
        willChange: 'transform'
      }}
    >
      <div 
        className="flex flex-col bg-[#05070a]/90 backdrop-blur-md border shadow-[0_0_15px_rgba(0,0,0,0.8)] overflow-hidden rounded-sm pointer-events-none"
        style={{ borderColor: `${color}66`, minWidth: '160px' }}
      >
        <div 
          className="px-2 py-1.5 flex items-center gap-2 border-b"
          style={{ background: `linear-gradient(90deg, ${color}22, transparent)`, borderColor: `${color}44` }}
        >
          <Ship className="w-3 h-3 flex-shrink-0" style={{ color }} />
          <h3 className="font-display font-bold text-[11px] uppercase tracking-wider text-white truncate max-w-[120px]">
            {name}
          </h3>
        </div>
        <div className="px-2 py-1.5 flex flex-col gap-1 font-mono text-[9px] text-gray-300">
          <div className="flex justify-between items-center">
            <span className="text-gray-500 uppercase">Type Class</span>
            <span className="font-bold text-white truncate max-w-[80px]">{typeName}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-500 uppercase">Flag</span>
            <span className="font-bold text-white truncate max-w-[80px]">{flag}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-500 uppercase flex items-center gap-1"><Navigation size={8} /> SOG</span>
            <span className="font-bold text-[#00FF00]">{sog} KTS</span>
          </div>
        </div>
      </div>
    </div>
  );
}
