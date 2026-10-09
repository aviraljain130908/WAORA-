import React from 'react';
import { RoutePreference, WeatherCondition, IndianCity } from '../types/wayora';
import { TRANSIT_NODES, INDIAN_CITIES_CONFIG } from '../data/transitNetwork';
import { sound } from '../services/soundService';
import { ArrowLeftRight, Clock, Shield, CloudRain, Sun, Zap, HeartHandshake, Compass, Train, Bus, MapPin, Sparkles, Navigation } from 'lucide-react';

interface JourneySearchPanelProps {
  currentCity: IndianCity;
  onCityChange: (city: IndianCity) => void;
  originId: string;
  destinationId: string;
  preference: RoutePreference;
  maxBudget: number;
  maxWalkDistance: number;
  isNightTravel: boolean;
  weather: WeatherCondition;
  onOriginChange: (id: string) => void;
  onDestinationChange: (id: string) => void;
  onPreferenceChange: (pref: RoutePreference) => void;
  onBudgetChange: (val: number) => void;
  onWalkDistanceChange: (val: number) => void;
  onNightTravelToggle: () => void;
  onWeatherToggle: () => void;
  onSearch: () => void;
  onOpenLiveGPS: () => void;
  isLoading: boolean;
}

export const JourneySearchPanel: React.FC<JourneySearchPanelProps> = ({
  currentCity,
  onCityChange,
  originId,
  destinationId,
  preference,
  maxBudget,
  maxWalkDistance,
  isNightTravel,
  weather,
  onOriginChange,
  onDestinationChange,
  onPreferenceChange,
  onBudgetChange,
  onWalkDistanceChange,
  onNightTravelToggle,
  onWeatherToggle,
  onSearch,
  onOpenLiveGPS,
  isLoading,
}) => {
  const handleSwap = () => {
    sound.playTactileTick();
    const temp = originId;
    onOriginChange(destinationId);
    onDestinationChange(temp);
  };

  const cityFilteredNodes = TRANSIT_NODES.filter((n) => n.city === currentCity);

  // Popular Indian Commute Presets
  const popularPresets = [
    { label: 'Airport T3 ⇄ Cyber City', orig: 'DEL-02', dest: 'DEL-03' },
    { label: 'Rajiv Chowk ⇄ Noida 62', orig: 'DEL-01', dest: 'DEL-04' },
    { label: 'Vande Bharat ⇄ Hauz Khas', orig: 'DEL-06', dest: 'DEL-07' },
    { label: 'Kashmere Gate ⇄ Chandni Chowk', orig: 'DEL-05', dest: 'DEL-08' },
  ];

  const preferencesList: { id: RoutePreference; label: string; icon: React.ReactNode }[] = [
    { id: 'fastest', label: 'Fastest Metro', icon: <Zap className="w-3.5 h-3.5 text-cyan-400" /> },
    { id: 'cheapest', label: 'Cheapest DTC/Bus', icon: <span className="font-bold text-xs text-emerald-400">₹</span> },
    { id: 'balanced', label: 'E-Auto + Metro', icon: <Compass className="w-3.5 h-3.5 text-blue-400" /> },
    { id: 'weather_aware', label: 'Monsoon Shield', icon: <CloudRain className="w-3.5 h-3.5 text-sky-400" /> },
    { id: 'safety_conscious', label: 'CISF Night Safe', icon: <Shield className="w-3.5 h-3.5 text-amber-400" /> },
    { id: 'low_walking', label: 'Zero Walk E-Auto', icon: <Clock className="w-3.5 h-3.5 text-purple-400" /> },
    { id: 'accessible', label: 'Lift & Step-Free', icon: <HeartHandshake className="w-3.5 h-3.5 text-pink-400" /> },
  ];

  return (
    <div className="bg-[#071324]/85 backdrop-blur-xl border border-cyan-900/40 rounded-2xl p-5 shadow-2xl flex flex-col gap-4">
      {/* City Switcher Bar */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5" /> Select Indian City Region
          </span>

          {/* Live GPS Quick Launch Button */}
          <button
            onClick={() => {
              sound.playRouteSweep();
              onOpenLiveGPS();
            }}
            className="px-2.5 py-1 bg-cyan-950 hover:bg-cyan-900 border border-cyan-400/50 text-cyan-300 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all shadow-sm"
          >
            <Navigation className="w-3 h-3 fill-current text-cyan-400 animate-pulse" />
            <span>Launch Live GPS</span>
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
          {INDIAN_CITIES_CONFIG.map((c) => {
            const isSelected = c.id === currentCity;
            return (
              <button
                key={c.id}
                onClick={() => {
                  sound.playTactileTick();
                  onCityChange(c.id);
                  onOriginChange(c.defaultOrigin);
                  onDestinationChange(c.defaultDest);
                }}
                className={`py-2 px-2.5 rounded-xl text-left border transition-all ${
                  isSelected
                    ? 'bg-gradient-to-r from-cyan-950 to-blue-950 border-cyan-400 text-white shadow-md shadow-cyan-950/50'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <div className="text-xs font-bold leading-tight truncate">{c.name}</div>
                <div className="text-[10px] text-slate-400 truncate mt-0.5">{c.metroSystem.split(' ')[0]}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 1-Click Popular Commute Presets */}
      <div className="flex flex-col gap-1.5 pt-1">
        <span className="text-[10px] font-semibold uppercase text-slate-400 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-amber-400" /> Fast Route Suggestions
        </span>
        <div className="flex flex-wrap gap-1.5">
          {popularPresets.map((p) => (
            <button
              key={p.label}
              onClick={() => {
                sound.playTactileTick();
                onOriginChange(p.orig);
                onDestinationChange(p.dest);
              }}
              className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:border-cyan-500/50 hover:text-cyan-300 transition-colors"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Origin & Destination Inputs with Hindi + English Names */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] items-center gap-2.5 pt-1">
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            Origin (शुरुआत)
          </label>
          <select
            value={originId}
            onChange={(e) => {
              onOriginChange(e.target.value);
              sound.playTactileTick();
            }}
            className="w-full bg-slate-900/90 border border-slate-700 hover:border-cyan-500/50 focus:border-cyan-400 text-slate-100 text-xs rounded-xl px-3 py-2.5 outline-none transition-colors"
          >
            {cityFilteredNodes.map((n) => (
              <option key={`orig-${n.id}`} value={n.id}>
                {n.name} {n.hindiName ? `(${n.hindiName})` : ''}
              </option>
            ))}
          </select>
        </div>

        <div className="flex justify-center md:pt-4">
          <button
            onClick={handleSwap}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-cyan-500/60 text-slate-400 hover:text-cyan-300 transition-all hover:rotate-180"
            title="Swap Origin & Destination"
          >
            <ArrowLeftRight className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-pink-500" />
            Destination (गंतव्य)
          </label>
          <select
            value={destinationId}
            onChange={(e) => {
              onDestinationChange(e.target.value);
              sound.playTactileTick();
            }}
            className="w-full bg-slate-900/90 border border-slate-700 hover:border-cyan-500/50 focus:border-cyan-400 text-slate-100 text-xs rounded-xl px-3 py-2.5 outline-none transition-colors"
          >
            {cityFilteredNodes.map((n) => (
              <option key={`dest-${n.id}`} value={n.id}>
                {n.name} {n.hindiName ? `(${n.hindiName})` : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Optimization Mode Tabs */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Optimization Mode
        </span>
        <div className="flex flex-wrap items-center gap-1.5">
          {preferencesList.map((p) => {
            const isSelected = preference === p.id;
            return (
              <button
                key={p.id}
                onClick={() => {
                  onPreferenceChange(p.id);
                  sound.playTactileTick();
                }}
                className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                  isSelected
                    ? 'bg-cyan-500/20 text-cyan-200 border-cyan-400/60 shadow-sm shadow-cyan-500/30'
                    : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                {p.icon}
                <span>{p.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Constraints Sliders & Weather Button */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t border-slate-800/80">
        <div className="flex flex-col gap-1">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400">Budget Constraint</span>
            <span className="font-mono text-cyan-300 font-semibold">₹{maxBudget}</span>
          </div>
          <input
            type="range"
            min="20"
            max="100"
            step="5"
            value={maxBudget}
            onChange={(e) => onBudgetChange(Number(e.target.value))}
            className="w-full accent-cyan-400 cursor-pointer"
          />
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400">Max Walk Distance</span>
            <span className="font-mono text-cyan-300 font-semibold">{maxWalkDistance} m</span>
          </div>
          <input
            type="range"
            min="100"
            max="1000"
            step="50"
            value={maxWalkDistance}
            onChange={(e) => onWalkDistanceChange(Number(e.target.value))}
            className="w-full accent-cyan-400 cursor-pointer"
          />
        </div>

        <div className="flex items-center justify-between md:justify-end gap-3 pt-1 md:pt-0">
          <button
            onClick={() => {
              onWeatherToggle();
              sound.playTactileTick();
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
              weather.condition.includes('rain')
                ? 'bg-sky-950 text-sky-300 border-sky-500/50'
                : 'bg-slate-900 text-amber-300 border-slate-800'
            }`}
          >
            {weather.condition.includes('rain') ? <CloudRain className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
            <span className="capitalize">{weather.condition.includes('rain') ? 'Monsoon Rain' : 'Clear Skies'}</span>
          </button>
        </div>
      </div>

      {/* Search Button */}
      <div className="flex items-center justify-between pt-1">
        <span className="text-[11px] text-slate-400">
          Integrated UPI / NCMC Metro Card Tap Active
        </span>
        <button
          onClick={() => {
            sound.playRouteSweep();
            onSearch();
          }}
          disabled={isLoading}
          className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-xs tracking-wide rounded-xl shadow-lg shadow-cyan-500/25 transition-all flex items-center gap-2 disabled:opacity-50"
        >
          {isLoading ? (
            <span>Calculating Indian Corridors...</span>
          ) : (
            <>
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>Calculate Best Routes</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
