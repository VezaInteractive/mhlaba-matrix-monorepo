import * as satellite from 'satellite.js';

// 4 floats per satellite: [noradId, lng, lat, alt]
const STRIDE = 4;

let intervalId: any = null;
let satRecords: { id: number; name: string; satrec: satellite.SatRec }[] = [];

const FALLBACK_TLES = `
ISS (ZARYA)
1 25544U 98067A   26091.56819444 -.00049216  00000-0 -84407-3 0  9997
2 25544  51.6409  68.2255 0004353 328.7297 122.9592 15.50209939445258
STARLINK-3140
1 49303U 21099BC  26091.55173715  .00010903  00000-0  80879-3 0  9996
2 49303  53.2183 234.3315 0001358 116.7118 243.3980 15.06411516130454
STARLINK-3141
1 49304U 21099BD  26091.62677943  .00002196  00000-0  16949-3 0  9993
2 49304  53.2173 234.0041 0001362 108.6471 251.4646 15.06423984130467
STARLINK-3144
1 49307U 21099BG  26091.47647248 -.00001859  00000-0 -11244-3 0  9993
2 49307  53.2171 234.6629 0001389 123.6393 236.4674 15.06422501130403
HUBBLE SPACE TELESCOPE
1 20580U 90037B   26091.44755787  .00002802  00000-0  14490-3 0  9995
2 20580  28.4704 223.3644 0002369 313.3444  46.6534 15.09347895475143
NOAA 19
1 33591U 09005A   26091.55836806  .00000164  00000-0  12822-4 0  9994
2 33591  99.1679 261.2155 0013919 146.5057 213.6823 14.12595874775432
AQUA
1 27424U 02022A   26091.15243056  .00001602  00000-0  39566-4 0  9997
2 27424  98.2435 277.6760 0002016  74.0202 301.7643 14.57116744167198
SUOMI NPP
1 37849U 11061A   26091.48611111  .00000208  00000-0  39062-4 0  9996
2 37849  98.7180  87.2796 0001297  66.1950 294.9458 14.19553752643568
GPS BIIR-2  (PRN 28) 
1 24876U 97035A   26091.54166667  .00000010  00000-0  00000-0 0  9998
2 24876  56.0967   2.8907 0134839  95.7368 266.3815  2.00554471195612
`;

async function fetchTLEs() {
  let text = FALLBACK_TLES;
  try {
    // Fetch active satellites from CelesTrak (~9000 satellites)
    const res = await fetch('https://celestrak.org/NORAD/elements/gp.php?GROUP=active&FORMAT=tle');
    if (res.ok) {
        text = await res.text();
    } else {
        console.warn("CelesTrak rate limit explicitly blocked origin. Failing over to local cache...");
    }
  } catch(error) {
    console.warn("Satellite Worker fetch error:", error);
  }

  try {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const newRecords: any[] = [];
    const meta: Record<number, { name: string; apogee: number; perigee: number; inc: number }> = {};
    
    // TLEs come in blocks of 3 lines: Name, Line 1, Line 2
    for (let i = 0; i < lines.length; i += 3) {
      if (i + 2 < lines.length) {
        const name = lines[i];
        const line1 = lines[i+1];
        const line2 = lines[i+2];
        
        try {
          const satrec = satellite.twoline2satrec(line1, line2);
          const noradId = parseInt(line1.substring(2, 7).trim(), 10);
          newRecords.push({ id: noradId, name, satrec });

          // Precompute static meta properties (avoids recalculating every 10 seconds for 9000 entries)
          const inc = satrec.inclo * (180 / Math.PI);
          const a = satrec.a;         // Semi-major axis 
          const e = satrec.ecco;      // Eccentricity
          const earthRadiusKm = 6371; 
          const aKm = a * earthRadiusKm;
          meta[noradId] = { 
            name, 
            apogee: aKm * (1 + e) - earthRadiusKm, 
            perigee: aKm * (1 - e) - earthRadiusKm, 
            inc 
          };
        } catch (e) {
          // Ignore parse errors for specific invalid TLEs
        }
      }
    }
    
    satRecords = newRecords;



    console.log(`🚀 Satellite Worker: Swarm Generated -> ${satRecords.length} TLEs.`);
    
    // Send massive metadata dictionary exactly ONCE
    (self as any).postMessage({ type: 'INIT_META', meta });

    // Trigger immediate propagation after loading
    propagatePositions();
  } catch(error) {
    console.error("Satellite Worker fetch error:", error);
  }
}

