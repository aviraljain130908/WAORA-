import { 
  User, 
  signInWithPopup, 
  signInWithRedirect,
  getRedirectResult,
  signOut as fbSignOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  serverTimestamp, 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs, 
  addDoc, 
  deleteDoc 
} from 'firebase/firestore';
import { auth, googleProvider, db } from './firebase';
import { IndianCity, RoutePreference, JourneyRoute, TransitNode } from '../types/wayora';

export interface UserProfile {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  provider: string;
  createdAt?: any;
  updatedAt?: any;
  defaultCity?: IndianCity;
  preferences?: {
    preferredRoute?: RoutePreference;
    maxBudget?: number;
    maxWalkingMeters?: number;
    isNightTravel?: boolean;
  };
}

export interface SavedJourneyRecord {
  id?: string;
  userId: string;
  journeyName: string;
  originName: string;
  destinationName: string;
  originLat: number;
  originLng: number;
  destLat: number;
  destLng: number;
  routeTitle: string;
  preferenceCategory: string;
  totalDurationMinutes: number;
  totalCost: number;
  transfersCount: number;
  carbonSavedKg: number;
  modes: string[];
  createdAt?: any;
  notes?: string;
}

export interface RecentSearchRecord {
  id?: string;
  userId: string;
  originName: string;
  destName: string;
  originId?: string;
  destId?: string;
  originLat?: number;
  originLng?: number;
  destLat?: number;
  destLng?: number;
  timestamp?: any;
}

/**
 * Handle Google Sign In
 */
export async function signInWithGoogle(): Promise<User | null> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    if (result.user) {
      await syncUserProfile(result.user);
      return result.user;
    }
    return null;
  } catch (error: any) {
    // If popup was blocked or closed by user, fall back to redirect if appropriate
    if (error.code === 'auth/popup-blocked') {
      console.warn('Popup blocked, attempting redirect flow');
      await signInWithRedirect(auth, googleProvider);
      return null;
    }
    console.error('Firebase Google Sign-In error:', error);
    throw error;
  }
}

/**
 * Check for redirect results on startup
 */
export async function checkRedirectAuth(): Promise<User | null> {
  try {
    const result = await getRedirectResult(auth);
    if (result?.user) {
      await syncUserProfile(result.user);
      return result.user;
    }
    return null;
  } catch (err) {
    console.warn('Redirect auth check notice:', err);
    return null;
  }
}

/**
 * Sign out current user
 */
export async function signOutUser(): Promise<void> {
  await fbSignOut(auth);
}

/**
 * Sync user profile to Firestore `users/{uid}`
 */
export async function syncUserProfile(user: User): Promise<UserProfile> {
  const userRef = doc(db, 'users', user.uid);
  const snap = await getDoc(userRef);

  if (!snap.exists()) {
    const newProfile: UserProfile = {
      uid: user.uid,
      displayName: user.displayName || 'WAYORA Traveler',
      email: user.email,
      photoURL: user.photoURL,
      provider: 'google',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      defaultCity: 'delhi_ncr',
      preferences: {
        preferredRoute: 'fastest',
        maxBudget: 60,
        maxWalkingMeters: 500,
        isNightTravel: false,
      },
    };
    await setDoc(userRef, newProfile);
    return newProfile;
  } else {
    // Update last active
    await setDoc(
      userRef,
      {
        displayName: user.displayName || snap.data()?.displayName,
        photoURL: user.photoURL || snap.data()?.photoURL,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
    return snap.data() as UserProfile;
  }
}

/**
 * Save user preferences to Firestore
 */
export async function updateUserPreferences(
  userId: string,
  preferences: {
    defaultCity?: IndianCity;
    preferredRoute?: RoutePreference;
    maxBudget?: number;
    maxWalkingMeters?: number;
    isNightTravel?: boolean;
  }
): Promise<void> {
  const userRef = doc(db, 'users', userId);
  await setDoc(
    userRef,
    {
      ...preferences,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

/**
 * Save journey to Firestore `saved_journeys`
 */
export async function saveJourneyToCloud(
  userId: string,
  journey: JourneyRoute,
  originNode: TransitNode,
  destNode: TransitNode,
  notes?: string
): Promise<string> {
  const modes = Array.from(new Set(journey.legs.map((leg) => leg.mode)));
  const journeyRecord: Omit<SavedJourneyRecord, 'id'> = {
    userId,
    journeyName: `${originNode.name} to ${destNode.name}`,
    originName: originNode.name,
    destinationName: destNode.name,
    originLat: originNode.lat,
    originLng: originNode.lng,
    destLat: destNode.lat,
    destLng: destNode.lng,
    routeTitle: journey.title,
    preferenceCategory: journey.preferenceCategory,
    totalDurationMinutes: journey.totalDurationMinutes,
    totalCost: journey.totalCost,
    transfersCount: journey.transfersCount,
    carbonSavedKg: journey.carbonSavedKg,
    modes,
    notes: notes || '',
    createdAt: serverTimestamp(),
  };

  const colRef = collection(db, 'saved_journeys');
  const docRef = await addDoc(colRef, journeyRecord);
  return docRef.id;
}

/**
 * Get user's saved journeys
 */
export async function fetchUserSavedJourneys(userId: string): Promise<SavedJourneyRecord[]> {
  try {
    const colRef = collection(db, 'saved_journeys');
    const q = query(colRef, where('userId', '==', userId), orderBy('createdAt', 'desc'), limit(30));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<SavedJourneyRecord, 'id'>) }));
  } catch (err) {
    console.warn('Could not fetch saved journeys with orderBy, trying basic query:', err);
    const colRef = collection(db, 'saved_journeys');
    const q = query(colRef, where('userId', '==', userId), limit(30));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<SavedJourneyRecord, 'id'>) }));
  }
}

/**
 * Delete a saved journey
 */
export async function deleteSavedJourney(journeyId: string): Promise<void> {
  const docRef = doc(db, 'saved_journeys', journeyId);
  await deleteDoc(docRef);
}

/**
 * Save recent search to Firestore
 */
export async function recordRecentSearch(
  userId: string,
  search: {
    originName: string;
    destName: string;
    originId?: string;
    destId?: string;
    originLat?: number;
    originLng?: number;
    destLat?: number;
    destLng?: number;
  }
): Promise<void> {
  try {
    const colRef = collection(db, 'recent_searches');
    await addDoc(colRef, {
      userId,
      ...search,
      timestamp: serverTimestamp(),
    });
  } catch (err) {
    console.error('Failed to log recent search to Firestore:', err);
  }
}

/**
 * Get user's recent searches
 */
export async function fetchRecentSearches(userId: string): Promise<RecentSearchRecord[]> {
  try {
    const colRef = collection(db, 'recent_searches');
    const q = query(colRef, where('userId', '==', userId), orderBy('timestamp', 'desc'), limit(8));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<RecentSearchRecord, 'id'>) }));
  } catch (err) {
    const colRef = collection(db, 'recent_searches');
    const q = query(colRef, where('userId', '==', userId), limit(8));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<RecentSearchRecord, 'id'>) }));
  }
}

/**
 * Clear all recent searches for a user
 */
export async function clearRecentSearches(userId: string): Promise<void> {
  const colRef = collection(db, 'recent_searches');
  const q = query(colRef, where('userId', '==', userId));
  const snap = await getDocs(q);
  const deletePromises = snap.docs.map((d) => deleteDoc(d.ref));
  await Promise.all(deletePromises);
}
