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
  serverTimestamp 
} from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { BrandProfile, UserProfile } from '../types';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  brandProfile: BrandProfile | null; // Profilul ACTIV curent
  allProfiles: BrandProfile[]; // Toate profilele disponibile
  activeProfileIndex: number;
  loading: boolean;
  signIn: () => Promise<void>;
  logout: () => Promise<void>;
  saveBrandProfile: (profile: BrandProfile) => Promise<void>; // Salveaza profilul ACTIV
  switchProfile: (index: number) => Promise<void>; // Schimba profilul activ
  addNewProfile: () => Promise<void>; // Adauga un profil nou (daca permite planul)
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

  // Derivam profilul activ pentru restul aplicatiei
  const brandProfile = allProfiles[activeProfileIndex] || null;

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
      // 1. User Profile
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

      // 2. Brand Profiles (Multi-Profile Logic)
      const brandRef = doc(db, 'brands', uid);
      const brandSnap = await getDoc(brandRef);

      if (brandSnap.exists()) {
        const data = brandSnap.data();
        
        // Logica de Migrare: Daca avem formatul vechi (fara array 'profiles'), il convertim
        if (data.profiles && Array.isArray(data.profiles)) {
            setAllProfiles(data.profiles);
            setActiveProfileIndex(data.activeIndex || 0);
        } else {
            // Migram datele vechi in Profilul 1
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
            
            // Salvam structura noua in DB
            await setDoc(brandRef, { profiles: [migratedProfile], activeIndex: 0 }, { merge: true });
        }
      } else {
        // Doc nou
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

  // --- LOGICA MULTI-PROFILE ---

  const switchProfile = async (index: number) => {
      if (index >= 0 && index < allProfiles.length) {
          setActiveProfileIndex(index);
          if (user) {
              // Persistenta selectiei
              const brandRef = doc(db, 'brands', user.uid);
              await updateDoc(brandRef, { activeIndex: index });
          }
      }
  };

  const addNewProfile = async () => {
      if (!user) return;
      
      // Limite Planuri
      const tier = userProfile?.subscriptionTier || 'creator';
      const limit = tier === 'agency' ? 5 : (tier === 'pro' ? 2 : 1);
      
      if (allProfiles.length >= limit) {
          alert(`Upgrade to add more profiles. Your ${tier.toUpperCase()} plan limit is ${limit}.`);
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
      await setDoc(brandRef, { 
          profiles: newProfilesList, 
          activeIndex: newIndex 
      }, { merge: true });
  };

  const saveBrandProfile = async (updatedActiveProfile: BrandProfile) => {
    if (!user) return;
    try {
      // Updatam doar profilul activ in lista
      const newProfilesList = [...allProfiles];
      newProfilesList[activeProfileIndex] = updatedActiveProfile;
      
      setAllProfiles(newProfilesList); // Update local instant

      const brandRef = doc(db, 'brands', user.uid);
      await setDoc(brandRef, {
        profiles: newProfilesList,
        activeIndex: activeProfileIndex,
        updatedAt: serverTimestamp()
      }, { merge: true });
      
      console.log("Profile saved!");
    } catch (error) {
      console.error("Error saving brand:", error);
      throw error;
    }
  };

  const checkCredits = (cost: number) => {
    if (!userProfile) return false;
    if (userProfile.credits >= cost) {
      const newCredits = userProfile.credits - cost;
      setUserProfile({ ...userProfile, credits: newCredits });
      if (user) {
        const userRef = doc(db, 'users', user.uid);
        updateDoc(userRef, { credits: newCredits });
      }
      return true;
    }
    return false;
  };

  const isTrialExpired = (userProfile?.credits || 0) <= 0;

  return (
    <AuthContext.Provider value={{ 
      user, userProfile, brandProfile, allProfiles, activeProfileIndex, loading, 
      signIn, logout, saveBrandProfile, switchProfile, addNewProfile, checkCredits, isTrialExpired
    }}>
      {children}
    </AuthContext.Provider>
  );
};
