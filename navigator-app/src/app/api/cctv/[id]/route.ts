import { NextResponse } from 'next/server';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    
    // Some i-traffic endpoints map to /api/camera/image?id=XXX or /api/camera/image/XXX
    // Officially it relies on /api/camera/image/{id}
    const res = await fetch(`https://www.i-traffic.co.za/api/camera/image/${id}`, {
      method: 'GET',
      headers: {
        'Accept': 'image/jpeg, image/png, */*',
        'Referer': 'https://www.i-traffic.co.za/'
      },
      cache: 'no-store'
    });

    if (!res.ok) {
      return new NextResponse('Failed to fetch image', { status: res.status });
    }

    const arrayBuffer = await res.arrayBuffer();
    
    // Forward the image explicitly with a 1 second cache control for Next.js 
    // caching or bypass to allow the client loop to hammer it raw
    const response = new NextResponse(arrayBuffer);
    response.headers.set('Content-Type', res.headers.get('Content-Type') || 'image/jpeg');
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    
    return response;
    
  } catch (error) {
    console.error("CCTV Image Proxy Error:", error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
