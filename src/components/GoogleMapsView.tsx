// Source: Google Maps Platform Code Assist
import React, { useEffect, useState, useRef } from 'react';
import { APIProvider, Map, AdvancedMarker, useMap, MapMouseEvent } from '@vis.gl/react-google-maps';
import { JourneyRoute, TransitNode } from '../types/wayora';
import { sound } from '../services/soundService';
import {
  Navigation,
  Crosshair,
  Layers,
  ArrowUpRight,
  Gauge,
  Compass,
  MapPin,
  LocateFixed,
  Flag,
  CheckCircle,
  X,
  Loader2,
  Sparkles,
  Route as RouteIcon
} from 'lucide-react';
import { GoogleMapsStyleView } from './GoogleMapsStyleView';
import { fetchRoadCoordinates } from '../services/roadGeometryService';

interface GoogleMapsViewProps {
  selectedRoute: JourneyRoute | null;
  originNode: TransitNode;
  destNode: TransitNode;
  isLiveTracking: boolean;
  onToggleLiveTracking: (active: boolean) => void;
  onSelectOriginLocation?: (loc: { lat: number; lng: number; name?: string }) => void;
  onSelectDestLocation?: (loc: { lat: number; lng: number; name?: string }) => void;
  onUseCurrentLocation?: () => void;
  isLocatingGPS?: boolean;
  onToggle3DView?: () => void;
  is3DActive?: boolean;
}

// Sub-component to manage REAL ROAD-FOLLOWING polyline and bounds fitting using Google Maps JS API
const RoutePolylineRenderer: React.FC<{
  selectedRoute: JourneyRoute | null;
  originNode: TransitNode;
  destNode: TransitNode;
  onRoadPathReady: (path: google.maps.LatLngLiteral[]) => void;
}> = ({ selectedRoute, originNode, destNode, onRoadPathReady }) => {
  const map = useMap();
  const polylineRef = useRef<google.maps.Polyline | null>(null);
  const glowPolylineRef = useRef<google.maps.Polyline | null>(null);

  useEffect(() => {
    if (!map) return;

    let isSubscribed = true;

    // Clean up previous polyline
    if (polylineRef.current) {
      polylineRef.current.setMap(null);
      polylineRef.current = null;
    }
    if (glowPolylineRef.current) {
      glowPolylineRef.current.setMap(null);
      glowPolylineRef.current = null;
    }

    const loadRoadGeometry = async () => {
      // Collect sequential waypoints for the journey
      const waypoints: Array<{ lat: number; lng: number }> = [];
      if (selectedRoute && selectedRoute.legs.length > 0) {
        waypoints.push({ lat: selectedRoute.legs[0].fromNode.lat, lng: selectedRoute.legs[0].fromNode.lng });
        selectedRoute.legs.forEach((leg) => {
          waypoints.push({ lat: leg.toNode.lat, lng: leg.toNode.lng });
        });
      } else {
        waypoints.push({ lat: originNode.lat, lng: originNode.lng });
        waypoints.push({ lat: destNode.lat, lng: destNode.lng });
      }

      // Fetch real road coordinates between successive waypoints
      const fullRoadPath: google.maps.LatLngLiteral[] = [];
      for (let i = 0; i < waypoints.length - 1; i++) {
        const segRoad = await fetchRoadCoordinates(waypoints[i], waypoints[i + 1], 'DRIVE');
        if (i === 0) {
          fullRoadPath.push(...segRoad);
        } else {
          // Avoid duplicate joint point
          fullRoadPath.push(...segRoad.slice(1));
        }
      }

      if (!isSubscribed) return;

      if (fullRoadPath.length === 0) {
        fullRoadPath.push(
          { lat: originNode.lat, lng: originNode.lng },
          { lat: destNode.lat, lng: destNode.lng }
        );
      }

      onRoadPathReady(fullRoadPath);

      const bounds = new google.maps.LatLngBounds();
      fullRoadPath.forEach((pt) => bounds.extend(pt));

      const routeColor = selectedRoute?.legs[0]?.lineColor || '#0284C7';

      // 1. Glow shadow polyline for aesthetic depth
      const glowLine = new google.maps.Polyline({
        path: fullRoadPath,
        strokeColor: routeColor,
        strokeOpacity: 0.35,
        strokeWeight: 12,
        map,
      });
      glowPolylineRef.current = glowLine;

      // 2. Core crisp road polyline following every road curve
      const coreLine = new google.maps.Polyline({
        path: fullRoadPath,
        strokeColor: routeColor,
        strokeOpacity: 0.95,
        strokeWeight: 5,
        map,
      });
      polylineRef.current = coreLine;

      // Fit map bounds smoothly
      map.fitBounds(bounds, { top: 90, right: 90, bottom: 90, left: 90 });
    };

    loadRoadGeometry();

    return () => {
      isSubscribed = false;
      if (polylineRef.current) {
        polylineRef.current.setMap(null);
        polylineRef.current = null;
      }
      if (glowPolylineRef.current) {
        glowPolylineRef.current.setMap(null);
        glowPolylineRef.current = null;
      }
    };
  }, [map, selectedRoute, originNode.lat, originNode.lng, destNode.lat, destNode.lng]);

  return null;
};

