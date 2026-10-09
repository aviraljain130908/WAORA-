import React from 'react';
import { sound } from '../services/soundService';
import { Volume2, VolumeX, Sparkles, ShieldAlert, Share2 } from 'lucide-react';

interface WayoraHeaderProps {
  onOpenAura: () => void;
  onOpenDisruptions: () => void;
  onOpenSOS: () => void;
  onOpenShare: () => void;
  onOpenSoundSettings: () => void;
  isMuted: boolean;
  onMuteToggle: (val: boolean) => void;
  activeSection: string;
  onNavigateSection: (section: string) => void;
}

export const WayoraHeader: React.FC<WayoraHeaderProps> = ({
  onOpenAura,
  onOpenDisruptions,
  onOpenSOS,
  onOpenShare,
  onOpenSoundSettings,
  isMuted,
  onMuteToggle,
  activeSection,
  onNavigateSection,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#050B14]/85 backdrop-blur-xl border-b border-cyan-900/40">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-3.5 flex items-center justify-between gap-8">
        {/* Zone 1: Brand Wordmark (Single text element in display face) */}
        <div className="flex items-center gap-3 shrink-0">
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              onNavigateSection('planner');
            }}
            className="text-xl font-extrabold tracking-tight text-white hover:text-cyan-300 transition-colors whitespace-nowrap shrink-0 flex items-center gap-2"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400/80" />
            <span className="bg-gradient-to-r from-cyan-400 via-sky-200 to-white bg-clip-text text-transparent">
              WAYORA
            </span>
          </a>
        </div>

        {/* Zone 2: 4-5 Nav Links (Single line, whitespace-nowrap) */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-semibold tracking-wide text-slate-300">
          <button
            onClick={() => {
              onNavigateSection('planner');
              sound.playTactileTick();
            }}
            className={`transition-colors whitespace-nowrap shrink-0 hover:text-cyan-300 ${
              activeSection === 'planner' ? 'text-cyan-400' : ''
            }`}
          >
            Journey Planner
          </button>
          <button
            onClick={() => {
              onNavigateSection('map');
              sound.playTactileTick();
            }}
            className={`transition-colors whitespace-nowrap shrink-0 hover:text-cyan-300 ${
              activeSection === 'map' ? 'text-cyan-400' : ''
            }`}
          >
            Spatial Map
          </button>
          <button
            onClick={() => {
              onOpenDisruptions();
              sound.playTactileTick();
            }}
            className="transition-colors whitespace-nowrap shrink-0 hover:text-cyan-300"
          >
            Disruptions & Alerts
          </button>
          <button
            onClick={() => {
              onOpenShare();
              sound.playTactileTick();
            }}
            className="transition-colors whitespace-nowrap shrink-0 hover:text-cyan-300"
          >
            Live Check-in
          </button>
          <button
            onClick={() => {
              onOpenSOS();
              sound.playTactileTick();
            }}
            className="text-red-400 hover:text-red-300 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            Emergency SOS
          </button>
        </nav>

        {/* Zone 3: 1 Primary Action + Audio Quick Control */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Quick Sound Mute Button */}
          <button
            onClick={() => {
              onMuteToggle(!isMuted);
            }}
            className={`p-2 rounded-xl border text-xs transition-colors ${
              !isMuted
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-sm shadow-cyan-500/20'
                : 'bg-slate-900 text-slate-500 border-slate-800 hover:text-slate-300'
            }`}
            title={isMuted ? 'Sound Muted (Click to enable sensory audio)' : 'Sound Enabled'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Primary Action Button */}
          <button
            onClick={() => {
              sound.playAuraChime();
              onOpenAura();
            }}
            className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-cyan-500/25 transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Launch Aura</span>
          </button>
        </div>
      </div>
    </header>
  );
};
