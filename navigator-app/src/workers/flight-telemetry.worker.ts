const GLOBAL_BOUNDS = {
  lamin: -90.0,
  lomin: -180.0,
  lamax: 90.0,
  lomax: 180.0
};

// 6 floats per flight: [icao24, lng, lat, alt, velocity, true_track]
const STRIDE = 6;

let intervalId: any = null;


async function fetchTelemetry() {
  try {
    // Request global scope state vectors
    const url = `https://opensky-network.org/api/states/all`;
    
    const res = await fetch(url);
    if (!res.ok) {
      if (res.status === 429) {
        console.warn('Flight Telemetry Worker: OpenSky API Rate Limited (429). Fetch dropped.');
      }
      return;
    }

    const data = await res.json();
    if (!data || !data.states) return;

    const states = data.states;
    const count = states.length;
    
    const floatBuffer = new Float32Array(count * STRIDE);
    const meta: Record<number, any> = {};

    for (let i = 0; i < count; i++) {
      const state = states[i];
      // OpenSky format: 
      // 0: icao24 (string), 1: callsign (string), 2: origin_country, 3: time_position, 4: last_contact,
      // 5: longitude (float), 6: latitude (float), 7: baro_altitude (float), 8: on_ground (boolean)
      // 9: velocity (float), 10: true_track (float), 11: vertical_rate (float), 13: geo_altitude (float)
      
      const icao24Hex = state[0];
      const icao24Int = parseInt(icao24Hex, 16); // 24-bit hex fits in Float32 precisely without precision loss
      
      const callsign = state[1] ? state[1].trim() : "UNKNOWN";
      
      const originCountry = state[2] ? state[2].trim() : "UNKNOWN";
      
      const lng = state[5] || 0;
      const lat = state[6] || 0;
      
      // Use geo_altitude [13] if available, else baro_altitude [7], else default flying height
      const alt = state[13] !== null ? state[13] : (state[7] !== null ? state[7] : (state[8] ? 0 : 10000));
      
      const vel = state[9] || 0; // m/s
      const track = state[10] || 0; // decimal degrees clockwise from north
      
      // Basic airline extraction from 3-letter ICAO callsign prefixes
      let airline = "PRIVATE / UNKNOWN";
      if (callsign.length >= 3) {
        const prefix = callsign.substring(0, 3).toUpperCase();
        const numCheck = callsign.substring(0, 2).toUpperCase();
        if (prefix === "UAE") airline = "Emirates";
        else if (prefix === "DAL") airline = "Delta Air Lines";
        else if (prefix === "AAL") airline = "American Airlines";
        else if (prefix === "BAW") airline = "British Airways";
        else if (prefix === "AFR") airline = "Air France";
        else if (prefix === "DLH") airline = "Lufthansa";
        else if (prefix === "RYR") airline = "Ryanair";
        else if (prefix === "EZY") airline = "easyJet";
        else if (prefix === "SFA") airline = "Safair";
        else if (prefix === "SAA") airline = "South African Airways";
        else if (prefix === "QFA") airline = "Qantas";
        else if (prefix === "SIA") airline = "Singapore Airlines";
        else if (prefix === "CPA") airline = "Cathay Pacific";
        else if (prefix === "ANA") airline = "All Nippon Airways";
        else if (prefix === "JAL") airline = "Japan Airlines";
        else if (prefix === "KAL") airline = "Korean Air";
        else if (prefix === "THY") airline = "Turkish Airlines";
        else if (prefix === "QTR") airline = "Qatar Airways";
        else if (prefix === "ETH") airline = "Ethiopian Airlines";
        else if (numCheck === "UA") airline = "United Airlines";
        else if (numCheck === "WN") airline = "Southwest Airlines";
        else if (/^[A-Z]{3}/.test(prefix)) airline = `COMMERCIAL (${prefix})`;
      }
      
      // We skip airplanes that have no lat/lng
      if (lng !== 0 && lat !== 0) {
        const offset = i * STRIDE;
        floatBuffer[offset + 0] = icao24Int;
        floatBuffer[offset + 1] = lng;
        floatBuffer[offset + 2] = lat;
        floatBuffer[offset + 3] = alt;
        floatBuffer[offset + 4] = vel;
        floatBuffer[offset + 5] = track;
        
        meta[icao24Int] = { callsign, origin_country: originCountry, airline };
      }
    }

    // Pass the buffer ownership to the main thread securely (zero-copy)
    // We also pass the timestamp (data.time) representing when the state vectors were sampled
    (self as any).postMessage(
      { 
        buffer: floatBuffer, 
        meta,
        timestamp: data.time || Math.floor(Date.now() / 1000)
      }, 
      [floatBuffer.buffer]
    );

  } catch (error) {
    console.error("Flight Telemetry Worker: fetch error", error);
  }
}

self.addEventListener("message", (e) => {
  const { type, intervalMs } = e.data;
  
  if (type === "START") {
    if (!intervalId) {
      console.log("✈️ Flight Telemetry Worker Started");
      // Fire immediately
      fetchTelemetry();
      intervalId = setInterval(fetchTelemetry, intervalMs || 10000);
    }
  } else if (type === "STOP") {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
      console.log("✈️ Flight Telemetry Worker Stopped");
    }
  } else if (type === "FETCH_ONCE") {
    console.log("✈️ Flight Telemetry Startup Pre-fetch");
    fetchTelemetry();
  }
});

export {};
