import React, { useState, useEffect, useRef } from 'react';
import { AuraMessage, AuraState, JourneyRoute, RoutePreference } from '../types/wayora';
import { sound } from '../services/soundService';
import { Mic, MicOff, Send, Volume2, VolumeX, Sparkles, X } from 'lucide-react';

interface AuraAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedRoute: JourneyRoute | null;
  onApplyPreference: (pref: RoutePreference) => void;
  onApplyBudget: (budget: number) => void;
  onTriggerReroute: (stationId: string) => void;
  onTriggerWeather: () => void;
  onOpenSOS: () => void;
  onOpenLiveGPS?: () => void;
}

export const AuraAssistantModal: React.FC<AuraAssistantModalProps> = ({
  isOpen,
  onClose,
  selectedRoute,
  onApplyPreference,
  onApplyBudget,
  onTriggerReroute,
  onTriggerWeather,
  onOpenSOS,
  onOpenLiveGPS,
}) => {
  const [messages, setMessages] = useState<AuraMessage[]>([
    {
      id: 'm-welcome',
      sender: 'aura',
      text: 'नमस्ते! I am Aura, your Indian mobility companion. I monitor live DMRC Metro schedules, Vande Bharat departures, DTC electric buses, and E-Rickshaw feeder connections. How may I help you commute today?',
      timestamp: 'Just now',
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [auraState, setAuraState] = useState<AuraState>('idle');
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [selectedLang, setSelectedLang] = useState('en-IN');
  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRec) {
        const recognition = new SpeechRec();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = selectedLang;

        recognition.onstart = () => {
          setAuraState('listening');
          sound.playAuraChime();
        };

        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          handleUserQuery(transcript);
        };

        recognition.onerror = () => {
          setAuraState('error');
          setTimeout(() => setAuraState('idle'), 2000);
        };

        recognition.onend = () => {
          if (auraState === 'listening') {
            setAuraState('idle');
          }
        };

        recognitionRef.current = recognition;
      }
    }
  }, [selectedLang]);

  const speakText = (text: string) => {
    if (!voiceEnabled || typeof window === 'undefined' || !window.speechSynthesis) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = selectedLang;
      utterance.rate = 1.05;
      utterance.onstart = () => setAuraState('speaking');
      utterance.onend = () => setAuraState('idle');
      utterance.onerror = () => setAuraState('idle');
      window.speechSynthesis.speak(utterance);
    } catch {
      setAuraState('idle');
    }
  };

  const startListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
      } catch {
        recognitionRef.current.stop();
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setAuraState('idle');
  };

  const handleUserQuery = (query: string) => {
    if (!query.trim()) return;

    sound.playTactileTick();
    const userMsg: AuraMessage = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: 'Just now',
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setAuraState('processing');

    setTimeout(() => {
      processIntent(query);
    }, 450);
  };

  const processIntent = async (query: string) => {
    const q = query.toLowerCase();
    let reply = '';
    let action = '';

    try {
      const res = await fetch('/api/aura/assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, contextRoute: selectedRoute }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.responseText) {
          reply = data.responseText;
        }
        if (data.recommendedAction) {
          const act = data.recommendedAction;
          if (act.action === 'set_preference') {
            onApplyPreference(act.preference);
            if (act.maxBudget) onApplyBudget(act.maxBudget);
          } else if (act.action === 'trigger_reroute') {
            onTriggerReroute(act.stationId);
          } else if (act.action === 'set_weather') {
            onTriggerWeather();
          }
          action = `Applied ${act.action.replace('_', ' ')}`;
        }
      }
    } catch (e) {
      console.warn('[Aura Client] Fetch failed, using client engine fallback:', e);
    }

    if (!reply) {
      if (q.includes('gps') || q.includes('track') || q.includes('navigation') || q.includes('cockpit')) {
        if (onOpenLiveGPS) onOpenLiveGPS();
        reply = 'Starting Live GPS Navigation Cockpit with speedometer and real-time waypoint tracking.';
        action = 'Launched Live GPS Cockpit';
      } else if (q.includes('cheap') || q.includes('kam') || q.includes('paisa') || q.includes('fare') || q.includes('₹')) {
        const budgetMatch = q.match(/\d+/);
        const budget = budgetMatch ? parseInt(budgetMatch[0], 10) : 35;
        onApplyBudget(budget);
        onApplyPreference('cheapest');
        reply = `Budget mode set to ₹${budget}. Switched to state electric bus and shared E-Rickshaw feeder routes to minimize travel cost.`;
        action = `Applied budget limit ₹${budget}`;
      } else if (q.includes('missed') || q.includes('chhoot') || q.includes('reroute')) {
        onTriggerReroute('DEL-01');
        reply = `Missed connection detected at Rajiv Chowk. I have routed you to an immediate Smart E-Auto bypass connecting to the Blue Line with zero transfer delay.`;
        action = 'Recalculated E-Auto bypass reroute';
      } else if (q.includes('rain') || q.includes('barish') || q.includes('weather') || q.includes('monsoon')) {
        onTriggerWeather();
        onApplyPreference('weather_aware');
        reply = `Monsoon mode engaged. All surface walking minimized; 100% underground Metro Blue & Yellow corridors with covered skywalks prioritized.`;
        action = 'Engaged Monsoon Weather Shield';
      } else if (q.includes('night') || q.includes('safe') || q.includes('mahila') || q.includes('cisf') || q.includes('women')) {
        onApplyPreference('safety_conscious');
        reply = `Guardian Night Corridor engaged. Routing strictly through 24/7 CISF-staffed stations with dedicated women coaches and high-luminance paths.`;
        action = 'Activated CISF Night Safety';
      } else if (q.includes('fast') || q.includes('jaldi') || q.includes('metro') || q.includes('vande bharat')) {
        onApplyPreference('fastest');
        reply = `Speed priority activated. Routing via High-Speed Airport Express and automated Delhi Metro cross-platform lines.`;
        action = 'Selected Fastest Express Corridor';
      } else if (q.includes('sos') || q.includes('police') || q.includes('emergency') || q.includes('help')) {
        onOpenSOS();
        reply = `Emergency Quick-Assist opened. Dialing 112 (Police), 1091 (Women Safety), or connecting to the nearest Metro Station Controller.`;
        action = 'Opened Emergency SOS modal';
      } else {
        reply = `Main aapki transit query samajh gaya. Delhi NCR aur Indian metro corridors bilkul on-time chal rahe hain. Would you like to check the fastest route or start live GPS tracking?`;
      }
    }

    setAuraState('speaking');
    sound.playAuraChime();

    const auraMsg: AuraMessage = {
      id: `a-${Date.now()}`,
      sender: 'aura',
      text: reply,
      timestamp: 'Just now',
      actionTaken: action,
    };

    setMessages((prev) => [...prev, auraMsg]);
    speakText(reply);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-2xl bg-[#071325] border border-cyan-500/40 rounded-2xl shadow-2xl flex flex-col h-[620px] overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center border transition-all ${
                auraState === 'listening'
                  ? 'bg-emerald-950 border-emerald-400 text-emerald-300 animate-pulse'
                  : auraState === 'processing'
                  ? 'bg-purple-950 border-purple-400 text-purple-300 animate-spin'
                  : 'bg-slate-900 border-cyan-700/60 text-cyan-400'
              }`}
            >
              <Sparkles className="w-4 h-4" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">WAYORA Aura (भारत)</h3>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                  {auraState.toUpperCase()}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Contextual Indian Transit Intelligence</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedLang}
              onChange={(e) => setSelectedLang(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-slate-300 text-xs rounded-lg px-2 py-1 outline-none"
            >
              <option value="en-IN">English (India)</option>
              <option value="hi-IN">Hindi (हिंदी)</option>
              <option value="en-US">English (Global)</option>
            </select>

            <button
              onClick={() => {
                setVoiceEnabled(!voiceEnabled);
                sound.playTactileTick();
              }}
              className={`p-1.5 rounded-lg border text-xs transition-colors ${
                voiceEnabled ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' : 'bg-slate-900 text-slate-400 border-slate-800'
              }`}
              title="Toggle Voice Speech Output"
            >
              {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            <button
              onClick={() => {
                if (window.speechSynthesis) window.speechSynthesis.cancel();
                onClose();
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Messages Thread */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3.5 bg-gradient-to-b from-[#061122] to-[#040913]">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex flex-col max-w-[84%] ${
                m.sender === 'user' ? 'self-end items-end' : 'self-start items-start'
              }`}
            >
              <div
                className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                  m.sender === 'user'
                    ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-br-none shadow-md shadow-cyan-950/40'
                    : 'bg-slate-900/90 border border-slate-800 text-slate-200 rounded-bl-none shadow-sm'
                }`}
              >
                {m.text}
              </div>

              {m.actionTaken && (
                <span className="text-[10px] text-cyan-400 mt-1 font-mono flex items-center gap-1">
                  ✓ {m.actionTaken}
                </span>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Indian Transit Prompts */}
        <div className="px-4 py-2 bg-slate-950/70 border-t border-slate-800/80 flex flex-wrap gap-1.5">
          <button
            onClick={() => handleUserQuery('Rajiv Chowk ke liye fastest route batao')}
            className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-900 text-slate-300 hover:text-cyan-300 hover:border-cyan-500/40 border border-slate-800 transition-colors"
          >
            "Rajiv Chowk fastest route"
          </button>
          <button
            onClick={() => handleUserQuery('Start Live GPS Navigation')}
            className="text-[11px] px-2.5 py-1 rounded-lg bg-emerald-950/70 text-emerald-300 hover:border-emerald-500/40 border border-emerald-800/60 transition-colors"
          >
            "Start Live GPS Navigation"
          </button>
          <button
            onClick={() => handleUserQuery('Cheapest route under ₹40')}
            className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-900 text-slate-300 hover:text-cyan-300 hover:border-cyan-500/40 border border-slate-800 transition-colors"
          >
            "Cheapest route under ₹40"
          </button>
          <button
            onClick={() => handleUserQuery('Rain monsoon shield route')}
            className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-900 text-slate-300 hover:text-cyan-300 hover:border-cyan-500/40 border border-slate-800 transition-colors"
          >
            "Monsoon rain shield"
          </button>
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center gap-2">
          <button
            onClick={() => {
              if (auraState === 'listening') stopListening();
              else startListening();
            }}
            className={`p-2.5 rounded-xl border transition-all ${
              auraState === 'listening'
                ? 'bg-emerald-500 text-white border-emerald-400 animate-pulse'
                : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-cyan-500/50 hover:text-cyan-300'
            }`}
            title="Voice input in Hindi/English"
          >
            {auraState === 'listening' ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>

          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleUserQuery(inputText);
            }}
            placeholder="Ask Aura in Hindi or English (e.g. 'Airport T3 ke liye route'...)"
            className="flex-1 bg-slate-900/90 border border-slate-800 focus:border-cyan-400 text-slate-100 text-xs rounded-xl px-3.5 py-2.5 outline-none transition-colors"
          />

          <button
            onClick={() => handleUserQuery(inputText)}
            disabled={!inputText.trim()}
            className="p-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
