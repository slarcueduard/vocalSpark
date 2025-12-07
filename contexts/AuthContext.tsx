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
  increment // <--- IMPORT IMPORTANT
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
  
  const [allProfiles, setAllProfiles] = useState<BrandProfile[]>([]);
  const [activeProfileIndex, setActiveProfileIndex] = useState(0);
  
  const [loading, setLoading] = useState(true);
  const brandProfile = allProfiles[activeProfileIndex] || null;
// ... în interiorul AuthProvider ...

  const checkCredits = (cost: number) => {
    if (!userProfile) return false;
    
    const currentCredits = Number(userProfile.credits);
    
    // Protectie: Daca costul e 0 sau negativ, nu facem nimic
    if (cost <= 0) return true;

    if (!isNaN(currentCredits) && currentCredits >= cost) {
      
      // --- LOGGING: Arata in consola cand se scad banii ---
      console.warn(`💸 SCADERE CREDITE! Cost: ${cost} | Ramas: ${currentCredits - cost}`);
      // ----------------------------------------------------

      const newCredits = currentCredits - cost;
      setUserProfile({ ...userProfile, credits: newCredits });
      
      if (user) {
        const userRef = doc(db, 'users', user.uid);
        updateDoc(userRef, { credits: increment(-cost) });
      }
      return true;
    }
    
    console.error("❌ Insufficient funds. Need:", cost, "Have:", currentCredits);
    return false;
  };
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

  const fetchUserData = async (uid: string) => {
    try {
      const userRef = doc(db, 'users', uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const data = userSnap.data() as UserProfile;
        setUserProfile(data);
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

      const brandRef = doc(db, 'brands', uid);
      const brandSnap = await getDoc(brandRef);

      if (brandSnap.exists()) {
        const data = brandSnap.data();
        if (data.profiles && Array.isArray(data.profiles)) {
            setAllProfiles(data.profiles);
            setActiveProfileIndex(data.activeIndex || 0);
        } else {
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

  // --- LOGICA DE PLATA (CRITIC - REPARAT) ---
  const checkCredits = (cost: number) => {
    if (!userProfile) return false;
    
    // Asiguram ca e numar
    const currentCredits = Number(userProfile.credits);
    if (isNaN(currentCredits)) return false;

    if (currentCredits >= cost) {
      // 1. Calculam noul total local pentru UI instant
      const newCredits = currentCredits - cost;
      
      console.log(`💰 DEDUCTING: ${cost} | OLD: ${currentCredits} | NEW: ${newCredits}`);

      // 2. Updatam starea locala
      setUserProfile({ ...userProfile, credits: newCredits });
      
      // 3. Updatam Firebase ATOMIC (Increment cu minus) - Asta previne bug-uri de suprascriere
      if (user) {
        const userRef = doc(db, 'users', user.uid);
        // "Scade costul din ce e in baza de date" - e mult mai sigur
        updateDoc(userRef, { credits: increment(-cost) });
      }
      return true;
    }
    
    console.warn("⚠️ Not enough credits:", currentCredits, "Cost:", cost);
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
