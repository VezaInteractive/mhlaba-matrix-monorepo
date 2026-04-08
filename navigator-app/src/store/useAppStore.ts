import { create } from 'zustand';

export type VisionMode = 'NORMAL' | 'NVG' | 'THERMAL' | 'CRT';
export type Continent = 'AFRICA' | 'EUROPE' | 'NORTH_AMERICA' | 'SOUTH_AMERICA' | 'ASIA' | 'OCEANIA';

export const POIs = {
  // AFRICA
  JOBURG: { lng: 28.0436, lat: -26.2041, height: 400, pitch: -20, heading: 45 },
  CAPETOWN: { lng: 18.4232, lat: -33.9249, height: 500, pitch: -15, heading: 120 },
  PRETORIA: { lng: 28.1881, lat: -25.7479, height: 400, pitch: -25, heading: 0 },
  DURBAN: { lng: 31.0218, lat: -29.8587, height: 450, pitch: -15, heading: 90 },
  // EUROPE
  LONDON: { lng: -0.1276, lat: 51.5072, height: 400, pitch: -20, heading: 0 },
  BERLIN: { lng: 13.4050, lat: 52.5200, height: 400, pitch: -20, heading: 30 },
  PARIS: { lng: 2.3522, lat: 48.8566, height: 350, pitch: -15, heading: -20 },
  ROME: { lng: 12.4964, lat: 41.9028, height: 350, pitch: -25, heading: 10 },
  // NORTH AMERICA
  NY: { lng: -74.0060, lat: 40.7128, height: 600, pitch: -25, heading: -30 },
  LA: { lng: -118.2437, lat: 34.0522, height: 500, pitch: -15, heading: 45 },
  TORONTO: { lng: -79.3832, lat: 43.6532, height: 500, pitch: -20, heading: 0 },
  MEXICO: { lng: -99.1332, lat: 19.4326, height: 450, pitch: -20, heading: 90 },
  // SOUTH AMERICA
  SAO: { lng: -46.6333, lat: -23.5505, height: 550, pitch: -25, heading: 180 },
  BA: { lng: -58.3816, lat: -34.6037, height: 400, pitch: -15, heading: -45 },
  BOGOTA: { lng: -74.0721, lat: 4.7110, height: 400, pitch: -20, heading: 0 },
  LIMA: { lng: -77.0428, lat: -12.0464, height: 400, pitch: -20, heading: 30 },
  // ASIA
  TOKYO: { lng: 139.6917, lat: 35.6895, height: 600, pitch: -25, heading: 45 },
  SHANGHAI: { lng: 121.4737, lat: 31.2304, height: 500, pitch: -20, heading: -30 },
  MUMBAI: { lng: 72.8777, lat: 19.0760, height: 450, pitch: -15, heading: 90 },
  SG: { lng: 103.8198, lat: 1.3521, height: 350, pitch: -15, heading: 0 },
  // OCEANIA
  SYDNEY: { lng: 151.2093, lat: -33.8688, height: 450, pitch: -20, heading: 120 },
  MELB: { lng: 144.9631, lat: -37.8136, height: 400, pitch: -15, heading: 45 },
  AUCKLAND: { lng: 174.7633, lat: -36.8485, height: 350, pitch: -20, heading: -60 },
  PERTH: { lng: 115.8605, lat: -31.9505, height: 400, pitch: -15, heading: 90 },
  
  HQ: { lng: 28.0287, lat: -26.1404, height: 200, pitch: -10, heading: 180 },
};

export type POIKey = keyof typeof POIs;

