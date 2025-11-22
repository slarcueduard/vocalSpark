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
  serverTimestamp, 
  Timestamp 
} from 'firebase/firestore';
import { auth, googleProvider, db } from '../services/firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isTrialExpired: boolean;
  daysRemaining: number;
  signIn: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isTrialExpired, setIsTrialExpired] = useState(false);
  const [daysRemaining, setDaysRemaining] = useState(5);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        // Check user document in Firestore
        const userRef = doc(db, 'users', currentUser.uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
          // NEW USER: Create account with start date
          await setDoc(userRef, {
            email: currentUser.email,
            createdAt: serverTimestamp(),
            subscriptionStatus: 'trial'
          });
          setDaysRemaining(5);
          setIsTrialExpired(false);
        } else {
          // EXISTING USER: Check time difference
          const userData = userSnap.data();
          
          // If they already paid, skip checks
          if (userData.subscriptionStatus === 'active') {
            setIsTrialExpired(false);
            setLoading(false);
            return;
          }

          // Calculate Trial Time
          const createdAt = userData.createdAt instanceof Timestamp 
            ? userData.createdAt.toDate() 
            : new Date(); // Fallback
            
          const now = new Date();
          const diffTime = Math.abs(now.getTime() - createdAt.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
          
          // Logic: 5 Days Free
          if (diffDays > 5) {
            setIsTrialExpired(true);
            setDaysRemaining(0);
          } else {
            setIsTrialExpired(false);
            setDaysRemaining(6 - diffDays); // 6 because diff starts at 1
          }
        }
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
      alert("Login failed. Please check your popup blocker or settings.");
    }
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setIsTrialExpired(false);
  };

  return (
    <AuthContext.Provider value={{ user, loading, isTrialExpired, daysRemaining, signIn, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
