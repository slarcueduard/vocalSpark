import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import type { User } from 'firebase/auth';
import type { UserProfile, BrandProfile } from '../types';

/**
 * Fetches the user profile from Firestore.
 * @param uid The user's unique ID.
 * @returns The user profile object or null if not found.
 */
export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  const userDocRef = doc(db, 'users', uid);
  const userDocSnap = await getDoc(userDocRef);

  if (userDocSnap.exists()) {
    return userDocSnap.data() as UserProfile;
  } else {
    return null;
  }
};

/**
 * Creates a new user profile in Firestore upon first sign-in,
 * automatically setting up a 5-day trial period.
 * @param user The Firebase Auth user object.
 * @returns The newly created user profile.
 */
export const createUserProfile = async (user: User): Promise<UserProfile> => {
  const userDocRef = doc(db, 'users', user.uid);
  
  const trialStartDate = new Date();
  const trialEndDate = new Date();
  trialEndDate.setDate(trialStartDate.getDate() + 5);

  const newUserProfile: UserProfile = {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
    trialStartDate: trialStartDate.toISOString(),
    trialEndDate: trialEndDate.toISOString(),
    subscriptionStatus: 'trial',
  };

  await setDoc(userDocRef, newUserProfile);
  
  return newUserProfile;
};

/**
 * Updates the user's subscription status.
 * @param uid The user's unique ID.
 * @param status The new subscription status.
 */
export const updateSubscriptionStatus = async (uid: string, status: 'active' | 'trial' | 'none'): Promise<void> => {
  const userDocRef = doc(db, 'users', uid);
  await updateDoc(userDocRef, { 
    subscriptionStatus: status 
  });
};

/**
 * Updates the user's brand profile settings.
 * @param uid The user's unique ID.
 * @param brandProfile The brand profile data.
 */
export const updateUserBrandProfile = async (uid: string, brandProfile: BrandProfile): Promise<void> => {
  const userDocRef = doc(db, 'users', uid);
  await updateDoc(userDocRef, { 
    brandProfile: brandProfile 
  });
};