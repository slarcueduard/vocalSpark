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

// 1. SAVE (Debug Version)
export const savePostToHistory = async (
    userId: string, 
    post: Post, 
    topic: string, 
    vaultLimit: number = 20 // <--- Parametru nou cu default 20
): Promise<string | null> => {
  // ...
  // Înlocuiește VAULT_LIMIT cu vaultLimit în interiorul funcției
  // ...
        if (snapshot.size >= vaultLimit) {
          const numToDelete = snapshot.size - vaultLimit + 1;
  // ...
};
  
  if (!userId || !post.content) {
      console.error("❌ [DEBUG] Missing userId or content. Abort.");
      return null;
  }

  try {
    const postsRef = collection(db, 'posts');

    // PASUL A: Încercăm să ștergem postările vechi (Rotire)
    // Punem într-un try/catch separat ca să nu blocheze salvarea dacă lipsește indexul
    try {
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
            console.log("🗑️ [DEBUG] Auto-deleted old post");
          }
        }
    } catch (cleanupErr) {
        console.warn("⚠️ [DEBUG] Cleanup skipped (Index missing?). Proceeding to save anyway.", cleanupErr);
    }

    // PASUL B: Salvarea propriu-zisă
    const docData = {
      userId,
      content: post.content,
      imageUrl: post.imageUrl || null,
      platform: Object.keys(post.adaptedContent || {})[0] || 'Generic',
      adaptedContent: post.adaptedContent || {},
      topic: topic || 'Untitled',
      createdAt: serverTimestamp(),
      isLocked: false
    };

    console.log("📝 [DEBUG] Writing to Firestore...", docData);
    
    const docRef = await addDoc(postsRef, docData);
    
    console.log("✅ [DEBUG] SUCCESS! Saved with ID:", docRef.id);
    return docRef.id;

  } catch (e: any) {
    console.error("❌ [DEBUG] FIRESTORE CRITICAL ERROR:", e);
    return null;
  }
};

// 2. UPDATE GENERAL
export const updatePostInHistory = async (postId: string, updates: Partial<Post>) => {
  if (!postId) return;
  try {
    const docRef = doc(db, 'posts', postId);
    const updateData: any = { ...updates };
    
    // Curățăm datele care nu trebuie în DB
    delete updateData.id;
    delete updateData.isGeneratingImage;
    
    updateData.updatedAt = serverTimestamp();

    await updateDoc(docRef, updateData);
    console.log("🔄 Post updated:", postId);
  } catch (e) {
    console.error("Error updating post:", e);
  }
};

// 3. UPDATE CONTENT (Alias necesar pentru HistoryView)
export const updatePostContent = async (postId: string, newContent: string) => {
    return updatePostInHistory(postId, { content: newContent });
};

// 4. FETCH
export const fetchUserHistory = async (userId: string): Promise<any[]> => {
  if (!userId) return [];
  try {
    // Încercăm query-ul complex
    try {
        const q = query(
          collection(db, 'posts'),
          where('userId', '==', userId),
          orderBy('createdAt', 'desc')
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (indexError: any) {
        // Fallback dacă lipsește indexul: luăm tot și sortăm în JS
        if (indexError.code === 'failed-precondition') {
            console.warn("⚠️ Index missing. Falling back to client-side sort.");
            const qSimple = query(collection(db, 'posts'), where('userId', '==', userId));
            const querySnapshot = await getDocs(qSimple);
            const docs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            // @ts-ignore
            return docs.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        }
        throw indexError;
    }
  } catch (e) {
    console.error("Error fetching history:", e);
    return [];
  }
};

// 5. DELETE
export const deletePostFromHistory = async (postId: string) => {
  try {
      await deleteDoc(doc(db, 'posts', postId));
  } catch (e) {
      console.error("Delete failed:", e);
  }
};

// 6. LOCK
export const togglePostLock = async (postId: string, currentStatus: boolean) => {
  try {
      await updateDoc(doc(db, 'posts', postId), { isLocked: !currentStatus });
  } catch (e) {
      console.error("Lock failed:", e);
  }

  // ... importuri existente

// 7. SCHEDULE POST
export const schedulePost = async (postId: string, date: Date) => {
  try {
    const docRef = doc(db, 'posts', postId);
    await updateDoc(docRef, {
      scheduledDate: date,
      isPublished: false // Resetăm statusul
    });
    console.log(`📅 Post ${postId} scheduled for ${date}`);
  } catch (e) {
    console.error("Schedule failed:", e);
  }
};

// 8. CHECK DUE POSTS (Pentru Notificări)
export const checkDuePosts = async (userId: string) => {
  try {
    const now = new Date();
    const startOfDay = new Date(now.setHours(0, 0, 0, 0)); // Începutul zilei de azi
    
    const q = query(
      collection(db, 'posts'),
      where('userId', '==', userId),
      where('isPublished', '==', false), // Doar cele nepostate
      where('scheduledDate', '>=', startOfDay), // De azi...
      where('scheduledDate', '<=', new Date(now.setHours(23, 59, 59, 999))) // ...până la finalul zilei
      // Notă: Pentru "Missed posts" (din trecut) ar trebui o logică separată, dar pt MVP azi e ok.
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (e) {
    console.error("Check due posts failed:", e);
    return [];
  }
};

// 9. MARK AS PUBLISHED
export const markPostAsPublished = async (postId: string) => {
    await updateDoc(doc(db, 'posts', postId), { isPublished: true });

};
