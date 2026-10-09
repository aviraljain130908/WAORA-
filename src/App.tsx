import React, { useState, useEffect, useRef } from 'react';
import { WayoraHeader } from './components/WayoraHeader';
import { GoogleMapsView } from './components/GoogleMapsView';
import { GoogleMapsStyleView } from './components/GoogleMapsStyleView';
import { GoogleMapsRouteDrawer } from './components/GoogleMapsRouteDrawer';
import { ThreeMobilityUniverse } from './components/ThreeMobilityUniverse';
import { JourneyTimeline } from './components/JourneyTimeline';
import { DemoScenarioController } from './components/DemoScenarioController';
import { AuraAssistantModal } from './components/AuraAssistantModal';
import { DisruptionManager } from './components/DisruptionManager';
import { EmergencyAssistanceModal } from './components/EmergencyAssistanceModal';
import { JourneyShareModal } from './components/JourneyShareModal';
import { SoundSettingsModal } from './components/SoundSettingsModal';
import { LiveGPSTracker } from './components/LiveGPSTracker';

import { JourneyRoute, RoutePreference, WeatherCondition, DisruptionAlert, AuraState, CommunityReport, IndianCity, TransitNode } from './types/wayora';
import { INITIAL_DISRUPTIONS, INITIAL_WEATHER, TRANSIT_NODES, INDIAN_CITIES_CONFIG } from './data/transitNetwork';
import { planRoutes, rerouteAfterDisruption } from './services/routingEngine';
import { sound } from './services/soundService';
import { Navigation, MapPin, ArrowLeftRight, Sparkles, CloudRain, Sun, Shield, Layers, Zap, LocateFixed, Loader2, X, Flag } from 'lucide-react';

