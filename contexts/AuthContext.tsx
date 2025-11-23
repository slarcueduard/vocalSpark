import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  User 
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  increment, 
  serverTimestamp 
} from 'firebase/firestore';
import { auth, googleProvider, db } from '../services/firebase';
import { UserProfile, SubscriptionTier } from '../types';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  daysRemaining: number;
  signIn: () => Promise<void>;
  logout: () => Promise<void>;
  checkImageLimit: () => boolean; // Verifică dacă poate genera
  incrementImageCount: () => Promise<void>; // Scade un credit
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

// Configurația limitelor (Hardcodată pentru MVP)
const TIER_LIMITS = {
  trial: 5,
  creator: 50,
  business: 200
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [daysRemaining, setDaysRemaining] = useState(0);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        const userRef = doc(db, 'users', currentUser.uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
          // USER NOU: Îl setăm pe TRIAL (5 imagini)
          const newProfile: any = {
            uid: currentUser.uid,
            email: currentUser.email,
            subscriptionTier: 'trial',
            subscriptionStatus: 'active',
            createdAt: serverTimestamp(),
            imageCount: 0,
            imageLimit: 5 // Limita 5 imagini
          };
          await setDoc(userRef, newProfile);
          setUserProfile(newProfile as UserProfile);
          setDaysRemaining(5);
        } else {
          // USER EXISTENT: Încărcăm datele
          const data = userSnap.data() as UserProfile;
          setUserProfile(data);

          // Calculăm zilele rămase din Trial
          if (data.subscriptionTier === 'trial' && data.trialStartDate) {
             const startDate = data.trialStartDate.toDate(); // Firestore timestamp to JS Date
             const now = new Date();
             const diffTime = Math.abs(now.getTime() - startDate.getTime());
             const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
             const remaining = 5 - diffDays;
             setDaysRemaining(remaining > 0 ? remaining : 0);
          } else {
             setDaysRemaining(30); // Pentru planuri plătite
          }
        }
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
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
  };

  // Funcția critică: Verifică limitele
  const checkImageLimit = () => {
    if (!userProfile) return false;
    // Dacă e trial și au trecut 5 zile -> Block
    if (userProfile.subscriptionTier === 'trial' && daysRemaining <= 0) return false;
    
    // Verifică numărul de imagini
    return userProfile.imageCount < userProfile.imageLimit;
  };

  // Funcția critică: Consumă un credit
  const incrementImageCount = async () => {
    if (!user || !userProfile) return;
    const userRef = doc(db, 'users', user.uid);
    
    // Update local state instant (pentru UI rapid)
    setUserProfile(prev => prev ? ({...prev, imageCount: prev.imageCount + 1}) : null);
    
    // Update în baza de date
    await updateDoc(userRef, {
      imageCount: increment(1)
    });
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      userProfile, 
      loading, 
      daysRemaining, 
      signIn, 
      logout,
      checkImageLimit,
      incrementImageCount
    }}>
      {children}
    </AuthContext.Provider>
  );
};
