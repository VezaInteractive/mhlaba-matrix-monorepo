"use client";

import LeftPanel from "./LeftPanel";
import RightPanel from "./RightPanel";
import BottomDock from "./BottomDock";
import FlightTargetingHUD from "./FlightTargetingHUD";
import SatelliteTargetingHUD from "./SatelliteTargetingHUD";
import MaritimeTargetingHUD from "./MaritimeTargetingHUD";
import MaritimeHoverTooltip from "./MaritimeHoverTooltip";
import VesselDossierPanel from "./VesselDossierPanel";
import RealEstateModal from "./RealEstateModal";

export default function MainHUD() {
  return (
    <div className="absolute inset-0 pointer-events-none z-40 overflow-hidden">
      {/* 
        This wrapper uses pointer-events-none so mouse events pass through to MapViewer (Cesium). 
        The individual panels have pointer-events-auto so they can be interacted with.
      */}
      <LeftPanel />
      <RightPanel />
      <BottomDock />
      
      {/* Decorative center reticle or sniper crosshair logic can go here if needed */ }
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40px] h-[40px] opacity-20 pointer-events-none flex items-center justify-center">
        <div className="absolute w-[2px] h-full bg-white/50" />
        <div className="absolute w-full h-[2px] bg-white/50" />
        <div className="absolute w-full h-full border border-white/50 rounded-full" />
      </div>
      <FlightTargetingHUD />
      <SatelliteTargetingHUD />
      <MaritimeTargetingHUD />
      <MaritimeHoverTooltip />
      
      {/* Overlays / Modals */}
      <VesselDossierPanel />
      <RealEstateModal />
    </div>
  );
}