export default function App() {
  const [activeSection, setActiveSection] = useState('planner');
  const plannerRef = useRef<HTMLDivElement>(null);

  // Indian City Region State
  const [currentCity, setCurrentCity] = useState<IndianCity>('delhi_ncr');

  // Search & Routing State
  const [originId, setOriginId] = useState('DEL-01'); // Rajiv Chowk
  const [destinationId, setDestinationId] = useState('DEL-03'); // Cyber City Gurgaon
  const [customOrigin, setCustomOrigin] = useState<TransitNode | null>(null);
  const [customDest, setCustomDest] = useState<TransitNode | null>(null);
  const [isLocatingGPS, setIsLocatingGPS] = useState(false);
  const [gpsNotice, setGpsNotice] = useState<string | null>(null);

  const [preference, setPreference] = useState<RoutePreference>('fastest');
  const [maxBudget, setMaxBudget] = useState(60);
  const [maxWalkDistance, setMaxWalkDistance] = useState(500);
  const [isNightTravel, setIsNightTravel] = useState(false);
  const [weather, setWeather] = useState<WeatherCondition>(INITIAL_WEATHER);
  const [disruptions, setDisruptions] = useState<DisruptionAlert[]>(INITIAL_DISRUPTIONS);

  // Calculated Routes
  const [routes, setRoutes] = useState<JourneyRoute[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<JourneyRoute | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRerouting, setIsRerouting] = useState(false);

  // Live GPS Tracking & 3D Mode State
  const [isLiveTracking, setIsLiveTracking] = useState(true);
  const [is3DActive, setIs3DActive] = useState(false);
  const [isLiveGPSCockpitOpen, setIsLiveGPSCockpitOpen] = useState(false);

  // Aura AI Companion State
  const [auraState, setAuraState] = useState<AuraState>('idle');
  const [isAuraOpen, setIsAuraOpen] = useState(false);

  // Modals
  const [isDisruptionsOpen, setIsDisruptionsOpen] = useState(false);
  const [isSOSOpen, setIsSOSOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isSoundOpen, setIsSoundOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  // Demo Sequence Step
  const [demoStep, setDemoStep] = useState(1);

  // Helper nodes
  const originNode = customOrigin || (TRANSIT_NODES.find((n) => n.id === originId) || TRANSIT_NODES[0]);
  const destNode = customDest || (TRANSIT_NODES.find((n) => n.id === destinationId) || TRANSIT_NODES[2]);
  const cityFilteredNodes = TRANSIT_NODES.filter((n) => n.city === currentCity);

  // Compute routes
  const computeRoutes = (
    orig: string | TransitNode = originNode,
    dest: string | TransitNode = destNode,
    pref = preference,
    budget = maxBudget,
    walk = maxWalkDistance,
    w = weather
  ) => {
    setIsLoading(true);
    const calculated = planRoutes(orig, dest, {
      preference: pref,
      maxBudget: budget,
      maxWalkingMeters: walk,
      isNightTravel,
      weather: w,
    });
    setRoutes(calculated);
    if (calculated.length > 0) {
      setSelectedRoute(calculated[0]);
    } else {
      setSelectedRoute(null);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    computeRoutes(originNode, destNode);
  }, [originId, destinationId, preference, maxBudget, maxWalkDistance, isNightTravel, weather, customOrigin, customDest]);

  // Handle device GPS current location
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setGpsNotice('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocatingGPS(true);
    setGpsNotice('Acquiring precise GPS location from device...');
    sound.playTactileTick();

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const accuracy = Math.round(pos.coords.accuracy || 10);

        const userNode: TransitNode = {
          id: `GPS-${Date.now()}`,
          name: 'My Current Location (मेरा स्थान)',
          hindiName: 'मेरा वर्तमान स्थान',
          code: 'MY-GPS',
          city: currentCity,
          x: 500,
          y: 500,
          lat,
          lng,
          type: 'landmark',
          lines: ['ROAD-LINK', 'EV-AUTO-FEEDER'],
          hasElevator: true,
          hasCCTV: true,
          isStaffedNight: true,
          crowdingLevel: 'low',
          aqi: 65,
          zone: `Device GPS (Accuracy: ±${accuracy}m)`,
        };

        setCustomOrigin(userNode);
        setIsLocatingGPS(false);
        setGpsNotice(`GPS Locked: ${lat.toFixed(4)}, ${lng.toFixed(4)} (±${accuracy}m)`);
        sound.playArrivalChime();
        computeRoutes(userNode, destNode);
        setTimeout(() => setGpsNotice(null), 4000);
      },
      (err) => {
        setIsLocatingGPS(false);
        setGpsNotice(`GPS unavailable (${err.message}). You can click anywhere on the map to set Start.`);
        sound.playDisruptionAlert();
        setTimeout(() => setGpsNotice(null), 4500);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );
  };

  // Handle manual selection on map
  const handleSelectOriginLocation = (loc: { lat: number; lng: number; name?: string }) => {
    const newNode: TransitNode = {
      id: `MANUAL-START-${Date.now()}`,
      name: loc.name || `Custom Start (${loc.lat.toFixed(4)}, ${loc.lng.toFixed(4)})`,
      hindiName: 'प्रारंभिक बिंदु',
      code: 'START-A',
      city: currentCity,
      x: 500,
      y: 500,
      lat: loc.lat,
      lng: loc.lng,
      type: 'landmark',
      lines: ['ROAD-LINK'],
      hasElevator: true,
      hasCCTV: true,
      isStaffedNight: true,
      crowdingLevel: 'low',
      aqi: 70,
      zone: 'Manual Map Pin',
    };
    setCustomOrigin(newNode);
    sound.playArrivalChime();
    computeRoutes(newNode, destNode);
  };

  const handleSelectDestLocation = (loc: { lat: number; lng: number; name?: string }) => {
    const newNode: TransitNode = {
      id: `MANUAL-DEST-${Date.now()}`,
      name: loc.name || `Custom Destination (${loc.lat.toFixed(4)}, ${loc.lng.toFixed(4)})`,
      hindiName: 'गंतव्य बिंदु',
      code: 'DEST-B',
      city: currentCity,
      x: 500,
      y: 500,
      lat: loc.lat,
      lng: loc.lng,
      type: 'landmark',
      lines: ['ROAD-LINK'],
      hasElevator: true,
      hasCCTV: true,
      isStaffedNight: true,
      crowdingLevel: 'low',
      aqi: 70,
      zone: 'Manual Map Pin',
    };
    setCustomDest(newNode);
    sound.playArrivalChime();
    computeRoutes(originNode, newNode);
  };

  const handleSwap = () => {
    sound.playTactileTick();
    const tempOrigin = customOrigin;
    const tempDest = customDest;
    const tempOriginId = originId;
    const tempDestId = destinationId;

    setCustomOrigin(tempDest);
    setCustomDest(tempOrigin);
    setOriginId(tempDestId);
    setDestinationId(tempOriginId);
  };

  const handleMissedConnection = (stationId: string) => {
    if (!selectedRoute) return;
    setIsRerouting(true);
    sound.playDisruptionAlert();

    setTimeout(() => {
      const recovered = rerouteAfterDisruption(
        selectedRoute,
        stationId,
        destinationId,
        'Missed scheduled interchange transfer at platform'
      );
      setSelectedRoute(recovered);
      setRoutes((prev) => [recovered, ...prev]);
      setIsRerouting(false);
      sound.playArrivalChime();
    }, 600);
  };

  const handleToggleWeather = () => {
    if (weather.condition === 'clear') {
      const rainyWeather: WeatherCondition = {
        condition: 'monsoon_downpour',
        temperatureC: 22,
        precipitationProbability: 95,
        humidityPercent: 88,
        windSpeedKmh: 32,
        aqiLevel: 35,
        advisory: 'Heavy monsoon downpour active. Underground Metro Yellow & Blue lines prioritized.',
        isSimulatedScenario: true,
      };
      setWeather(rainyWeather);
      setPreference('weather_aware');
    } else {
      setWeather(INITIAL_WEATHER);
      setPreference('fastest');
    }
  };

  const handleRunDemoStep = (step: number) => {
    setDemoStep(step);
    switch (step) {
      case 1:
        setOriginId('DEL-01');
        setDestinationId('DEL-03');
        setPreference('fastest');
        setMaxBudget(60);
        setWeather(INITIAL_WEATHER);
        break;
      case 2:
        computeRoutes('DEL-01', 'DEL-03', 'fastest');
        sound.playRouteSweep();
        break;
      case 3:
        break;
      case 4:
        setMaxBudget(35);
        setPreference('cheapest');
        break;
      case 5:
        setIsAuraOpen(true);
        break;
      case 6:
        handleToggleWeather();
        break;
      case 7:
        handleMissedConnection('DEL-01');
        break;
      case 8:
        sound.playArrivalChime();
        setIsLiveGPSCockpitOpen(true);
        break;
      default:
        break;
    }
  };

  const handleResetDemo = () => {
    setOriginId('DEL-01');
    setDestinationId('DEL-03');
    setPreference('fastest');
    setMaxBudget(60);
    setMaxWalkDistance(500);
    setIsNightTravel(false);
    setWeather(INITIAL_WEATHER);
    setDisruptions(INITIAL_DISRUPTIONS);
    setDemoStep(1);
    computeRoutes('DEL-01', 'DEL-03', 'fastest', 60, 500, INITIAL_WEATHER);
  };

  const handleAddCommunityReport = (report: Partial<CommunityReport>) => {
    const newDisruption: DisruptionAlert = {
      id: `dis-${Date.now()}`,
      lineId: report.lineId || 'DMRC-YELLOW',
      lineName: 'Delhi Metro Yellow Line',
      title: `Passenger Report: ${report.issueType?.replace('_', ' ').toUpperCase()}`,
      description: report.description || 'Reported variance',
      severity: 'medium',
      affectedNodes: [report.stationId || 'DEL-01'],
      verificationStatus: 'community_corroborated',
      corroborationCount: 1,
      reportedAt: 'Just now',
      isSimulated: false,
    };
    setDisruptions((prev) => [newDisruption, ...prev]);
  };

  return (
    <div className="min-h-screen bg-[#050B14] text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Top Header */}
      <WayoraHeader
        onOpenAura={() => setIsAuraOpen(true)}
        onOpenDisruptions={() => setIsDisruptionsOpen(true)}
        onOpenSOS={() => setIsSOSOpen(true)}
        onOpenShare={() => setIsShareOpen(true)}
        onOpenSoundSettings={() => setIsSoundOpen(true)}
        isMuted={isMuted}
        onMuteToggle={(val) => {
          setIsMuted(val);
          sound.setMuted(val);
        }}
        activeSection={activeSection}
        onNavigateSection={(sec) => setActiveSection(sec)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl mx-auto px-3 sm:px-6 py-4 w-full flex flex-col gap-5">
        {/* Simplified Google Maps-style Top Floating Search & Location Bar */}
        <div className="bg-[#071324]/90 backdrop-blur-xl border border-cyan-900/50 rounded-2xl p-4 shadow-xl flex flex-col gap-3">
          {/* Indian City & Fast Suggestions */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" /> Metro Region:
              </span>
              <div className="flex flex-wrap gap-1">
                {INDIAN_CITIES_CONFIG.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      sound.playTactileTick();
                      setCurrentCity(c.id);
                      setOriginId(c.defaultOrigin);
                      setDestinationId(c.defaultDest);
                    }}
                    className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                      currentCity === c.id
                        ? 'bg-cyan-500 text-white shadow-sm shadow-cyan-500/40'
                        : 'bg-slate-900 text-slate-400 hover:text-white'
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>

            {/* 3D Universe & Live GPS quick triggers */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  sound.playRouteSweep();
                  setIs3DActive(!is3DActive);
                }}
                className={`px-3 py-1 text-xs font-bold rounded-lg border flex items-center gap-1.5 transition-all shadow-sm ${
                  is3DActive
                    ? 'bg-cyan-500 text-white border-cyan-400 shadow-cyan-500/40'
                    : 'bg-slate-900 border-slate-800 text-cyan-300 hover:bg-slate-850 hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>{is3DActive ? '2D Google Map' : '3D Spatial Universe'}</span>
              </button>

              <button
                onClick={handleToggleWeather}
                className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white flex items-center gap-1 transition-colors"
              >
                {weather.condition.includes('rain') ? <CloudRain className="w-3.5 h-3.5 text-sky-400" /> : <Sun className="w-3.5 h-3.5 text-amber-400" />}
                <span>{weather.condition.includes('rain') ? 'Monsoon' : 'Clear'}</span>
              </button>

              <button
                onClick={() => setIsLiveGPSCockpitOpen(true)}
                className="px-3 py-1 text-xs font-bold rounded-lg bg-emerald-950 border border-emerald-500/50 text-emerald-300 hover:bg-emerald-900 flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <Navigation className="w-3.5 h-3.5 fill-current text-emerald-400" />
                <span>GPS Cockpit</span>
              </button>
            </div>
          </div>

          {/* Quick Indian Route Suggestions (1-Click Shortcuts) */}
          <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none text-xs">
            <span className="text-[10px] uppercase font-bold text-slate-400 shrink-0 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-cyan-400" /> Top Indian Routes:
            </span>
            {[
              {
                label: 'Rajiv Chowk ➔ Cyber City',
                city: 'delhi_ncr' as IndianCity,
                orig: 'DEL-01',
                dest: 'DEL-03',
                badge: 'DMRC Yellow Line',
              },
              {
                label: 'IGI Airport T3 ➔ Connaught Place',
                city: 'delhi_ncr' as IndianCity,
                orig: 'DEL-02',
                dest: 'DEL-01',
                badge: 'Airport Express',
              },
              {
                label: 'Noida Sec 62 ➔ Kashmere Gate',
                city: 'delhi_ncr' as IndianCity,
                orig: 'DEL-04',
                dest: 'DEL-05',
                badge: 'Blue + Red Line',
              },
              {
                label: 'CST ➔ Bandra-Kurla (BKC)',
                city: 'mumbai' as IndianCity,
                orig: 'BOM-01',
                dest: 'BOM-02',
                badge: 'Mumbai Local + Feeder',
              },
              {
                label: 'MG Road ➔ Whitefield ITPL',
                city: 'bengaluru' as IndianCity,
                orig: 'BLR-01',
                dest: 'BLR-03',
                badge: 'Namma Metro Purple',
              },
              {
                label: 'Hitec City ➔ Secunderabad',
                city: 'hyderabad' as IndianCity,
                orig: 'HYD-01',
                dest: 'HYD-03',
                badge: 'Hyderabad Metro Blue',
              },
            ].map((sug, idx) => (
              <button
                key={`sug-${idx}`}
                onClick={() => {
                  sound.playRouteSweep();
                  setCurrentCity(sug.city);
                  setOriginId(sug.orig);
                  setDestinationId(sug.dest);
                  computeRoutes(sug.orig, sug.dest);
                }}
                className={`px-3 py-1.5 rounded-xl border text-[11px] font-semibold whitespace-nowrap shrink-0 transition-all flex items-center gap-1.5 ${
                  originId === sug.orig && destinationId === sug.dest
                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 shadow-sm shadow-cyan-500/30 ring-1 ring-cyan-400'
                    : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
                }`}
              >
                <span>{sug.label}</span>
                <span className="text-[9px] px-1 py-0.2 rounded bg-slate-800 text-cyan-300 border border-slate-700">
                  {sug.badge}
                </span>
              </button>
            ))}
          </div>

          {/* GPS Status Toast Notice */}
          {gpsNotice && (
            <div className="bg-cyan-950/90 border border-cyan-400 text-cyan-200 px-3.5 py-2 rounded-xl text-xs flex items-center justify-between shadow-xl animate-in fade-in">
              <span className="flex items-center gap-2">
                <LocateFixed className="w-4 h-4 text-cyan-300 animate-pulse" />
                <span>{gpsNotice}</span>
              </span>
              <button onClick={() => setGpsNotice(null)} className="text-cyan-400 hover:text-white">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* From / To Search Input Controls with Device GPS & Map Pickers */}
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr_auto] items-center gap-2">
            {/* Origin (From) Input */}
            <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-700/80 rounded-xl px-3 py-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] uppercase font-bold text-slate-400 block">From (शुरुआत)</span>
                  {customOrigin && (
                    <button
                      onClick={() => setCustomOrigin(null)}
                      className="text-[9px] text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-0.5"
                    >
                      <X className="w-2.5 h-2.5" /> Reset to Station
                    </button>
                  )}
                </div>

                {customOrigin ? (
                  <div className="flex items-center justify-between gap-1 text-xs font-semibold text-emerald-300 truncate">
                    <span className="truncate">{customOrigin.name}</span>
                    <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 shrink-0">
                      GPS / Map Pin
                    </span>
                  </div>
                ) : (
                  <select
                    value={originId}
                    onChange={(e) => {
                      setOriginId(e.target.value);
                      sound.playTactileTick();
                    }}
                    className="w-full bg-transparent text-xs font-semibold text-white outline-none cursor-pointer truncate"
                  >
                    {cityFilteredNodes.map((n) => (
                      <option key={`from-${n.id}`} value={n.id} className="bg-slate-900">
                        {n.name} {n.hindiName ? `(${n.hindiName})` : ''}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* 1-Click Device GPS Location Button */}
              <button
                onClick={handleUseCurrentLocation}
                disabled={isLocatingGPS}
                className={`p-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1 border shrink-0 ${
                  customOrigin?.id.startsWith('GPS')
                    ? 'bg-emerald-500 text-white border-emerald-400 shadow-sm shadow-emerald-500/40'
                    : 'bg-slate-800 hover:bg-slate-750 text-cyan-300 border-slate-700 hover:text-white'
                }`}
                title="Use My Real Device GPS Location (वर्तमान स्थान)"
              >
                {isLocatingGPS ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-300" />
                ) : (
                  <LocateFixed className="w-3.5 h-3.5" />
                )}
                <span className="hidden sm:inline text-[10px]">GPS</span>
              </button>
            </div>

            {/* Swap Button */}
            <button
              onClick={handleSwap}
              className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-cyan-300 hover:rotate-180 transition-all self-center"
              title="Swap From and To"
            >
              <ArrowLeftRight className="w-4 h-4" />
            </button>

            {/* Destination (To) Input */}
            <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-700/80 rounded-xl px-3 py-2">
              <span className="w-2.5 h-2.5 rounded-full bg-pink-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] uppercase font-bold text-slate-400 block">To (गंतव्य)</span>
                  {customDest && (
                    <button
                      onClick={() => setCustomDest(null)}
                      className="text-[9px] text-pink-400 hover:text-pink-300 font-semibold flex items-center gap-0.5"
                    >
                      <X className="w-2.5 h-2.5" /> Reset to Station
                    </button>
                  )}
                </div>

                {customDest ? (
                  <div className="flex items-center justify-between gap-1 text-xs font-semibold text-pink-300 truncate">
                    <span className="truncate">{customDest.name}</span>
                    <span className="text-[9px] px-1 py-0.2 rounded bg-pink-950 text-pink-300 border border-pink-800 shrink-0">
                      Map Pin
                    </span>
                  </div>
                ) : (
                  <select
                    value={destinationId}
                    onChange={(e) => {
                      setDestinationId(e.target.value);
                      sound.playTactileTick();
                    }}
                    className="w-full bg-transparent text-xs font-semibold text-white outline-none cursor-pointer truncate"
                  >
                    {cityFilteredNodes.map((n) => (
                      <option key={`to-${n.id}`} value={n.id} className="bg-slate-900">
                        {n.name} {n.hindiName ? `(${n.hindiName})` : ''}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {/* Search / Recalculate Button */}
            <button
              onClick={() => {
                sound.playRouteSweep();
                computeRoutes(originNode, destNode);
              }}
              disabled={isLoading}
              className="px-5 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-1.5 transition-all"
            >
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>{isLoading ? 'Updating...' : 'Search Routes'}</span>
            </button>
          </div>
        </div>

        {/* PRIMARY MAP CONTAINER (GOOGLE MAPS STYLE & 3D TOGGLE) */}
        <div className="w-full relative">
          {is3DActive ? (
            <div className="relative w-full h-[580px] lg:h-[630px] rounded-3xl overflow-hidden border border-cyan-900/40 shadow-2xl">
              <ThreeMobilityUniverse
                auraState={auraState}
                weather={weather}
                interactive={true}
              />
              <button
                onClick={() => setIs3DActive(false)}
                className="absolute top-4 right-4 z-20 px-3 py-1.5 bg-slate-900/90 border border-cyan-500/50 text-cyan-300 text-xs font-bold rounded-xl shadow-lg flex items-center gap-1.5"
              >
                <Layers className="w-4 h-4" />
                <span>Switch to Google Street Map</span>
              </button>
            </div>
          ) : (
            <GoogleMapsView
              selectedRoute={selectedRoute}
              originNode={originNode}
              destNode={destNode}
              isLiveTracking={isLiveTracking}
              onToggleLiveTracking={setIsLiveTracking}
              onSelectOriginLocation={handleSelectOriginLocation}
              onSelectDestLocation={handleSelectDestLocation}
              onUseCurrentLocation={handleUseCurrentLocation}
              isLocatingGPS={isLocatingGPS}
              onToggle3DView={() => setIs3DActive(!is3DActive)}
              is3DActive={is3DActive}
            />
          )}
        </div>

        {/* GOOGLE MAPS-STYLE ROUTE DRAWER (SHOWS ONLY THE SELECTED ROUTE ON THE MAP) */}
        <GoogleMapsRouteDrawer
          routes={routes}
          selectedRouteId={selectedRoute?.id || ''}
          onSelectRoute={(rt) => {
            setSelectedRoute(rt);
            sound.playRouteSweep();
          }}
          isLiveTracking={isLiveTracking}
          onToggleLiveTracking={setIsLiveTracking}
        />

        {/* Chronological Transit Timeline & Recovery */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start pt-2">
          <div className="lg:col-span-7">
            <JourneyTimeline
              selectedRoute={selectedRoute}
              onMissedConnection={handleMissedConnection}
              isRerouting={isRerouting}
            />
          </div>

          <div className="lg:col-span-5 flex flex-col gap-4">
            <DemoScenarioController
              currentStep={demoStep}
              onRunStep={handleRunDemoStep}
              onResetDemo={handleResetDemo}
            />

            {/* Quick Assistance Card */}
            <div className="bg-[#071324]/80 border border-slate-800 rounded-2xl p-4 flex flex-col gap-2">
              <span className="text-[11px] font-bold uppercase text-slate-400">Emergency & Safety</span>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300">Transit Police & Women Safety Helpline</span>
                <button
                  onClick={() => setIsSOSOpen(true)}
                  className="text-red-400 hover:text-red-300 font-bold"
                >
                  Dial 112 / SOS →
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Floating Action Button for Aura */}
      <div className="fixed bottom-6 right-6 z-30">
        <button
          onClick={() => {
            sound.playAuraChime();
            setIsAuraOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 text-white rounded-full shadow-2xl shadow-cyan-500/40 border border-cyan-300/40 transition-all hover:scale-105"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-xs font-bold tracking-wide">Ask Aura AI</span>
        </button>
      </div>

      {/* Live GPS Cockpit Modal */}
      <LiveGPSTracker
        isOpen={isLiveGPSCockpitOpen}
        onClose={() => setIsLiveGPSCockpitOpen(false)}
        route={selectedRoute}
        onEmergencyShare={() => sound.playDisruptionAlert()}
      />

      {/* Modals */}
      <AuraAssistantModal
        isOpen={isAuraOpen}
        onClose={() => setIsAuraOpen(false)}
        selectedRoute={selectedRoute}
        onApplyPreference={setPreference}
        onApplyBudget={setMaxBudget}
        onTriggerReroute={handleMissedConnection}
        onTriggerWeather={handleToggleWeather}
        onOpenSOS={() => {
          setIsAuraOpen(false);
          setIsSOSOpen(true);
        }}
        onOpenLiveGPS={() => {
          setIsAuraOpen(false);
          setIsLiveTracking(true);
        }}
      />

      <DisruptionManager
        isOpen={isDisruptionsOpen}
        onClose={() => setIsDisruptionsOpen(false)}
        disruptions={disruptions}
        onAddReport={handleAddCommunityReport}
        onCorroborate={(id) => {
          setDisruptions((prev) =>
            prev.map((d) => (d.id === id ? { ...d, corroborationCount: d.corroborationCount + 1 } : d))
          );
        }}
      />

      <EmergencyAssistanceModal
        isOpen={isSOSOpen}
        onClose={() => setIsSOSOpen(false)}
      />

      <JourneyShareModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        selectedRoute={selectedRoute}
      />

      <SoundSettingsModal
        isOpen={isSoundOpen}
        onClose={() => setIsSoundOpen(false)}
        isMuted={isMuted}
        onMuteToggle={(val) => {
          setIsMuted(val);
          sound.setMuted(val);
        }}
      />

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-[#03070E] py-6 text-xs text-slate-500 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-300">WAYORA (भारत)</span>
            <span>·</span>
            <span>Google Maps-Style Real-time Transit Experience</span>
          </div>
          <div className="flex items-center gap-3 text-[11px]">
            <span>© OpenStreetMap / CartoDB</span>
            <span>·</span>
            <span>DMRC · MMRDA · Namma Metro</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
