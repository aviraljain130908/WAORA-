import React from 'react';
import { JourneyRoute } from '../types/wayora';
import { sound } from '../services/soundService';
import { Clock, IndianRupee, Footprints, ArrowRight, ShieldCheck, Leaf, Wind, CheckCircle2, QrCode } from 'lucide-react';

interface RouteComparisonPanelProps {
  routes: JourneyRoute[];
  selectedRouteId: string;
  onSelectRoute: (route: JourneyRoute) => void;
  onPayUPI?: (route: JourneyRoute) => void;
}

export const RouteComparisonPanel: React.FC<RouteComparisonPanelProps> = ({
  routes,
  selectedRouteId,
  onSelectRoute,
  onPayUPI,
}) => {
  if (routes.length === 0) {
    return (
      <div className="bg-[#071324]/80 border border-slate-800 rounded-2xl p-8 text-center text-slate-400">
        <p className="text-sm">No alternative routes match your current constraints.</p>
        <p className="text-xs text-slate-500 mt-1">Try expanding your budget limit or walking tolerance.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
            Available Route Corridors
            <span className="text-xs font-normal text-slate-400">({routes.length} options)</span>
          </h3>
          <p className="text-xs text-slate-400">Integrated DMRC, Vande Bharat, DTC Electric & E-Auto Network</p>
        </div>
        <span className="text-[11px] text-cyan-400 font-medium">Click card to highlight path</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {routes.map((route) => {
          const isSelected = route.id === selectedRouteId;

          // Select vehicle thumbnail based on preference/mode
          let vehicleImg = '/src/assets/images/india_metro_futuristic_1791572831642.jpg';
          if (route.preferenceCategory === 'cheapest' || route.preferenceCategory === 'low_walking') {
            vehicleImg = '/src/assets/images/india_e_autorickshaw_1791572846379.jpg';
          } else if (route.preferenceCategory === 'fastest') {
            vehicleImg = '/src/assets/images/india_metro_futuristic_1791572831642.jpg';
          }

          return (
            <div
              key={route.id}
              onClick={() => {
                sound.playTactileTick();
                sound.playRouteSweep();
                onSelectRoute(route);
              }}
              className={`cursor-pointer rounded-2xl p-4 transition-all duration-200 border relative flex flex-col justify-between ${
                isSelected
                  ? 'bg-[#0B1D36] border-cyan-400/80 shadow-xl shadow-cyan-950/70 scale-[1.01]'
                  : 'bg-[#061222]/85 border-slate-800 hover:border-slate-700 hover:bg-[#08172c]'
              }`}
            >
              <div>
                {/* Header & Thumbnail */}
                <div className="flex items-start gap-3">
                  <img
                    src={vehicleImg}
                    alt="Transit vehicle"
                    referrerPolicy="no-referrer"
                    className="w-14 h-14 rounded-xl object-cover shrink-0 border border-slate-700/60 shadow-md"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <span className="capitalize font-bold text-cyan-400">
                        {route.preferenceCategory.replace('_', ' ')}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono text-slate-300">
                        {route.departureTime} – {route.arrivalTime}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-white mt-0.5 truncate">{route.title}</h4>
                    <span className="text-[11px] text-emerald-400 font-medium">NCMC Smart Card / UPI Tap</span>
                  </div>

                  {isSelected && (
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-cyan-300 bg-cyan-950/90 border border-cyan-500/40 px-2 py-0.5 rounded-md shrink-0">
                      <CheckCircle2 className="w-3 h-3 text-cyan-400" />
                      Active
                    </span>
                  )}
                </div>

                {/* Key Metrics Strip (Tabular numbers) */}
                <div className="mt-3 grid grid-cols-4 gap-2 bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/80 text-center">
                  <div>
                    <span className="text-[10px] text-slate-400 flex items-center justify-center gap-0.5">
                      <Clock className="w-2.5 h-2.5" /> Time
                    </span>
                    <span className="text-xs font-mono font-bold text-white tabular-nums">
                      {route.totalDurationMinutes}m
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 flex items-center justify-center gap-0.5">
                      <IndianRupee className="w-2.5 h-2.5" /> Fare
                    </span>
                    <span className="text-xs font-mono font-bold text-emerald-400 tabular-nums">
                      ₹{route.totalCost}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 flex items-center justify-center gap-0.5">
                      <Footprints className="w-2.5 h-2.5" /> Walk
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-300 tabular-nums">
                      {route.totalWalkingMeters}m
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 flex items-center justify-center gap-0.5">
                      Transfers
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-300 tabular-nums">
                      {route.transfersCount}
                    </span>
                  </div>
                </div>

                {/* Transit Mode Sequence */}
                <div className="mt-3 flex items-center flex-wrap gap-1.5 text-xs">
                  {route.legs.map((leg, idx) => (
                    <React.Fragment key={leg.id}>
                      <div
                        className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium"
                        style={{
                          backgroundColor: `${leg.lineColor}22`,
                          color: leg.lineColor || '#94A3B8',
                          border: `1px solid ${leg.lineColor}44`,
                        }}
                      >
                        <span className="capitalize">{leg.mode}</span>
                        {leg.lineId && <span className="font-mono text-[10px] opacity-90">({leg.lineId})</span>}
                      </div>
                      {idx < route.legs.length - 1 && (
                        <ArrowRight className="w-2.5 h-2.5 text-slate-600 shrink-0" />
                      )}
                    </React.Fragment>
                  ))}
                </div>

                <p className="mt-2.5 text-xs text-slate-300 leading-relaxed border-t border-slate-800/60 pt-2">
                  {route.explanation}
                </p>
              </div>

              {/* Footer with CO2 savings & Safety badge */}
              <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/60 pt-2">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1 text-emerald-400">
                    <Leaf className="w-3 h-3" />
                    {route.carbonSavedKg} kg CO₂ saved
                  </span>
                  <span className="flex items-center gap-1 text-sky-400">
                    <Wind className="w-3 h-3" />
                    {route.averageAqi} AQI
                  </span>
                </div>

                <span className="flex items-center gap-1 text-slate-300 font-medium">
                  <ShieldCheck className="w-3 h-3 text-cyan-400" />
                  {route.safetyRating}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
