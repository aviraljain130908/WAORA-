import React, { useState } from 'react';
import { sound } from '../services/soundService';
import { Volume2, VolumeX, Play, Sliders, X, Check } from 'lucide-react';

interface SoundSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isMuted: boolean;
  onMuteToggle: (muted: boolean) => void;
}

export const SoundSettingsModal: React.FC<SoundSettingsModalProps> = ({
  isOpen,
  onClose,
  isMuted,
  onMuteToggle,
}) => {
  const [volume, setVolume] = useState(sound.getVolume());

  if (!isOpen) return null;

  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    sound.setVolume(newVol);
    if (isMuted && newVol > 0) {
      onMuteToggle(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-md bg-[#071325] border border-cyan-500/40 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Spatial Sound Architecture</h3>
              <p className="text-[11px] text-slate-400">Tactile & Atmospheric Synthesizer Controls</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col gap-4">
          {/* Master Sound Switch */}
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              {isMuted ? <VolumeX className="w-4 h-4 text-slate-500" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
              <div>
                <span className="text-xs font-semibold text-white block">Master Tactile Audio</span>
                <span className="text-[10px] text-slate-400">Opt-in non-intrusive sensory cues</span>
              </div>
            </div>
            <button
              onClick={() => {
                onMuteToggle(!isMuted);
              }}
              className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                !isMuted ? 'bg-cyan-500' : 'bg-slate-800'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  !isMuted ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Volume Slider */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Volume Attenuation</span>
              <span className="font-mono text-cyan-300 font-semibold">{Math.round(volume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              disabled={isMuted}
              onChange={(e) => handleVolumeChange(Number(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer disabled:opacity-40"
            />
          </div>

          {/* Test Sound Tones */}
          <div className="flex flex-col gap-2">
            <span className="text-[11px] font-semibold uppercase text-slate-400">Test Synthesized Tones</span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => sound.playTactileTick()}
                disabled={isMuted}
                className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-cyan-500/40 text-slate-200 flex items-center justify-between disabled:opacity-40 transition-colors"
              >
                <span>Tactile Tick</span>
                <Play className="w-3 h-3 text-cyan-400 fill-current" />
              </button>
              <button
                onClick={() => sound.playRouteSweep()}
                disabled={isMuted}
                className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-cyan-500/40 text-slate-200 flex items-center justify-between disabled:opacity-40 transition-colors"
              >
                <span>Route Sweep</span>
                <Play className="w-3 h-3 text-cyan-400 fill-current" />
              </button>
              <button
                onClick={() => sound.playAuraChime()}
                disabled={isMuted}
                className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-cyan-500/40 text-slate-200 flex items-center justify-between disabled:opacity-40 transition-colors"
              >
                <span>Aura Chime</span>
                <Play className="w-3 h-3 text-cyan-400 fill-current" />
              </button>
              <button
                onClick={() => sound.playArrivalChime()}
                disabled={isMuted}
                className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-cyan-500/40 text-slate-200 flex items-center justify-between disabled:opacity-40 transition-colors"
              >
                <span>Arrival Chime</span>
                <Play className="w-3 h-3 text-cyan-400 fill-current" />
              </button>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-800">
            Synthesized purely via native Web Audio API. Zero external audio downloads. Full visual equivalent available for every acoustic cue.
          </div>
        </div>
      </div>
    </div>
  );
};
