import { NextResponse } from "next/server";

// Server-side proxy for the OpenSky Network REST API.
// This avoids CORS issues that block direct browser access to opensky-network.org.
export async function GET() {
  try {
    const res = await fetch("https://opensky-network.org/api/states/all", {
      // Server-side requests are not subject to browser CORS, but keep a UA header
      // to identify the application in OpenSky server logs.
      headers: {
        "User-Agent": "MhlabaMatrix/1.0 (https://vezainteractive.com)"
      },
      // 10 second timeout — OpenSky can be slow under high load.
      signal: AbortSignal.timeout(10_000),
      // Prevent Next.js from caching this – data must always be fresh.
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `OpenSky returned ${res.status}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data, {
      headers: {
        // Allow the response to be cached by the browser/CDN for up to 10s
        // to reduce hammering OpenSky on HMR hot reloads.
        "Cache-Control": "public, max-age=10, stale-while-revalidate=30",
      },
    });
  } catch (err) {
    console.error("[/api/flights] proxy error:", err);
    return NextResponse.json(
      { error: "Failed to reach OpenSky" },
      { status: 502 }
    );
  }
}
