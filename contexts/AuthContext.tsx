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
  onSnapshot 
} from 'firebase/firestore';
import { auth, googleProvider, db } from '../services/firebase';
import { UserProfile, PLANS } from '../types';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  daysRemaining: number;
  credits: number;
  signIn: () => Promise<void>;
  logout: () => Promise<void>;
  checkCredits: (cost: number) => boolean;
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
  const [loading, setLoading] = useState(true);
  const [daysRemaining, setDaysRemaining] = useState(0);
  const [credits, setCredits] = useState(0);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        const userRef = doc(db, 'users', currentUser.uid);

        // --- FIX: Am adăugat gestionarea erorilor la Snapshot ---
        const unsubscribeSnapshot = onSnapshot(
          userRef, 
          async (docSnap) => {
            if (!docSnap.exists()) {
              // User Nou -> Inițializare
              try {
                const newProfile: any = {
                  uid: currentUser.uid,
                  email: currentUser.email,
                  subscriptionTier: 'trial',
                  subscriptionStatus: 'active',
                  createdAt: serverTimestamp(),
                  credits: PLANS?.trial?.credits || 150, // Fallback de siguranță
                  imageCount: 0 
                };
                await setDoc(userRef, newProfile);
              } catch (err) {
                console.error("Error creating user profile:", err);
              }
            } else {
              // User Existent
              const data = docSnap.data() as UserProfile;
              const currentCredits = data.credits !== undefined ? data.credits : 0;
              
              setUserProfile(data);
              setCredits(currentCredits);

              if (data.subscriptionTier === 'trial' && data.createdAt) {
                 // @ts-ignore
                 const startDate = data.createdAt?.toDate ? data.createdAt.toDate() : new Date();
                 const now = new Date();
                 const diffTime = Math.abs(now.getTime() - startDate.getTime());
                 const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                 const remaining = 5 - diffDays;
                 setDaysRemaining(remaining > 0 ? remaining : 0);
              } else {
                 setDaysRemaining(30); 
              }
            }
            // Oprim loading-ul când avem datele
            setLoading(false);
          },
          (error) => {
            console.error("Firestore Snapshot Error:", error);
            // CRITIC: Oprim loading-ul chiar dacă e eroare, ca să nu rămână ecranul alb
            setLoading(false); 
          }
        );

        return () => unsubscribeSnapshot();
      } else {
        setUserProfile(null);
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
  };

  const checkCredits = (cost: number) => {
    return credits >= cost;
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      userProfile, 
      loading, 
      daysRemaining, 
      credits,
      signIn, 
      logout,
      checkCredits
    }}>
      {children}
    </AuthContext.Provider>
  );
};
