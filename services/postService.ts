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

const VAULT_LIMIT = 20; // Mărim puțin limita pentru confort

// 1. SAVE (Returnează ID-ul documentului creat)
export const savePostToHistory = async (userId: string, post: Post, topic: string): Promise<string | null> => {
  if (!userId || !post.content) return null;

  try {
    const postsRef = collection(db, 'posts');

    // --- ROTIRE (Ștergem cele vechi dacă e cazul) ---
    const q = query(
      postsRef,
      where('userId', '==', userId),
      where('isLocked', '==', false),
      orderBy('createdAt', 'asc')
    );
    
    const snapshot = await getDocs(q);
    if (snapshot.size >= VAULT_LIMIT) {
      const numToDelete = snapshot.size - VAULT_LIMIT + 1;
      for (let i = 0; i < numToDelete; i++) {
        await deleteDoc(snapshot.docs[i].ref);
      }
    }

    // --- SALVARE ---
    const docRef = await addDoc(postsRef, {
      userId,
      content: post.content,
      imageUrl: post.imageUrl || null,
      platform: Object.keys(post.adaptedContent || {})[0] || 'Generic',
      adaptedContent: post.adaptedContent || {}, // Salvăm și adaptările
      topic: topic || 'Untitled',
      createdAt: serverTimestamp(),
      isLocked: false
    });
    
    console.log("✅ Post saved. ID:", docRef.id);
    return docRef.id;

  } catch (e) {
    console.error("❌ Error saving post:", e);
    return null;
  }
};

// 2. UPDATE (Universal)
// Se apelează la orice modificare (Refine, Image, Lock)
export const updatePostInHistory = async (postId: string, updates: Partial<Post>) => {
  if (!postId) return;
  try {
    const docRef = doc(db, 'posts', postId);
    // Filtrăm câmpurile care nu trebuie în DB (ex: isGeneratingImage)
    const { isGeneratingImage, id, ...cleanUpdates } = updates as any;
    
    await updateDoc(docRef, {
        ...cleanUpdates,
        updatedAt: serverTimestamp()
    });
    console.log("🔄 Post updated in Vault:", postId);
  } catch (e) {
    console.error("Error updating post:", e);
  }
};

// 3. FETCH
export const fetchUserHistory = async (userId: string): Promise<any[]> => {
  if (!userId) return [];
  try {
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

// 4. DELETE & LOCK (Helpere)
export const deletePostFromHistory = async (postId: string) => {
  await deleteDoc(doc(db, 'posts', postId));
};

export const togglePostLock = async (postId: string, currentStatus: boolean) => {
  await updateDoc(doc(db, 'posts', postId), { isLocked: !currentStatus });
};
