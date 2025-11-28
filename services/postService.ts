import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  getDocs, 
  deleteDoc, 
  doc, 
  updateDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from './firebase';
import { Post } from '../types';

const VAULT_LIMIT = 10;

// 1. SAVE (Cu protecție la limită)
export const savePostToHistory = async (userId: string, post: Post, topic: string) => {
  if (!userId || !post.content) return;

  try {
    const postsRef = collection(db, 'posts');

    // --- LOGICA DE ROTIRE ---
    // Luăm doar postările care NU sunt blocate (Locked)
    const q = query(
      postsRef,
      where('userId', '==', userId),
      where('isLocked', '==', false), // Doar cele neimportante pot fi șterse
      orderBy('createdAt', 'asc') // Cele mai vechi primele
    );
    
    const snapshot = await getDocs(q);

    // Dacă depășim limita de postări "ciurn", le ștergem pe cele vechi
    if (snapshot.size >= VAULT_LIMIT) {
      const numToDelete = snapshot.size - VAULT_LIMIT + 1;
      for (let i = 0; i < numToDelete; i++) {
        await deleteDoc(snapshot.docs[i].ref);
      }
    }

    // --- SALVARE ---
    let platformName = 'Generic';
    const keys = Object.keys(post.adaptedContent || {});
    if (keys.length > 0) platformName = keys[0];

    await addDoc(postsRef, {
      userId,
      content: post.content,
      imageUrl: post.imageUrl || null,
      platform: platformName,
      topic: topic || 'Untitled',
      createdAt: serverTimestamp(),
      isLocked: false // Implicit nu e blocat
    });
    
    console.log("✅ Post auto-saved to Vault.");

  } catch (e) {
    console.error("❌ Error saving post:", e);
  }
};

// 2. FETCH
export const fetchUserHistory = async (userId: string): Promise<any[]> => {
  if (!userId) return [];
  try {
    // Le luăm pe toate, ordonate după dată
    const q = query(
      collection(db, 'posts'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (e) {
    console.error("Error fetching history:", e);
    return [];
  }
};

// 3. DELETE
export const deletePostFromHistory = async (postId: string) => {
  await deleteDoc(doc(db, 'posts', postId));
};

// 4. TOGGLE LOCK (NOU)
export const togglePostLock = async (postId: string, currentStatus: boolean) => {
  await updateDoc(doc(db, 'posts', postId), {
    isLocked: !currentStatus
  });
};

// 5. UPDATE CONTENT (NOU - Pentru editare in Vault)
export const updatePostContent = async (postId: string, newContent: string) => {
  await updateDoc(doc(db, 'posts', postId), {
    content: newContent
  });
};
