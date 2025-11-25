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
import { UserProfile } from '../types';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  daysRemaining: number;
  credits: number; // Am adăugat creditele explicit
  signIn: () => Promise<void>;
  logout: () => Promise<void>;
  checkCredits: (cost: number) => boolean; // Verificare credite
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
    // Ascultăm starea de autentificare
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        const userRef = doc(db, 'users', currentUser.uid);

        // ASCULTARE ÎN TIMP REAL (Real-time Listener)
        // Asta face ca UI-ul să se actualizeze singur când Backend-ul scade creditele!
        const unsubscribeSnapshot = onSnapshot(userRef, async (docSnap) => {
          if (!docSnap.exists()) {
            // USER NOU: Îl inițializăm cu 10 credite (cum am stabilit în backend)
            const newProfile = {
              uid: currentUser.uid,
              email: currentUser.email,
              subscriptionTier: 'trial',
              subscriptionStatus: 'active',
              createdAt: serverTimestamp(),
              credits: 10, // Sincronizat cu backend-ul
              imageCount: 0 
            };
            await setDoc(userRef, newProfile);
            // Snapshot-ul se va declanșa din nou automat după setDoc
          } else {
            // USER EXISTENT: Actualizăm datele în aplicație
            const data = docSnap.data() as UserProfile;
            
            // Mapăm creditele (dacă nu există câmpul, punem 0)
            // @ts-ignore - ignorăm eroarea de tip pt a fi flexibili
            const currentCredits = data.credits !== undefined ? data.credits : (data.imageLimit - data.imageCount || 0);
            
            setUserProfile(data);
            setCredits(currentCredits);

            // Calcul zile trial (păstrat pentru logică veche)
            if (data.subscriptionTier === 'trial' && data.trialStartDate) {
               // @ts-ignore
               const startDate = data.trialStartDate.toDate(); 
               const now = new Date();
               const diffTime = Math.abs(now.getTime() - startDate.getTime());
               const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
               const remaining = 5 - diffDays;
               setDaysRemaining(remaining > 0 ? remaining : 0);
            } else {
               setDaysRemaining(30); 
            }
          }
          setLoading(false);
        });

        return () => unsubscribeSnapshot(); // Curățăm listener-ul când userul iese
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

  // Funcție nouă: Verifică dacă userul are destule credite pt o acțiune
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
