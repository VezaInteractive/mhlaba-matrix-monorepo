"use client";

import { useEffect, useRef, useMemo, useState } from "react";
import { useAppStore, POIs } from "@/store/useAppStore";
import { useFlightTelemetry } from "@/hooks/useFlightTelemetry";
import { useSatelliteTelemetry } from "@/hooks/useSatelliteTelemetry";
import { useMaritimeTelemetry } from "@/hooks/useMaritimeTelemetry";
import { useClimateTelemetry } from "@/hooks/useClimateTelemetry";
import { useCyberIntel } from "@/hooks/useCyberIntel";
import { CITY_INTEL } from "./HUD/RightPanel";

type CesiumType = any; // We type it as any to avoid typescript errors since we uninstalled the module

const CRT_SHADER = `
uniform sampler2D colorTexture;
in vec2 v_textureCoordinates;
out vec4 fragColor;
void main() {
    vec4 color = texture(colorTexture, v_textureCoordinates);
    float scanline = sin(v_textureCoordinates.y * 800.0) * 0.04;
    color.r *= 0.8;
    color.b *= 1.2;
    color.g *= 1.1;
    fragColor = vec4(color.rgb - scanline, 1.0);
}
`;

const NVG_SHADER = `
uniform sampler2D colorTexture;
in vec2 v_textureCoordinates;
out vec4 fragColor;
float rand(vec2 co){
    return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
}
void main() {
    vec4 color = texture(colorTexture, v_textureCoordinates);
    float luminance = dot(color.rgb, vec3(0.299, 0.587, 0.114));
    float noise = rand(v_textureCoordinates * 100.0) * 0.1;
    vec3 nvgColor = vec3(0.1, 0.9, 0.2); 
    fragColor = vec4(nvgColor * (luminance + noise), 1.0);
}
`;

const THERMAL_SHADER = `
uniform sampler2D colorTexture;
in vec2 v_textureCoordinates;
out vec4 fragColor;
void main() {
    vec4 color = texture(colorTexture, v_textureCoordinates);
    float luminance = dot(color.rgb, vec3(0.299, 0.587, 0.114));
    vec3 heat;
    if (luminance < 0.25) {
        heat = mix(vec3(0.0, 0.0, 1.0), vec3(0.0, 1.0, 1.0), luminance / 0.25);
    } else if (luminance < 0.5) {
        heat = mix(vec3(0.0, 1.0, 1.0), vec3(1.0, 1.0, 0.0), (luminance - 0.25) / 0.25);
    } else if (luminance < 0.75) {
        heat = mix(vec3(1.0, 1.0, 0.0), vec3(1.0, 0.0, 0.0), (luminance - 0.5) / 0.25);
    } else {
        heat = mix(vec3(1.0, 0.0, 0.0), vec3(1.0, 1.0, 1.0), (luminance - 0.75) / 0.25);
    }
    fragColor = vec4(heat, 1.0);
}
`;

