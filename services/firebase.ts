import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut as firebaseSignOut, onAuthStateChanged, NextOrObserver, User } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { firebaseConfig as localConfig } from "../firebaseConfig";

// Use the local config in this environment.
// In a real Vercel/Vite environment, you might use import.meta.env,
// but for this preview to work, we rely on the firebaseConfig.ts file.
const firebaseConfig = localConfig;

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);

export const signInWithGoogle = () => signInWithPopup(auth, googleProvider);
export const signOut = () => firebaseSignOut(auth);
export const onAuthChanged = (observer: NextOrObserver<User>) => onAuthStateChanged(auth, observer);
