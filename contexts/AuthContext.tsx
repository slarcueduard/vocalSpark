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
  brandProfile: BrandProfile | null;
  loading: boolean;
  signIn: () => Promise<void>;
  logout: () => Promise<void>;
  saveBrandProfile: (profile: BrandProfile) => Promise<void>;
  checkCredits: (cost: number) => boolean;
  isTrialExpired: boolean;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [brandProfile, setBrandProfile] = useState<BrandProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // 1. ASCULTAM SCHIMBARILE DE LOGIN/LOGOUT
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        await fetchUserData(currentUser.uid);
      } else {
        setUserProfile(null);
        setBrandProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // 2. FETCH DATA DIN FIREBASE
  const fetchUserData = async (uid: string) => {
    try {
      // User Profile
      const userRef = doc(db, 'users', uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
    const userData = userSnap.data();
    console.log("🔥 DATA DIN FIREBASE:", userData); // <--- ADAUGA ASTA
    setUserProfile(userData as UserProfile);
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

      // Brand Profile
      const brandRef = doc(db, 'brands', uid);
      const brandSnap = await getDoc(brandRef);

      if (brandSnap.exists()) {
        setBrandProfile(brandSnap.data() as BrandProfile);
      } else {
        setBrandProfile({
          name: 'My Brand',
          industry: '',
          targetAudience: '',
          voiceDNA: '',
          language: 'English'
        });
      }

    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  // 3. LOG IN (MODIFICAT: Cere contul mereu)
  const signIn = async () => {
    const provider = new GoogleAuthProvider();
    // Aici adaugam setarea care forteaza 'Account Chooser'
    provider.setCustomParameters({
      prompt: 'select_account'
    });

    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Error signing in", error);
    }
  };

  // 4. LOG OUT
  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out", error);
    }
  };

  // 5. SAVE BRAND PROFILE
  const saveBrandProfile = async (newProfile: BrandProfile) => {
    if (!user) return;

    try {
      setBrandProfile(newProfile);
      const brandRef = doc(db, 'brands', user.uid);
      await setDoc(brandRef, {
        ...newProfile,
        updatedAt: serverTimestamp()
      }, { merge: true });
      console.log("Brand saved to Firebase successfully!");
    } catch (error) {
      console.error("Error saving brand:", error);
      throw error;
    }
  };

  // 6. MANAGEMENT CREDITE
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
      user, userProfile, brandProfile, loading, 
      signIn, logout, saveBrandProfile, checkCredits, isTrialExpired
    }}>
      {children}
    </AuthContext.Provider>
  );
};
