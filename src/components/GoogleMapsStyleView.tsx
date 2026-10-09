import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { JourneyRoute, TransitNode, LiveGPSState } from '../types/wayora';
import { sound } from '../services/soundService';
import { fetchRoadCoordinates } from '../services/roadGeometryService';
import { Navigation, Compass, Crosshair, ZoomIn, ZoomOut, Maximize2, Shield, AlertTriangle, ArrowUpRight, Gauge, Play, Pause, Layers } from 'lucide-react';

interface GoogleMapsStyleViewProps {
  selectedRoute: JourneyRoute | null;
  originNode: TransitNode;
  destNode: TransitNode;
  isLiveTracking: boolean;
  onToggleLiveTracking: (active: boolean) => void;
  onSelectNode?: (nodeId: string) => void;
  onToggle3DView?: () => void;
  is3DActive?: boolean;
}

export const GoogleMapsStyleView: React.FC<GoogleMapsStyleViewProps> = ({
  selectedRoute,
  originNode,
  destNode,
  isLiveTracking,
  onToggleLiveTracking,
  onSelectNode,
  onToggle3DView,
  is3DActive = false,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const routeLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const liveLocationMarkerRef = useRef<L.Marker | null>(null);

  // Live Location & Simulation State
  const [gpsSpeed, setGpsSpeed] = useState(48);
  const [gpsInstruction, setGpsInstruction] = useState('Head northeast towards station concourse');
  const [distanceRemaining, setDistanceRemaining] = useState('2.4 km');
  const [etaRemaining, setEtaRemaining] = useState('8 mins');
  const animFrameRef = useRef<any>(null);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Default center: Rajiv Chowk / Delhi NCR [28.6328, 77.2197]
      const map = L.map(mapContainerRef.current, {
        center: [originNode.lat, originNode.lng],
        zoom: 12,
        zoomControl: false,
      });

      // CartoDB Dark Matter / Voyager high-performance tiles
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 19,
      }).addTo(map);

      const routeGroup = L.layerGroup().addTo(map);
      routeLayerGroupRef.current = routeGroup;
      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Render ONLY the Selected Route on the Map
  useEffect(() => {
    const map = mapInstanceRef.current;
    const routeGroup = routeLayerGroupRef.current;
    if (!map || !routeGroup) return;

    routeGroup.clearLayers();

    if (!selectedRoute || selectedRoute.legs.length === 0) {
      // If no route, just show origin and destination pins
      const origMarker = L.circleMarker([originNode.lat, originNode.lng], {
        radius: 9,
        fillColor: '#10B981',
        color: '#FFFFFF',
        weight: 3,
        fillOpacity: 1,
      }).bindPopup(`<b>Origin: ${originNode.name}</b><br/>${originNode.zone}`);
      routeGroup.addLayer(origMarker);

      const destMarker = L.circleMarker([destNode.lat, destNode.lng], {
        radius: 9,
        fillColor: '#EC4899',
        color: '#FFFFFF',
        weight: 3,
        fillOpacity: 1,
      }).bindPopup(`<b>Destination: ${destNode.name}</b><br/>${destNode.zone}`);
      routeGroup.addLayer(destMarker);

      map.fitBounds([
        [originNode.lat, originNode.lng],
        [destNode.lat, destNode.lng],
      ], { padding: [60, 60], maxZoom: 14 });
      return;
    }

    // Collect all lat/lng points exclusively for the SELECTED route
    const stationsInRoute: TransitNode[] = [];
    selectedRoute.legs.forEach((leg) => {
      if (!stationsInRoute.some((s) => s.id === leg.fromNode.id)) {
        stationsInRoute.push(leg.fromNode);
      }
      if (!stationsInRoute.some((s) => s.id === leg.toNode.id)) {
        stationsInRoute.push(leg.toNode);
      }
    });

    const waypoints = [
      { lat: originNode.lat, lng: originNode.lng },
      { lat: destNode.lat, lng: destNode.lng },
    ];

    // Fetch real road coordinates
    fetchRoadCoordinates(waypoints[0], waypoints[1], 'DRIVE').then((roadCoords) => {
      if (!mapInstanceRef.current || !routeLayerGroupRef.current) return;
      const roadLatLngs: [number, number][] = roadCoords.map((pt) => [pt.lat, pt.lng]);

      // 1. Draw glowing background shadow line
      const shadowPolyline = L.polyline(roadLatLngs, {
        color: '#0284C7',
        weight: 12,
        opacity: 0.35,
        lineCap: 'round',
        lineJoin: 'round',
      });
      routeGroup.addLayer(shadowPolyline);

      // 2. Draw primary route polyline on real roads
      const primaryColor = selectedRoute.legs[0]?.lineColor || '#0284C7';
      const mainPolyline = L.polyline(roadLatLngs, {
        color: primaryColor,
        weight: 5,
        opacity: 0.95,
        lineCap: 'round',
        lineJoin: 'round',
      });
      routeGroup.addLayer(mainPolyline);

      map.fitBounds(roadLatLngs, { padding: [60, 60], maxZoom: 15 });
    });

    // 3. Render Station Markers ONLY for this selected route
    stationsInRoute.forEach((node, idx) => {
      const isOrigin = node.id === originNode.id;
      const isDest = node.id === destNode.id;
      const isInterchange = !isOrigin && !isDest;

      // Custom HTML pin icon
      const pinHtml = `
        <div style="
          width: ${isOrigin || isDest ? '28px' : '20px'};
          height: ${isOrigin || isDest ? '28px' : '20px'};
          background-color: ${isOrigin ? '#10B981' : isDest ? '#EC4899' : '#0284C7'};
          border: 3px solid #FFFFFF;
          border-radius: 50%;
          box-shadow: 0 4px 12px rgba(0,0,0,0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: 11px;
        ">
          ${isOrigin ? 'A' : isDest ? 'B' : ''}
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'custom-station-pin',
        html: pinHtml,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      const marker = L.marker([node.lat, node.lng], { icon: customIcon })
        .bindPopup(`
          <div style="font-family: sans-serif; padding: 4px;">
            <strong style="color: #0f172a; font-size: 13px;">${node.name}</strong><br/>
            ${node.hindiName ? `<span style="color: #64748b; font-size: 11px;">${node.hindiName}</span><br/>` : ''}
            <span style="font-size: 11px; color: #0284c7;">${isOrigin ? 'Departure Station' : isDest ? 'Final Destination' : 'Interchange Transfer'}</span><br/>
            <span style="font-size: 10px; color: #475569;">Lift Access: ${node.hasElevator ? 'Verified' : 'Stairs'} · CISF: ${node.isStaffedNight ? '24/7' : 'Standard'}</span>
          </div>
        `);

      routeGroup.addLayer(marker);
    });

    // Update Turn Prompt
    if (selectedRoute.legs.length > 0) {
      setGpsInstruction(selectedRoute.legs[0].instructions);
      setDistanceRemaining(`${(selectedRoute.legs[0].distanceMeters / 1000).toFixed(1)} km`);
      setEtaRemaining(`${selectedRoute.legs[0].durationMinutes} mins`);
    }
  }, [selectedRoute, originNode, destNode]);

  // Live Location Tracker Marker Animation on the Map
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !selectedRoute || selectedRoute.legs.length === 0) return;

    if (!isLiveTracking) {
      if (liveLocationMarkerRef.current) {
        liveLocationMarkerRef.current.remove();
        liveLocationMarkerRef.current = null;
      }
      return;
    }

    // Google Maps-style Blue GPS dot with pulsing halo
    const liveIconHtml = `
      <div style="position: relative; width: 36px; height: 36px;">
        <div style="
          position: absolute;
          inset: 0;
          border-radius: 50%;
          background: rgba(14, 165, 233, 0.35);
          animation: pulse 1.6s ease-in-out infinite;
        "></div>
        <div style="
          position: absolute;
          top: 6px;
          left: 6px;
          width: 24px;
          height: 24px;
          background: #0284C7;
          border: 3px solid #FFFFFF;
          border-radius: 50%;
          box-shadow: 0 4px 10px rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <div style="width: 6px; height: 6px; background: white; border-radius: 50%;"></div>
        </div>
      </div>
    `;

    const liveIcon = L.divIcon({
      className: 'live-gps-dot',
      html: liveIconHtml,
      iconSize: [36, 36],
      iconAnchor: [18, 18],
    });

    const startPos: [number, number] = [selectedRoute.legs[0].fromNode.lat, selectedRoute.legs[0].fromNode.lng];
    const marker = L.marker(startPos, { icon: liveIcon, zIndexOffset: 1000 }).addTo(map);
    liveLocationMarkerRef.current = marker;

    // Smoothly animate along the route coordinates
    let progress = 0;
    const legs = selectedRoute.legs;
    const totalLegs = legs.length;

    const interval = setInterval(() => {
      progress = (progress + 0.02) % 1.0;
      const legIndex = Math.min(totalLegs - 1, Math.floor(progress * totalLegs));
      const leg = legs[legIndex];

      const fromLat = leg.fromNode.lat;
      const fromLng = leg.fromNode.lng;
      const toLat = leg.toNode.lat;
      const toLng = leg.toNode.lng;

      const frac = (progress * totalLegs) - legIndex;
      const curLat = fromLat + (toLat - fromLat) * frac;
      const curLng = fromLng + (toLng - fromLng) * frac;

      marker.setLatLng([curLat, curLng]);

      const baseSpeed = leg.mode === 'metro' ? 56 : leg.mode === 'rail' ? 82 : leg.mode === 'feeder' ? 26 : 5;
      setGpsSpeed(Math.round(baseSpeed + (Math.sin(Date.now() / 600) * 3)));
      setGpsInstruction(leg.instructions);
    }, 400);

    return () => {
      clearInterval(interval);
      if (liveLocationMarkerRef.current) {
        liveLocationMarkerRef.current.remove();
        liveLocationMarkerRef.current = null;
      }
    };
  }, [isLiveTracking, selectedRoute]);

  // Recenter Map on Live Position or Route
  const handleRecenter = () => {
    sound.playTactileTick();
    const map = mapInstanceRef.current;
    if (!map) return;

    if (liveLocationMarkerRef.current) {
      map.panTo(liveLocationMarkerRef.current.getLatLng(), { animate: true });
    } else if (selectedRoute) {
      const latLngs = selectedRoute.legs.map((l) => [l.fromNode.lat, l.fromNode.lng] as [number, number]);
      map.fitBounds(L.latLngBounds(latLngs), { padding: [80, 80], animate: true });
    } else {
      map.setView([originNode.lat, originNode.lng], 13, { animate: true });
    }
  };

  return (
    <div className="relative w-full h-[580px] lg:h-[620px] rounded-3xl overflow-hidden border border-slate-700/60 shadow-2xl bg-slate-950 flex flex-col">
      {/* Google Maps-style Top Floating Turn-by-Turn Guidance Banner */}
      {selectedRoute && (
        <div className="absolute top-4 left-4 right-16 z-[1000] max-w-lg bg-slate-900/95 backdrop-blur-xl border border-cyan-500/40 rounded-2xl p-3.5 shadow-2xl flex items-start gap-3 pointer-events-auto">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-400/60 flex items-center justify-center text-cyan-300 shrink-0 mt-0.5">
            <ArrowUpRight className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between text-[11px] text-cyan-400 font-semibold uppercase tracking-wider">
              <span>{isLiveTracking ? 'Live GPS Guidance' : 'Route Navigation'}</span>
              <span className="font-mono text-emerald-400">{selectedRoute.arrivalTime} ETA</span>
            </div>
            <h4 className="text-xs md:text-sm font-bold text-white mt-0.5 leading-snug truncate">
              {gpsInstruction}
            </h4>
            <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-300">
              <span className="font-mono font-bold text-white">{distanceRemaining} left</span>
              <span>·</span>
              <span className="text-slate-400">{etaRemaining}</span>
              {isLiveTracking && (
                <>
                  <span>·</span>
                  <span className="flex items-center gap-1 text-emerald-400 font-mono font-bold">
                    <Gauge className="w-3 h-3" /> {gpsSpeed} km/h
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Google Maps Right Toolbar Controls (Zoom, Recenter, 3D Toggle) */}
      <div className="absolute right-4 top-4 z-[1000] flex flex-col gap-2 pointer-events-auto">
        {/* Toggle 3D Spatial Universe / 2D Map */}
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
            title="Toggle between Google Maps street view and 3D Spatial Universe"
          >
            <Layers className="w-5 h-5" />
          </button>
        )}

        {/* Live Location Toggle Button */}
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
          title={isLiveTracking ? 'Live Location Tracking Active' : 'Start Live Location Tracking'}
        >
          <Navigation className={`w-5 h-5 ${isLiveTracking ? 'fill-current' : ''}`} />
        </button>

        {/* Recenter Crosshair Button */}
        <button
          onClick={handleRecenter}
          className="p-2.5 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-slate-200 shadow-xl flex items-center justify-center transition-all"
          title="Recenter Map on Route"
        >
          <Crosshair className="w-5 h-5" />
        </button>

        {/* Zoom In */}
        <button
          onClick={() => {
            mapInstanceRef.current?.zoomIn();
            sound.playTactileTick();
          }}
          className="p-2.5 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-slate-200 shadow-xl flex items-center justify-center transition-all"
          title="Zoom In"
        >
          <ZoomIn className="w-5 h-5" />
        </button>

        {/* Zoom Out */}
        <button
          onClick={() => {
            mapInstanceRef.current?.zoomOut();
            sound.playTactileTick();
          }}
          className="p-2.5 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-slate-200 shadow-xl flex items-center justify-center transition-all"
          title="Zoom Out"
        >
          <ZoomOut className="w-5 h-5" />
        </button>
      </div>

      {/* Leaflet Map DOM Element */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Bottom Floating Map Information Pill */}
      <div className="absolute bottom-3 left-4 right-4 z-[1000] flex flex-wrap items-center justify-between text-xs text-slate-300 bg-slate-950/85 backdrop-blur-md px-4 py-2 rounded-xl border border-slate-800/80 pointer-events-none">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          <span className="font-semibold text-white">
            Showing Selected Route: {selectedRoute ? selectedRoute.title : `${originNode.name} → ${destNode.name}`}
          </span>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-slate-400">
          <span>{isLiveTracking ? 'Real-time GPS Tracking Active' : 'Select a route below to preview'}</span>
          <span>·</span>
          <span>© OpenStreetMap / CartoDB</span>
        </div>
      </div>
    </div>
  );
};
