import React, { useState } from 'react';
import { sound } from '../services/soundService';
import { Play, RotateCcw, ChevronRight, CheckCircle2, Sparkles } from 'lucide-react';

interface DemoScenarioControllerProps {
  onRunStep: (stepNumber: number) => void;
  onResetDemo: () => void;
  currentStep: number;
}

export const DemoScenarioController: React.FC<DemoScenarioControllerProps> = ({
  onRunStep,
  onResetDemo,
  currentStep,
}) => {
  const steps = [
    { title: 'Discover', desc: 'Initialize trip between Aerocity & Lotus Lake' },
    { title: 'Connect', desc: 'Calculate multi-modal network transit corridors' },
    { title: 'Compare', desc: 'Evaluate 6 distinct routes by fare, time & CO₂' },
    { title: 'Personalise', desc: 'Enforce budget constraint (₹50 economy cap)' },
    { title: 'Consult Aura', desc: 'Engage contextual voice & intent reasoning' },
    { title: 'Simulate Rain', desc: 'Trigger monsoon downpour & road delay' },
    { title: 'Smart Reroute', desc: 'Automated recovery bypass via Feeder Shuttle' },
    { title: 'Arrival', desc: 'Verify step-free arrival & live check-in' },
  ];

  return (
    <div className="bg-[#071324]/90 backdrop-blur-xl border border-cyan-500/40 rounded-2xl p-4 shadow-2xl flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-white">
            Deterministic Demo Showcase
          </h3>
        </div>

        <button
          onClick={() => {
            sound.playTactileTick();
            onResetDemo();
          }}
          className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
        >
          <RotateCcw className="w-3 h-3" />
          Reset Demo
        </button>
      </div>

      {/* Step Pills Progress Bar */}
      <div className="grid grid-cols-4 md:grid-cols-8 gap-1.5">
        {steps.map((st, idx) => {
          const stepNum = idx + 1;
          const isDone = currentStep > stepNum;
          const isCurrent = currentStep === stepNum;

          return (
            <button
              key={st.title}
              onClick={() => {
                sound.playTactileTick();
                onRunStep(stepNum);
              }}
              className={`p-2 rounded-lg border text-left flex flex-col transition-all ${
                isCurrent
                  ? 'bg-cyan-500/20 border-cyan-400 text-white shadow-sm shadow-cyan-500/30'
                  : isDone
                  ? 'bg-emerald-950/40 border-emerald-800/60 text-slate-300'
                  : 'bg-slate-900/60 border-slate-800/80 text-slate-500 hover:border-slate-700'
              }`}
            >
              <span className="text-[10px] font-mono font-bold flex items-center justify-between">
                <span>0{stepNum}</span>
                {isDone && <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />}
              </span>
              <span className="text-[11px] font-semibold truncate mt-0.5">{st.title}</span>
            </button>
          );
        })}
      </div>

      {/* Current Step Description & Action Button */}
      <div className="flex items-center justify-between pt-1">
        <div className="text-xs text-slate-300">
          <span className="text-cyan-400 font-semibold mr-1.5">Scene {currentStep}:</span>
          <span>{steps[currentStep - 1]?.desc || 'Completed'}</span>
        </div>

        {currentStep < 8 ? (
          <button
            onClick={() => {
              sound.playRouteSweep();
              onRunStep(currentStep + 1);
            }}
            className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1 transition-colors shadow-md shadow-cyan-950/50"
          >
            <span>Next Scene</span>
            <ChevronRight className="w-3 h-3" />
          </button>
        ) : (
          <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Showcase Sequence Complete
          </span>
        )}
      </div>
    </div>
  );
};
