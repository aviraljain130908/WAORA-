import React, { useState } from 'react';
import { JourneyRoute } from '../types/wayora';
import { sound } from '../services/soundService';
import { Share2, Copy, Check, Lock, BellRing, X } from 'lucide-react';

interface JourneyShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedRoute: JourneyRoute | null;
}

export const JourneyShareModal: React.FC<JourneyShareModalProps> = ({
  isOpen,
  onClose,
  selectedRoute,
}) => {
  const [copied, setCopied] = useState(false);
  const [activeCheckIn, setActiveCheckIn] = useState<string | null>(null);

  if (!isOpen) return null;

  const trackingLink = `https://wayora.app/live/track-${selectedRoute?.id.slice(0, 8) || 'current'}`;

  const handleCopy = () => {
    sound.playTactileTick();
    navigator.clipboard?.writeText(trackingLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const triggerCheckIn = (text: string) => {
    sound.playTactileTick();
    setActiveCheckIn(text);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-md bg-[#071325] border border-cyan-500/40 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Share Journey & Live Check-in</h3>
              <p className="text-[11px] text-slate-400">Consent-Based Real-time Tracking</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 flex flex-col gap-4">
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex flex-col gap-2">
            <span className="text-[11px] font-semibold uppercase text-slate-400">Secure Live Tracking Link</span>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={trackingLink}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-cyan-300 outline-none"
              />
              <button
                onClick={handleCopy}
                className="px-3 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Quick Check-in broadcasts */}
          <div className="flex flex-col gap-2">
            <span className="text-[11px] font-semibold uppercase text-slate-400">Automated SMS / WhatsApp Check-ins</span>
            <div className="grid grid-cols-1 gap-2">
              {[
                'Departing safely from origin concourse',
                'Successfully boarded transit coach',
                'At interchange transfer point',
                'Arrived safely at destination',
              ].map((msg) => (
                <button
                  key={msg}
                  onClick={() => triggerCheckIn(msg)}
                  className={`p-2.5 rounded-lg border text-xs text-left transition-all flex items-center justify-between ${
                    activeCheckIn === msg
                      ? 'bg-emerald-950/60 border-emerald-500/60 text-emerald-200'
                      : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <span>"{msg}"</span>
                  <BellRing className={`w-3.5 h-3.5 ${activeCheckIn === msg ? 'text-emerald-400' : 'text-slate-500'}`} />
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-400 border-t border-slate-800 pt-3">
            <Lock className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span>End-to-end encrypted. Tracking expires automatically 1 hour after estimated arrival.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