interface AppState {
  visionMode: VisionMode;
  setVisionMode: (mode: VisionMode) => void;
  activeContinent: Continent;
  setActiveContinent: (continent: Continent) => void;
  activePOI: POIKey | null;
  setActivePOI: (poi: POIKey | null) => void;
  layers: {
    cctv: boolean;
    flights: boolean;
    satellites: boolean;
    traffic: boolean;
    maritime: boolean;
    climate: boolean;
    cyber: boolean;
    businesses: boolean;
    realEstate: boolean;
  };
  toggleLayer: (layer: keyof AppState['layers']) => void;
  showAdModal: boolean;
  setShowAdModal: (show: boolean) => void;
  showRealEstateModal: boolean;
  setShowRealEstateModal: (show: boolean) => void;
  selectedCCTV: { id: string; name: string } | null;
  setSelectedCCTV: (cctv: { id: string; name: string } | null) => void;
  cctvScreenPos: { x: number; y: number } | null;
  setCctvScreenPos: (pos: { x: number; y: number } | null) => void;
  selectedFlight: { id: string; callsign: string; airline?: string; origin?: string; alt: number; mach: number } | null;
  setSelectedFlight: (flight: { id: string; callsign: string; airline?: string; origin?: string; alt: number; mach: number } | null) => void;
  flightScreenPos: { x: number; y: number } | null;
  setFlightScreenPos: (pos: { x: number; y: number } | null) => void;
  selectedSatellite: { id: string; name: string; apogee: number; perigee: number; inc: number } | null;
  setSelectedSatellite: (sat: { id: string; name: string; apogee: number; perigee: number; inc: number } | null) => void;
  satelliteScreenPos: { x: number; y: number } | null;
  setSatelliteScreenPos: (pos: { x: number; y: number } | null) => void;
  selectedMaritime: { id: string; type: string; speed: number; heading: number } | null;
  setSelectedMaritime: (vessel: { id: string; type: string; speed: number; heading: number } | null) => void;
  maritimeScreenPos: { x: number; y: number } | null;
  setMaritimeScreenPos: (pos: { x: number; y: number } | null) => void;

  // Global Time Control
  timeMultiplier: number;
  setTimeMultiplier: (multiplier: number) => void;

  // Search Architecture
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  executeSearch: string | null; // Signal token
  triggerSearch: (query: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  visionMode: 'NORMAL',
  setVisionMode: (mode) => set({ visionMode: mode }),
  activeContinent: 'AFRICA',
  setActiveContinent: (continent) => set({ activeContinent: continent }),
  activePOI: null,
  setActivePOI: (poi) => set({ activePOI: poi }),
  layers: {
    cctv: false,
    flights: false,
    satellites: false,
    traffic: false,
    maritime: false,
    climate: false,
    cyber: false,
    businesses: false,
    realEstate: false,
  },
  showAdModal: false,
  setShowAdModal: (show) => set({ showAdModal: show }),
  showRealEstateModal: false,
  setShowRealEstateModal: (show) => set({ showRealEstateModal: show }),
  toggleLayer: (layer) =>
    set((state) => ({
      layers: {
        ...state.layers,
        [layer]: !state.layers[layer],
      },
      // Automatically clear cctv selection if switching off cctv layer
      selectedCCTV: layer === 'cctv' && state.layers.cctv ? null : state.selectedCCTV
    })),
  selectedCCTV: null,
  setSelectedCCTV: (cctv) => set({ selectedCCTV: cctv }),
  cctvScreenPos: null,
  setCctvScreenPos: (pos) => set({ cctvScreenPos: pos }),
  selectedFlight: null,
  setSelectedFlight: (flight) => set({ selectedFlight: flight }),
  flightScreenPos: null,
  setFlightScreenPos: (pos) => set({ flightScreenPos: pos }),
  selectedSatellite: null,
  setSelectedSatellite: (sat) => set({ selectedSatellite: sat }),
  satelliteScreenPos: null,
  setSatelliteScreenPos: (pos) => set({ satelliteScreenPos: pos }),
  selectedMaritime: null,
  setSelectedMaritime: (vessel) => set({ selectedMaritime: vessel }),
  maritimeScreenPos: null,
  setMaritimeScreenPos: (pos) => set({ maritimeScreenPos: pos }),

  timeMultiplier: 1,
  setTimeMultiplier: (multiplier) => set({ timeMultiplier: multiplier }),
  
  searchQuery: "",
  setSearchQuery: (query) => set({ searchQuery: query }),
  executeSearch: null,
  triggerSearch: (query) => set({ executeSearch: query + "_" + Date.now() })
}));
