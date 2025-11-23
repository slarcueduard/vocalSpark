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
  serverTimestamp, 
  Timestamp 
} from 'firebase/firestore';
import { auth, googleProvider, db } from '../services/firebase';
import { updateUserBrandProfile } from '../services/firestore';
import { BrandProfile } from '../types';

// REPLACE THIS WITH YOUR ACTUAL STRIPE PAYMENT LINK
const STRIPE_PAYMENT_LINK = "https://buy.stripe.com/test_eVa..."; 

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isTrialExpired: boolean;
  daysRemaining: number;
  error: string | null;
  brandProfile: BrandProfile | null;
  signIn: () => Promise<void>;
  loginAsGuest: () => void;
  logout: () => Promise<void>;
  subscribe: () => void;
  clearError: () => void;
  saveBrandProfile: (profile: BrandProfile) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

const GUEST_PROFILE_KEY = 'socialSparkGuestBrandProfile';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isTrialExpired, setIsTrialExpired] = useState(false);
  const [daysRemaining, setDaysRemaining] = useState(5);
  const [error, setError] = useState<string | null>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [brandProfile, setBrandProfile] = useState<BrandProfile | null>(null);

  useEffect(() => {
    // If we are in guest mode, ignore firebase auth changes
    if (isGuest) {
      // Load guest profile from local storage
      const savedProfile = localStorage.getItem(GUEST_PROFILE_KEY);
      if (savedProfile) {
        setBrandProfile(JSON.parse(savedProfile));
      }
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        // Check user document in Firestore
        const userRef = doc(db, 'users', currentUser.uid);
        try {
            const userSnap = await getDoc(userRef);

            // Check for payment success return in URL
            const params = new URLSearchParams(window.location.search);
            const isPaymentSuccess = params.get('payment_success') === 'true';

            if (isPaymentSuccess) {
              await setDoc(userRef, { subscriptionStatus: 'active' }, { merge: true });
              window.history.replaceState({}, '', window.location.pathname);
              setIsTrialExpired(false);
              setLoading(false);
              alert("Thank you! Your subscription is now active.");
              return;
            }

            if (!userSnap.exists()) {
              await setDoc(userRef, {
                  email: currentUser.email,
                  createdAt: serverTimestamp(),
                  subscriptionStatus: 'trial'
              });
              setDaysRemaining(5);
              setIsTrialExpired(false);
            } else {
              const userData = userSnap.data();
              
              // Load Brand Profile from Firestore
              if (userData.brandProfile) {
                setBrandProfile(userData.brandProfile as BrandProfile);
              }

              if (userData.subscriptionStatus === 'active') {
                  setIsTrialExpired(false);
                  setLoading(false);
                  return;
              }

              const createdAt = userData.createdAt instanceof Timestamp 
                  ? userData.createdAt.toDate() 
                  : new Date(); 
                  
              const now = new Date();
              const diffTime = Math.abs(now.getTime() - createdAt.getTime());
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
              
              if (diffDays > 5) {
                  setIsTrialExpired(true);
                  setDaysRemaining(0);
              } else {
                  setIsTrialExpired(false);
                  setDaysRemaining(6 - diffDays);
              }
            }
        } catch (err) {
            console.error("Error fetching user data:", err);
            setLoading(false);
        }
      } else {
        setBrandProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, [isGuest]);

  const signIn = async () => {
    setError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.error("Login failed", err);
      setError(err.message || "Login failed. Please check your settings.");
    }
  };

  const loginAsGuest = () => {
    setIsGuest(true);
    setError(null);
    setLoading(true);
    
    const guestUser = {
      uid: 'guest-preview-id',
      displayName: 'Guest Preview',
      email: 'guest@velocityautomationai.com',
      emailVerified: true,
      isAnonymous: true,
      metadata: {},
      providerData: [],
      refreshToken: '',
      tenantId: null,
      delete: async () => {},
      getIdToken: async () => 'guest-token',
      getIdTokenResult: async () => ({} as any),
      reload: async () => {},
      toJSON: () => ({}),
      phoneNumber: null,
      photoURL: null,
    } as unknown as User;

    setTimeout(() => {
        setUser(guestUser);
        setIsTrialExpired(false);
        setDaysRemaining(5);
        setLoading(false);
        // Try load guest profile
        const savedProfile = localStorage.getItem(GUEST_PROFILE_KEY);
        if (savedProfile) {
            setBrandProfile(JSON.parse(savedProfile));
        }
    }, 800);
  };

  const logout = async () => {
    if (isGuest) {
        setIsGuest(false);
        setUser(null);
        setBrandProfile(null);
        return;
    }
    await signOut(auth);
    setUser(null);
    setBrandProfile(null);
    setIsTrialExpired(false);
    setError(null);
  };

  const subscribe = () => {
    if (STRIPE_PAYMENT_LINK.includes("test_eVa")) {
        const confirm = window.confirm("You need to configure your Stripe Link in contexts/AuthContext.tsx first. Do you want to be redirected to the placeholder link?");
        if(!confirm) return;
    }
    window.location.href = STRIPE_PAYMENT_LINK;
  };

  const clearError = () => setError(null);

  const saveBrandProfile = async (profile: BrandProfile) => {
    setBrandProfile(profile);
    
    if (isGuest) {
      localStorage.setItem(GUEST_PROFILE_KEY, JSON.stringify(profile));
    } else if (user) {
      try {
        await updateUserBrandProfile(user.uid, profile);
      } catch (err) {
        console.error("Failed to save brand profile to Firestore", err);
        setError("Failed to save brand profile settings.");
      }
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      isTrialExpired, 
      daysRemaining, 
      error, 
      brandProfile,
      signIn, 
      loginAsGuest, 
      logout, 
      subscribe, 
      clearError,
      saveBrandProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
};