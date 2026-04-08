import { useEffect, useRef, useState } from "react";

export interface ClimateData {
  buffer: Float32Array;
}

// Generates wind vector field data with 5 floats per wind point:
// [id, lng, lat, intensity (m/s), heading (degrees)]
function generateClimateBuffer(): ClimateData {
  const WIND_POINT_COUNT = 200;
  const STRIDE = 5;
  const buffer = new Float32Array(WIND_POINT_COUNT * STRIDE);

  for (let i = 0; i < WIND_POINT_COUNT; i++) {
    const offset = i * STRIDE;
    // Spread globally across all latitudes and longitudes
    const lng = -180 + Math.random() * 360;
    const lat = -60 + Math.random() * 120; // Avoid extreme poles

    // Simulate trade winds, westerlies, and polar jets
    const absLat = Math.abs(lat);
    let baseHeading = 270; // Default westward
    let baseIntensity = 3;

    if (absLat < 25) {
      // Trade winds — blow toward equator (easterly)
      baseHeading = lat > 0 ? 225 : 135;
      baseIntensity = 4 + Math.random() * 4;
    } else if (absLat < 60) {
      // Westerlies
      baseHeading = 90 + Math.random() * 45;
      baseIntensity = 6 + Math.random() * 8;
    } else {
      // Polar easterlies
      baseHeading = 270 + Math.random() * 30;
      baseIntensity = 2 + Math.random() * 5;
    }

    buffer[offset + 0] = i;
    buffer[offset + 1] = lng;
    buffer[offset + 2] = lat;
    buffer[offset + 3] = baseIntensity;
    buffer[offset + 4] = (baseHeading + (Math.random() - 0.5) * 40) % 360;
  }

  return { buffer };
}

export function useClimateTelemetry(enabled: boolean) {
  const [telemetry, setTelemetry] = useState<ClimateData | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!enabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setTelemetry(null);
      return;
    }

    // Initial generation
    setTelemetry(generateClimateBuffer());

    // Refresh every 60 seconds — wind fields evolve slowly
    intervalRef.current = setInterval(() => {
      setTelemetry(generateClimateBuffer());
    }, 60000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled]);

  return telemetry;
}
