import { useEffect, useRef, useState } from "react";

export interface CyberAttack {
  id: string;
  sourceLng: number;
  sourceLat: number;
  targetLng: number;
  targetLat: number;
  severity: number; // 0=Low (purple), 1=Medium (magenta), 2=High (red)
}

// Major cyber threat source regions and their likely targets
const THREAT_VECTORS: Array<{
  sourceLng: number; sourceLat: number; sourceLabel: string;
  targetLng: number; targetLat: number; targetLabel: string;
  severity: number;
}> = [
  { sourceLng: 116.4, sourceLat: 39.9,  sourceLabel: "Beijing",    targetLng: -73.9, targetLat: 40.7, targetLabel: "New York",       severity: 2 },
  { sourceLng: 37.6,  sourceLat: 55.7,  sourceLabel: "Moscow",     targetLng: -0.1,  targetLat: 51.5, targetLabel: "London",          severity: 2 },
  { sourceLng: 126.9, sourceLat: 37.5,  sourceLabel: "Pyongyang",  targetLng: 139.7, targetLat: 35.7, targetLabel: "Tokyo",           severity: 1 },
  { sourceLng: 51.4,  sourceLat: 35.7,  sourceLabel: "Tehran",     targetLng: 34.8,  targetLat: 32.1, targetLabel: "Tel Aviv",        severity: 1 },
  { sourceLng: 116.4, sourceLat: 39.9,  sourceLabel: "Beijing",    targetLng: 28.0,  targetLat: -26.2, targetLabel: "Johannesburg",   severity: 1 },
  { sourceLng: 37.6,  sourceLat: 55.7,  sourceLabel: "Moscow",     targetLng: 2.3,   targetLat: 48.9, targetLabel: "Paris",           severity: 2 },
  { sourceLng: 126.9, sourceLat: 37.5,  sourceLabel: "Pyongyang",  targetLng: -77.0, targetLat: 38.9, targetLabel: "Washington",      severity: 0 },
  { sourceLng: 28.0, sourceLat: -26.2,  sourceLabel: "Joburg",     targetLng: -43.2, targetLat: -22.9, targetLabel: "Rio",            severity: 0 },
  { sourceLng: 77.2,  sourceLat: 28.6,  sourceLabel: "Delhi",      targetLng: 73.1,  targetLat: 33.7, targetLabel: "Islamabad",       severity: 1 },
  { sourceLng: -34.9, sourceLat: -8.1,  sourceLabel: "Recife",     targetLng: 18.4,  targetLat: -33.9, targetLabel: "Cape Town",      severity: 0 },
];

function generateCyberAttacks(): CyberAttack[] {
  // Randomly activate a subset of attacks each cycle
  const activeCount = 4 + Math.floor(Math.random() * 5);
  const shuffled = [...THREAT_VECTORS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, activeCount).map((v, i) => ({
    id: `attack-${i}-${Date.now()}`,
    sourceLng: v.sourceLng + (Math.random() - 0.5) * 0.5,
    sourceLat: v.sourceLat + (Math.random() - 0.5) * 0.5,
    targetLng: v.targetLng + (Math.random() - 0.5) * 0.5,
    targetLat: v.targetLat + (Math.random() - 0.5) * 0.5,
    severity: v.severity,
  }));
}

export function useCyberIntel(enabled: boolean): CyberAttack[] {
  const [attacks, setAttacks] = useState<CyberAttack[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!enabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setAttacks([]);
      return;
    }

    // Initial burst
    setAttacks(generateCyberAttacks());

    // New attack vectors every 8 seconds — shows active cyber warfare
    intervalRef.current = setInterval(() => {
      setAttacks(generateCyberAttacks());
    }, 8000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled]);

  return attacks;
}
