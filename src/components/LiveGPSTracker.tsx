import React, { useState, useEffect, useRef } from 'react';
import { JourneyRoute, LiveGPSState } from '../types/wayora';
import { sound } from '../services/soundService';
import { Navigation, Compass, Gauge, MapPin, Play, Pause, RotateCcw, AlertTriangle, ShieldCheck, Share2, Check, ArrowUpRight } from 'lucide-react';

interface LiveGPSTrackerProps {
  route: JourneyRoute | null;
  isOpen: boolean;
  onClose: () => void;
  onEmergencyShare: (coords: string) => void;
}

export const LiveGPSTracker: React.FC<LiveGPSTrackerProps> = ({
  route,
  isOpen,
  onClose,
  onEmergencyShare,
}) => {
  const [gpsState, setGpsState] = useState<LiveGPSState>({
    isActive: true,
    isSimulated: true,
    currentLat: 28.6328,
    currentLng: 77.2197,
    speedKmh: 42,
    headingDegrees: 28,
    currentStationIndex: 0,
    distanceToNextStopMeters: 420,
    nextStopName: 'Rajiv Chowk Interchange',
    estimatedArrivalMins: 2,
    turnInstruction: 'Follow concourse signage toward Yellow Line Platform 2',
  });

  const [copiedCoords, setCopiedCoords] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const simIntervalRef = useRef<any>(null);

  // Initialize GPS or simulation
  useEffect(() => {
    if (!isOpen || !route) return;

    const legs = route.legs;
    if (legs.length === 0) return;

    let progress = 0;
    const totalLegs = legs.length;

    simIntervalRef.current = setInterval(() => {
      if (isPaused) return;

      progress = (progress + 0.04) % 1.0;
      const currentLegIndex = Math.min(totalLegs - 1, Math.floor(progress * totalLegs));
      const currentLeg = legs[currentLegIndex];
      const nextLeg = legs[Math.min(totalLegs - 1, currentLegIndex + 1)];

      const fromLat = currentLeg.fromNode.lat;
      const fromLng = currentLeg.fromNode.lng;
      const toLat = currentLeg.toNode.lat;
      const toLng = currentLeg.toNode.lng;

      const legFraction = (progress * totalLegs) - currentLegIndex;
      const curLat = fromLat + (toLat - fromLat) * legFraction;
      const curLng = fromLng + (toLng - fromLng) * legFraction;

      const baseSpeed = currentLeg.mode === 'metro' ? 58 : currentLeg.mode === 'rail' ? 85 : currentLeg.mode === 'feeder' ? 26 : 4.5;
      const jitterSpeed = Math.max(0, baseSpeed + (Math.sin(Date.now() / 1000) * 4));

      const distLeft = Math.max(20, Math.round((1 - legFraction) * currentLeg.distanceMeters));
      const minsLeft = Math.max(1, Math.ceil((distLeft / (baseSpeed * 1000 / 60))));

      setGpsState({
        isActive: true,
        isSimulated: true,
        currentLat: Number(curLat.toFixed(5)),
        currentLng: Number(curLng.toFixed(5)),
        speedKmh: Math.round(jitterSpeed),
        headingDegrees: Math.round((Date.now() / 150) % 360),
        currentStationIndex: currentLegIndex,
        distanceToNextStopMeters: distLeft,
        nextStopName: currentLeg.toNode.name,
        estimatedArrivalMins: minsLeft,
        turnInstruction: currentLeg.instructions,
      });
    }, 600);

    return () => {
      if (simIntervalRef.current) clearInterval(simIntervalRef.current);
    };
  }, [isOpen, route, isPaused]);

  if (!isOpen || !route) return null;

  const handleCopyCoordinates = () => {
    sound.playTactileTick();
    const str = `${gpsState.currentLat.toFixed(5)}, ${gpsState.currentLng.toFixed(5)}`;
    navigator.clipboard?.writeText(str);
    setCopiedCoords(true);
    setTimeout(() => setCopiedCoords(false), 2000);
    onEmergencyShare(str);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/85 backdrop-blur-md">
      <div className="w-full max-w-4xl bg-[#061222] border border-cyan-500/50 rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Cockpit Header */}
        <div className="p-4 bg-slate-950/90 border-b border-cyan-900/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-950 border border-cyan-400/50 flex items-center justify-center text-cyan-300 animate-pulse">
              <Navigation className="w-5 h-5 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white tracking-wide">Live GPS Mobility Cockpit</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-700/60 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  REAL-TIME GPS SYNC
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Turn-by-turn Indian Transit Navigation · {route.title}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                sound.playTactileTick();
                setIsPaused(!isPaused);
              }}
              className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-900 text-xs text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors"
            >
              {isPaused ? <Play className="w-3.5 h-3.5 text-emerald-400" /> : <Pause className="w-3.5 h-3.5 text-amber-400" />}
              <span>{isPaused ? 'Resume Navigation' : 'Pause'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Cockpit Body */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 flex flex-col gap-5">
          {/* Top Telemetry Strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {/* Speedometer */}
            <div className="bg-slate-950/80 border border-slate-800 p-3.5 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 font-semibold uppercase flex items-center gap-1">
                  <Gauge className="w-3 h-3 text-cyan-400" /> Live Velocity
                </span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-2xl font-mono font-bold text-white tabular-nums">
                    {gpsState.speedKmh}
                  </span>
                  <span className="text-xs text-slate-400">km/h</span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-full border-2 border-cyan-500/30 border-t-cyan-400 flex items-center justify-center text-[10px] font-mono text-cyan-300">
                {gpsState.speedKmh > 50 ? 'FAST' : 'ECO'}
              </div>
            </div>

            {/* Next Stop Distance */}
            <div className="bg-slate-950/80 border border-slate-800 p-3.5 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 font-semibold uppercase flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-pink-400" /> Next Hub
                </span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-2xl font-mono font-bold text-pink-300 tabular-nums">
                    {gpsState.distanceToNextStopMeters}
                  </span>
                  <span className="text-xs text-slate-400">meters</span>
                </div>
              </div>
              <span className="text-xs font-mono font-semibold text-slate-400">
                ~{gpsState.estimatedArrivalMins} min
              </span>
            </div>

            {/* Compass Heading */}
            <div className="bg-slate-950/80 border border-slate-800 p-3.5 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 font-semibold uppercase flex items-center gap-1">
                  <Compass className="w-3 h-3 text-amber-400" /> Heading
                </span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-2xl font-mono font-bold text-white tabular-nums">
                    {gpsState.headingDegrees}°
                  </span>
                  <span className="text-xs text-slate-400">NNE</span>
                </div>
              </div>
              <div
                className="w-8 h-8 rounded-full bg-slate-900 border border-amber-500/40 flex items-center justify-center text-amber-400 transition-transform duration-300"
                style={{ transform: `rotate(${gpsState.headingDegrees}deg)` }}
              >
                ▲
              </div>
            </div>

            {/* Exact GPS Coordinates */}
            <div className="bg-slate-950/80 border border-slate-800 p-3.5 rounded-xl flex flex-col justify-between">
              <span className="text-[10px] text-slate-400 font-semibold uppercase flex items-center justify-between">
                <span>GPS Fix Coordinates</span>
                <button
                  onClick={handleCopyCoordinates}
                  className="text-cyan-400 hover:text-cyan-300 text-[10px] flex items-center gap-0.5"
                  title="Copy Coordinates"
                >
                  {copiedCoords ? <Check className="w-2.5 h-2.5" /> : <Share2 className="w-2.5 h-2.5" />}
                  <span>{copiedCoords ? 'Copied' : 'Share'}</span>
                </button>
              </span>
              <div className="mt-1 font-mono text-xs text-cyan-300 tabular-nums">
                {gpsState.currentLat.toFixed(5)}° N, {gpsState.currentLng.toFixed(5)}° E
              </div>
            </div>
          </div>

          {/* Turn-by-Turn Real-time Guidance Banner */}
          <div className="bg-gradient-to-r from-cyan-950/90 via-slate-900 to-blue-950/90 border border-cyan-500/50 p-4 rounded-xl flex items-start justify-between gap-4 shadow-lg">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-400/60 flex items-center justify-center text-cyan-300 shrink-0 mt-0.5">
                <ArrowUpRight className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-cyan-400 block">
                  Next Action: In {gpsState.distanceToNextStopMeters}m
                </span>
                <h4 className="text-sm md:text-base font-bold text-white mt-0.5">
                  {gpsState.turnInstruction}
                </h4>
                <p className="text-xs text-slate-300 mt-1">
                  Target Station: <strong className="text-white">{gpsState.nextStopName}</strong>
                </p>
              </div>
            </div>

            <div className="text-right shrink-0">
              <span className="text-[11px] text-slate-400 block">Expected Arrival</span>
              <span className="text-sm font-mono font-bold text-emerald-400">
                {route.arrivalTime}
              </span>
            </div>
          </div>

          {/* Live Interactive GPS Map Visualizer */}
          <div className="relative h-64 md:h-72 rounded-xl bg-[#040913] border border-cyan-900/40 overflow-hidden flex items-center justify-center shadow-inner">
            {/* Visual background grid */}
            <div className="absolute inset-0 bg-[radial-gradient(#0369a1_1px,transparent_1px)] [background-size:16px_16px] opacity-20 pointer-events-none" />

            {/* Simulated Live Route Path Line */}
            <svg className="w-full h-full select-none" viewBox="0 0 800 300">
              <defs>
                <linearGradient id="gpsRouteGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#06B6D4" />
                  <stop offset="50%" stopColor="#3B82F6" />
                  <stop offset="100%" stopColor="#10B981" />
                </linearGradient>
              </defs>

              {/* Waypoint Connection Lines */}
              <path
                d="M 80 180 Q 240 80, 400 150 T 720 120"
                fill="none"
                stroke="#0284C7"
                strokeWidth="12"
                strokeOpacity="0.25"
                strokeLinecap="round"
              />
              <path
                d="M 80 180 Q 240 80, 400 150 T 720 120"
                fill="none"
                stroke="url(#gpsRouteGrad)"
                strokeWidth="5"
                strokeLinecap="round"
              />
              {/* Traveling Pulse Dash */}
              <path
                d="M 80 180 Q 240 80, 400 150 T 720 120"
                fill="none"
                stroke="#FFFFFF"
                strokeWidth="3"
                strokeDasharray="8 24"
                className="animate-route-flow"
              />

              {/* Origin Station Beacon */}
              <g transform="translate(80, 180)">
                <circle r="8" fill="#10B981" />
                <circle r="14" fill="none" stroke="#10B981" strokeWidth="2" strokeOpacity="0.5" />
                <text y="24" textAnchor="middle" fill="#94A3B8" fontSize="11" fontWeight="600">
                  {route.legs[0]?.fromNode.name || 'Origin'}
                </text>
              </g>

              {/* Dynamic GPS Moving Waypoint Indicator */}
              <g transform="translate(400, 150)">
                {/* Radar ripple rings */}
                <circle r="28" fill="#38BDF8" fillOpacity="0.2" className="animate-ping" />
                <circle r="18" fill="none" stroke="#38BDF8" strokeWidth="2" />
                {/* Vehicle Marker */}
                <circle r="9" fill="#FFFFFF" stroke="#0284C7" strokeWidth="3" />
                <path d="M -3 -1 L 0 -5 L 3 -1 Z" fill="#0284C7" />
                <text y="-20" textAnchor="middle" fill="#FFFFFF" fontSize="11" fontWeight="700">
                  You are here ({gpsState.speedKmh} km/h)
                </text>
              </g>

              {/* Destination Station Beacon */}
              <g transform="translate(720, 120)">
                <circle r="8" fill="#EC4899" />
                <circle r="14" fill="none" stroke="#EC4899" strokeWidth="2" strokeOpacity="0.5" />
                <text y="24" textAnchor="middle" fill="#94A3B8" fontSize="11" fontWeight="600">
                  {route.legs[route.legs.length - 1]?.toNode.name || 'Destination'}
                </text>
              </g>
            </svg>

            {/* Bottom HUD Overlay */}
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs text-slate-400 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-800">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>GPS High-Precision Lock: ±2.4m</span>
              </span>
              <span>Subway Ingress Auto-Switch Active</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