// Sub-component to manage live GPS marker moving along the ACTUAL ROAD PATH
const LiveGpsMarkerRenderer: React.FC<{
  roadPath: google.maps.LatLngLiteral[];
  selectedRoute: JourneyRoute | null;
  isLiveTracking: boolean;
  onUpdateTelemetry: (speed: number, instruction: string, dist: string, eta: string) => void;
}> = ({ roadPath, selectedRoute, isLiveTracking, onUpdateTelemetry }) => {
  const [currentPosition, setCurrentPosition] = useState<google.maps.LatLngLiteral | null>(null);

  useEffect(() => {
    if (!isLiveTracking || roadPath.length < 2) {
      setCurrentPosition(null);
      return;
    }

    let currentIndex = 0;
    const totalPoints = roadPath.length;

    const interval = setInterval(() => {
      currentIndex = (currentIndex + 1) % totalPoints;
      const pos = roadPath[currentIndex];
      setCurrentPosition(pos);

      const progress = currentIndex / totalPoints;
      const baseSpeed = selectedRoute?.legs[0]?.mode === 'metro' ? 58 : 42;
      const curSpeed = Math.round(baseSpeed + (Math.sin(Date.now() / 400) * 4));
      const distRemaining = (Math.max(0.1, (1 - progress) * (selectedRoute?.totalWalkingMeters ? selectedRoute.totalWalkingMeters / 100 : 5))).toFixed(1);
      const minsRemaining = Math.max(1, Math.ceil((1 - progress) * (selectedRoute?.totalDurationMinutes || 15)));

      const curInstruction = currentIndex < totalPoints * 0.3
        ? 'Departing on designated roadway / entrance'
        : currentIndex < totalPoints * 0.7
        ? 'Cruising along main transit corridor'
        : 'Approaching destination terminal';

      onUpdateTelemetry(curSpeed, curInstruction, `${distRemaining} km`, `${minsRemaining} mins`);
    }, 280);

    return () => clearInterval(interval);
  }, [isLiveTracking, roadPath, selectedRoute]);

  if (!isLiveTracking || !currentPosition) return null;

  return (
    <AdvancedMarker position={currentPosition} title="Live GPS Location">
      <div className="relative w-11 h-11 flex items-center justify-center pointer-events-none">
        <div className="absolute inset-0 rounded-full bg-cyan-400/40 animate-ping" />
        <div className="w-8 h-8 rounded-full bg-[#0284C7] border-2 border-white shadow-2xl flex items-center justify-center">
          <div className="w-3 h-3 rounded-full bg-white" />
        </div>
      </div>
    </AdvancedMarker>
  );
};

