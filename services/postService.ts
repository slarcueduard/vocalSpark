import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  getDocs, 
  deleteDoc, 
  doc, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from './firebase';
import { Post } from '../types';

const VAULT_LIMIT = 10; // Limita de postări salvate

// Salvează un post nou (cu ștergere automată a celor vechi)
export const savePostToHistory = async (userId: string, post: Post, topic: string) => {
  try {
    const postsRef = collection(db, 'posts');

    // 1. Verificăm câte postări are userul
    const q = query(
      postsRef,
      where('userId', '==', userId),
      orderBy('createdAt', 'asc') // Cele mai vechi primele
    );
    
    const snapshot = await getDocs(q);

    // 2. Dacă a atins limita, ștergem cele mai vechi până facem loc
    if (snapshot.size >= VAULT_LIMIT) {
      // Calculăm câte trebuie șterse (ex: avem 10, limita e 10 => ștergem 1 ca să punem 1)
      const numToDelete = snapshot.size - VAULT_LIMIT + 1;
      
      for (let i = 0; i < numToDelete; i++) {
        const docToDelete = snapshot.docs[i];
        await deleteDoc(docToDelete.ref);
        console.log("Auto-deleted old post from Vault:", docToDelete.id);
      }
    }

    // 3. Salvăm noul post
    await addDoc(postsRef, {
      userId,
      content: post.content,
      imageUrl: post.imageUrl || null,
      platform: Object.keys(post.adaptedContent)[0] || 'Generic',
      topic: topic,
      createdAt: serverTimestamp(),
      isLocked: false
    });
    
    console.log("Post saved to Vault automatically.");

  } catch (e) {
    console.error("Error saving post:", e);
  }
};

// Aduce istoricul
export const fetchUserHistory = async (userId: string): Promise<any[]> => {
  try {
    const q = query(
      collection(db, 'posts'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc') // Cele mai noi primele
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

// Șterge manual (butonul de Delete din Vault)
export const deletePostFromHistory = async (postId: string) => {
  try {
    await deleteDoc(doc(db, 'posts', postId));
  } catch (e) {
    console.error("Error deleting post:", e);
    throw e;
  }
};
