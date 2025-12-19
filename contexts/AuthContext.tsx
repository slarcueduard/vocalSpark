import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  User
} from 'firebase/auth';
import {
  doc,
  setDoc,
  updateDoc,
  serverTimestamp,
  increment,
  onSnapshot // <--- IMPORT CRITIC PENTRU REAL-TIME
} from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { BrandProfile, UserProfile } from '../types';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  brandProfile: BrandProfile | null;
  allProfiles: BrandProfile[];
  activeProfileIndex: number;
  loading: boolean;
  signIn: () => Promise<void>;
  logout: () => Promise<void>;
  saveBrandProfile: (profile: BrandProfile) => Promise<void>;
  switchProfile: (index: number) => Promise<void>;
  addNewProfile: () => Promise<void>;
  deleteProfile: (index: number) => Promise<void>;
  checkCredits: (cost: number) => boolean;
  refundCredits: (cost: number) => void; // Functie noua pentru erori
  isTrialExpired: boolean;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [allProfiles, setAllProfiles] = useState<BrandProfile[]>([]);
  const [activeProfileIndex, setActiveProfileIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  const brandProfile = allProfiles[activeProfileIndex] || null;

  // --- 1. MONITORIZARE AUTH SI DATE (REAL-TIME) ---
  useEffect(() => {
    let unsubscribeUserDoc: () => void;
    let unsubscribeBrandDoc: () => void;

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        // A. ASCULTAM PROFILUL UTILIZATORULUI (Credite, Plan)
        const userRef = doc(db, 'users', currentUser.uid);
        unsubscribeUserDoc = onSnapshot(userRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data() as UserProfile;
            console.log("🔥 Real-time User Update:", data);
            setUserProfile(data);
          } else {
            // Daca nu exista, il cream
            const newProfile: UserProfile = {
              uid: currentUser.uid,
              email: currentUser.email || '',
              credits: 150,
              subscriptionTier: 'pro', // Updated: Pro is now entry level
              createdAt: new Date().toISOString()
            };
            setDoc(userRef, newProfile);
          }
        });

        // B. ASCULTAM BRANDURILE
        const brandRef = doc(db, 'brands', currentUser.uid);
        unsubscribeBrandDoc = onSnapshot(brandRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.profiles && Array.isArray(data.profiles)) {
              setAllProfiles(data.profiles);
              setActiveProfileIndex(data.activeIndex || 0);
            } else {
              // Migrare veche
              const migrated = {
                name: data.name || 'Personal Brand',
                industry: data.industry || '',
                targetAudience: data.targetAudience || '',
                voiceDNA: data.voiceDNA || '',
                language: data.language || 'English',
                fixedHashtags: data.fixedHashtags || '',
                brandColors: data.brandColors || ['#3B82F6'],
                logoUrl: data.logoUrl || null
              };
              setAllProfiles([migrated]);
            }
          } else {
            setAllProfiles([{
              name: 'Personal Brand',
              industry: '',
              targetAudience: '',
              voiceDNA: '',
              language: 'English',
              brandColors: ['#3B82F6']
            }]);
          }
          setLoading(false); // Gata incarcarea cand avem si brandurile
        });

      } else {
        // Logout cleanup
        setUserProfile(null);
        setAllProfiles([]);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeUserDoc) unsubscribeUserDoc();
      if (unsubscribeBrandDoc) unsubscribeBrandDoc();
    };
  }, []);

  // --- ACTIONS ---
  const signIn = async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    try { await signInWithPopup(auth, provider); } catch (error) { console.error("Error signing in", error); }
  };

  const logout = async () => {
    try { await signOut(auth); } catch (error) { console.error("Error signing out", error); }
  };

  const switchProfile = async (index: number) => {
    if (index >= 0 && index < allProfiles.length) {
      setActiveProfileIndex(index);
      if (user) await updateDoc(doc(db, 'brands', user.uid), { activeIndex: index });
    }
  };

  const addNewProfile = async () => {
    if (!user) return;
    const tier = userProfile?.subscriptionTier || 'pro'; // Default to Pro
    const limit = tier === 'agency' ? 5 : (tier === 'pro' ? 2 : 1);
    if (allProfiles.length >= limit) { alert(`Upgrade to add more profiles.`); return; }

    const newProfile: BrandProfile = { name: `Brand #${allProfiles.length + 1}`, industry: '', targetAudience: '', voiceDNA: '', language: 'English', brandColors: ['#3B82F6'] };
    const newList = [...allProfiles, newProfile];
    const newIndex = newList.length - 1;

    // Update optimist (UI)
    setAllProfiles(newList);
    setActiveProfileIndex(newIndex);

    await setDoc(doc(db, 'brands', user.uid), { profiles: newList, activeIndex: newIndex }, { merge: true });
  };

  const saveBrandProfile = async (updatedProfile: BrandProfile) => {
    if (!user) return;
    const newList = [...allProfiles];
    newList[activeProfileIndex] = updatedProfile;
    // Update optimist
    setAllProfiles(newList);
    await setDoc(doc(db, 'brands', user.uid), { profiles: newList, activeIndex: activeProfileIndex, updatedAt: serverTimestamp() }, { merge: true });
  };

  // --- PLATA & CREDITE ---
  const checkCredits = (cost: number) => {
    if (!userProfile) return false;
    const current = Number(userProfile.credits);
    if (isNaN(current)) return false;
    if (cost <= 0) return true;

    if (current >= cost) {
      // Scadem LOCAL pentru viteza UI
      // Dar ascultatorul onSnapshot va corecta oricum in cateva ms
      if (user) updateDoc(doc(db, 'users', user.uid), { credits: increment(-cost) });
      return true;
    }
    return false;
  };

  const refundCredits = (cost: number) => {
    if (user && cost > 0) {
      console.log(`Refund ${cost} credits due to error`);
      updateDoc(doc(db, 'users', user.uid), { credits: increment(cost) });
    }
  }

  const deleteProfile = async (index: number) => {
    if (!user) return;
    if (allProfiles.length <= 1) {
      alert("You cannot delete your only brand profile.");
      return;
    }

    const confirmDelete = window.confirm(`Are you sure you want to delete profile "${allProfiles[index].name}"? This cannot be undone.`);
    if (!confirmDelete) return;

    const newList = allProfiles.filter((_, i) => i !== index);

    // Adjust active index
    let newIndex = activeProfileIndex;
    if (index === activeProfileIndex) {
      newIndex = 0; // Fallback to first
    } else if (index < activeProfileIndex) {
      newIndex = activeProfileIndex - 1; // Shift left
    }

    // Update state
    setAllProfiles(newList);
    setActiveProfileIndex(newIndex);

    await setDoc(doc(db, 'brands', user.uid), { profiles: newList, activeIndex: newIndex }, { merge: true });
  };

  const currentCredits = userProfile?.credits ?? 0;
  const currentTier = userProfile?.subscriptionTier || 'pro';
  const isTrialExpired = currentCredits <= 0 && currentTier === 'trial';

  return (
    <AuthContext.Provider value={{
      user, userProfile, brandProfile, allProfiles, activeProfileIndex, loading,
      signIn, logout, saveBrandProfile, switchProfile, addNewProfile, deleteProfile, checkCredits, refundCredits, isTrialExpired
    }}>
      {children}
    </AuthContext.Provider>
  );
};
