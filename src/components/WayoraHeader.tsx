import React from 'react';
import { sound } from '../services/soundService';
import { Volume2, VolumeX, Sparkles, ShieldAlert, Share2 } from 'lucide-react';

import { User } from 'firebase/auth';

interface WayoraHeaderProps {
  onOpenAura: () => void;
  onOpenDisruptions: () => void;
  onOpenSOS: () => void;
  onOpenShare: () => void;
  onOpenSoundSettings: () => void;
  onOpenAuth: () => void;
  currentUser: User | null;
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
  onOpenAuth,
  currentUser,
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

        {/* Zone 3: 1 Primary Action + Audio Quick Control + Auth */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Google Sign-in / User Profile Button */}
          <button
            onClick={() => {
              sound.playTactileTick();
              onOpenAuth();
            }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
              currentUser
                ? 'bg-cyan-950/50 border-cyan-500/40 text-cyan-200 hover:border-cyan-400'
                : 'bg-white/10 hover:bg-white/15 border-white/20 text-white'
            }`}
          >
            {currentUser ? (
              <>
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.displayName || 'User'}
                    className="w-5 h-5 rounded-full border border-cyan-400 object-cover"
                  />
                ) : (
                  <span className="w-5 h-5 rounded-full bg-cyan-500/30 text-cyan-300 flex items-center justify-center text-[10px] font-bold">
                    {(currentUser.displayName || currentUser.email || 'U')[0].toUpperCase()}
                  </span>
                )}
                <span className="max-w-[80px] sm:max-w-[120px] truncate hidden sm:inline">
                  {currentUser.displayName || 'Account'}
                </span>
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.27 21.43 7.35 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.16 0 9.98 0 12s.45 3.84 1.25 5.42l4.03-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.27 2.57 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
                <span>Sign In</span>
              </>
            )}
          </button>

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
