import { useEffect, useRef, useState, useCallback } from "react";

export interface SatelliteData {
  buffer: Float32Array;
  meta: Record<number, { name: string; apogee: number; perigee: number; inc: number }>;
  timestamp: number;
}

export function useSatelliteTelemetry(enabled: boolean) {
  const workerRef = useRef<Worker | null>(null);
  const [telemetry, setTelemetry] = useState<SatelliteData | null>(null);
  const [orbitPrediction, setOrbitPrediction] = useState<{ noradId: number; points: {lng: number, lat: number, alt: number}[] } | null>(null);

  const metaRef = useRef<Record<number, { name: string; apogee: number; perigee: number; inc: number }>>({});

  useEffect(() => {
    if (!enabled) {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
        setTelemetry(null);
        setOrbitPrediction(null);
      }
      return;
    }

    if (!workerRef.current) {
      workerRef.current = new Worker(new URL('../workers/satellite-propagation.worker.ts', import.meta.url), {
        type: 'module',
      });

      workerRef.current.onmessage = (event: MessageEvent) => {
        if (event.data.type === 'INIT_META') {
            metaRef.current = event.data.meta;
        } else if (event.data.type === 'ORBIT_PREDICTION') {
          setOrbitPrediction({ noradId: event.data.noradId, points: event.data.points });
        } else if (event.data.type === 'TELEMETRY_UPDATE') {
          setTelemetry({ 
              buffer: event.data.buffer, 
              timestamp: event.data.timestamp,
              meta: metaRef.current // Attach stored meta for components
          });
        }
      };

      workerRef.current.postMessage({ type: 'START', intervalMs: 10000 });
    }

    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, [enabled]);

  const requestOrbitPrediction = useCallback((noradId: number) => {
    if (workerRef.current) {
      workerRef.current.postMessage({ type: 'PREDICT_ORBIT', noradId });
    }
  }, []);

  return { telemetry, orbitPrediction, requestOrbitPrediction };
}
