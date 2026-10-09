import React from 'react';
import { JourneyRoute, RouteLeg } from '../types/wayora';
import { sound } from '../services/soundService';
import { AlertCircle, CheckCircle2, Clock, Footprints, Shield, Users, RefreshCw } from 'lucide-react';

interface JourneyTimelineProps {
  selectedRoute: JourneyRoute | null;
  onMissedConnection: (nodeId: string) => void;
  isRerouting: boolean;
}

export const JourneyTimeline: React.FC<JourneyTimelineProps> = ({
  selectedRoute,
  onMissedConnection,
  isRerouting,
}) => {
  if (!selectedRoute) {
    return (
      <div className="bg-[#071324]/80 border border-slate-800 rounded-2xl p-6 text-center text-slate-400">
        <p className="text-sm">Select a route above to inspect its chronological journey timeline.</p>
      </div>
    );
  }

  return (
    <div className="bg-[#071324]/85 backdrop-blur-xl border border-cyan-900/40 rounded-2xl p-5 shadow-2xl flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            Chronological Journey Timeline
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            {selectedRoute.title} · Departure at {selectedRoute.departureTime}
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="font-mono text-emerald-400 font-semibold">
            Arrival ~{selectedRoute.arrivalTime}
          </span>
        </div>
      </div>

      {/* Timeline Legs */}
      <div className="relative pl-6 flex flex-col gap-5 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-gradient-to-b before:from-cyan-500 before:via-blue-500 before:to-emerald-500">
        {selectedRoute.legs.map((leg, idx) => {
          const isInterchange = idx > 0 && idx < selectedRoute.legs.length - 1 && leg.mode !== 'walk';

          return (
            <div key={leg.id} className="relative flex flex-col gap-2">
              {/* Timeline Marker Bullet */}
              <div
                className="absolute -left-[27px] top-1 w-4 h-4 rounded-full border-2 border-[#071324] flex items-center justify-center text-[10px]"
                style={{ backgroundColor: leg.lineColor || '#06B6D4' }}
              >
                <div className="w-1.5 h-1.5 rounded-full bg-white" />
              </div>

              {/* Leg Content Box */}
              <div className="bg-slate-900/75 border border-slate-800/80 rounded-xl p-3.5 hover:border-cyan-500/30 transition-all">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 text-xs">
                      <span
                        className="font-semibold uppercase tracking-wider text-[11px]"
                        style={{ color: leg.lineColor || '#38BDF8' }}
                      >
                        {leg.mode} {leg.lineId ? `· ${leg.lineName}` : ''}
                      </span>
                      <span aria-hidden="true" className="text-slate-600">·</span>
                      <span className="text-slate-400 font-mono text-[11px]">
                        {leg.durationMinutes} min ({leg.distanceMeters >= 1000 ? `${(leg.distanceMeters / 1000).toFixed(1)} km` : `${leg.distanceMeters} m`})
                      </span>
                    </div>

                    <h5 className="text-sm font-semibold text-white mt-1">
                      {leg.fromNode.name} → {leg.toNode.name}
                    </h5>
                  </div>

                  {leg.cost > 0 && (
                    <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
                      ₹{leg.cost}
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-300 mt-2 bg-slate-950/50 p-2 rounded-lg border border-slate-800/60">
                  {leg.instructions}
                </p>

                {/* Sub-meta details: Platform, Crowding, Accessibility */}
                <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
                  <div className="flex items-center gap-3">
                    {leg.platform && (
                      <span className="font-mono text-cyan-300">
                        {leg.platform}
                      </span>
                    )}

                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3 text-slate-400" />
                      Crowding: <span className="capitalize text-slate-200">{leg.crowding}</span>
                    </span>

                    {leg.isElevatorAccessible && (
                      <span className="flex items-center gap-1 text-emerald-400">
                        <CheckCircle2 className="w-3 h-3" />
                        Step-free
                      </span>
                    )}
                  </div>

                  {/* Missed Connection trigger button at interchange station */}
                  {isInterchange && (
                    <button
                      onClick={() => {
                        sound.playDisruptionAlert();
                        onMissedConnection(leg.fromNode.id);
                      }}
                      disabled={isRerouting}
                      className="text-[11px] font-medium text-amber-400 hover:text-amber-200 bg-amber-950/60 border border-amber-600/40 hover:border-amber-400 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 disabled:opacity-50"
                      title="Trigger immediate smart recovery if you missed this transit connection"
                    >
                      <RefreshCw className={`w-3 h-3 ${isRerouting ? 'animate-spin' : ''}`} />
                      Missed Connection? Reroute Here
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