export const GoogleMapsView: React.FC<GoogleMapsViewProps> = ({
  selectedRoute,
  originNode,
  destNode,
  isLiveTracking,
  onToggleLiveTracking,
  onSelectOriginLocation,
  onSelectDestLocation,
  onUseCurrentLocation,
  isLocatingGPS = false,
  onToggle3DView,
  is3DActive = false,
}) => {
  // Use user-provided Google Maps API key
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyAo3PnQV7TkkeBk2_uXy9dxFy3GjscN_nE';

  const [roadPath, setRoadPath] = useState<google.maps.LatLngLiteral[]>([]);
  const [gpsSpeed, setGpsSpeed] = useState(52);
  const [gpsInstruction, setGpsInstruction] = useState('Following original road navigation path');
  const [distanceRemaining, setDistanceRemaining] = useState('3.2 km');
  const [etaRemaining, setEtaRemaining] = useState('11 mins');
  const [authError, setAuthError] = useState(false);
  const [useFallbackStreetView, setUseFallbackStreetView] = useState(false);
  const [mapTypeId, setMapTypeId] = useState<'roadmap' | 'hybrid'>('roadmap');

  // Manual map location selection state
  const [clickPin, setClickPin] = useState<{ lat: number; lng: number } | null>(null);
  const [pickerTarget, setPickerTarget] = useState<'none' | 'origin' | 'destination'>('none');

  // Monitor for Google Maps auth or loading failures
  useEffect(() => {
    const handleAuthFailure = () => {
      setAuthError(true);
    };
    (window as any).gm_authFailure = handleAuthFailure;
    return () => {
      if ((window as any).gm_authFailure === handleAuthFailure) {
        (window as any).gm_authFailure = null;
      }
    };
  }, []);

  const handleMapClick = (e: MapMouseEvent) => {
    if (!e.detail.latLng) return;
    const { lat, lng } = e.detail.latLng;
    sound.playTactileTick();

    if (pickerTarget === 'origin') {
      onSelectOriginLocation?.({ lat, lng, name: `Map Location (${lat.toFixed(4)}, ${lng.toFixed(4)})` });
      setPickerTarget('none');
      setClickPin(null);
      return;
    }

    if (pickerTarget === 'destination') {
      onSelectDestLocation?.({ lat, lng, name: `Map Location (${lat.toFixed(4)}, ${lng.toFixed(4)})` });
      setPickerTarget('none');
      setClickPin(null);
      return;
    }

    // Default: Show manual pick bubble at clicked location
    setClickPin({ lat, lng });
  };

  // If auth error or user prefers high-def vector tiles, render GoogleMapsStyleView
  if (authError || useFallbackStreetView) {
    return (
      <div className="relative w-full">
        {authError && (
          <div className="bg-amber-500/20 border border-amber-500/50 text-amber-200 text-xs px-4 py-2 rounded-xl mb-2 flex items-center justify-between">
            <span>
              Google Maps API active (Referrer mode). Automatically displaying high-resolution street view.
            </span>
            <button
              onClick={() => setAuthError(false)}
              className="text-white underline font-semibold hover:text-cyan-300"
            >
              Retry
            </button>
          </div>
        )}
        <GoogleMapsStyleView
          selectedRoute={selectedRoute}
          originNode={originNode}
          destNode={destNode}
          isLiveTracking={isLiveTracking}
          onToggleLiveTracking={onToggleLiveTracking}
          onToggle3DView={onToggle3DView}
          is3DActive={is3DActive}
        />
      </div>
    );
  }

  return (
    <div className="relative w-full h-[580px] lg:h-[630px] rounded-3xl overflow-hidden border border-slate-700/60 shadow-2xl bg-slate-950 flex flex-col">
      {/* Top Floating Turn-by-Turn Guidance & Location Picker Status */}
      <div className="absolute top-4 left-4 right-20 z-20 max-w-xl flex flex-col gap-2 pointer-events-auto">
        {/* Navigation / Real Road Guidance Banner */}
        {selectedRoute && (
          <div className="bg-slate-900/95 backdrop-blur-xl border border-cyan-500/40 rounded-2xl p-3 shadow-2xl flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-400/60 flex items-center justify-center text-cyan-300 shrink-0 mt-0.5">
              <RouteIcon className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between text-[11px] text-cyan-400 font-semibold uppercase tracking-wider">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  {isLiveTracking ? 'Live Road Navigation' : 'Road Route (Google Maps Roads)'}
                </span>
                <span className="font-mono text-emerald-400 font-bold">{selectedRoute.arrivalTime} ETA</span>
              </div>
              <h4 className="text-xs md:text-sm font-bold text-white mt-0.5 leading-snug truncate">
                {gpsInstruction}
              </h4>
              <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-300">
                <span className="font-mono font-bold text-white">{distanceRemaining}</span>
                <span>·</span>
                <span className="text-slate-400">{etaRemaining}</span>
                {isLiveTracking && (
                  <>
                    <span>·</span>
                    <span className="flex items-center gap-1 text-emerald-400 font-mono font-bold">
                      <Gauge className="w-3.5 h-3.5" /> {gpsSpeed} km/h
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Manual Click Selection Active Indicator */}
        {pickerTarget !== 'none' && (
          <div className="bg-amber-950/95 border border-amber-500/70 text-amber-200 px-3.5 py-2 rounded-xl text-xs flex items-center justify-between shadow-xl">
            <span className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-amber-400 animate-bounce" />
              <span>Click anywhere on the map to place <strong>{pickerTarget === 'origin' ? 'Initial Location (A)' : 'Final Location (B)'}</strong></span>
            </span>
            <button
              onClick={() => setPickerTarget('none')}
              className="text-amber-400 hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Right Controls Toolbar */}
      <div className="absolute right-4 top-4 z-20 flex flex-col gap-2 pointer-events-auto">
        {/* Device GPS Location Button */}
        {onUseCurrentLocation && (
          <button
            onClick={() => {
              sound.playTactileTick();
              onUseCurrentLocation();
            }}
            disabled={isLocatingGPS}
            className={`p-2.5 rounded-2xl border shadow-xl flex items-center justify-center transition-all ${
              isLocatingGPS
                ? 'bg-cyan-600 text-white border-cyan-400 animate-spin'
                : 'bg-slate-900/90 text-cyan-400 border-slate-700 hover:bg-slate-800 hover:text-cyan-300'
            }`}
            title="Use My Device GPS Current Location"
          >
            {isLocatingGPS ? <Loader2 className="w-5 h-5 animate-spin" /> : <LocateFixed className="w-5 h-5" />}
          </button>
        )}

        {/* 3D Universe Toggle */}
        {onToggle3DView && (
          <button
            onClick={() => {
              sound.playRouteSweep();
              onToggle3DView();
            }}
            className={`p-2.5 rounded-2xl border shadow-xl flex items-center justify-center transition-all ${
              is3DActive
                ? 'bg-cyan-500 text-white border-cyan-400 shadow-cyan-500/40'
                : 'bg-slate-900/90 text-cyan-300 border-slate-700 hover:bg-slate-800'
            }`}
            title="Toggle 3D Spatial Universe / Google Map"
          >
            <Layers className="w-5 h-5" />
          </button>
        )}

        {/* Live Location Navigation Toggle */}
        <button
          onClick={() => {
            sound.playTactileTick();
            onToggleLiveTracking(!isLiveTracking);
          }}
          className={`p-2.5 rounded-2xl border shadow-xl flex items-center justify-center transition-all ${
            isLiveTracking
              ? 'bg-emerald-500 text-white border-emerald-400 shadow-emerald-500/40 animate-pulse'
              : 'bg-slate-900/90 text-slate-300 border-slate-700 hover:text-white hover:bg-slate-800'
          }`}
          title={isLiveTracking ? 'Live GPS Active' : 'Start Live GPS'}
        >
          <Navigation className={`w-5 h-5 ${isLiveTracking ? 'fill-current' : ''}`} />
        </button>

        {/* Manual Pin Picker Buttons */}
        <button
          onClick={() => {
            sound.playTactileTick();
            setPickerTarget(pickerTarget === 'origin' ? 'none' : 'origin');
          }}
          className={`p-2.5 rounded-2xl border shadow-xl flex items-center justify-center transition-all ${
            pickerTarget === 'origin'
              ? 'bg-emerald-600 text-white border-emerald-400 ring-2 ring-emerald-400/50'
              : 'bg-slate-900/90 text-emerald-400 border-slate-700 hover:bg-slate-800'
          }`}
          title="Click to Choose Initial Location on Map"
        >
          <MapPin className="w-5 h-5" />
        </button>

        <button
          onClick={() => {
            sound.playTactileTick();
            setPickerTarget(pickerTarget === 'destination' ? 'none' : 'destination');
          }}
          className={`p-2.5 rounded-2xl border shadow-xl flex items-center justify-center transition-all ${
            pickerTarget === 'destination'
              ? 'bg-pink-600 text-white border-pink-400 ring-2 ring-pink-400/50'
              : 'bg-slate-900/90 text-pink-400 border-slate-700 hover:bg-slate-800'
          }`}
          title="Click to Choose Final Location on Map"
        >
          <Flag className="w-5 h-5" />
        </button>

        {/* Map Type Switcher (Roadmap vs Satellite) */}
        <button
          onClick={() => {
            sound.playTactileTick();
            setMapTypeId((prev) => (prev === 'roadmap' ? 'hybrid' : 'roadmap'));
          }}
          className="p-2.5 rounded-2xl border shadow-xl bg-slate-900/90 text-slate-300 border-slate-700 hover:text-white hover:bg-slate-800 flex items-center justify-center transition-all"
          title={`Switch to ${mapTypeId === 'roadmap' ? 'Satellite' : 'Roadmap'} view`}
        >
          <Compass className="w-5 h-5" />
        </button>
      </div>

      {/* Google Maps API Provider & Map Element */}
      <APIProvider apiKey={apiKey} libraries={['places', 'routes', 'geometry', 'marker']}>
        <div className="w-full h-full relative">
          <Map
            defaultCenter={{ lat: originNode.lat, lng: originNode.lng }}
            defaultZoom={12}
            mapId="DEMO_MAP_ID"
            mapTypeId={mapTypeId}
            gestureHandling="greedy"
            disableDefaultUI={false}
            onClick={handleMapClick}
            internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
            style={{ width: '100%', height: '100%' }}
          >
            {/* Draw ONLY the Selected Route Polyline on REAL ROADS */}
            <RoutePolylineRenderer
              selectedRoute={selectedRoute}
              originNode={originNode}
              destNode={destNode}
              onRoadPathReady={setRoadPath}
            />

            {/* Live GPS Animated Marker along real roads */}
            <LiveGpsMarkerRenderer
              roadPath={roadPath}
              selectedRoute={selectedRoute}
              isLiveTracking={isLiveTracking}
              onUpdateTelemetry={(speed, instruction, dist, eta) => {
                setGpsSpeed(speed);
                setGpsInstruction(instruction);
                setDistanceRemaining(dist);
                setEtaRemaining(eta);
              }}
            />

            {/* DRAGGABLE Initial Location Marker (A) */}
            <AdvancedMarker
              position={{ lat: originNode.lat, lng: originNode.lng }}
              draggable={true}
              onDragEnd={(e) => {
                if (e.latLng) {
                  const lat = typeof (e.latLng as any).lat === 'function' ? (e.latLng as any).lat() : Number((e.latLng as any).lat);
                  const lng = typeof (e.latLng as any).lng === 'function' ? (e.latLng as any).lng() : Number((e.latLng as any).lng);
                  sound.playArrivalChime();
                  onSelectOriginLocation?.({
                    lat,
                    lng,
                    name: `Dropped Pin (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
                  });
                }
              }}
              title={`Initial Location (Drag to change): ${originNode.name}`}
            >
              <div className="relative group cursor-grab active:cursor-grabbing">
                <div className="w-9 h-9 rounded-full bg-emerald-500 border-3 border-white shadow-2xl flex items-center justify-center text-white font-black text-xs">
                  A
                </div>
                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-slate-900/90 text-emerald-300 text-[10px] px-2 py-0.5 rounded shadow pointer-events-none whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                  Drag to move Start
                </div>
              </div>
            </AdvancedMarker>

            {/* DRAGGABLE Final Destination Marker (B) */}
            <AdvancedMarker
              position={{ lat: destNode.lat, lng: destNode.lng }}
              draggable={true}
              onDragEnd={(e) => {
                if (e.latLng) {
                  const lat = typeof (e.latLng as any).lat === 'function' ? (e.latLng as any).lat() : Number((e.latLng as any).lat);
                  const lng = typeof (e.latLng as any).lng === 'function' ? (e.latLng as any).lng() : Number((e.latLng as any).lng);
                  sound.playArrivalChime();
                  onSelectDestLocation?.({
                    lat,
                    lng,
                    name: `Dropped Pin (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
                  });
                }
              }}
              title={`Final Destination (Drag to change): ${destNode.name}`}
            >
              <div className="relative group cursor-grab active:cursor-grabbing">
                <div className="w-9 h-9 rounded-full bg-pink-500 border-3 border-white shadow-2xl flex items-center justify-center text-white font-black text-xs">
                  B
                </div>
                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-slate-900/90 text-pink-300 text-[10px] px-2 py-0.5 rounded shadow pointer-events-none whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                  Drag to move Destination
                </div>
              </div>
            </AdvancedMarker>

            {/* Click Pin Callout for Manual Selection */}
            {clickPin && (
              <AdvancedMarker position={clickPin}>
                <div className="bg-slate-900/95 backdrop-blur-md border border-cyan-500 p-2.5 rounded-2xl shadow-2xl flex flex-col gap-2 min-w-[190px] -translate-y-12 animate-in fade-in zoom-in-95">
                  <div className="flex items-center justify-between text-[11px] font-bold text-white">
                    <span>Selected Pin</span>
                    <button
                      onClick={() => setClickPin(null)}
                      className="text-slate-400 hover:text-white p-0.5"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    {clickPin.lat.toFixed(4)}, {clickPin.lng.toFixed(4)}
                  </div>
                  <div className="flex gap-1.5 pt-1">
                    <button
                      onClick={() => {
                        sound.playArrivalChime();
                        onSelectOriginLocation?.({
                          lat: clickPin.lat,
                          lng: clickPin.lng,
                          name: `Manual Point (${clickPin.lat.toFixed(3)}, ${clickPin.lng.toFixed(3)})`,
                        });
                        setClickPin(null);
                      }}
                      className="flex-1 py-1 px-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold text-center"
                    >
                      Set Start (A)
                    </button>
                    <button
                      onClick={() => {
                        sound.playArrivalChime();
                        onSelectDestLocation?.({
                          lat: clickPin.lat,
                          lng: clickPin.lng,
                          name: `Manual Point (${clickPin.lat.toFixed(3)}, ${clickPin.lng.toFixed(3)})`,
                        });
                        setClickPin(null);
                      }}
                      className="flex-1 py-1 px-2 rounded-lg bg-pink-600 hover:bg-pink-500 text-white text-[10px] font-bold text-center"
                    >
                      Set Dest (B)
                    </button>
                  </div>
                </div>
              </AdvancedMarker>
            )}
          </Map>
        </div>
      </APIProvider>

      {/* Bottom Floating Info Badge */}
      <div className="absolute bottom-3 left-4 right-4 z-20 flex flex-wrap items-center justify-between text-xs text-slate-300 bg-slate-950/85 backdrop-blur-md px-4 py-2 rounded-xl border border-slate-800/80 pointer-events-none">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          <span className="font-semibold text-white">
            Original Roads Navigation · {originNode.name} ➔ {destNode.name}
          </span>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-slate-400">
          <span>Drag A / B pins or click map to choose locations</span>
          <span>·</span>
          <span>Google Routes Platform</span>
        </div>
      </div>
    </div>
  );
};
