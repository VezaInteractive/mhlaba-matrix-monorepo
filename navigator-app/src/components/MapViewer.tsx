"use client";

import { useEffect, useRef, useMemo, useState } from "react";
import { useAppStore, POIs } from "@/store/useAppStore";
import { useFlightTelemetry } from "@/hooks/useFlightTelemetry";
import { useSatelliteTelemetry } from "@/hooks/useSatelliteTelemetry";
import { CITY_INTEL } from "./HUD/RightPanel";

type CesiumType = any; // We type it as any to avoid typescript errors since we uninstalled the module



export default function MapViewer() {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<CesiumType>(null);
  const activePOI = useAppStore((state) => state.activePOI);
  const layers = useAppStore((state) => state.layers);
  const timeMultiplier = useAppStore((state) => state.timeMultiplier);
  const executeSearch = useAppStore((state) => state.executeSearch);
  const searchQuery = useAppStore((state) => state.searchQuery);
  const flightTelemetry = useFlightTelemetry(layers.flights);
  const { telemetry: satTelemetry, orbitPrediction, requestOrbitPrediction } = useSatelliteTelemetry(layers.satellites);
  
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
    const interval = setInterval(() => {
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

        viewerRef.current = viewer;

        // Create data sources
        flightsDataSourceRef.current = new Cesium.CustomDataSource('flights');
        cctvDataSourceRef.current = new Cesium.CustomDataSource('cctv');
        businessesDataSourceRef.current = new Cesium.CustomDataSource('businesses');
        realEstateDataSourceRef.current = new Cesium.CustomDataSource('realEstate');
        
        viewer.dataSources.add(flightsDataSourceRef.current);
        viewer.dataSources.add(cctvDataSourceRef.current);
        viewer.dataSources.add(satellitesDataSourceRef.current);
        viewer.dataSources.add(businessesDataSourceRef.current);
        viewer.dataSources.add(realEstateDataSourceRef.current);

        viewer.scene.globe.enableLighting = false; // Disabled day/night terminators for consistent tactical illumination
        viewer.scene.highDynamicRange = true; // High accuracy colors
        viewer.clock.shouldAnimate = false; // Disable global clock animation to freeze lighting bugs on tiles
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
        for (const e of ents) {
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
        for (const e of ents) {
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
                useAppStore.getState().setSelectedCCTV(null);
                requestOrbitPrediction(parseInt(satId, 10));
            } else if (layerType === 'flight') {
                useAppStore.getState().setSelectedFlight({
                  id: foundEntity.properties.flightId.getValue().toString(),
                  callsign: foundEntity.properties.callsign.getValue(),
                  alt: Math.round(foundEntity.properties.alt.getValue()),
                  mach: parseFloat(foundEntity.properties.mach.getValue())
                });
                useAppStore.getState().setSelectedSatellite(null);
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
      // 1. Standard precise pixel pick
      let pickedEntity: any = null;
      const pickedObject = viewerRef.current.scene.pick(click.position);
      
      if (Cesium.defined(pickedObject) && pickedObject.id) {
          pickedEntity = pickedObject.id;
      }
      
      // 2. Spatial Math Proximity Search (Bulletproof hit detection)
      if (!pickedEntity) {
          let closestDist = 35; // Massive 35px click tolerance radius
          
          const searchLayer = (dataSource: any) => {
              if (!dataSource || !dataSource.entities) return;
              const ents = dataSource.entities.values;
              for (const e of ents) {
                  if (e.position) {
                      const pos = e.position.getValue(viewerRef.current.clock.currentTime);
                      if (pos) {
                          const screenPos = Cesium.SceneTransforms.wgs84ToWindowCoordinates(viewerRef.current.scene, pos);
                          if (screenPos) {
                              const dist = Math.sqrt(
                                  Math.pow(screenPos.x - click.position.x, 2) + 
                                  Math.pow(screenPos.y - click.position.y, 2)
                              );
                              if (dist < closestDist) {
                                  closestDist = dist;
                                  pickedEntity = e;
                              }
                          }
                      }
                  }
              }
          };

          if (realEstateDataSourceRef.current?.show) searchLayer(realEstateDataSourceRef.current);
          if (businessesDataSourceRef.current?.show) searchLayer(businessesDataSourceRef.current);
      }

      if (pickedEntity && pickedEntity.id) {
        const entity = pickedEntity;
        console.log("CLICKED ENTITY FOUND", entity, typeof entity.id, entity.id);
        
        // Failsafe parameter extractor that guards against Cesium type-coercion/Prototype mutating crashes
        const extractVal = (prop: string, fallback: any = "") => {
           if (!entity || !entity.properties || entity.properties[prop] === undefined) return fallback;
           const field = entity.properties[prop];
           if (typeof field.getValue === 'function') return field.getValue();
           if (typeof field === 'object' && field._value !== undefined) return field._value;
           return field; // Fallback to raw primitive if Cesium stripped prototype
        };

        if (entity.id?.startsWith("cctv-")) {
          useAppStore.getState().setSelectedCCTV({
            id: extractVal("cctvId").toString(),
            name: extractVal("cctvName").toString()
          });
          useAppStore.getState().setSelectedFlight(null);
          useAppStore.getState().setSelectedSatellite(null);
        } else if (entity.id?.startsWith("fl-")) {
          useAppStore.getState().setSelectedFlight({
            id: extractVal("flightId").toString() || extractVal("id", entity.id.replace("fl-", "")),
            callsign: extractVal("callsign").toString() || "UNKNOWN",
            origin: extractVal("origin").toString() || "UNKNOWN",
            airline: extractVal("airline").toString() || "UNKNOWN",
            alt: Math.round(parseFloat(extractVal("alt", 0))),
            mach: parseFloat(extractVal("mach", 0))
          });
        } else if (entity.id?.startsWith("sat-")) {
          const satId = extractVal("satId").toString() || entity.id.replace("sat-", "");
          useAppStore.getState().setSelectedSatellite({
            id: satId,
            name: extractVal("satName").toString() || "CLASSIFIED",
            apogee: parseFloat(extractVal("apogee", 0)),
            perigee: parseFloat(extractVal("perigee", 0)),
            inc: parseFloat(extractVal("inc", 0))
          });
          useAppStore.getState().setSelectedCCTV(null);
          requestOrbitPrediction(parseInt(satId, 10));
        } else if (entity.id?.startsWith("business_")) {
          // Trigger External Deployment (Direct Web Link)
          const cityKey = entity.id.replace("business_", "");
          useAppStore.getState().setActivePOI(cityKey as any);
          
          const website = CITY_INTEL[cityKey]?.commercial?.website;
          if (website) {
            window.open(website, "_blank");
          }
        } else if (entity.id?.startsWith("realEstate_")) {
          // Open Premium Asser View
          const cityKey = entity.id.replace("realEstate_", "");
          useAppStore.getState().setActivePOI(cityKey as any);
          useAppStore.getState().setShowRealEstateModal(true);
        }
      } else {
        // Did not hit any asset
      }
    };
    
    // Bind to both Single Tap and Double Tap mechanics
    handler.setInputAction(processInteraction, Cesium.ScreenSpaceEventType.LEFT_CLICK);
    handler.setInputAction(processInteraction, Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);

    return () => {
      handler.destroy();
    };
  }, []);

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
    };

    viewerRef.current.scene.preRender.addEventListener(preRenderListener);

    return () => {
      if (viewerRef.current && !viewerRef.current.isDestroyed()) {
         viewerRef.current.scene.preRender.removeEventListener(preRenderListener);
      }
    };
  }, [viewerReady]);



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
              color: new Cesium.Color(0,0,0,0.01)
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
              color: new Cesium.Color(0,0,0,0.01)
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
    const predEntity = viewerRef.current.entities.getById(entityId);

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



  return <div ref={containerRef} className="absolute inset-0 z-0 bg-[#0b0f19]" />;
}
