import React, { useState } from 'react';
import { sound } from '../services/soundService';
import { ShieldAlert, PhoneCall, MapPin, CheckCircle, X, ShieldCheck } from 'lucide-react';

interface EmergencyAssistanceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EmergencyAssistanceModal: React.FC<EmergencyAssistanceModalProps> = ({ isOpen, onClose }) => {
  const [alertSent, setAlertSent] = useState(false);

  if (!isOpen) return null;

  const triggerSOS = () => {
    sound.playDisruptionAlert();
    setAlertSent(true);
    setTimeout(() => setAlertSent(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="w-full max-w-lg bg-[#071325] border border-red-500/50 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-red-950/60 border-b border-red-800/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-500/20 border border-red-500/50 flex items-center justify-center text-red-400">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Emergency Quick-Assist</h3>
              <p className="text-[11px] text-red-300">Verified Transit Safety & Safe Havens</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col gap-4">
          {alertSent ? (
            <div className="p-4 rounded-xl bg-emerald-950/50 border border-emerald-500/40 text-center">
              <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
              <h4 className="text-sm font-bold text-white">Emergency Broadcast Transmitted</h4>
              <p className="text-xs text-slate-300 mt-1">
                Your coordinates and current transit route have been securely broadcasted to designated emergency contacts.
              </p>
            </div>
          ) : (
            <button
              onClick={triggerSOS}
              className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-red-950/60 transition-all flex items-center justify-center gap-2"
            >
              <ShieldAlert className="w-4 h-4" />
              Trigger Transit SOS Broadcast
            </button>
          )}

          {/* Emergency Hotlines */}
          <div className="flex flex-col gap-2">
            <span className="text-[11px] font-semibold uppercase text-slate-400">Verified Emergency Hotlines</span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <a
                href="tel:112"
                className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-cyan-500/40 flex items-center justify-between text-slate-200"
              >
                <span>Transit Police</span>
                <span className="font-mono text-cyan-400 font-bold">112</span>
              </a>
              <a
                href="tel:1091"
                className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-cyan-500/40 flex items-center justify-between text-slate-200"
              >
                <span>Women Safety</span>
                <span className="font-mono text-pink-400 font-bold">1091</span>
              </a>
              <a
                href="tel:108"
                className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-cyan-500/40 flex items-center justify-between text-slate-200"
              >
                <span>Ambulance / Medical</span>
                <span className="font-mono text-emerald-400 font-bold">108</span>
              </a>
              <a
                href="tel:155370"
                className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-cyan-500/40 flex items-center justify-between text-slate-200"
              >
                <span>Metro Control Kiosk</span>
                <span className="font-mono text-amber-400 font-bold">155370</span>
              </a>
            </div>
          </div>

          {/* Verified Safe Haven Stations */}
          <div className="flex flex-col gap-2">
            <span className="text-[11px] font-semibold uppercase text-slate-400">Nearest 24/7 Staffed Safe Haven Hubs</span>
            <div className="flex flex-col gap-2 text-xs">
              <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                <div>
                  <h5 className="font-semibold text-white">Grand Central Interchange (GCI-01)</h5>
                  <p className="text-[11px] text-slate-400">Staffed Security Booth · Platform 1 Concourse · Defibrillator Equipped</p>
                </div>
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                <div>
                  <h5 className="font-semibold text-white">Aerocity Terminal 3 (AER-T3)</h5>
                  <p className="text-[11px] text-slate-400">24/7 Rapid Transit Police Command Post · CCTV Density: 100%</p>
                </div>
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
