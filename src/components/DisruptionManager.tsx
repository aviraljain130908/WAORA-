import React, { useState } from 'react';
import { DisruptionAlert, CommunityReport } from '../types/wayora';
import { TRANSIT_LINES, TRANSIT_NODES } from '../data/transitNetwork';
import { sound } from '../services/soundService';
import { AlertTriangle, ThumbsUp, PlusCircle, CheckCircle, ShieldAlert, X, Info } from 'lucide-react';

interface DisruptionManagerProps {
  isOpen: boolean;
  onClose: () => void;
  disruptions: DisruptionAlert[];
  onAddReport: (report: Partial<CommunityReport>) => void;
  onCorroborate: (disruptionId: string) => void;
}

export const DisruptionManager: React.FC<DisruptionManagerProps> = ({
  isOpen,
  onClose,
  disruptions,
  onAddReport,
  onCorroborate,
}) => {
  const [activeTab, setActiveTab] = useState<'feed' | 'report'>('feed');
  const [selectedLine, setSelectedLine] = useState('M2');
  const [selectedStation, setSelectedStation] = useState('N3');
  const [issueType, setIssueType] = useState<CommunityReport['issueType']>('delay');
  const [description, setDescription] = useState('');
  const [hasSubmitted, setHasSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    sound.playTactileTick();
    onAddReport({
      lineId: selectedLine,
      stationId: selectedStation,
      issueType,
      description,
    });

    setHasSubmitted(true);
    setTimeout(() => {
      setHasSubmitted(false);
      setDescription('');
      setActiveTab('feed');
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-xl bg-[#071325] border border-cyan-500/40 rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-950/60 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Transit Alerts & Community Reports</h3>
              <p className="text-[11px] text-slate-400">Verified Disruption Intelligence & Live Headway</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="px-4 pt-3 flex gap-2 border-b border-slate-800 bg-slate-950/40">
          <button
            onClick={() => setActiveTab('feed')}
            className={`pb-2.5 text-xs font-semibold px-2 border-b-2 transition-colors ${
              activeTab === 'feed'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Active Disruptions ({disruptions.length})
          </button>
          <button
            onClick={() => setActiveTab('report')}
            className={`pb-2.5 text-xs font-semibold px-2 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'report'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <PlusCircle className="w-3.5 h-3.5" />
            Submit Community Report
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
          {activeTab === 'feed' ? (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-cyan-950/30 border border-cyan-800/40 text-[11px] text-cyan-300">
                <Info className="w-4 h-4 shrink-0 text-cyan-400" />
                <span>
                  WAYORA utilizes automated duplicate detection and multi-passenger corroboration to verify passenger delay claims before propagating rerouting recommendations.
                </span>
              </div>

              {disruptions.map((d) => (
                <div
                  key={d.id}
                  className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col gap-2.5 hover:border-slate-700 transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 text-[11px]">
                        <span className="font-mono text-cyan-300 font-semibold">{d.lineName}</span>
                        <span aria-hidden="true" className="text-slate-600">·</span>
                        <span className="text-slate-400">{d.reportedAt}</span>
                      </div>
                      <h4 className="text-xs font-bold text-white mt-1">{d.title}</h4>
                    </div>

                    {/* Verification Badge */}
                    <span
                      className={`text-[10px] font-medium px-2 py-0.5 rounded-md border ${
                        d.verificationStatus === 'verified_authority'
                          ? 'bg-emerald-950 text-emerald-300 border-emerald-700/50'
                          : 'bg-amber-950 text-amber-300 border-amber-700/50'
                      }`}
                    >
                      {d.verificationStatus === 'verified_authority'
                        ? 'Authority Verified'
                        : 'Community Corroborated'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">{d.description}</p>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
                    <span className="text-[11px] text-slate-400">
                      Corroborated by <strong className="text-slate-200">{d.corroborationCount}</strong> passengers
                    </span>

                    <button
                      onClick={() => {
                        sound.playTactileTick();
                        onCorroborate(d.id);
                      }}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-cyan-900/40 text-slate-300 hover:text-cyan-300 transition-colors text-xs"
                    >
                      <ThumbsUp className="w-3 h-3" />
                      Corroborate (+1)
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
              {hasSubmitted ? (
                <div className="p-8 text-center bg-emerald-950/40 border border-emerald-500/40 rounded-xl">
                  <CheckCircle className="w-8 h-8 mx-auto text-emerald-400 mb-2" />
                  <h4 className="text-sm font-bold text-white">Report Submitted Successfully</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Your report has entered the corroboration pipeline. Thank you for keeping WAYORA accurate.
                  </p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] text-slate-400 font-semibold uppercase">Transit Line</label>
                      <select
                        value={selectedLine}
                        onChange={(e) => setSelectedLine(e.target.value)}
                        className="bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-100 outline-none"
                      >
                        {TRANSIT_LINES.map((l) => (
                          <option key={l.id} value={l.id}>
                            {l.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] text-slate-400 font-semibold uppercase">Station / Stop</label>
                      <select
                        value={selectedStation}
                        onChange={(e) => setSelectedStation(e.target.value)}
                        className="bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-100 outline-none"
                      >
                        {TRANSIT_NODES.map((n) => (
                          <option key={n.id} value={n.id}>
                            {n.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] text-slate-400 font-semibold uppercase">Incident Category</label>
                    <select
                      value={issueType}
                      onChange={(e) => setIssueType(e.target.value as any)}
                      className="bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-100 outline-none"
                    >
                      <option value="delay">Service Delay (+10m)</option>
                      <option value="overcrowding">Platform Severe Overcrowding</option>
                      <option value="elevator_fault">Elevator / Escalator Out of Order</option>
                      <option value="waterlogging">Waterlogging / Rain Ingress</option>
                      <option value="security_concern">Lighting / Staffing Absence</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] text-slate-400 font-semibold uppercase">Observations</label>
                    <textarea
                      rows={3}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Specify platform number, expected delay, or alternative advice..."
                      className="bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-100 outline-none focus:border-cyan-400"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full mt-2 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold text-xs rounded-xl shadow-lg transition-all"
                  >
                    Transmit Community Verification Report
                  </button>
                </>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
