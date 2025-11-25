import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  User 
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  serverTimestamp, 
  onSnapshot,
  updateDoc 
} from 'firebase/firestore';
import { auth, googleProvider, db } from '../services/firebase';
import { UserProfile, BrandProfile, PLANS } from '../types';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  brandProfile: BrandProfile | null; // <--- LIPSEA
  loading: boolean;
  daysRemaining: number;
  credits: number;
  isTrialExpired: boolean;
  signIn: () => Promise<void>;
  logout: () => Promise<void>;
  checkCredits: (cost: number) => boolean;
  saveBrandProfile: (profile: BrandProfile) => Promise<void>; // <--- LIPSEA
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [brandProfile, setBrandProfile] = useState<BrandProfile | null>(null); // State pt Brand
  const [loading, setLoading] = useState(true);
  const [daysRemaining, setDaysRemaining] = useState(0);
  const [credits, setCredits] = useState(0);
  const [isTrialExpired, setIsTrialExpired] = useState(false);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        const userRef = doc(db, 'users', currentUser.uid);

        const unsubscribeSnapshot = onSnapshot(userRef, async (docSnap) => {
          if (!docSnap.exists()) {
            // User Nou
            try {
              const newProfile: any = {
                uid: currentUser.uid,
                email: currentUser.email,
                subscriptionTier: 'trial',
                subscriptionStatus: 'active',
                createdAt: serverTimestamp(),
                credits: PLANS.trial.credits,
                imageCount: 0 
              };
              await setDoc(userRef, newProfile);
            } catch (err) {
              console.error("Error creating user profile:", err);
            }
          } else {
            // User Existent
            const data = docSnap.data();
            
            // 1. Setăm Profilul General
            setUserProfile(data as UserProfile);
            setCredits(data.credits !== undefined ? data.credits : 0);

            // 2. Setăm Brand Profile (dacă există)
            if (data.brandProfile) {
                setBrandProfile(data.brandProfile as BrandProfile);
            } else {
                setBrandProfile(null);
            }

            // 3. Calcul Trial
            if (data.subscriptionTier === 'trial' && data.createdAt) {
               // @ts-ignore
               const startDate = data.createdAt?.toDate ? data.createdAt.toDate() : new Date();
               const now = new Date();
               const diffTime = Math.abs(now.getTime() - startDate.getTime());
               const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
               
               const remaining = 5 - diffDays;
               setDaysRemaining(remaining > 0 ? remaining : 0);
               setIsTrialExpired(remaining <= 0);
            } else {
               setDaysRemaining(30); 
               setIsTrialExpired(false);
            }
          }
          setLoading(false);
        });

        return () => unsubscribeSnapshot();
      } else {
        setUserProfile(null);
        setBrandProfile(null);
        setCredits(0);
        setLoading(false);
      }
    });

    return unsubscribeAuth;
  }, []);

  const signIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setUserProfile(null);
    setBrandProfile(null);
  };

  const checkCredits = (cost: number) => {
    if (isTrialExpired) return false;
    return credits >= cost;
  };

  // --- FUNCTIA DE SALVARE (NOUĂ) ---
  const saveBrandProfile = async (profile: BrandProfile) => {
      if (!user) return;
      const userRef = doc(db, 'users', user.uid);
      
      // Salvăm obiectul brandProfile în documentul userului
      await updateDoc(userRef, {
          brandProfile: profile
      });
      
      // State-ul se va actualiza automat datorită lui onSnapshot de mai sus
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      userProfile,
      brandProfile, 
      loading, 
      daysRemaining, 
      credits,
      isTrialExpired,
      signIn, 
      logout,
      checkCredits,
      saveBrandProfile // Exportăm funcția
    }}>
      {children}
    </AuthContext.Provider>
  );
};
