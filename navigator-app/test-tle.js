async function run() {
  try {
    const res = await fetch('https://celestrak.org/NORAD/elements/gp.php?GROUP=active&FORMAT=tle', {
        headers: {
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
    });

    if (!res.ok) {
        console.log("Failed to fetch", res.status);
        const text = await res.text();
        console.log(text.substring(0, 200));
        return;
    }
    const text = await res.text();
    const lines = text.split('\n').filter(l => l.trim().length > 0);
    console.log("Fetched lines:", lines.length);
    console.log("Satellites:", Math.floor(lines.length / 3));
  } catch (e) {
    console.error(e);
  }
}
run();
