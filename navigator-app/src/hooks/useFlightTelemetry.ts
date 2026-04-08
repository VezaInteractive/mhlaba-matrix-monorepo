import { useEffect, useRef, useState, useCallback } from "react";

export interface FlightData {
  buffer: Float32Array;
  meta: Record<number, any>;
  timestamp: number;
}

export function useFlightTelemetry(enabled: boolean) {
  const workerRef = useRef<Worker | null>(null);
  const [telemetry, setTelemetry] = useState<FlightData | null>(null);

  useEffect(() => {
    workerRef.current = new Worker(new URL('../workers/flight-telemetry.worker.ts', import.meta.url), {
      type: 'module',
    });

    workerRef.current.onmessage = (event: MessageEvent) => {
      setTelemetry({ ...event.data });
    };
    
    // Proactively fetch global scope once on mount
    workerRef.current.postMessage({ type: 'FETCH_ONCE' });

    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!workerRef.current) return;
    if (enabled) {
      workerRef.current.postMessage({ type: 'START', intervalMs: 10000 });
    } else {
      workerRef.current.postMessage({ type: 'STOP' });
    }
  }, [enabled]);

  return telemetry;
}
