import React, { useState } from 'react';
import { User } from 'firebase/auth';
import { 
  UserProfile, 
  signInWithGoogle, 
  signOutUser, 
  SavedJourneyRecord, 
  RecentSearchRecord,
  deleteSavedJourney,
  clearRecentSearches
} from '../services/userService';
import { 
  LogIn, 
  LogOut, 
  User as UserIcon, 
  Bookmark, 
  Clock, 
  CheckCircle, 
  Trash2, 
  MapPin, 
  Compass, 
  ShieldCheck, 
  X,
  Loader2,
  Calendar,
  Sparkles
} from 'lucide-react';

interface AuthProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  userProfile: UserProfile | null;
  savedJourneys: SavedJourneyRecord[];
  recentSearches: RecentSearchRecord[];
  onSelectSavedJourney: (journey: SavedJourneyRecord) => void;
  onSelectRecentSearch: (search: RecentSearchRecord) => void;
  onRefreshData: () => void;
}

export const AuthProfileModal: React.FC<AuthProfileModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  userProfile,
  savedJourneys,
  recentSearches,
  onSelectSavedJourney,
  onSelectRecentSearch,
  onRefreshData,
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'saved' | 'history'>('profile');
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSignIn = async () => {
    setIsSigningIn(true);
    setAuthError(null);
    try {
      await signInWithGoogle();
      onRefreshData();
    } catch (err: any) {
      setAuthError(err?.message || 'Failed to sign in with Google. Please try again.');
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOutUser();
      onRefreshData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteSaved = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteSavedJourney(id);
      onRefreshData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleClearHistory = async () => {
    if (!currentUser) return;
    try {
      await clearRecentSearches(currentUser.uid);
      onRefreshData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-[#070e1b] border border-cyan-500/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-cyan-900/40 bg-gradient-to-r from-cyan-950/60 to-[#0c1629] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <UserIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-wide flex items-center gap-2">
                WAYORA Account
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  Cloud Synced
                </span>
              </h2>
              <p className="text-xs text-slate-400">Persistent Profile & Multi-Modal Journey Cloud Vault</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-cyan-900/30 bg-[#060b14] px-6">
          <button
            onClick={() => setActiveTab('profile')}
            className={`py-3.5 px-4 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'profile'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserIcon className="w-4 h-4" />
            Profile & Login
          </button>
          <button
            onClick={() => setActiveTab('saved')}
            className={`py-3.5 px-4 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'saved'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Bookmark className="w-4 h-4" />
            Saved Journeys ({savedJourneys.length})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`py-3.5 px-4 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'history'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clock className="w-4 h-4" />
            Recent Searches ({recentSearches.length})
          </button>
        </div>

        {/* Body content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 text-sm text-slate-300">
          {authError && (
            <div className="p-3 bg-red-950/40 border border-red-500/40 rounded-xl text-xs text-red-300">
              {authError}
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="space-y-6">
              {currentUser ? (
                /* Authenticated State */
                <div className="space-y-5">
                  <div className="flex items-center gap-4 p-4 rounded-xl bg-cyan-950/30 border border-cyan-500/20">
                    {currentUser.photoURL ? (
                      <img
                        src={currentUser.photoURL}
                        alt={currentUser.displayName || 'User'}
                        className="w-14 h-14 rounded-full border-2 border-cyan-400 shadow-md object-cover"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-cyan-500/20 text-cyan-300 border-2 border-cyan-400 flex items-center justify-center font-bold text-xl">
                        {(currentUser.displayName || currentUser.email || 'U')[0].toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-white text-base">
                          {currentUser.displayName || 'WAYORA Traveler'}
                        </h3>
                        <span className="flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                          <ShieldCheck className="w-3 h-3" />
                          Authenticated
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">{currentUser.email}</p>
                      <p className="text-[11px] text-cyan-400/80 font-mono mt-1">
                        UID: {currentUser.uid.slice(0, 16)}...
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl bg-[#091222] border border-slate-800">
                      <span className="text-[11px] text-slate-400 block mb-1">Database Provider</span>
                      <span className="text-xs font-semibold text-cyan-300 flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5" />
                        Firebase Cloud Firestore
                      </span>
                    </div>
                    <div className="p-3 rounded-xl bg-[#091222] border border-slate-800">
                      <span className="text-[11px] text-slate-400 block mb-1">Saved Trips</span>
                      <span className="text-xs font-semibold text-white">
                        {savedJourneys.length} routes saved
                      </span>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={handleSignOut}
                      className="w-full py-2.5 px-4 rounded-xl border border-red-500/30 bg-red-950/20 hover:bg-red-900/30 text-red-300 text-xs font-semibold flex items-center justify-center gap-2 transition-all"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                </div>
              ) : (
                /* Unauthenticated State */
                <div className="text-center py-6 space-y-5">
                  <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center mx-auto shadow-lg shadow-cyan-500/10">
                    <Compass className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Sign In with Google</h3>
                    <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
                      Unlock cloud persistence. Save your favorite multi-modal routes, sync preferences across devices, and retrieve your recent Indian transit trips automatically.
                    </p>
                  </div>

                  <div className="max-w-sm mx-auto pt-2">
                    <button
                      onClick={handleSignIn}
                      disabled={isSigningIn}
                      className="w-full py-3 px-5 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-semibold text-xs flex items-center justify-center gap-3 shadow-lg transition-all border border-slate-200 disabled:opacity-50"
                    >
                      {isSigningIn ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-cyan-600" />
                          <span>Connecting to Google...</span>
                        </>
                      ) : (
                        <>
                          {/* Google G Icon */}
                          <svg className="w-4 h-4" viewBox="0 0 24 24">
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
                          <span>Continue with Google</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="flex items-center justify-center gap-4 text-[11px] text-slate-400 pt-3">
                    <span className="flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5 text-cyan-400" />
                      Persistent Storage
                    </span>
                    <span className="flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5 text-cyan-400" />
                      Encrypted Cloud Rules
                    </span>
                    <span className="flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5 text-cyan-400" />
                      Multi-Modal Sync
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'saved' && (
            <div className="space-y-4">
              {!currentUser ? (
                <div className="p-6 text-center border border-dashed border-slate-800 rounded-xl">
                  <Bookmark className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  <p className="text-xs text-slate-400">Please sign in to view and save your journeys in Cloud Firestore.</p>
                  <button
                    onClick={() => setActiveTab('profile')}
                    className="mt-3 px-4 py-1.5 rounded-lg bg-cyan-500/20 text-cyan-300 text-xs font-medium border border-cyan-500/40"
                  >
                    Go to Sign In
                  </button>
                </div>
              ) : savedJourneys.length === 0 ? (
                <div className="p-6 text-center border border-dashed border-slate-800 rounded-xl">
                  <Bookmark className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  <p className="text-xs text-slate-400">No saved journeys yet.</p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    When you calculate a route, click the <strong>Save Journey</strong> button to store it in your Cloud Vault.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {savedJourneys.map((j) => (
                    <div
                      key={j.id}
                      onClick={() => {
                        onSelectSavedJourney(j);
                        onClose();
                      }}
                      className="p-3.5 rounded-xl bg-[#091222] border border-slate-800 hover:border-cyan-500/40 hover:bg-[#0c182d] transition-all cursor-pointer flex items-center justify-between group"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white text-xs">{j.journeyName}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 capitalize">
                            {j.preferenceCategory}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-3">
                          <span>⏱️ {j.totalDurationMinutes} mins</span>
                          <span>💰 ₹{j.totalCost}</span>
                          <span>🔄 {j.transfersCount} transfers</span>
                          <span>🌱 {j.carbonSavedKg}kg CO₂ saved</span>
                        </div>
                        <div className="text-[10px] text-cyan-400/80 flex items-center gap-1.5 pt-0.5">
                          <span>Modes:</span>
                          {j.modes.map((m, idx) => (
                            <span key={idx} className="capitalize bg-slate-800 px-1.5 py-0.5 rounded text-[10px]">
                              {m}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => handleDeleteSaved(j.id!, e)}
                          className="p-2 text-slate-500 hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-colors"
                          title="Delete saved journey"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-4">
              {!currentUser ? (
                <div className="p-6 text-center border border-dashed border-slate-800 rounded-xl">
                  <Clock className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  <p className="text-xs text-slate-400">Please sign in to view persistent search history.</p>
                  <button
                    onClick={() => setActiveTab('profile')}
                    className="mt-3 px-4 py-1.5 rounded-lg bg-cyan-500/20 text-cyan-300 text-xs font-medium border border-cyan-500/40"
                  >
                    Go to Sign In
                  </button>
                </div>
              ) : recentSearches.length === 0 ? (
                <div className="p-6 text-center border border-dashed border-slate-800 rounded-xl">
                  <Clock className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  <p className="text-xs text-slate-400">No recent searches recorded yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-slate-400">Stored in Cloud Firestore</span>
                    <button
                      onClick={handleClearHistory}
                      className="text-xs text-red-400 hover:text-red-300 transition-colors flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Clear History
                    </button>
                  </div>
                  {recentSearches.map((s) => (
                    <div
                      key={s.id}
                      onClick={() => {
                        onSelectRecentSearch(s);
                        onClose();
                      }}
                      className="p-3 rounded-xl bg-[#091222] border border-slate-800 hover:border-cyan-500/40 hover:bg-[#0c182d] transition-all cursor-pointer flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <MapPin className="w-4 h-4 text-cyan-400 shrink-0" />
                        <div>
                          <div className="text-xs font-medium text-white">
                            {s.originName} <span className="text-cyan-400">➔</span> {s.destName}
                          </div>
                          <div className="text-[10px] text-slate-400">Click to replay search</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-cyan-900/40 bg-[#060b14] flex justify-between items-center text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Database: Firestore Active</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
