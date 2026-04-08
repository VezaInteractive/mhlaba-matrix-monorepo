"use client";

import dynamic from "next/dynamic";
import MainHUD from "@/components/HUD/MainHUD";

// Dynamically import MapViewer with no SSR since Cesium requires the 'window' object
const MapViewer = dynamic(() => import("@/components/MapViewer"), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 bg-black flex items-center justify-center font-display text-primary animate-pulse tracking-widest text-xl z-0">
      INITIALIZING WEBGL CORE...
    </div>
  ),
});

export default function Home() {
  return (
    <main className="relative w-screen h-screen overflow-hidden bg-black text-white">
      {/* 3D Map Base Layer */}
      <MapViewer />

      {/* Glassmorphic Overlay Layer */}
      <MainHUD />
    </main>
  );
}
