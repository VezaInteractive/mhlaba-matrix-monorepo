import { useAppStore } from '@/store/useAppStore';
import { Target, Plane } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function FlightTargetingHUD() {
  const selectedFlight = useAppStore((state) => state.selectedFlight);
  const flightScreenPos = useAppStore((state) => state.flightScreenPos);
  const [glitch, setGlitch] = useState(false);

  useEffect(() => {
    if (selectedFlight) {
      setGlitch(true);
      const t = setTimeout(() => setGlitch(false), 300);
      return () => clearTimeout(t);
    }
  }, [selectedFlight]);

  if (!selectedFlight || !flightScreenPos) return null;

  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        pointerEvents: 'none',
        transform: `translate3d(calc(${Math.round(flightScreenPos.x)}px - 50%), calc(${Math.round(flightScreenPos.y)}px - 50%), 0)`,
        willChange: 'transform',
        zIndex: 50,
      }}
      className={`transition-opacity duration-200 ${glitch ? 'opacity-80' : 'opacity-100'}`}
    >
      {/* Target Reticle */}
      <div className="absolute inset-0 flex items-center justify-center animate-spin-slow">
        <Target size={120} className="text-[#FFCC00] opacity-50" strokeWidth={0.5} />
      </div>
      <div className="absolute inset-0 flex items-center justify-center animate-reverse-spin-slow">
        <Target size={140} className="text-[#FFCC00] opacity-30" strokeWidth={1} />
      </div>

    </div>
  );
}
