import { useEffect, useRef, useState } from "react";

export interface MaritimeData {
  buffer: Float32Array;
  timestamp: number;
}

// Simulates AIS vessel telemetry data with 7 floats per vessel:
// [mmsi, lng, lat, speed, heading, vesselTypeCode, colorHex]
function generateMaritimeBuffer(): MaritimeData {
  const VESSEL_COUNT = 80;
  const STRIDE = 7;
  const buffer = new Float32Array(VESSEL_COUNT * STRIDE);

  // Major shipping lanes: around Cape of Good Hope, Indian Ocean, Atlantic routes
  const shippingLanes = [
    { lngCenter: 18.5,  latCenter: -33.9,  spread: 3.0, label: "Cape Town" },
    { lngCenter: 32.0,  latCenter: -29.8,  spread: 2.0, label: "Durban" },
    { lngCenter: 55.0,  latCenter: -20.0,  spread: 8.0, label: "Indian Ocean" },
    { lngCenter: -10.0, latCenter:  5.0,   spread: 10.0, label: "Gulf of Guinea" },
    { lngCenter: 43.0,  latCenter:  11.0,  spread: 4.0, label: "Gulf of Aden" },
    { lngCenter: 103.0, latCenter:   1.0,  spread: 3.0, label: "Malacca Strait" },
    { lngCenter: -70.0, latCenter:  25.0,  spread: 8.0, label: "Caribbean" },
    { lngCenter:   5.0, latCenter:  51.0,  spread: 3.0, label: "North Sea" },
  ];

  for (let i = 0; i < VESSEL_COUNT; i++) {
    const offset = i * STRIDE;
    const lane = shippingLanes[i % shippingLanes.length];
    const mmsi = 200000000 + i;
    const lng = lane.lngCenter + (Math.random() - 0.5) * lane.spread;
    const lat = lane.latCenter + (Math.random() - 0.5) * lane.spread;
    const speed = 5 + Math.random() * 20; // knots
    const heading = Math.random() * 360;

    // Color by vessel class: Cyan=Cargo, Magenta=Tanker, Gold=Passenger
    const vesselType = i % 3; // 0=Cargo, 1=Tanker, 2=Passenger
    const colorValues = [0x00FFFF, 0xFF0055, 0xFFD700];
    const colorHex = colorValues[vesselType];

    buffer[offset + 0] = mmsi;
    buffer[offset + 1] = lng;
    buffer[offset + 2] = lat;
    buffer[offset + 3] = speed;
    buffer[offset + 4] = heading;
    buffer[offset + 5] = vesselType;
    buffer[offset + 6] = colorHex;
  }

  return { buffer, timestamp: Date.now() / 1000 };
}

export function useMaritimeTelemetry(enabled: boolean) {
  const [telemetry, setTelemetry] = useState<MaritimeData | null>(null);
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

    // Initial fetch
    setTelemetry(generateMaritimeBuffer());

    // Refresh every 30 seconds with slight position drift
    intervalRef.current = setInterval(() => {
      setTelemetry(generateMaritimeBuffer());
    }, 30000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled]);

  return telemetry;
}
