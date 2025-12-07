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
  getDoc, 
  setDoc, 
  updateDoc, 
  serverTimestamp,
  increment 
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
  checkCredits: (cost: number) => boolean;
  isTrialExpired: boolean;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  
  // State pentru Multi-Profile
  const [allProfiles, setAllProfiles] = useState<BrandProfile[]>([]);
  const [activeProfileIndex, setActiveProfileIndex] = useState(0);
  
  const [loading, setLoading] = useState(true);

  // Derivam profilul activ
  const brandProfile = allProfiles[activeProfileIndex] || null;

  // 1. MONITORIZARE LOGIN
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await fetchUserData(currentUser.uid);
      } else {
        setUserProfile(null);
        setAllProfiles([]);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // 2. FETCH DATA
  const fetchUserData = async (uid: string) => {
    try {
      // User Profile
      const userRef = doc(db, 'users', uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        setUserProfile(userSnap.data() as UserProfile);
      } else {
        const newProfile: UserProfile = {
          uid,
          email: auth.currentUser?.email || '',
          credits: 150,
          subscriptionTier: 'creator',
          createdAt: new Date().toISOString()
        };
        await setDoc(userRef, newProfile);
        setUserProfile(newProfile);
      }

      // Brand Profiles
      const brandRef = doc(db, 'brands', uid);
      const brandSnap = await getDoc(brandRef);

      if (brandSnap.exists()) {
        const data = brandSnap.data();
        if (data.profiles && Array.isArray(data.profiles)) {
            setAllProfiles(data.profiles);
            setActiveProfileIndex(data.activeIndex || 0);
        } else {
            // Migrare date vechi
            const migratedProfile: BrandProfile = {
                name: data.name || 'Personal Brand',
                industry: data.industry || '',
                targetAudience: data.targetAudience || '',
                voiceDNA: data.voiceDNA || '',
                language: data.language || 'English',
                fixedHashtags: data.fixedHashtags || '',
                brandColors: data.brandColors || ['#3B82F6'],
                logoUrl: data.logoUrl || null
            };
            setAllProfiles([migratedProfile]);
            setActiveProfileIndex(0);
            await setDoc(brandRef, { profiles: [migratedProfile], activeIndex: 0 }, { merge: true });
        }
      } else {
        const defaultProfile: BrandProfile = {
          name: 'Personal Brand',
          industry: '',
          targetAudience: '',
          voiceDNA: '',
          language: 'English',
          brandColors: ['#3B82F6', '#8B5CF6', '#FFFFFF']
        };
        setAllProfiles([defaultProfile]);
        setActiveProfileIndex(0);
      }

    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

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
          if (user) {
              const brandRef = doc(db, 'brands', user.uid);
              await updateDoc(brandRef, { activeIndex: index });
          }
      }
  };

  const addNewProfile = async () => {
      if (!user) return;
      const tier = userProfile?.subscriptionTier || 'creator';
      const limit = tier === 'agency' ? 5 : (tier === 'pro' ? 2 : 1);
      
      if (allProfiles.length >= limit) {
          alert(`Upgrade to add more profiles.`);
          return;
      }

      const newProfile: BrandProfile = {
          name: `Brand #${allProfiles.length + 1}`,
          industry: '',
          targetAudience: '',
          voiceDNA: '',
          language: 'English',
          brandColors: ['#3B82F6']
      };

      const newProfilesList = [...allProfiles, newProfile];
      setAllProfiles(newProfilesList);
      const newIndex = newProfilesList.length - 1;
      setActiveProfileIndex(newIndex);

      const brandRef = doc(db, 'brands', user.uid);
      await setDoc(brandRef, { profiles: newProfilesList, activeIndex: newIndex }, { merge: true });
  };

  const saveBrandProfile = async (updatedActiveProfile: BrandProfile) => {
    if (!user) return;
    try {
      const newProfilesList = [...allProfiles];
      newProfilesList[activeProfileIndex] = updatedActiveProfile;
      setAllProfiles(newProfilesList); 

      const brandRef = doc(db, 'brands', user.uid);
      await setDoc(brandRef, {
        profiles: newProfilesList,
        activeIndex: activeProfileIndex,
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (error) {
      console.error("Error saving brand:", error);
      throw error;
    }
  };

  // --- LOGICA DE PLATA (DEFINIT O SINGURA DATA) ---
  const checkCredits = (cost: number) => {
    if (!userProfile) return false;
    
    const currentCredits = Number(userProfile.credits);
    if (isNaN(currentCredits)) return false;

    // Protectie cost 0
    if (cost <= 0) return true;

    if (currentCredits >= cost) {
      // 1. Update Local
      const newCredits = currentCredits - cost;
      console.warn(`💸 CREDITS DEDUCTED: ${cost} | Remaining: ${newCredits}`);
      setUserProfile({ ...userProfile, credits: newCredits });
      
      // 2. Update Firebase Atomic
      if (user) {
        const userRef = doc(db, 'users', user.uid);
        updateDoc(userRef, { credits: increment(-cost) });
      }
      return true;
    }
    
    console.error("❌ Not enough credits.");
    return false;
  };

  const currentCredits = userProfile?.credits ?? 0;
  const currentTier = userProfile?.subscriptionTier || 'creator';
  const isTrialExpired = currentCredits <= 0 && (currentTier === 'trial' || currentTier === 'creator');

  return (
    <AuthContext.Provider value={{ 
      user, userProfile, brandProfile, allProfiles, activeProfileIndex, loading, 
      signIn, logout, saveBrandProfile, switchProfile, addNewProfile, checkCredits, isTrialExpired
    }}>
      {children}
    </AuthContext.Provider>
  );
};
