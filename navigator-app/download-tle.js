async function run() {
  try {
    const res = await fetch('https://corsproxy.io/?https%3A%2F%2Fcelestrak.org%2FNORAD%2Felements%2Fgp.php%3FGROUP%3Dactive%26FORMAT%3Dtle');
    
    if (!res.ok) {
        console.log("Failed to fetch via proxy", res.status);
        return;
    }
    const text = await res.text();
    const fs = require('fs');
    fs.writeFileSync('./public/active.txt', text);
    console.log("Saved active.txt locally!");
  } catch (e) {
    console.error(e);
  }
}
run();
