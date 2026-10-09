import React from 'react';
import { ThreeMobilityUniverse } from './ThreeMobilityUniverse';
import { AuraState, WeatherCondition } from '../types/wayora';
import { sound } from '../services/soundService';
import { Navigation2, Sparkles, Navigation, ShieldCheck, Zap } from 'lucide-react';

interface ImmersiveHeroProps {
  auraState: AuraState;
  weather: WeatherCondition;
  onExploreClick: () => void;
  onOpenAura: () => void;
  onOpenLiveGPS: () => void;
  onSelectNode: (nodeId: string) => void;
}

export const ImmersiveHero: React.FC<ImmersiveHeroProps> = ({
  auraState,
  weather,
  onExploreClick,
  onOpenAura,
  onOpenLiveGPS,
  onSelectNode,
}) => {
  return (
    <section className="relative w-full min-h-[640px] flex flex-col justify-center overflow-hidden border-b border-cyan-900/40">
      {/* 3D Canvas Background Layer */}
      <div className="absolute inset-0 z-0">
        <ThreeMobilityUniverse
          auraState={auraState}
          weather={weather}
          onSelectNode={onSelectNode}
          interactive={true}
        />
        {/* Scrim gradients */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#050B14]/95 via-[#050B14]/80 to-transparent pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050B14] via-transparent to-transparent pointer-events-none" />
      </div>

      {/* Semantic Content Container */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 py-12 pointer-events-none">
        <div className="max-w-2xl flex flex-col gap-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-cyan-400">
            <span>India Multi-Modal Transit Universe</span>
            <span aria-hidden="true">·</span>
            <span>सफ़र का नया अनुभव</span>
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.1] text-balance">
            Move Smarter.{' '}
            <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-amber-300 bg-clip-text text-transparent">
              Feel the Journey.
            </span>
          </h1>

          <p className="text-base text-slate-300 leading-relaxed max-w-xl">
            Next-generation Indian urban mobility connecting high-speed Metro lines, Vande Bharat rail corridors, green electric buses, and last-mile Smart E-Autos in real-time.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-2 pointer-events-auto">
            <button
              onClick={() => {
                sound.playRouteSweep();
                onExploreClick();
              }}
              className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs tracking-wider uppercase rounded-xl shadow-xl shadow-cyan-500/25 transition-all flex items-center gap-2"
            >
              <Navigation2 className="w-4 h-4 fill-current" />
              <span>Explore Route Planner</span>
            </button>

            <button
              onClick={() => {
                sound.playRouteSweep();
                onOpenLiveGPS();
              }}
              className="px-5 py-3 bg-emerald-950/80 hover:bg-emerald-900/80 border border-emerald-500/50 text-emerald-300 text-xs font-bold rounded-xl backdrop-blur-md transition-all flex items-center gap-2 shadow-lg shadow-emerald-950/40"
            >
              <Navigation className="w-4 h-4 fill-current animate-pulse text-emerald-400" />
              <span>Live GPS Navigation</span>
            </button>

            <button
              onClick={() => {
                sound.playAuraChime();
                onOpenAura();
              }}
              className="px-4 py-3 bg-slate-900/90 hover:bg-slate-800 border border-slate-700 hover:border-cyan-500/60 text-slate-200 text-xs font-semibold rounded-xl backdrop-blur-md transition-all flex items-center gap-1.5"
            >
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>Aura AI Companion</span>
            </button>
          </div>

          {/* Mode Highlights with High-Fidelity Generated Images */}
          <div className="grid grid-cols-3 gap-3 pt-4 pointer-events-auto max-w-lg">
            {/* 1. Metro */}
            <div className="group relative rounded-xl overflow-hidden border border-slate-800 hover:border-cyan-500/50 transition-all bg-slate-950/60 shadow-lg">
              <img
                src="/src/assets/images/india_metro_futuristic_1791572831642.jpg"
                alt="Rapid Metro viaduct corridor"
                referrerPolicy="no-referrer"
                className="w-full h-16 object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="p-2 bg-slate-950/90">
                <span className="text-[11px] font-bold text-white block truncate">Rapid Metro</span>
                <span className="text-[10px] text-cyan-400">DMRC & MMRDA</span>
              </div>
            </div>

            {/* 2. E-Auto */}
            <div className="group relative rounded-xl overflow-hidden border border-slate-800 hover:border-emerald-500/50 transition-all bg-slate-950/60 shadow-lg">
              <img
                src="/src/assets/images/india_e_autorickshaw_1791572846379.jpg"
                alt="Smart electric auto rickshaw feeder"
                referrerPolicy="no-referrer"
                className="w-full h-16 object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="p-2 bg-slate-950/90">
                <span className="text-[11px] font-bold text-white block truncate">Smart E-Auto</span>
                <span className="text-[10px] text-emerald-400">Doorstep Feeder</span>
              </div>
            </div>

            {/* 3. Vande Bharat */}
            <div className="group relative rounded-xl overflow-hidden border border-slate-800 hover:border-amber-500/50 transition-all bg-slate-950/60 shadow-lg">
              <img
                src="/src/assets/images/india_vande_bharat_express_1791572857938.jpg"
                alt="Vande Bharat semi-high speed train terminal"
                referrerPolicy="no-referrer"
                className="w-full h-16 object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="p-2 bg-slate-950/90">
                <span className="text-[11px] font-bold text-white block truncate">Vande Bharat</span>
                <span className="text-[10px] text-amber-400">130 km/h Express</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
