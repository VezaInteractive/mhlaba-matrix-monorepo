"use client";

import { useAppStore } from '@/store/useAppStore';
import { Target, Anchor } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function MaritimeTargetingHUD() {
  const selectedMaritime = useAppStore((state) => state.selectedMaritime);
  const maritimeScreenPos = useAppStore((state) => state.maritimeScreenPos);
  const [glitch, setGlitch] = useState(false);

  useEffect(() => {
    if (selectedMaritime) {
      setGlitch(true);
      const t = setTimeout(() => setGlitch(false), 300);
      return () => clearTimeout(t);
    }
  }, [selectedMaritime]);

  if (!selectedMaritime || !maritimeScreenPos) return null;

  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        pointerEvents: 'none',
        transform: `translate3d(calc(${Math.round(maritimeScreenPos.x)}px - 50%), calc(${Math.round(maritimeScreenPos.y)}px - 50%), 0)`,
        willChange: 'transform',
        zIndex: 50,
      }}
      className={`transition-opacity duration-200 ${glitch ? 'opacity-80' : 'opacity-100'}`}
    >
      {/* Target Reticle */}
      <div className="absolute inset-0 flex items-center justify-center animate-spin-slow">
        <Target size={120} className="text-[#00CCFF] opacity-50" strokeWidth={0.5} />
      </div>
      <div className="absolute inset-0 flex items-center justify-center animate-reverse-spin-slow">
        <Target size={140} className="text-[#00CCFF] opacity-30" strokeWidth={1} />
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <Anchor size={24} className="text-[#00CCFF] opacity-70" strokeWidth={1.5} />
      </div>
    </div>
  );
}
