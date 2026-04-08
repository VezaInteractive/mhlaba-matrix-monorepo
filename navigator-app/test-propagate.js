const satellite = require('satellite.js');

const FALLBACK_TLES = `
ISS (ZARYA)
1 25544U 98067A   24083.56819444 -.00049216  00000-0 -84407-3 0  9997
2 25544  51.6409  68.2255 0004353 328.7297 122.9592 15.50209939445258
STARLINK-3140
1 49303U 21099BC  24083.55173715  .00010903  00000-0  80879-3 0  9996
2 49303  53.2183 234.3315 0001358 116.7118 243.3980 15.06411516130454
STARLINK-3141
1 49304U 21099BD  24083.62677943  .00002196  00000-0  16949-3 0  9993
2 49304  53.2173 234.0041 0001362 108.6471 251.4646 15.06423984130467
STARLINK-3144
1 49307U 21099BG  24083.47647248 -.00001859  00000-0 -11244-3 0  9993
2 49307  53.2171 234.6629 0001389 123.6393 236.4674 15.06422501130403
HUBBLE SPACE TELESCOPE
1 20580U 90037B   24083.44755787  .00002802  00000-0  14490-3 0  9995
2 20580  28.4704 223.3644 0002369 313.3444  46.6534 15.09347895475143
NOAA 19
1 33591U 09005A   24083.55836806  .00000164  00000-0  12822-4 0  9994
2 33591  99.1679 261.2155 0013919 146.5057 213.6823 14.12595874775432
AQUA
1 27424U 02022A   24083.15243056  .00001602  00000-0  39566-4 0  9997
2 27424  98.2435 277.6760 0002016  74.0202 301.7643 14.57116744167198
SUOMI NPP
1 37849U 11061A   24083.48611111  .00000208  00000-0  39062-4 0  9996
2 37849  98.7180  87.2796 0001297  66.1950 294.9458 14.19553752643568
GPS BIIR-2  (PRN 28) 
1 24876U 97035A   24083.54166667  .00000010  00000-0  00000-0 0  9998
2 24876  56.0967   2.8907 0134839  95.7368 266.3815  2.00554471195612
`;

async function test() {
  const lines = FALLBACK_TLES.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  
  let success = 0;
  for (let i = 0; i < lines.length; i += 3) {
    if (i + 2 < lines.length) {
      const name = lines[i];
      const line1 = lines[i+1];
      const line2 = lines[i+2];
      try {
        const satrec = satellite.twoline2satrec(line1, line2);
        const positionAndVelocity = satellite.propagate(satrec, new Date());
        
        if (positionAndVelocity.position && typeof positionAndVelocity.position.x === 'number') {
            success++;
        }
      } catch (e) {
        console.error("FAIL", name, e.message);
      }
    }
  }
  console.log("Successfully parsed and propagated:", success);
}
test();
