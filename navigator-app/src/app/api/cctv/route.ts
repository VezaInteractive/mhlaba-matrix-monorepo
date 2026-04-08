import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Send form-urlencoded payload directly identical to the DataTables request.
    const payload = new URLSearchParams();
    payload.append('start', '0');
    payload.append('length', '150'); // Pull top 150 cameras
    payload.append('filters[0][i]', '1');
    payload.append('filters[0][s]', 'Gauteng');
    payload.append('order[i]', '0');
    payload.append('order[dir]', 'desc');

    const res = await fetch("https://www.i-traffic.co.za/List/GetData/Cameras", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "X-Requested-With": "XMLHttpRequest",
      },
      body: payload.toString(),
      cache: "no-store", // Ensure live requests
    });

    if (!res.ok) {
      throw new Error(`i-traffic API responded with status: ${res.status}`);
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("CCTV Proxy Error:", error);
    return NextResponse.json({ error: "Failed to fetch CCTV data" }, { status: 500 });
  }
}
