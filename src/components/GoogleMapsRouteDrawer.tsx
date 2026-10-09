import React from 'react';
import { JourneyRoute } from '../types/wayora';
import { sound } from '../services/soundService';
import { Navigation, Clock, IndianRupee, Footprints, ShieldCheck, CheckCircle2, ArrowRight, Eye, Check } from 'lucide-react';

interface GoogleMapsRouteDrawerProps {
  routes: JourneyRoute[];
  selectedRouteId: string;
  onSelectRoute: (route: JourneyRoute) => void;
  isLiveTracking: boolean;
  onToggleLiveTracking: (active: boolean) => void;
}

export const GoogleMapsRouteDrawer: React.FC<GoogleMapsRouteDrawerProps> = ({
  routes,
  selectedRouteId,
  onSelectRoute,
  isLiveTracking,
  onToggleLiveTracking,
}) => {
  if (routes.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      {/* Header with Title & Live GPS button */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
            <span>Select Route to View on Map</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800">
              {routes.length} Available
            </span>
          </h3>
          <p className="text-xs text-slate-400">
            Click any route below — Google Maps will highlight <strong className="text-cyan-300">ONLY</strong> this selected route
          </p>
        </div>

        <button
          onClick={() => {
            sound.playRouteSweep();
            onToggleLiveTracking(!isLiveTracking);
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-lg ${
            isLiveTracking
              ? 'bg-emerald-500 text-white shadow-emerald-500/30'
              : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-600/30'
          }`}
        >
          <Navigation className="w-3.5 h-3.5 fill-current" />
          <span>{isLiveTracking ? 'Live GPS Active' : 'Start GPS Tracking'}</span>
        </button>
      </div>

      {/* Route Cards Carousel / Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {routes.map((route) => {
          const isSelected = route.id === selectedRouteId;

          // Transit vehicle thumbnail based on mode
          let vehicleImg = '/src/assets/images/india_metro_futuristic_1791572831642.jpg';
          if (route.preferenceCategory === 'cheapest' || route.preferenceCategory === 'low_walking') {
            vehicleImg = '/src/assets/images/india_e_autorickshaw_1791572846379.jpg';
          } else if (route.legs.some((l) => l.mode === 'rail')) {
            vehicleImg = '/src/assets/images/india_vande_bharat_express_1791572857938.jpg';
          }

          return (
            <div
              key={route.id}
              onClick={() => {
                sound.playTactileTick();
                sound.playRouteSweep();
                onSelectRoute(route);
              }}
              className={`cursor-pointer rounded-2xl p-3.5 transition-all duration-200 border relative flex flex-col justify-between ${
                isSelected
                  ? 'bg-[#0B1D36] border-cyan-400 shadow-xl shadow-cyan-950/80 ring-2 ring-cyan-500/30 -translate-y-0.5'
                  : 'bg-[#061222]/90 border-slate-800 hover:border-slate-700 hover:bg-[#08182e]'
              }`}
            >
              <div>
                {/* Header row */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <img
                      src={vehicleImg}
                      alt="Vehicle"
                      referrerPolicy="no-referrer"
                      className="w-11 h-11 rounded-xl object-cover shrink-0 border border-slate-700 shadow-md"
                    />
                    <div className="min-w-0">
                      <span className="text-[10px] uppercase font-bold text-cyan-400 block truncate">
                        {route.preferenceCategory.replace('_', ' ')}
                      </span>
                      <h4 className="text-xs font-bold text-white truncate">{route.title}</h4>
                    </div>
                  </div>

                  {isSelected ? (
                    <span className="text-[10px] font-bold text-cyan-200 bg-cyan-950 px-2 py-0.5 rounded-full border border-cyan-500/70 flex items-center gap-1 shadow-sm shrink-0">
                      <Check className="w-2.5 h-2.5 text-cyan-400" /> ON MAP
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400 bg-slate-900 px-2 py-0.5 rounded-full border border-slate-800 hover:text-white shrink-0">
                      Select
                    </span>
                  )}
                </div>

                {/* Key Numbers (Tabular) */}
                <div className="mt-2.5 grid grid-cols-3 gap-1.5 bg-slate-950/70 p-2 rounded-xl border border-slate-800/80 text-center">
                  <div>
                    <span className="text-[9px] text-slate-400 block">Duration</span>
                    <span className="text-xs font-mono font-bold text-white tabular-nums">
                      {route.totalDurationMinutes}m
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 block">Fare</span>
                    <span className="text-xs font-mono font-bold text-emerald-400 tabular-nums">
                      ₹{route.totalCost}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 block">Walk</span>
                    <span className="text-xs font-mono font-bold text-slate-300 tabular-nums">
                      {route.totalWalkingMeters}m
                    </span>
                  </div>
                </div>

                {/* Mode Sequence icons */}
                <div className="mt-2 flex items-center flex-wrap gap-1 text-[10px]">
                  {route.legs.map((leg, idx) => (
                    <React.Fragment key={leg.id}>
                      <span
                        className="px-1.5 py-0.5 rounded font-medium truncate"
                        style={{
                          backgroundColor: `${leg.lineColor}22`,
                          color: leg.lineColor || '#94A3B8',
                        }}
                      >
                        {leg.mode}
                      </span>
                      {idx < route.legs.length - 1 && (
                        <ArrowRight className="w-2.5 h-2.5 text-slate-600 shrink-0" />
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>

              {/* Bottom selection confirmation bar */}
              <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                <span className="font-mono text-slate-300 text-[10px]">
                  {route.departureTime} → {route.arrivalTime}
                </span>
                <button
                  type="button"
                  className={`px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all ${
                    isSelected
                      ? 'bg-cyan-500 text-white shadow-sm shadow-cyan-500/40'
                      : 'bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-slate-700'
                  }`}
                >
                  <Eye className="w-3 h-3" />
                  <span>{isSelected ? 'Showing' : 'Show on Map'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