export default function MapViewer() {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<CesiumType>(null);
  const activePOI = useAppStore((state) => state.activePOI);
  const layers = useAppStore((state) => state.layers);
  const timeMultiplier = useAppStore((state) => state.timeMultiplier);
  const executeSearch = useAppStore((state) => state.executeSearch);
  const searchQuery = useAppStore((state) => state.searchQuery);
  const visionMode = useAppStore((state) => state.visionMode);
  const flightTelemetry = useFlightTelemetry(layers.flights);
  const { telemetry: satTelemetry, orbitPrediction, requestOrbitPrediction } = useSatelliteTelemetry(layers.satellites);
  const maritimeTelemetry = useMaritimeTelemetry(layers.maritime);
  const climateTelemetry = useClimateTelemetry(layers.climate);
  const cyberIntel = useCyberIntel(layers.cyber);

  const stageRef = useRef<CesiumType>(null);
  const flightsDataSourceRef = useRef<CesiumType>(null);
  const cctvDataSourceRef = useRef<CesiumType>(null);
  const trafficDataSourceRef = useRef<CesiumType>(null);
  const satellitesDataSourceRef = useRef<CesiumType>(null);
  const maritimeDataSourceRef = useRef<CesiumType>(null);
  const climateDataSourceRef = useRef<CesiumType>(null);
  const cyberDataSourceRef = useRef<CesiumType>(null);
  const businessesDataSourceRef = useRef<CesiumType>(null);
  const realEstateDataSourceRef = useRef<CesiumType>(null);

  const [viewerReady, setViewerReady] = useState(false);

  const AIRPLANE_SVG = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="#FFCC00" width="64" height="64"><path stroke="#000000" stroke-width="12" d="M256 16C237.2 16 222 31.2 222 50V216L24 104C10.7 96.5 0 102 0 112V144C0 152 4.4 160 11.2 164L222 284V424C222 441.7 207.7 456 190 456H160C142.3 456 128 470.3 128 488V504C128 508.4 131.6 512 136 512H376C380.4 512 384 508.4 384 504V488C384 470.3 369.7 456 352 456H322C304.3 456 290 441.7 290 424V284L500.8 164C507.6 160 512 152 512 144V112C512 102 501.3 96.5 488 104L290 216V50C290 31.2 274.8 16 256 16z"/></svg>');
  const SATELLITE_SVG = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="currentColor" width="48" height="48"><path stroke="#000000" stroke-width="12" d="M381.2 153.2c16.3-16.3 16.3-42.7 0-59L343.9 57c-16.3-16.3-42.7-16.3-59 0L193.3 148.5c-19 19-35 41.5-47.5 66.5L46.9 313.9C36.1 324.7 30 339.4 30 354.6V442c0 22.1 17.9 40 40 40h87.4c15.2 0 29.9-6.1 40.7-16.9l98.9-98.9c25-12.5 47.5-28.5 66.5-47.5l91.5-91.5c16.3-16.3 16.3-42.7 0-59l-37.3-37.2-36.5-36.5z"/></svg>');

  // Initialize Viewer
  useEffect(() => {
    // Wait for the window.Cesium object to load from script tags
    let interval = setInterval(() => {
      const Cesium = (window as any).Cesium;
      if (Cesium && containerRef.current && !viewerRef.current) {
        clearInterval(interval);

        Cesium.Ion.defaultAccessToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJlNDIwYTBmNS0wMGYxLTRmZWYtYTQ1OC1kOWY1N2EzMGM1NGIiLCJpZCI6MTk3NjM5LCJpYXQiOjE3NzUwMjg5ODF9.ZQhqAaU7UFaLmLGouqfH4jjffUmI9xXaZ-aQkgxlQbU";

        const viewer = new Cesium.Viewer(containerRef.current, {
          animation: false,
          timeline: false,
          baseLayerPicker: false,
          geocoder: false,
          homeButton: false,
          infoBox: false,
          sceneModePicker: false,
          selectionIndicator: false,
          navigationInstructionsInitiallyVisible: false,
          navigationHelpButton: false,
        });

        // Hide credit elements for tactical UI
        viewer.cesiumWidget.creditContainer.style.display = "none";

        // Add Google Photorealistic 3D Tileset (Restores Joburg and Cape Town perfectly)
        Cesium.IonResource.fromAssetId(2275207)
          .then((resource: any) => {
            return Cesium.Cesium3DTileset.fromUrl(resource);
          })
          .then((tileset: any) => {
            viewer.scene.primitives.add(tileset);
          })
          .catch((e: any) => console.log('3D Tiles Err:', e));

        // Set initial camera to center over Africa
        viewer.camera.setView({
          destination: Cesium.Cartesian3.fromDegrees(20.0, 0.0, 18000000),
          orientation: {
            heading: Cesium.Math.toRadians(0),
            pitch: Cesium.Math.toRadians(-90),
            roll: 0.0
          }
        });

        viewerRef.current = viewer;

        // Create data sources
        flightsDataSourceRef.current = new Cesium.CustomDataSource('flights');
        cctvDataSourceRef.current = new Cesium.CustomDataSource('cctv');
        trafficDataSourceRef.current = new Cesium.CustomDataSource('traffic');
        satellitesDataSourceRef.current = new Cesium.CustomDataSource('satellites');

        maritimeDataSourceRef.current = new Cesium.CustomDataSource('maritime');
        climateDataSourceRef.current = new Cesium.CustomDataSource('climate');
        cyberDataSourceRef.current = new Cesium.CustomDataSource('cyber');
        businessesDataSourceRef.current = new Cesium.CustomDataSource('businesses');
        realEstateDataSourceRef.current = new Cesium.CustomDataSource('realEstate');

        viewer.dataSources.add(flightsDataSourceRef.current);
        viewer.dataSources.add(cctvDataSourceRef.current);
        viewer.dataSources.add(trafficDataSourceRef.current);
        viewer.dataSources.add(satellitesDataSourceRef.current);
        viewer.dataSources.add(maritimeDataSourceRef.current);
        viewer.dataSources.add(climateDataSourceRef.current);
        viewer.dataSources.add(cyberDataSourceRef.current);
        viewer.dataSources.add(businessesDataSourceRef.current);
        viewer.dataSources.add(realEstateDataSourceRef.current);

        viewer.scene.globe.enableLighting = false; // Disabled day/night terminators for consistent tactical illumination
        viewer.scene.highDynamicRange = true; // High accuracy colors
        viewer.clock.shouldAnimate = true; // Required for entity position resolution in pick handlers
        if (viewer.scene.skyAtmosphere) {
          viewer.scene.skyAtmosphere.hueShift = 0.0;
          viewer.scene.skyAtmosphere.brightnessShift = 0.0;
        }

        setViewerReady(true);
      }
    }, 100);

    return () => {
      clearInterval(interval);
      if (viewerRef.current) {
        viewerRef.current.destroy();
        viewerRef.current = null;
      }
    };
  }, []);

  // Handle POI Jumps
  useEffect(() => {
    const Cesium = (window as any).Cesium;
    if (viewerRef.current && Cesium && activePOI) {
      const { lng, lat, height, pitch = -30, heading = 0 } = POIs[activePOI] as any;
      viewerRef.current.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(lng, lat, height),
        orientation: {
          heading: Cesium.Math.toRadians(heading),
          pitch: Cesium.Math.toRadians(pitch),
          roll: 0.0
        },
        duration: 2.5
      });
    }
  }, [activePOI]);

  // Global Search Engine Router
  useEffect(() => {
    if (!executeSearch || !viewerRef.current || !searchQuery) return;

    const query = searchQuery.trim().toUpperCase();
    const Cesium = (window as any).Cesium;
    let foundEntity = null;
    let layerType = null;

    // Search Cities (Regional Intel Intercept)
    if (query === "JOHANNESBURG" || query === "JOBURG" || query === "JHB") { useAppStore.getState().setActiveContinent('AFRICA'); useAppStore.getState().setActivePOI('JOBURG'); return; }
    if (query === "CAPE TOWN" || query === "CAPETOWN" || query === "CTP") { useAppStore.getState().setActiveContinent('AFRICA'); useAppStore.getState().setActivePOI('CAPETOWN'); return; }
    if (query === "PRETORIA" || query === "PTA") { useAppStore.getState().setActiveContinent('AFRICA'); useAppStore.getState().setActivePOI('PRETORIA'); return; }
    if (query === "DURBAN" || query === "DBN") { useAppStore.getState().setActiveContinent('AFRICA'); useAppStore.getState().setActivePOI('DURBAN'); return; }

    if (query === "LONDON" || query === "LON") { useAppStore.getState().setActiveContinent('EUROPE'); useAppStore.getState().setActivePOI('LONDON'); return; }
    if (query === "BERLIN" || query === "BER") { useAppStore.getState().setActiveContinent('EUROPE'); useAppStore.getState().setActivePOI('BERLIN'); return; }
    if (query === "PARIS" || query === "PAR") { useAppStore.getState().setActiveContinent('EUROPE'); useAppStore.getState().setActivePOI('PARIS'); return; }
    if (query === "ROME") { useAppStore.getState().setActiveContinent('EUROPE'); useAppStore.getState().setActivePOI('ROME'); return; }

    if (query === "NEW YORK" || query === "NYC" || query === "NY") { useAppStore.getState().setActiveContinent('NORTH_AMERICA'); useAppStore.getState().setActivePOI('NY'); return; }
    if (query === "LOS ANGELES" || query === "LAX" || query === "LA") { useAppStore.getState().setActiveContinent('NORTH_AMERICA'); useAppStore.getState().setActivePOI('LA'); return; }
    if (query === "TORONTO" || query === "TOR") { useAppStore.getState().setActiveContinent('NORTH_AMERICA'); useAppStore.getState().setActivePOI('TORONTO'); return; }
    if (query === "MEXICO CITY" || query === "MEXICO") { useAppStore.getState().setActiveContinent('NORTH_AMERICA'); useAppStore.getState().setActivePOI('MEXICO'); return; }

    if (query === "SAO PAULO" || query === "SAO") { useAppStore.getState().setActiveContinent('SOUTH_AMERICA'); useAppStore.getState().setActivePOI('SAO'); return; }
    if (query === "BUENOS AIRES" || query === "BUE") { useAppStore.getState().setActiveContinent('SOUTH_AMERICA'); useAppStore.getState().setActivePOI('BA'); return; }
    if (query === "BOGOTA" || query === "BOG") { useAppStore.getState().setActiveContinent('SOUTH_AMERICA'); useAppStore.getState().setActivePOI('BOGOTA'); return; }
    if (query === "LIMA" || query === "LIM") { useAppStore.getState().setActiveContinent('SOUTH_AMERICA'); useAppStore.getState().setActivePOI('LIMA'); return; }

    if (query === "TOKYO" || query === "TOK") { useAppStore.getState().setActiveContinent('ASIA'); useAppStore.getState().setActivePOI('TOKYO'); return; }
    if (query === "SHANGHAI" || query === "SHA") { useAppStore.getState().setActiveContinent('ASIA'); useAppStore.getState().setActivePOI('SHANGHAI'); return; }
    if (query === "MUMBAI" || query === "MUM") { useAppStore.getState().setActiveContinent('ASIA'); useAppStore.getState().setActivePOI('MUMBAI'); return; }
    if (query === "SINGAPORE" || query === "SIN" || query === "SG") { useAppStore.getState().setActiveContinent('ASIA'); useAppStore.getState().setActivePOI('SG'); return; }

    if (query === "SYDNEY" || query === "SYD") { useAppStore.getState().setActiveContinent('OCEANIA'); useAppStore.getState().setActivePOI('SYDNEY'); return; }
    if (query === "MELBOURNE" || query === "MELB" || query === "MEL") { useAppStore.getState().setActiveContinent('OCEANIA'); useAppStore.getState().setActivePOI('MELB'); return; }
    if (query === "AUCKLAND" || query === "AUK") { useAppStore.getState().setActiveContinent('OCEANIA'); useAppStore.getState().setActivePOI('AUCKLAND'); return; }
    if (query === "PERTH" || query === "PER") { useAppStore.getState().setActiveContinent('OCEANIA'); useAppStore.getState().setActivePOI('PERTH'); return; }

    // Search Satellites
    if (!foundEntity && satellitesDataSourceRef.current) {
      const ents = satellitesDataSourceRef.current.entities.values;
      for (let e of ents) {
        const name = e.properties.satName?.getValue()?.toUpperCase() || "";
        const id = e.properties.satId?.getValue()?.toString() || "";
        if (name.includes(query) || id.includes(query)) {
          foundEntity = e;
          layerType = 'sat';
          break;
        }
      }
    }

    // Search Flights
    if (!foundEntity && flightsDataSourceRef.current) {
      const ents = flightsDataSourceRef.current.entities.values;
      for (let e of ents) {
        const callsign = e.properties.callsign?.getValue()?.toUpperCase() || "";
        const id = e.properties.flightId?.getValue()?.toString() || "";
        if (callsign.includes(query) || id.includes(query)) {
          foundEntity = e;
          layerType = 'flight';
          break;
        }
      }
    }

    if (foundEntity) {
      // Force the layer to be enabled if hidden
      if (layerType === 'sat' && !layers.satellites) useAppStore.getState().toggleLayer('satellites');
      if (layerType === 'flight' && !layers.flights) useAppStore.getState().toggleLayer('flights');

      const pos = foundEntity.position.getValue(viewerRef.current.clock.currentTime);
      if (pos) {
        // Camera Flyover
        viewerRef.current.camera.flyTo({
          destination: pos,
          duration: 2.0,
          offset: new Cesium.HeadingPitchRange(0, Cesium.Math.toRadians(-45), 2000000)
        });

        // Activate Target HUDs
        if (layerType === 'sat') {
          const satId = foundEntity.properties.satId.getValue().toString();
          useAppStore.getState().setSelectedSatellite({
            id: satId,
            name: foundEntity.properties.satName.getValue(),
            apogee: foundEntity.properties.apogee.getValue(),
            perigee: foundEntity.properties.perigee.getValue(),
            inc: foundEntity.properties.inc.getValue()
          });
          useAppStore.getState().setSelectedFlight(null);
          useAppStore.getState().setSelectedCCTV(null);
          useAppStore.getState().setSelectedMaritime(null);
          requestOrbitPrediction(parseInt(satId, 10));
        } else if (layerType === 'flight') {
          useAppStore.getState().setSelectedFlight({
            id: foundEntity.properties.flightId.getValue().toString(),
            callsign: foundEntity.properties.callsign.getValue(),
            alt: Math.round(foundEntity.properties.alt.getValue()),
            mach: parseFloat(foundEntity.properties.mach.getValue())
          });
          useAppStore.getState().setSelectedCCTV(null);
          useAppStore.getState().setSelectedSatellite(null);
          useAppStore.getState().setSelectedMaritime(null);
        }
      }
    }
  }, [executeSearch]);

  // Orbital Time Domain Mutator
  useEffect(() => {
    if (viewerRef.current) {
      viewerRef.current.clock.multiplier = timeMultiplier;
    }
  }, [timeMultiplier]);

  // Handle CCTV Layer
  useEffect(() => {
    const Cesium = (window as any).Cesium;
    if (layers.cctv && viewerRef.current && Cesium && cctvDataSourceRef.current) {
      cctvDataSourceRef.current.show = true;

      const fetchCCTV = async () => {
        // Prevent refetching static cameras
        if (cctvDataSourceRef.current.entities.values.length > 0) return;

        if (cctvDataSourceRef.current.clustering) {
          cctvDataSourceRef.current.clustering.enabled = true;
          cctvDataSourceRef.current.clustering.pixelRange = 40;
          cctvDataSourceRef.current.clustering.minimumClusterSize = 3;

          cctvDataSourceRef.current.clustering.clusterEvent.addEventListener((clusteredEntities: any, cluster: any) => {
            cluster.label.show = true;
            cluster.label.disableDepthTestDistance = Number.POSITIVE_INFINITY;
            cluster.billboard.show = true;
            cluster.billboard.disableDepthTestDistance = Number.POSITIVE_INFINITY;
          });
        }

        try {
          const res = await fetch("/api/cctv");
          const data = await res.json();
          if (data && data.data) {
            data.data.forEach((cam: any) => {
              if (cam.latitude && cam.longitude) {
                cctvDataSourceRef.current.entities.add({
                  id: `cctv-${cam.id}`,
                  position: Cesium.Cartesian3.fromDegrees(cam.longitude, cam.latitude, 2500),
                  billboard: {
                    image: 'data:image/svg+xml;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#FF0055" width="48" height="48"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 14c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm0-6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg>'),
                    scale: 0.8
                  },
                  label: {
                    text: cam.description1 || "CAMERA",
                    heightReference: Cesium.HeightReference.NONE,
                    pixelOffset: new Cesium.Cartesian2(0, -35),
                    fillColor: Cesium.Color.fromCssColorString('#FF0055'),
                    font: "12px monospace",
                    showBackground: true,
                    backgroundColor: Cesium.Color.fromCssColorString("rgba(11, 15, 25, 0.8)"),
                    scaleByDistance: new Cesium.NearFarScalar(1.5e2, 1.0, 1.5e4, 0.0),
                    translucencyByDistance: new Cesium.NearFarScalar(1.5e2, 1.0, 1.5e4, 0.0)
                  },
                  properties: {
                    cctvId: cam.id,
                    cctvName: cam.description1
                  }
                });
              }
            });
          }
        } catch (e) {
          console.error("CCTV fetch failed", e);
        }
      };

      fetchCCTV();
    } else if (cctvDataSourceRef.current) {
      cctvDataSourceRef.current.show = false;
    }
  }, [layers.cctv]);

  // Handle Businesses Layer (Holographic Map Symbols)
  useEffect(() => {
    const Cesium = (window as any).Cesium;
    if (!viewerRef.current || !Cesium || !businessesDataSourceRef.current) return;

    businessesDataSourceRef.current.show = layers.businesses;

    if (layers.businesses) {
      // Clear inside if repopulating, but typically we only populate once
      if (businessesDataSourceRef.current.entities.values.length > 0) return;

      Object.entries(POIs).forEach(([key, poi]: [string, any]) => {
        if (key === 'HQ') return; // Skip HQ, only do the 24 global cities
        businessesDataSourceRef.current.entities.add({
          id: `business_${key}`,
          position: Cesium.Cartesian3.fromDegrees(poi.lng, poi.lat, poi.height || 400),
          billboard: {
            image: '/mhlaba-logo.svg',
            width: 52,
            height: 52,
            heightReference: Cesium.HeightReference.RELATIVE_TO_GROUND,
            pixelOffset: new Cesium.Cartesian2(0, -26),
            scaleByDistance: new Cesium.NearFarScalar(1.5e2, 1.2, 8.0e6, 0.4)
          },
          properties: {
            companyKey: key
          }
        });
      });
    }
  }, [layers.businesses]);

  // Handle Real Estate Layer
  useEffect(() => {
    const Cesium = (window as any).Cesium;
    if (!viewerRef.current || !Cesium || !realEstateDataSourceRef.current) return;

    realEstateDataSourceRef.current.show = layers.realEstate;

    if (layers.realEstate) {
      if (realEstateDataSourceRef.current.entities.values.length > 0) return;

      const HOME_SVG = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#E3B341" width="64" height="64"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>');

      Object.entries(POIs).forEach(([key, poi]: [string, any]) => {
        if (key === 'HQ') return;
        realEstateDataSourceRef.current.entities.add({
          id: `realEstate_${key}`,
          // Offset longitude and latitude slightly to prevent exact pick overlap with the POI business marker
          position: Cesium.Cartesian3.fromDegrees(poi.lng + 0.15, poi.lat - 0.15, poi.height || 400),
          billboard: {
            image: HOME_SVG,
            width: 48,
            height: 48,
            heightReference: Cesium.HeightReference.RELATIVE_TO_GROUND,
            pixelOffset: new Cesium.Cartesian2(0, -24),
            scaleByDistance: new Cesium.NearFarScalar(1.5e2, 1.2, 8.0e6, 0.4)
          },
          properties: {
            propertyKey: key
          }
        });
      });
    }
  }, [layers.realEstate]);

  // Setup ScreenSpaceEventHandler for Custom Interactivity
  useEffect(() => {
    const Cesium = (window as any).Cesium;
    if (!viewerRef.current || !Cesium) return;

    // Attach custom event handler
    const handler = new Cesium.ScreenSpaceEventHandler(viewerRef.current.scene.canvas);

    const processInteraction = (click: any) => {
      let pickedEntity: any = null;

      // 1. Standard scene.pick — works in all Cesium versions for visible billboards
      const pickedObject = viewerRef.current.scene.pick(click.position);
      if (Cesium.defined(pickedObject) && pickedObject.id) {
        const candidate = pickedObject.id;
        const cId = typeof candidate === 'string' ? candidate :
          typeof candidate.id === 'string' ? candidate.id :
            (candidate.id && candidate.id.id) ? candidate.id.id : '';
        if (cId.startsWith("mmsi-") || cId.startsWith("fl-") || cId.startsWith("cctv-") || cId.startsWith("sat-") || cId.includes("business_") || cId.includes("realEstate_")) {
          pickedEntity = candidate;
        }
      }


      if (pickedEntity) {
        let entity = pickedEntity;

        // If the pickedEntity is already just the string ID, we don't need to dive into entity.id
        let targetId = typeof pickedEntity === 'string' ? pickedEntity :
          typeof pickedEntity.id === 'string' ? pickedEntity.id :
            (pickedEntity.id && pickedEntity.id.id) ? pickedEntity.id.id : String(pickedEntity.id || "");

        console.log("DIAGNOSTIC CLICK TRACE:", {
          hasPickedEntity: !!pickedEntity,
          isString: typeof pickedEntity === 'string',
          targetId: targetId,
          startMMSI: targetId.startsWith("mmsi-"),
          includesMMSI: targetId.includes("mmsi")
        });

        // Re-resolve the actual entity object if pickedEntity was magically returned as just a string geometry primitive ID
        if (typeof entity === 'string') {
          if (targetId.startsWith("fl-")) entity = flightsDataSourceRef.current?.entities.getById(targetId) || entity;
          else if (targetId.startsWith("mmsi-")) entity = maritimeDataSourceRef.current?.entities.getById(targetId) || entity;
          else if (targetId.startsWith("sat-")) entity = satellitesDataSourceRef.current?.entities.getById(targetId) || entity;
          else if (targetId.startsWith("cctv-")) entity = cctvDataSourceRef.current?.entities.getById(targetId) || entity;
        }

        console.log("CLICKED ENTITY FOUND", pickedEntity, "Parsed targetId:", targetId);

        // Failsafe parameter extractor that guards against Cesium type-coercion/Prototype mutating crashes
        const extractVal = (prop: string, fallback: any = "") => {
          if (!entity || !entity.properties) return fallback;
          let field;
          if (typeof entity.properties.hasProperty === 'function' && entity.properties.hasProperty(prop)) {
            field = entity.properties[prop];
          } else if (entity.properties[prop] !== undefined) {
            field = entity.properties[prop];
          } else {
            return fallback;
          }
          const timeContext = viewerRef.current?.clock?.currentTime;
          if (field && typeof field.getValue === 'function') return field.getValue(timeContext);
          if (field && typeof field === 'object' && field._value !== undefined) return field._value;
          return field !== undefined && field !== null ? field : fallback;
        };
        if (targetId.startsWith("cctv-")) {
          useAppStore.getState().setSelectedCCTV({
            id: extractVal("cctvId").toString(),
            name: extractVal("cctvName").toString()
          });
          useAppStore.getState().setSelectedFlight(null);
          useAppStore.getState().setSelectedSatellite(null);
        } else if (targetId.startsWith("fl-")) {
          useAppStore.getState().setSelectedFlight({
            id: extractVal("flightId").toString() || extractVal("id", entity.id.replace("fl-", "")),
            callsign: extractVal("callsign").toString() || "UNKNOWN",
            origin: extractVal("origin").toString() || "UNKNOWN",
            airline: extractVal("airline").toString() || "UNKNOWN",
            alt: Math.round(parseFloat(extractVal("alt", 0))),
            mach: parseFloat(extractVal("mach", 0))
          });
          useAppStore.getState().setSelectedCCTV(null);
          useAppStore.getState().setSelectedSatellite(null);
          useAppStore.getState().setSelectedMaritime(null);
        } else if (targetId.startsWith("mmsi-") || targetId.includes("mmsi")) {
          // Robust vessel property extraction with failsafe against missing property bags
          let mmsiVal = targetId.replace("mmsi-", "");
          let extractedName = `VESSEL ${mmsiVal}`;
          let extractedSpeed = 0;
          let extractedHeading = 0;
          let extractedIMO = 0;
          let extractedCallsign = "";
          let extractedFlag = "🏳️";
          let extractedTypeName = "UNKNOWN";
          let extractedShipType = 0;
          let extractedDestination = "";
          let extractedColorHex = "#00CCFF";
          let extractedNavStatusText = "";
          let extractedNavStatusInt = 0;
          let extractedLength = 0;
          let extractedWidth = 0;
          let extractedDraught = 0;

          try {
            mmsiVal = extractVal("mmsi", mmsiVal).toString();
            extractedName = extractVal("vesselName", extractedName).toString();
            extractedSpeed = parseFloat(extractVal("speed", 0) as string) || 0;
            extractedHeading = parseFloat(extractVal("heading", 0) as string) || 0;
            extractedIMO = parseInt(extractVal("imo", 0) as string) || 0;
            extractedCallsign = extractVal("callsign", "").toString();
            extractedFlag = extractVal("flag", "🏳️").toString();
            extractedTypeName = extractVal("vesselType", "UNKNOWN").toString();
            extractedShipType = parseInt(extractVal("shipType", 0) as string) || 0;
            extractedDestination = extractVal("destination", "").toString();
            extractedColorHex = extractVal("colorHex", "#00CCFF").toString();
            extractedNavStatusText = extractVal("navStatusText", "").toString();
            extractedNavStatusInt = parseInt(extractVal("navStatus", 0) as string) || 0;
            extractedLength = parseFloat(extractVal("length", 0) as string) || 0;
            extractedWidth = parseFloat(extractVal("width", 0) as string) || 0;
            extractedDraught = parseFloat(extractVal("draught", 0) as string) || 0;
          } catch (e) {
            console.error("Failed to extract some maritime properties, using robust fallbacks", e);
          }

          const vesselRecord = {
            mmsi: Number(mmsiVal) || 0,
            name: extractedName,
            imo: extractedIMO,
            callsign: extractedCallsign,
            flag: extractedFlag,
            shipType: extractedShipType,
            typeName: extractedTypeName,
            id: String(mmsiVal),
            type: extractedTypeName,
            lat: 0,
            lng: 0,
            sog: extractedSpeed,
            speed: extractedSpeed,
            cog: extractedHeading,
            heading: extractedHeading,
            navStatus: extractedNavStatusInt,
            navStatusText: extractedNavStatusText,
            destination: extractedDestination,
            eta: "",
            draught: extractedDraught,
            length: extractedLength,
            width: extractedWidth,
            colorHex: extractedColorHex,
            lastUpdate: Date.now(),
            simulated: true, // safe default
          };

          useAppStore.getState().setSelectedMaritime(vesselRecord as any);
          useAppStore.getState().setSelectedFlight(null);
          useAppStore.getState().setSelectedCCTV(null);
          useAppStore.getState().setSelectedSatellite(null);
          useAppStore.getState().setActivePOI(null);
        } else if (targetId.startsWith("sat-")) {
          const satId = extractVal("satId").toString() || targetId.replace("sat-", "");
          useAppStore.getState().setSelectedSatellite({
            id: satId,
            name: extractVal("satName").toString() || "CLASSIFIED",
            apogee: parseFloat(extractVal("apogee", 0)),
            perigee: parseFloat(extractVal("perigee", 0)),
            inc: parseFloat(extractVal("inc", 0))
          });
          useAppStore.getState().setSelectedFlight(null);
          useAppStore.getState().setSelectedCCTV(null);
          useAppStore.getState().setSelectedMaritime(null);
          requestOrbitPrediction(parseInt(satId, 10));
        } else if (targetId.startsWith("business_")) {
          // Trigger External Deployment (Direct Web Link)
          const cityKey = targetId.replace("business_", "");
          useAppStore.getState().setActivePOI(cityKey as any);

          const website = CITY_INTEL[cityKey]?.commercial?.website;
          if (website) {
            window.open(website, "_blank");
          }
        } else if (targetId.startsWith("realEstate_")) {
          // Open Premium Asser View
          const cityKey = targetId.replace("realEstate_", "");
          useAppStore.getState().setActivePOI(cityKey as any);
          useAppStore.getState().setShowRealEstateModal(true);
        }
      }
    };

    const processHover = (movement: any) => {
      let entity: any = null;

      // 1. Standard pick
      const pickedObject = viewerRef.current.scene.pick(movement.endPosition);
      if (Cesium.defined(pickedObject) && pickedObject.id) {
        const candidate = pickedObject.id;
        const cId = typeof candidate === 'string' ? candidate :
          typeof candidate.id === 'string' ? candidate.id :
            (candidate.id && candidate.id.id) ? candidate.id.id : '';
        if (cId.startsWith("mmsi-") || cId.startsWith("fl-") || cId.startsWith("cctv-") || cId.startsWith("sat-") || cId.includes("business_") || cId.includes("realEstate_")) {
          entity = candidate;
        }
      }

      if (entity) {
        // Change cursor to pointer for feedback
        viewerRef.current.container.style.cursor = 'pointer';

        let targetId = typeof entity === 'string' ? entity :
          typeof entity.id === 'string' ? entity.id :
            (entity.id && entity.id.id) ? entity.id.id : String(entity.id || "");

        // Re-resolve entity object if it was returned as a raw string ID
        if (typeof entity === 'string') {
          if (targetId.startsWith("mmsi-")) entity = maritimeDataSourceRef.current?.entities.getById(targetId) || entity;
          else if (targetId.startsWith("fl-")) entity = flightsDataSourceRef.current?.entities.getById(targetId) || entity;
        }

        // ── Flight Hover ──
        if (targetId.startsWith("fl-")) {
          const extractVal = (prop: string, fallback: any = "") => {
            if (!entity || !entity.properties) return fallback;
            let field;
            if (typeof entity.properties.hasProperty === 'function' && entity.properties.hasProperty(prop)) {
              field = entity.properties[prop];
            } else if (entity.properties[prop] !== undefined) {
              field = entity.properties[prop];
            } else {
              return fallback;
            }
            const timeContext = viewerRef.current?.clock?.currentTime;
            if (field && typeof field.getValue === 'function') return field.getValue(timeContext);
            if (field && typeof field === 'object' && field._value !== undefined) return field._value;
            return field !== undefined && field !== null ? field : fallback;
          };

          const flightRecord = {
            id: extractVal("flightId", targetId.replace("fl-", "")).toString(),
            callsign: extractVal("callsign", "UNKNOWN").toString(),
            origin: extractVal("origin", "UNKNOWN").toString(),
            airline: extractVal("airline", "UNKNOWN").toString(),
            alt: Math.round(parseFloat(extractVal("alt", 0))),
            mach: parseFloat(extractVal("mach", 0)),
          };

          if (useAppStore.getState().hoveredFlight?.id !== flightRecord.id) {
            useAppStore.getState().setHoveredFlight(flightRecord);
          }
          // Clear maritime hover if we're now hovering a flight
          if (useAppStore.getState().hoveredMaritime) {
            useAppStore.getState().setHoveredMaritime(null);
          }
          return;
        }

        // ── Maritime Hover ──
        if (targetId.startsWith("mmsi-")) {
          const extractVal = (prop: string, fallback: any = "") => {
            if (!entity || !entity.properties) return fallback;
            let field;
            if (typeof entity.properties.hasProperty === 'function' && entity.properties.hasProperty(prop)) {
              field = entity.properties[prop];
            } else if (entity.properties[prop] !== undefined) {
              field = entity.properties[prop];
            } else {
              return fallback;
            }
            const timeContext = viewerRef.current?.clock?.currentTime;
            if (field && typeof field.getValue === 'function') return field.getValue(timeContext);
            if (field && typeof field === 'object' && field._value !== undefined) return field._value;
            return field !== undefined && field !== null ? field : fallback;
          };

          const mmsiVal = extractVal("mmsi") || targetId.replace("mmsi-", "");
          const vesselRecord = {
            mmsi: Number(mmsiVal) || 0,
            name: extractVal("vesselName") || `VESSEL ${mmsiVal}`,
            imo: Number(extractVal("imo")) || 0,
            callsign: extractVal("callsign") || "",
            flag: extractVal("flag") || "🏳️",
            shipType: Number(extractVal("shipType")) || 0,
            typeName: extractVal("vesselType") || "UNKNOWN",
            lat: 0,
            lng: 0,
            sog: parseFloat(extractVal("speed", 0)),
            cog: parseFloat(extractVal("heading", 0)),
            heading: parseFloat(extractVal("heading", 0)),
            navStatus: parseInt(extractVal("navStatus", 0)) || 0,
            navStatusText: extractVal("navStatusText") || "",
            destination: extractVal("destination") || "",
            eta: "",
            draught: parseFloat(extractVal("draught", 0)),
            length: parseFloat(extractVal("length", 0)),
            width: parseFloat(extractVal("width", 0)),
            colorHex: extractVal("colorHex") || "#00CCFF",
            lastUpdate: Date.now(),
            simulated: extractVal("simulated") === 1,
          };

          if (useAppStore.getState().hoveredMaritime?.mmsi !== vesselRecord.mmsi) {
            useAppStore.getState().setHoveredMaritime(vesselRecord as any);
          }
          // Clear flight hover if we're now hovering maritime
          if (useAppStore.getState().hoveredFlight) {
            useAppStore.getState().setHoveredFlight(null);
          }
          return;
        }
      } else {
        // Reset cursor
        viewerRef.current.container.style.cursor = '';
      }

      // Clear both hovers when not over any entity
      if (useAppStore.getState().hoveredMaritime) {
        useAppStore.getState().setHoveredMaritime(null);
      }
      if (useAppStore.getState().hoveredFlight) {
        useAppStore.getState().setHoveredFlight(null);
      }
    };

    // Bind to both Single Tap and Double Tap mechanics
    handler.setInputAction(processInteraction, Cesium.ScreenSpaceEventType.LEFT_CLICK);
    handler.setInputAction(processInteraction, Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
    handler.setInputAction(processHover, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

    return () => {
      handler.destroy();
    };
  }, [viewerReady]);

  // Targeting HUD Screen Coordinate Sync
  useEffect(() => {
    const Cesium = (window as any).Cesium;
    if (!viewerReady || !viewerRef.current || !Cesium) return;

    const preRenderListener = () => {
      // 1. Flight Screen Tracking
      const selectedFlight = useAppStore.getState().selectedFlight;
      let flightPos = null;
      if (selectedFlight && flightsDataSourceRef.current) {
        const entity = flightsDataSourceRef.current.entities.getById(`fl-${selectedFlight.id}`);
        if (entity && entity.position) {
          const position = entity.position.getValue(viewerRef.current.clock.currentTime);
          if (position) {
            flightPos = Cesium.SceneTransforms.worldToWindowCoordinates(viewerRef.current.scene, position);
          }
        }
      }
      const currentFlightPos = useAppStore.getState().flightScreenPos;
      if (flightPos) {
        if (!currentFlightPos || Math.abs(currentFlightPos.x - flightPos.x) > 1 || Math.abs(currentFlightPos.y - flightPos.y) > 1) {
          useAppStore.getState().setFlightScreenPos({ x: flightPos.x, y: flightPos.y });
        }
      } else if (currentFlightPos !== null) {
        useAppStore.getState().setFlightScreenPos(null);
      }

      // 2. Satellite Screen Tracking
      const selectedSatellite = useAppStore.getState().selectedSatellite;
      let satPos = null;
      if (selectedSatellite && satellitesDataSourceRef.current) {
        const entity = satellitesDataSourceRef.current.entities.getById(`sat-${selectedSatellite.id}`);
        if (entity && entity.position) {
          const position = entity.position.getValue(viewerRef.current.clock.currentTime);
          if (position) {
            satPos = Cesium.SceneTransforms.worldToWindowCoordinates(viewerRef.current.scene, position);
          }
        }
      }
      const currentSatPos = useAppStore.getState().satelliteScreenPos;
      if (satPos) {
        if (!currentSatPos || Math.abs(currentSatPos.x - satPos.x) > 1 || Math.abs(currentSatPos.y - satPos.y) > 1) {
          useAppStore.getState().setSatelliteScreenPos({ x: satPos.x, y: satPos.y });
        }
      } else if (currentSatPos !== null) {
        useAppStore.getState().setSatelliteScreenPos(null);
      }

      // 3. CCTV Screen Tracking
      const selectedCCTV = useAppStore.getState().selectedCCTV;
      let cctvPos = null;
      if (selectedCCTV && cctvDataSourceRef.current) {
        const entity = cctvDataSourceRef.current.entities.getById(`cctv-${selectedCCTV.id}`);
        if (entity && entity.position) {
          const position = entity.position.getValue(viewerRef.current.clock.currentTime);
          if (position) {
            cctvPos = Cesium.SceneTransforms.worldToWindowCoordinates(viewerRef.current.scene, position);
          }
        }
      }
      const currentCctvPos = useAppStore.getState().cctvScreenPos;
      if (cctvPos) {
        if (!currentCctvPos || Math.abs(currentCctvPos.x - cctvPos.x) > 1 || Math.abs(currentCctvPos.y - cctvPos.y) > 1) {
          useAppStore.getState().setCctvScreenPos({ x: cctvPos.x, y: cctvPos.y });
        }
      } else if (currentCctvPos !== null) {
        useAppStore.getState().setCctvScreenPos(null);
      }

      // 4. Maritime Screen Tracking
      const selectedMaritime = useAppStore.getState().selectedMaritime;
      let maritimePos = null;
      if (selectedMaritime && maritimeDataSourceRef.current) {
        // we use either selectedMaritime.mmsi or fallback to id
        const mmsiTarget = selectedMaritime.mmsi;
        const entity = maritimeDataSourceRef.current.entities.getById(`mmsi-${mmsiTarget}`);
        if (entity && entity.position) {
          const position = entity.position.getValue(viewerRef.current.clock.currentTime);
          if (position) {
            maritimePos = Cesium.SceneTransforms.worldToWindowCoordinates(viewerRef.current.scene, position);
          }
        }
      }
      const currentMaritimePos = useAppStore.getState().maritimeScreenPos;
      if (maritimePos) {
        if (!currentMaritimePos || Math.abs(currentMaritimePos.x - maritimePos.x) > 1 || Math.abs(currentMaritimePos.y - maritimePos.y) > 1) {
          useAppStore.getState().setMaritimeScreenPos({ x: maritimePos.x, y: maritimePos.y });
        }
      } else if (currentMaritimePos !== null) {
        useAppStore.getState().setMaritimeScreenPos(null);
      }

      // 5. Maritime Hover Screen Tracking
      const hoveredMaritime = useAppStore.getState().hoveredMaritime;
      let maritimeHoverPos = null;
      if (hoveredMaritime && maritimeDataSourceRef.current) {
        const mmsiTarget = hoveredMaritime.mmsi;
        const entity = maritimeDataSourceRef.current.entities.getById(`mmsi-${mmsiTarget}`);
        if (entity && entity.position) {
          const position = entity.position.getValue(viewerRef.current.clock.currentTime);
          if (position) {
            maritimeHoverPos = Cesium.SceneTransforms.worldToWindowCoordinates(viewerRef.current.scene, position);
          }
        }
      }
      const currentMaritimeHoverPos = useAppStore.getState().maritimeHoverScreenPos;
      if (maritimeHoverPos) {
        if (!currentMaritimeHoverPos || Math.abs(currentMaritimeHoverPos.x - maritimeHoverPos.x) > 1 || Math.abs(currentMaritimeHoverPos.y - maritimeHoverPos.y) > 1) {
          useAppStore.getState().setMaritimeHoverScreenPos({ x: maritimeHoverPos.x, y: maritimeHoverPos.y });
        }
      } else if (currentMaritimeHoverPos !== null) {
        useAppStore.getState().setMaritimeHoverScreenPos(null);
      }
    };

    viewerRef.current.scene.preRender.addEventListener(preRenderListener);

    return () => {
      if (viewerRef.current && !viewerRef.current.isDestroyed()) {
        viewerRef.current.scene.preRender.removeEventListener(preRenderListener);
      }
    };
  }, [viewerReady]);

  // Handle Traffic Layer via OpenStreetMap Real Vectors
  useEffect(() => {
    const Cesium = (window as any).Cesium;
    if (layers.traffic && viewerRef.current && Cesium && trafficDataSourceRef.current) {
      trafficDataSourceRef.current.show = true;

      const fetchTrafficVectors = async () => {
        // Prevent refetching if already populated
        if (trafficDataSourceRef.current.entities.values.length > 0) return;

        try {
          // Use the server-side proxy to avoid CORS restrictions and leverage mirror fallback
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 35_000); // 35s client-side safety net
          let res: Response;
          try {
            res = await fetch(`/api/traffic`, { signal: controller.signal });
          } finally {
            clearTimeout(timeoutId);
          }

          if (!res.ok) throw new Error(`Traffic proxy returned HTTP ${res.status}`);
          const data = await res.json();

          // Graceful degradation: if all mirrors failed upstream, data.elements will be []
          if (!data?.elements?.length) {
            console.warn('[MapViewer] Traffic layer: no road vectors returned – layer hidden until retry.');
            return;
          }

          if (data && data.elements) {
            data.elements.forEach((way: any) => {
              if (way.geometry && way.geometry.length > 1) {
                const degreesArray = way.geometry.flatMap((pt: any) => [pt.lon, pt.lat]);

                // Deterministic mockup of traffic density using OpenStreetMap node ID modulo
                const trafficDensity = way.id % 3;
                let strokeColor = Cesium.Color.fromCssColorString("#00F0FF").withAlpha(0.7); // Light Flow (Cyan)
                if (trafficDensity === 1) strokeColor = Cesium.Color.fromCssColorString("#FF0055").withAlpha(0.9); // Moderate Flow (Magenta)
                else if (trafficDensity === 2) strokeColor = Cesium.Color.fromCssColorString("#9D00FF").withAlpha(1.0); // Congested Flow (Neon Purple)

                trafficDataSourceRef.current.entities.add({
                  polyline: {
                    positions: Cesium.Cartesian3.fromDegreesArray(degreesArray),
                    width: trafficDensity === 2 ? 12 : 8,
                    material: new Cesium.PolylineDashMaterialProperty({
                      color: new Cesium.CallbackProperty((time: any) => {
                        const seconds = Cesium.JulianDate.toDate(time).getTime() / 1000.0;
                        // Pulse effect varying slightly by highway density
                        const pulse = 0.6 + 0.4 * Math.sin(seconds * (3.0 + trafficDensity * 1.5) + way.id);
                        return strokeColor.withAlpha(pulse);
                      }, false),
                      gapColor: Cesium.Color.TRANSPARENT,
                      dashLength: 40.0 + trafficDensity * 20.0,
                      dashPattern: 255.0
                    }),
                    clampToGround: true // Ensures it maps perfectly over the 3D tiles terrain
                  }
                });
              }
            });
          }
        } catch (e: any) {
          if (e?.name === 'AbortError') {
            console.warn('[MapViewer] Traffic layer: request timed out – will retry on next layer toggle.');
          } else {
            console.warn('[MapViewer] Traffic layer: fetch failed gracefully –', e?.message ?? e);
          }
        }
      };

      fetchTrafficVectors();
    } else if (trafficDataSourceRef.current) {
      trafficDataSourceRef.current.show = false;
    }
  }, [layers.traffic]);

  // Handle Live Flights using Telemetry Worker Pipeline
  useEffect(() => {
    const Cesium = (window as any).Cesium;
    if (!Cesium || !viewerRef.current || !flightsDataSourceRef.current) return;

    if (!flightTelemetry) {
      if (flightsDataSourceRef.current) flightsDataSourceRef.current.show = layers.flights;
      return;
    }

    flightsDataSourceRef.current.show = layers.flights;
    const entities = flightsDataSourceRef.current.entities;

    const { buffer, meta, timestamp } = flightTelemetry;
    const STRIDE = 6;
    const count = buffer.length / STRIDE;

    const time = Cesium.JulianDate.fromDate(new Date(timestamp * 1000));
    // Ensure the viewer clock runs normally to animate sampled positions
    if (!viewerRef.current.clock.shouldAnimate) {
      viewerRef.current.clock.shouldAnimate = true;
    }

    const currentIds = new Set<string>();

    entities.suspendEvents();

    for (let i = 0; i < count; i++) {
      const offset = i * STRIDE;
      const idInt = buffer[offset];
      const stringId = `fl-${idInt}`;
      currentIds.add(stringId);

      const lng = buffer[offset + 1];
      const lat = buffer[offset + 2];
      const alt = buffer[offset + 3];
      const vel = buffer[offset + 4];
      const track = buffer[offset + 5];
      const callsign = meta[idInt]?.callsign || "UNKNOWN";
      const origin = meta[idInt]?.origin_country || "UNKNOWN";
      const airline = meta[idInt]?.airline || "PRIVATE / UNKNOWN";
      const mach = (vel / 340.3).toFixed(2);

      const position = Cesium.Cartesian3.fromDegrees(lng, lat, alt);

      // Tactical Contrail Color: Below 10,000ft ~ 3048m Gold, Above Obsidian Blue / Cyan
      const trailColor = alt < 3048
        ? Cesium.Color.fromCssColorString('#FFD700').withAlpha(0.8)
        : Cesium.Color.fromCssColorString('#00FFFF').withAlpha(0.5);

      let entity = entities.getById(stringId);

      if (!entity) {
        const positionProperty = new Cesium.SampledPositionProperty();
        positionProperty.setInterpolationOptions({
          interpolationDegree: 3,
          interpolationAlgorithm: Cesium.HermitePolynomialApproximation
        });
        positionProperty.forwardExtrapolationType = Cesium.ExtrapolationType.EXTRAPOLATE;
        positionProperty.forwardExtrapolationDuration = 3600; // Allow up to 1h drift for flights
        positionProperty.backwardExtrapolationType = Cesium.ExtrapolationType.HOLD;
        positionProperty.backwardExtrapolationDuration = Number.POSITIVE_INFINITY;

        entity = entities.add({
          id: stringId,
          position: positionProperty,
          // Macro View (Billboard / SVG Icon)
          billboard: {
            image: AIRPLANE_SVG,
            scaleByDistance: new Cesium.NearFarScalar(2000.0, 0.4, 8000000.0, 0.15),
            rotation: -Cesium.Math.toRadians(track || 0)
          },
          // Massive Hitbox Element
          point: {
            pixelSize: 40,
            color: new Cesium.Color(0, 0, 0, 0.01)
          },
          // Contrail Path (Amplified)
          path: {
            resolution: 1,
            leadTime: 10,
            trailTime: 300,
            width: 8,
            distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0.0, Number.POSITIVE_INFINITY)
          },
          properties: new Cesium.PropertyBag({ flightId: idInt, callsign: callsign, origin: origin, airline: airline, alt: alt, mach: mach })
        });

        entity.path.material = new Cesium.PolylineGlowMaterialProperty({
          glowPower: 0.35,
          color: trailColor
        });
      }

      entity.position.addSample(time, position);

      // Safely update or initialize properties without breaking Cesium Property prototypes
      if (!entity.properties) entity.properties = new Cesium.PropertyBag();

      const updateProp = (key: string, val: any) => {
        if (entity.properties.hasProperty(key)) {
          // IMPORTANT: Only trigger setValue if changed to prevent 9,000+ definitionChanged events from freezing the Scene
          const currentVal = entity.properties[key].getValue();
          if (currentVal !== val) {
            entity.properties[key].setValue(val);
          }
        } else {
          entity.properties.addProperty(key, val);
        }
      };

      updateProp('callsign', callsign);
      updateProp('origin', origin);
      updateProp('airline', airline);
      updateProp('alt', alt);
      updateProp('mach', mach);
      updateProp('flightId', idInt);

      if (entity.billboard) {
        entity.billboard.rotation = -Cesium.Math.toRadians(track);
      }

      if (entity.path && entity.path.material && entity.path.material.color) {
        entity.path.material.color = trailColor;
      }
    }

    // Cleanup stale flights (no longer received in buffer)
    const entitiesToRemove: any[] = [];
    entities.values.forEach((entity: any) => {
      if (entity.id.startsWith('fl-') && !currentIds.has(entity.id)) {
        entitiesToRemove.push(entity);
      }
    });
    entitiesToRemove.forEach((e: any) => entities.remove(e));

    entities.resumeEvents();

    // No else if needed because we unconditionally update the data and sync show state above.
  }, [layers.flights, flightTelemetry]);

  // Handle Real-Time Satellites
  useEffect(() => {
    const Cesium = (window as any).Cesium;
    if (!Cesium || !viewerRef.current || !satellitesDataSourceRef.current) return;

    if (layers.satellites && satTelemetry) {
      satellitesDataSourceRef.current.show = true;
      const entities = satellitesDataSourceRef.current.entities;

      const { buffer, meta, timestamp } = satTelemetry;
      const STRIDE = 4;
      const count = buffer.length / STRIDE;
      const time = Cesium.JulianDate.fromDate(new Date(timestamp * 1000));

      if (!viewerRef.current.clock.shouldAnimate) {
        viewerRef.current.clock.shouldAnimate = true;
      }

      const currentIds = new Set<string>();

      for (let i = 0; i < count; i++) {
        const offset = i * STRIDE;
        const idInt = buffer[offset];
        const stringId = `sat-${idInt}`;
        currentIds.add(stringId);

        const lng = buffer[offset + 1];
        const lat = buffer[offset + 2];
        const alt = buffer[offset + 3];

        const satMeta = meta && meta[idInt] ? meta[idInt] : { name: `UNKNOWN-${idInt}`, apogee: 0, perigee: 0, inc: 0 };
        const position = Cesium.Cartesian3.fromDegrees(lng, lat, alt);

        let entity = entities.getById(stringId);

        // Custom styling based on satellite metadata name
        const isStarlink = satMeta.name.includes("STARLINK");
        const isISS = satMeta.name.includes("ISS") || satMeta.name.includes("ZARYA");

        let satColor = Cesium.Color.fromCssColorString('#00FF00'); // Generic Green
        let footprintColor = Cesium.Color.fromCssColorString('#00FF00').withAlpha(0.05);

        if (isStarlink) {
          satColor = Cesium.Color.fromCssColorString('#00FFFF'); // Cyber Cyan
          footprintColor = Cesium.Color.fromCssColorString('#00FFFF').withAlpha(0.02);
        } else if (isISS) {
          satColor = Cesium.Color.fromCssColorString('#FFD700'); // Gold
          footprintColor = Cesium.Color.fromCssColorString('#FFD700').withAlpha(0.1);
        }

        if (!entity) {
          const positionProperty = new Cesium.SampledPositionProperty();
          positionProperty.setInterpolationOptions({
            interpolationDegree: 5, // Higher degree for orbital sweeps
            interpolationAlgorithm: Cesium.LagrangePolynomialApproximation
          });
          positionProperty.forwardExtrapolationType = Cesium.ExtrapolationType.EXTRAPOLATE;
          positionProperty.forwardExtrapolationDuration = 86400; // Extrapolate up to 24h into the future
          positionProperty.backwardExtrapolationType = Cesium.ExtrapolationType.HOLD;
          positionProperty.backwardExtrapolationDuration = Number.POSITIVE_INFINITY;

          // Use string replacement for fillColor in SVG
          const coloredSvg = SATELLITE_SVG.replace('currentColor', isStarlink ? '%2300FFFF' : (isISS ? '%23FFD700' : '%2300FF00'));

          entity = entities.add({
            id: stringId,
            position: positionProperty,
            billboard: {
              image: coloredSvg,
              scaleByDistance: new Cesium.NearFarScalar(2000.0, 0.55, 15000000.0, 0.22)
            },
            point: {
              pixelSize: 40,
              color: new Cesium.Color(0, 0, 0, 0.01)
            },
            properties: new Cesium.PropertyBag({
              satId: idInt,
              satName: satMeta.name,
              apogee: satMeta.apogee,
              perigee: satMeta.perigee,
              inc: satMeta.inc
            })
          });
        }

        entity.position.addSample(time, position);
        if (!entity.properties) entity.properties = new Cesium.PropertyBag();
        if (!entity.properties.hasProperty('satName')) {
          entity.properties.addProperty('satName', satMeta.name);
          entity.properties.addProperty('apogee', satMeta.apogee);
          entity.properties.addProperty('perigee', satMeta.perigee);
          entity.properties.addProperty('inc', satMeta.inc);
          entity.properties.addProperty('satId', idInt);
        }
      }

    } else if (satellitesDataSourceRef.current) {
      satellitesDataSourceRef.current.show = false;
    }
  }, [layers.satellites, satTelemetry]);

  // Handle Predict Orbit Overlay
  const selectedSatellite = useAppStore((state) => state.selectedSatellite);

  useEffect(() => {
    const Cesium = (window as any).Cesium;
    if (!Cesium || !viewerRef.current) return;

    const entityId = `orbit-pred-ring`;
    let predEntity = viewerRef.current.entities.getById(entityId);

    // If there is no active orbit prediction, or we clicked off the satellite, remove the ring entirely
    if (!orbitPrediction || !selectedSatellite || orbitPrediction.noradId.toString() !== selectedSatellite.id) {
      if (predEntity) viewerRef.current.entities.remove(predEntity);
      return;
    }

    // Connect predictive Cartesian points globally manually, independent of the moving entity
    const positions = orbitPrediction.points.map(pt => Cesium.Cartesian3.fromDegrees(pt.lng, pt.lat, pt.alt));

    if (!predEntity) {
      viewerRef.current.entities.add({
        id: entityId,
        polyline: {
          positions: positions,
          width: 8,
          material: new Cesium.PolylineGlowMaterialProperty({
            glowPower: 0.15,
            color: Cesium.Color.fromCssColorString('#00FFFF').withAlpha(0.6),
          })
        }
      });
    } else {
      predEntity.polyline.positions = new Cesium.ConstantProperty(positions);
    }
  }, [orbitPrediction, selectedSatellite]);

  // Handle Vision Modes (Post Process)
  useEffect(() => {
    const Cesium = (window as any).Cesium;
    if (!viewerRef.current || !Cesium) return;

    const scene = viewerRef.current.scene;

    if (stageRef.current) {
      scene.postProcessStages.remove(stageRef.current);
      stageRef.current = null;
    }

    if (visionMode === "NORMAL") return;

    let fragmentShader = "";
    if (visionMode === "NVG") fragmentShader = NVG_SHADER;
    else if (visionMode === "THERMAL") fragmentShader = THERMAL_SHADER;
    else if (visionMode === "CRT") fragmentShader = CRT_SHADER;

    if (fragmentShader) {
      stageRef.current = new Cesium.PostProcessStage({
        fragmentShader,
      });
      scene.postProcessStages.add(stageRef.current);
    }
  }, [visionMode]);

  // Handle Maritime Layer (Ocean Traffic)
  useEffect(() => {
    const Cesium = (window as any).Cesium;
    if (!Cesium || !maritimeDataSourceRef.current) return;

    maritimeDataSourceRef.current.show = layers.maritime;
    if (!maritimeTelemetry || maritimeTelemetry.size === 0) return;

    // Ensure viewer clock is animating
    if (viewerRef.current && !viewerRef.current.clock.shouldAnimate) {
      viewerRef.current.clock.shouldAnimate = true;
    }

    const entities = maritimeDataSourceRef.current.entities;
    entities.suspendEvents();

    const currentIds = new Set<string>();

    // maritimeTelemetry is Map<mmsi, VesselRecord> — iterate directly
    maritimeTelemetry.forEach((vessel) => {
      const { mmsi, lat, lng, sog, heading, colorHex, shipType } = vessel;
      if (!lat || !lng || lat === 0 || lng === 0) return;

      const stringId = `mmsi-${mmsi}`;
      currentIds.add(stringId);

      // Build a colored ship SVG from the vessel's real type color
      const safeColor = colorHex || '#00CCFF';
      // Sleek angular navigation chevron matching reference
      const SHIP_SVG = 'data:image/svg+xml;base64,' + btoa(
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${safeColor}" width="42" height="42">` +
        `<path d="M12 2 L22 22 L12 18 L2 22 Z" stroke="#000000" stroke-width="1.5" stroke-linejoin="round"/>` +
        `</svg>`
      );

      // Elevate slightly above the ellipsoid to prevent z-fighting with the ocean floor
      const cartesian = Cesium.Cartesian3.fromDegrees(lng, lat, 250);
      let entity = entities.getById(stringId);

      if (!entity) {
        entity = entities.add({
          id: stringId,
          position: cartesian,
          billboard: {
            image: SHIP_SVG,
            // Removed CLAMP_TO_GROUND since it causes vanishing when depth test is enabled on flat ellipsoid
            scaleByDistance: new Cesium.NearFarScalar(500.0, 1.2, 10000000.0, 0.5),
            eyeOffset: new Cesium.Cartesian3(0, 0, -50), // Pull slightly towards camera
            rotation: -Cesium.Math.toRadians(heading || 0),
            verticalOrigin: Cesium.VerticalOrigin.CENTER,
            horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
          },
          // Massive Hitbox Element for Hardware-Accelerated Picking
          point: {
            pixelSize: 35,
            color: new Cesium.Color(0, 0, 0, 0.01)
          },
        });
      } else {
        entity.position.setValue(cartesian);
      }

      if (entity.billboard) {
        entity.billboard.rotation = -Cesium.Math.toRadians(heading || 0);
      }

      // Store the full VesselRecord on the entity so clicking gives rich data
      if (!entity.properties) entity.properties = new Cesium.PropertyBag();
      const upsertProp = (key: string, val: any) => {
        if (entity!.properties.hasProperty(key)) {
          if (entity!.properties[key].getValue() !== val) entity!.properties[key].setValue(val);
        } else {
          entity!.properties.addProperty(key, val);
        }
      };

      upsertProp('mmsi', mmsi);
      upsertProp('vesselName', vessel.name || `VESSEL ${mmsi}`);
      upsertProp('vesselType', vessel.typeName || 'UNKNOWN');
      upsertProp('speed', sog || 0);
      upsertProp('heading', heading || 0);
      upsertProp('flag', vessel.flag || '🏳️');
      upsertProp('destination', vessel.destination || '');
      upsertProp('colorHex', safeColor);
      upsertProp('navStatus', vessel.navStatus || 0);
      upsertProp('navStatusText', vessel.navStatusText || '');
      upsertProp('imo', vessel.imo || 0);
      upsertProp('callsign', vessel.callsign || '');
      upsertProp('shipType', shipType || 0);
      upsertProp('length', vessel.length || 0);
      upsertProp('width', vessel.width || 0);
      upsertProp('draught', vessel.draught || 0);
      upsertProp('simulated', vessel.simulated ? 1 : 0);
    });

    // Remove vessels that are no longer in the telemetry map
    const toRemove: any[] = [];
    entities.values.forEach((e: any) => {
      if (e.id?.startsWith('mmsi-') && !currentIds.has(e.id)) toRemove.push(e);
    });
    toRemove.forEach((e) => entities.remove(e));

    entities.resumeEvents();
  }, [maritimeTelemetry, layers.maritime]);

  // Handle Climate Engine (Wind Vectors)
  useEffect(() => {
    const Cesium = (window as any).Cesium;
    if (!Cesium || !climateDataSourceRef.current) return;

    climateDataSourceRef.current.show = layers.climate;
    if (!layers.climate || !climateTelemetry) return;

    const entities = climateDataSourceRef.current.entities;
    const { buffer } = climateTelemetry;
    const STRIDE = 5;
    const count = buffer.length / STRIDE;

    entities.suspendEvents();

    for (let i = 0; i < count; i++) {
      const offset = i * STRIDE;
      const idInt = buffer[offset + 0];
      const stringId = `wind-${idInt}`;
      const lng = buffer[offset + 1];
      const lat = buffer[offset + 2];
      const intensity = buffer[offset + 3];
      const heading = buffer[offset + 4];

      // Intensity drives dynamic color (Deep Purple to Blazing Cyan)
      let colorHex = '#9D00FF'; // Slow: Deep Purple
      if (intensity > 6) colorHex = '#00F0FF'; // High: Blazing Cyan
      else if (intensity > 3) colorHex = '#FF0055'; // Medium: Magenta

      const glowColor = Cesium.Color.fromCssColorString(colorHex).withAlpha(0.3 + (intensity * 0.05));
      const position = Cesium.Cartesian3.fromDegrees(lng, lat, 1000 + intensity * 500);

      // Extended tail for faster wind
      const tailMult = 0.05 + (intensity * 0.02);
      const tailLng = lng - (Math.sin(heading * Math.PI / 180) * tailMult);
      const tailLat = lat - (Math.cos(heading * Math.PI / 180) * tailMult);
      const tailPos = Cesium.Cartesian3.fromDegrees(tailLng, tailLat, 1000 + intensity * 500);

      let entity = entities.getById(stringId);

      if (!entity) {
        entity = entities.add({
          id: stringId,
          polyline: {
            positions: [tailPos, position],
            width: 3 + intensity,
            material: new Cesium.PolylineGlowMaterialProperty({
              glowPower: 0.2,
              taperPower: 1.0, // Creates a comet-like comet tail
              color: glowColor
            })
          }
        });
      } else {
        entity.polyline.positions = [tailPos, position];
        (entity.polyline.material as any).color = glowColor;
        entity.polyline.width = 3 + intensity;
      }
    }
    entities.resumeEvents();
  }, [climateTelemetry, layers.climate]);

  // Handle Cyber Intel Layer (Ballistic Arcs)
  useEffect(() => {
    const Cesium = (window as any).Cesium;
    if (!Cesium || !cyberDataSourceRef.current) return;

    cyberDataSourceRef.current.show = layers.cyber;
    if (!layers.cyber) return;

    const entities = cyberDataSourceRef.current.entities;
    const activeIds = new Set(cyberIntel.map(a => a.id));

    // Cleanup faded attacks
    entities.values.forEach((entity: any) => {
      if (!activeIds.has(entity.id)) entities.remove(entity);
    });

    cyberIntel.forEach(attack => {
      if (!entities.getById(attack.id)) {
        const colorHex = attack.severity === 2 ? '#FF0000' : (attack.severity === 1 ? '#FF0055' : '#9D00FF');
        const cesiumColor = Cesium.Color.fromCssColorString(colorHex);

        const start = Cesium.Cartesian3.fromDegrees(attack.sourceLng, attack.sourceLat, 0);
        const end = Cesium.Cartesian3.fromDegrees(attack.targetLng, attack.targetLat, 0);

        entities.add({
          id: attack.id,
          polyline: {
            positions: [start, end],
            arcType: Cesium.ArcType.GEODESIC,
            width: 5,
            material: new Cesium.PolylineDashMaterialProperty({
              color: cesiumColor,
              dashLength: 400000.0,
              dashPattern: 255.0
            })
          }
        });
      }
    });

  }, [cyberIntel, layers.cyber]);

  return <div ref={containerRef} className="absolute inset-0 z-0 bg-[#0b0f19]" />;
}
