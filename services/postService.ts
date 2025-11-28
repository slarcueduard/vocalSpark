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

const VAULT_LIMIT = 20;

// 1. SAVE (Versiune Robustă: Salvează Întâi, Curăță După)
export const savePostToHistory = async (userId: string, post: Post, topic: string): Promise<string | null> => {
  if (!userId || !post.content) return null;

  try {
    const postsRef = collection(db, 'posts');

    // PASUL 1: SALVĂM DIRECT (Ca să fim siguri că datele ajung în DB)
    const docRef = await addDoc(postsRef, {
      userId,
      content: post.content,
      imageUrl: post.imageUrl || null,
      platform: Object.keys(post.adaptedContent || {})[0] || 'Generic',
      adaptedContent: post.adaptedContent || {},
      topic: topic || 'Untitled',
      createdAt: serverTimestamp(),
      isLocked: false
    });
    
    console.log("✅ Post saved successfully. ID:", docRef.id);

    // PASUL 2: CURĂȚENIE (Async - nu blochează salvarea dacă dă eroare de index)
    // Facem asta într-un bloc separat try-catch
    try {
        const q = query(
          postsRef,
          where('userId', '==', userId),
          where('isLocked', '==', false),
          orderBy('createdAt', 'asc') // Cele mai vechi primele
        );
        
        const snapshot = await getDocs(q);
        
        // Dacă avem mai multe decât limita, ștergem surplusul
        if (snapshot.size > VAULT_LIMIT) {
          const numToDelete = snapshot.size - VAULT_LIMIT;
          for (let i = 0; i < numToDelete; i++) {
            await deleteDoc(snapshot.docs[i].ref);
            console.log("🗑️ Auto-deleted old post");
          }
        }
    } catch (cleanupError) {
        console.warn("⚠️ Cleanup failed (probably missing Index). Post is safe though.", cleanupError);
    }

    return docRef.id;

  } catch (e) {
    console.error("❌ CRITICAL ERROR saving post:", e);
    return null;
  }
};

// 2. UPDATE
export const updatePostInHistory = async (postId: string, updates: Partial<Post>) => {
  if (!postId) return;
  try {
    const docRef = doc(db, 'posts', postId);
    const updateData: any = { ...updates };
    delete updateData.id;
    delete updateData.isGeneratingImage;
    updateData.updatedAt = serverTimestamp();

    await updateDoc(docRef, updateData);
  } catch (e) {
    console.error("Error updating post:", e);
  }
};

export const updatePostContent = async (postId: string, newContent: string) => {
    return updatePostInHistory(postId, { content: newContent });
};

// 3. FETCH (Versiune Simplificată Temporar)
export const fetchUserHistory = async (userId: string): Promise<any[]> => {
  if (!userId) return [];
  try {
    // Încercăm întâi query-ul complex
    try {
        const q = query(
          collection(db, 'posts'),
          where('userId', '==', userId),
          orderBy('createdAt', 'desc')
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (indexError: any) {
        // Dacă dă eroare de index (Failed precondition), facem fallback la query simplu
        if (indexError.code === 'failed-precondition') {
            console.warn("Index missing via fetch. Falling back to simple query.");
            const qSimple = query(collection(db, 'posts'), where('userId', '==', userId));
            const querySnapshot = await getDocs(qSimple);
            // Sortăm manual în JS
            const rawDocs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            // @ts-ignore
            return rawDocs.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        }
        throw indexError;
    }
  } catch (e) {
    console.error("Error fetching history:", e);
    return [];
  }
};

// 4. DELETE & LOCK
export const deletePostFromHistory = async (postId: string) => {
  await deleteDoc(doc(db, 'posts', postId));
};

export const togglePostLock = async (postId: string, currentStatus: boolean) => {
  await updateDoc(doc(db, 'posts', postId), { isLocked: !currentStatus });
};
