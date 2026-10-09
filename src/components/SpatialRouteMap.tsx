import React, { useState, useEffect } from 'react';
import { TransitNode, JourneyRoute, DisruptionAlert } from '../types/wayora';
import { TRANSIT_NODES, TRANSIT_LINES } from '../data/transitNetwork';
import { sound } from '../services/soundService';
import { Play, RotateCcw, AlertTriangle, ShieldCheck, Layers, Navigation, Compass, ArrowUpRight } from 'lucide-react';

interface SpatialRouteMapProps {
  selectedRoute: JourneyRoute | null;
  originNodeId: string;
  destNodeId: string;
  disruptions: DisruptionAlert[];
  onSelectNode: (nodeId: string) => void;
  onOpenLiveGPS?: () => void;
}

export type MapMode = 'network' | 'disruption' | 'safety' | 'gps';

export const SpatialRouteMap: React.FC<SpatialRouteMapProps> = ({
  selectedRoute,
  originNodeId,
  destNodeId,
  disruptions,
  onSelectNode,
  onOpenLiveGPS,
}) => {
  const [activeMode, setActiveMode] = useState<MapMode>('network');
  const [inspectedNode, setInspectedNode] = useState<TransitNode | null>(null);
  const [isReplaying, setIsReplaying] = useState(false);
  const [replayProgress, setReplayProgress] = useState(0);

  const triggerReplay = () => {
    if (!selectedRoute) return;
    sound.playRouteSweep();
    setIsReplaying(true);
    setReplayProgress(0);

    const startTime = Date.now();
    const duration = 4000;

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(1, elapsed / duration);
      setReplayProgress(progress);

      if (progress >= 1) {
        clearInterval(interval);
        setIsReplaying(false);
        sound.playArrivalChime();
      }
    }, 40);
  };

  const getNodeById = (id: string) => TRANSIT_NODES.find((n) => n.id === id);

  const isLineDisrupted = (lineId: string) => {
    return disruptions.some((d) => d.lineId === lineId);
  };

  return (
    <div className="relative w-full h-[560px] bg-[#050C18] border border-cyan-900/40 rounded-2xl overflow-hidden flex flex-col shadow-2xl">
      {/* Top Map Toolbar */}
      <div className="absolute top-4 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-2.5 pointer-events-none">
        {/* Map Mode Tabs */}
        <div className="pointer-events-auto flex items-center gap-1 p-1 bg-slate-950/85 backdrop-blur-md border border-slate-800 rounded-xl shadow-lg">
          <button
            onClick={() => { setActiveMode('network'); sound.playTactileTick(); }}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
              activeMode === 'network' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Transit Network
          </button>
          <button
            onClick={() => { setActiveMode('gps'); sound.playTactileTick(); }}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
              activeMode === 'gps' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Navigation className="w-3.5 h-3.5" />
            Live GPS Tracking
          </button>
          <button
            onClick={() => { setActiveMode('disruption'); sound.playTactileTick(); }}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
              activeMode === 'disruption' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            Delays
          </button>
          <button
            onClick={() => { setActiveMode('safety'); sound.playTactileTick(); }}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
              activeMode === 'safety' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            CISF Night Safety
          </button>
        </div>

        {/* GPS Cockpit & Replay Action */}
        <div className="pointer-events-auto flex items-center gap-2">
          {onOpenLiveGPS && (
            <button
              onClick={() => {
                sound.playRouteSweep();
                onOpenLiveGPS();
              }}
              className="px-3 py-1.5 bg-emerald-950/90 hover:bg-emerald-900 border border-emerald-500/50 text-emerald-300 text-xs font-bold rounded-xl shadow-lg flex items-center gap-1.5 transition-colors"
            >
              <Navigation className="w-3.5 h-3.5 fill-current text-emerald-400" />
              <span>Full GPS Cockpit</span>
            </button>
          )}

          {selectedRoute && (
            <button
              onClick={triggerReplay}
              disabled={isReplaying}
              className="px-3 py-1.5 bg-slate-950/85 backdrop-blur-md border border-slate-800 text-xs font-medium text-cyan-300 hover:text-cyan-100 rounded-xl shadow-lg flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              {isReplaying ? (
                <>
                  <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                  <span>Replaying ({Math.round(replayProgress * 100)}%)</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Replay Route Path</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* SVG Interactive Map */}
      <div className="w-full h-full relative overflow-hidden bg-[#040913]">
        <svg
          viewBox="0 0 1000 850"
          className="w-full h-full select-none"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <filter id="cyanGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <filter id="disruptionGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Cartographic Grid Background */}
          <g opacity="0.12">
            {Array.from({ length: 11 }).map((_, i) => (
              <line key={`gx-${i}`} x1={i * 100} y1="0" x2={i * 100} y2="850" stroke="#0284C7" strokeWidth="1" strokeDasharray="4 8" />
            ))}
            {Array.from({ length: 9 }).map((_, i) => (
              <line key={`gy-${i}`} x1="0" y1={i * 100} x2="1000" y2={i * 100} stroke="#0284C7" strokeWidth="1" strokeDasharray="4 8" />
            ))}
          </g>

          {/* Base Transit Network Lines */}
          <g id="transit-lines">
            {TRANSIT_LINES.map((line) => {
              const points = line.stops
                .map((stopId) => {
                  const node = getNodeById(stopId);
                  return node ? `${node.x},${node.y}` : null;
                })
                .filter(Boolean)
                .join(' ');

              const isDisrupted = activeMode === 'disruption' && isLineDisrupted(line.id);

              return (
                <g key={line.id}>
                  <polyline
                    points={points}
                    fill="none"
                    stroke={isDisrupted ? '#EF4444' : line.color}
                    strokeWidth={isDisrupted ? 6 : 4}
                    strokeOpacity={isDisrupted ? 0.95 : 0.4}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    filter={isDisrupted ? 'url(#disruptionGlow)' : undefined}
                  />
                  {isDisrupted && (
                    <polyline
                      points={points}
                      fill="none"
                      stroke="#EF4444"
                      strokeWidth="2"
                      strokeDasharray="6 6"
                      className="animate-route-flow"
                    />
                  )}
                </g>
              );
            })}
          </g>

          {/* Highlighted Selected Route Path & Animated Pulse */}
          {selectedRoute && (
            <g id="selected-route-layer">
              {selectedRoute.legs.map((leg, idx) => {
                const x1 = leg.fromNode.x;
                const y1 = leg.fromNode.y;
                const x2 = leg.toNode.x;
                const y2 = leg.toNode.y;

                if (x1 === x2 && y1 === y2) return null;

                return (
                  <g key={`sel-leg-${idx}`}>
                    <line
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke="#38BDF8"
                      strokeWidth="10"
                      strokeOpacity="0.3"
                      strokeLinecap="round"
                      filter="url(#cyanGlow)"
                    />
                    <line
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke={leg.lineColor || '#0284C7'}
                      strokeWidth="5"
                      strokeLinecap="round"
                    />
                    <line
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke="#FFFFFF"
                      strokeWidth="3"
                      strokeDasharray="12 40"
                      strokeLinecap="round"
                      className="animate-route-flow"
                    />

                    {/* Transfer Portal indicator at interchange */}
                    {idx < selectedRoute.legs.length - 1 && (
                      <g transform={`translate(${x2}, ${y2})`}>
                        <circle r="14" fill="none" stroke="#38BDF8" strokeWidth="2" strokeDasharray="4 4" className="animate-spin" />
                        <circle r="6" fill="#06B6D4" />
                      </g>
                    )}
                  </g>
                );
              })}

              {/* Replay Traveler Beacon or Live GPS Beacon */}
              {(isReplaying || activeMode === 'gps') && selectedRoute.legs.length > 0 && (() => {
                const legs = selectedRoute.legs.filter((l) => !(l.fromNode.x === l.toNode.x && l.fromNode.y === l.toNode.y));
                if (legs.length === 0) return null;
                const prog = isReplaying ? replayProgress : 0.45;
                const legIndex = Math.min(legs.length - 1, Math.floor(prog * legs.length));
                const legProgress = (prog * legs.length) - legIndex;
                const currLeg = legs[legIndex];
                const curX = currLeg.fromNode.x + (currLeg.toNode.x - currLeg.fromNode.x) * legProgress;
                const curY = currLeg.fromNode.y + (currLeg.toNode.y - currLeg.fromNode.y) * legProgress;

                return (
                  <g transform={`translate(${curX}, ${curY})`}>
                    <circle r="22" fill="#10B981" fillOpacity="0.3" className="animate-ping" />
                    <circle r="12" fill="none" stroke="#10B981" strokeWidth="2" />
                    <circle r="7" fill="#FFFFFF" stroke="#059669" strokeWidth="3" filter="url(#cyanGlow)" />
                    {activeMode === 'gps' && (
                      <text y="-16" textAnchor="middle" fill="#34D399" fontSize="11" fontWeight="700">
                        Live GPS (48 km/h)
                      </text>
                    )}
                  </g>
                );
              })()}
            </g>
          )}

          {/* Transit Stations / Nodes */}
          <g id="transit-nodes">
            {TRANSIT_NODES.map((node) => {
              const isOrigin = node.id === originNodeId;
              const isDest = node.id === destNodeId;
              const isInspected = inspectedNode?.id === node.id;
              const isInterchange = node.lines.length >= 2;

              let fillColor = '#0284C7';
              if (activeMode === 'safety') {
                fillColor = node.isStaffedNight ? '#10B981' : '#F59E0B';
              } else if (activeMode === 'disruption') {
                const affected = disruptions.some((d) => d.affectedNodes.includes(node.id));
                fillColor = affected ? '#EF4444' : '#0284C7';
              } else if (node.type === 'rail_hub') {
                fillColor = '#F59E0B';
              }

              return (
                <g
                  key={node.id}
                  transform={`translate(${node.x}, ${node.y})`}
                  className="cursor-pointer group"
                  onClick={() => {
                    setInspectedNode(node);
                    onSelectNode(node.id);
                    sound.playTactileTick();
                  }}
                >
                  {(isOrigin || isDest) && (
                    <circle
                      r={isOrigin ? 22 : 24}
                      fill={isOrigin ? '#10B981' : '#EC4899'}
                      fillOpacity="0.25"
                      className="animate-pulse"
                    />
                  )}

                  <circle
                    r={isInterchange ? 9.5 : 7}
                    fill={fillColor}
                    stroke="#FFFFFF"
                    strokeWidth={isInspected || isOrigin || isDest ? 3 : 1.5}
                    filter={isOrigin || isDest ? 'url(#cyanGlow)' : undefined}
                    className="transition-transform group-hover:scale-125"
                  />

                  {/* Station Label (English + Hindi) */}
                  <text
                    x="0"
                    y={node.y > 400 ? -14 : 20}
                    textAnchor="middle"
                    fill={isOrigin || isDest ? '#FFFFFF' : '#94A3B8'}
                    fontSize={isOrigin || isDest ? '12' : '10'}
                    fontWeight={isOrigin || isDest ? '700' : '500'}
                    className="pointer-events-none select-none tracking-tight"
                  >
                    {node.name}
                  </text>
                  {node.hindiName && (
                    <text
                      x="0"
                      y={node.y > 400 ? -26 : 32}
                      textAnchor="middle"
                      fill={isOrigin || isDest ? '#38BDF8' : '#64748B'}
                      fontSize="9"
                      fontWeight="400"
                      className="pointer-events-none select-none"
                    >
                      {node.hindiName}
                    </text>
                  )}
                </g>
              );
            })}
          </g>
        </svg>

        {/* Station Detail Inspection Popover */}
        {inspectedNode && (
          <div className="absolute bottom-4 right-4 z-30 max-w-sm bg-slate-950/95 backdrop-blur-md border border-cyan-500/50 p-4 rounded-xl shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-cyan-400">
                  {inspectedNode.code} · {inspectedNode.zone}
                </span>
                <h4 className="text-sm font-bold text-white mt-0.5">
                  {inspectedNode.name} {inspectedNode.hindiName ? `(${inspectedNode.hindiName})` : ''}
                </h4>
              </div>
              <button
                onClick={() => setInspectedNode(null)}
                className="text-slate-400 hover:text-white text-xs px-1.5 py-0.5 rounded bg-slate-800"
              >
                ✕
              </button>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Lines Connected</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {inspectedNode.lines.map((l) => (
                    <span key={l} className="text-[10px] font-mono font-medium px-1.5 py-0.5 bg-cyan-950 text-cyan-300 rounded border border-cyan-800">
                      {l}
                    </span>
                  ))}
                </div>
              </div>

              <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Step-Free Lifts</span>
                <span className={`text-xs font-medium mt-1 inline-block ${inspectedNode.hasElevator ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {inspectedNode.hasElevator ? 'Operational Lift' : 'Stairs Only'}
                </span>
              </div>

              <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                <span className="text-slate-400 block text-[10px]">CISF Security</span>
                <span className={`text-xs font-medium mt-1 inline-block ${inspectedNode.isStaffedNight ? 'text-emerald-400' : 'text-slate-400'}`}>
                  {inspectedNode.isStaffedNight ? '24/7 CISF & CCTV' : 'Day Staffed'}
                </span>
              </div>

              <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Air Quality (AQI)</span>
                <span className="text-xs font-mono font-medium text-cyan-300 mt-1 inline-block">
                  {inspectedNode.aqi} AQI
                </span>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
              <button
                onClick={() => {
                  onSelectNode(inspectedNode.id);
                  setInspectedNode(null);
                  sound.playTactileTick();
                }}
                className="text-cyan-400 hover:text-cyan-300 font-semibold"
              >
                Set as Destination
              </button>
              <span className="text-[10px] text-slate-500">NCMC Smart Card Active</span>
            </div>
          </div>
        )}
      </div>

      {/* Map Legend */}
      <div className="bg-slate-950/90 backdrop-blur-md border-t border-slate-800/80 px-4 py-2.5 flex flex-wrap items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#0284C7]" />
            <span>Blue Line</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#EAB308]" />
            <span>Yellow Line</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]" />
            <span>Vande Bharat</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]" />
            <span>DTC Electric Bus</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#06B6D4]" />
            <span>E-Auto Feeder</span>
          </div>
        </div>

        <div className="flex items-center gap-3 text-[11px]">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Origin</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-pink-500" />
            <span>Destination</span>
          </span>
        </div>
      </div>
    </div>
  );
};