function propagatePositions() {
  if (satRecords.length === 0) return;
  
  const currentEngineTime = new Date();
  const gmst = satellite.gstime(currentEngineTime);
  
  const count = satRecords.length;
  const floatBuffer = new Float32Array(count * STRIDE);
  let validCount = 0;

  for (let i = 0; i < count; i++) {
    const record: any = satRecords[i];
    const { id, satrec, timeOffset } = record;
    
    try {
      let targetTime = currentEngineTime;
      if (timeOffset) {
          targetTime = new Date(currentEngineTime.getTime() + timeOffset);
      }
      
      const positionAndVelocity = satellite.propagate(satrec, targetTime);
      if (!positionAndVelocity || !positionAndVelocity.position) continue;
      
      const positionEci = positionAndVelocity.position as satellite.EciVec3<number>;
      
      // Check if propagation was successful
      if (typeof positionEci.x === 'number') {
        const positionGd = satellite.eciToGeodetic(positionEci, gmst);
        
        const lng = satellite.degreesLong(positionGd.longitude);
        const lat = satellite.degreesLat(positionGd.latitude);
        const alt = positionGd.height * 1000; // satellite.js returns km, Cesium requires meters
        
        const offset = validCount * STRIDE;
        floatBuffer[offset + 0] = id;
        floatBuffer[offset + 1] = lng;
        floatBuffer[offset + 2] = lat;
        floatBuffer[offset + 3] = alt;
        
        validCount++;
      }
    } catch (err) {
      // Ignore decayed math
    }
  }

  // Create a trimmed buffer for valid propagations
  const finalBuffer = floatBuffer.slice(0, validCount * STRIDE);

  (self as any).postMessage(
    {
      type: 'TELEMETRY_UPDATE',
      buffer: finalBuffer,
      timestamp: Math.floor(currentEngineTime.getTime() / 1000)
    },
    [finalBuffer.buffer]
  );
}

// Predict Orbital Ring (+90 minutes forward) mapping purely Cartesian points
function calculateOrbitRing(noradId: number) {
  const record = satRecords.find(r => r.id === noradId);
  if (!record) return;
  
  const { satrec } = record;
  const points = [];
  const start = new Date();
  
  // Predict 90 minutes into the future at 1-minute intervals
  for (let min = 0; min <= 90; min++) {
    const futureTime = new Date(start.getTime() + min * 60000);
    const posVel = satellite.propagate(satrec, futureTime);
    const posEci = posVel.position as satellite.EciVec3<number>;
    
    if (posEci && typeof posEci.x === 'number') {
      const gmst = satellite.gstime(futureTime);
      const posGd = satellite.eciToGeodetic(posEci, gmst);
      points.push({
        lng: satellite.degreesLong(posGd.longitude),
        lat: satellite.degreesLat(posGd.latitude),
        alt: posGd.height * 1000
      });
    }
  }
  
  // We do not transfer buffer, standard postMessage is fine for one array
  (self as any).postMessage({ type: 'ORBIT_PREDICTION', noradId, points });
}

self.addEventListener("message", (e) => {
  const { type, noradId, intervalMs } = e.data;
  
  if (type === "START") {
    if (!intervalId) {
      console.log("🛰️ Satellite Tracking Worker Started");
      fetchTLEs(); // Fetches and propagates immediately
      
      // Update propagation every 10 seconds (Cesium will Hermite-spline dead reckon the missing MS)
      intervalId = setInterval(propagatePositions, intervalMs || 10000);
    }
  } else if (type === "STOP") {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
      console.log("🛰️ Satellite Tracking Worker Stopped");
    }
  } else if (type === "PREDICT_ORBIT") {
    if (noradId) {
      calculateOrbitRing(noradId);
    }
  }
});
