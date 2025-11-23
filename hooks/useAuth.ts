
import { useState, useEffect, useCallback } from 'react';
import { onAuthChanged, signInWithGoogle, signOut } from '../services/firebase';
import { getUserProfile, createUserProfile, updateSubscriptionStatus } from '../services/firestore';
import type { User } from 'firebase/auth';
import type { UserProfile } from '../types';

export type AuthState = 'loading' | 'authenticating' | 'unauthenticated' | 'trial' | 'trial_expired' | 'subscribed';

// TODO: REPLACE THIS WITH YOUR ACTUAL STRIPE PAYMENT LINK
const STRIPE_PAYMENT_LINK = "https://buy.stripe.com/test_eVa..."; 

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [authState, setAuthState] = useState<AuthState>('loading');
  const [authError, setAuthError] = useState<string | null>(null);

  // Handle Firebase Auth State Changes
  useEffect(() => {
    const unsubscribe = onAuthChanged(async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        let profile = await getUserProfile(firebaseUser.uid);
        if (!profile) {
          profile = await createUserProfile(firebaseUser);
        }
        setUserProfile(profile);

        const now = new Date();
        const trialEndDate = new Date(profile.trialEndDate);

        if (profile.subscriptionStatus === 'active') {
          setAuthState('subscribed');
        } else if (now < trialEndDate) {
          setAuthState('trial');
        } else {
          setAuthState('trial_expired');
        }
      } else {
        setUser(null);
        setUserProfile(null);
        setAuthState('unauthenticated');
      }
    });

    return () => unsubscribe();
  }, []);

  // Handle Return from Stripe (Payment Success)
  useEffect(() => {
    const checkPaymentSuccess = async () => {
      if (!user || !userProfile) return;

      const params = new URLSearchParams(window.location.search);
      const isPaymentSuccess = params.get('payment_success') === 'true';

      if (isPaymentSuccess && userProfile.subscriptionStatus !== 'active') {
        try {
          // Update Firestore
          await updateSubscriptionStatus(user.uid, 'active');
          
          // Update Local State
          const updatedProfile = { ...userProfile, subscriptionStatus: 'active' as const };
          setUserProfile(updatedProfile);
          setAuthState('subscribed');

          // Clean the URL so the user doesn't refresh and re-trigger
          window.history.replaceState({}, '', window.location.pathname);
          
          alert("Payment successful! Your subscription is now active. Thank you!");
        } catch (error) {
          console.error("Failed to activate subscription:", error);
          alert("Payment received, but we had trouble activating the account automatically. Please contact support.");
        }
      }
    };

    checkPaymentSuccess();
  }, [user, userProfile]);

  const handleSignIn = useCallback(async () => {
    setAuthError(null);
    setAuthState('authenticating');
    try {
      await signInWithGoogle();
      // onAuthChanged will handle the success state change
    } catch (error: any) {
      console.error("Error signing in with Google:", error);
      if (error.code !== 'auth/popup-closed-by-user') {
        setAuthError(error.code || error.message || 'An unknown authentication error occurred.');
      }
      setAuthState('unauthenticated');
    }
  }, []);

  const handleSignOut = useCallback(async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  }, []);

  const handleSubscribe = useCallback(() => {
    if (STRIPE_PAYMENT_LINK.includes("test_eVa")) {
        const confirm = window.confirm("You need to configure your Stripe Link in hooks/useAuth.ts first. Do you want to be redirected to the placeholder link?");
        if(!confirm) return;
    }
    // Redirect to Stripe
    window.location.href = STRIPE_PAYMENT_LINK;
  }, []);

  return {
    user,
    userProfile,
    authState,
    authError,
    handleSignIn,
    handleSignOut,
    handleSubscribe,
  };
};
