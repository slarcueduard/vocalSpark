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

// 1. SAVE (Versiune Robustă: Salvează Întâi, Curăță După)
export const savePostToHistory = async (
    userId: string, 
    post: Post, 
    topic: string, 
    limit: number = 20
): Promise<string | null> => {
  
  // Validare de bază
  if (!userId || !post.content) {
      console.error("❌ Save skipped: Missing userId or content");
      return null;
  }

  try {
    const postsRef = collection(db, 'posts');

    // --- PASUL 1: SALVAREA (Prioritate Critică) ---
    const docData = {
      userId,
      content: post.content,
      imageUrl: post.imageUrl || null,
      platform: post.adaptedContent ? Object.keys(post.adaptedContent)[0] : 'Generic',
      adaptedContent: post.adaptedContent || {},
      topic: topic || 'Untitled',
      createdAt: serverTimestamp(),
      scheduledDate: post.scheduledDate || null,
      isLocked: false,
      isPublished: false,
      
      // AICI SALVĂM TIPURILE PENTRU FILTRARE
      generationType: post.generationType || 'single', 
      type: post.type || 'post'
    };
    
    const docRef = await addDoc(postsRef, docData);
    console.log("✅ Post saved successfully. ID:", docRef.id);

    // --- PASUL 2: CURĂȚENIE (Async - nu blochează salvarea) ---
    // Încercăm să ștergem vechiturile. Dacă dă eroare (ex: index lipsă), nu ne pasă, userul are postarea salvată.
    try {
        const q = query(
          postsRef,
          where('userId', '==', userId),
          where('isLocked', '==', false), // Nu ștergem ce e blocat
          orderBy('createdAt', 'asc') // Cele mai vechi primele
        );
        
        const snapshot = await getDocs(q);
        
        // Dacă avem mai multe decât limita (ex: 21 vs 20), ștergem surplusul
        if (snapshot.size > limit) {
          const numToDelete = snapshot.size - limit;
          for (let i = 0; i < numToDelete; i++) {
            await deleteDoc(snapshot.docs[i].ref);
            console.log("🗑️ Auto-deleted old post to maintain limit.");
          }
        }
    } catch (cleanupError) {
        console.warn("⚠️ Cleanup warning (Index might be missing), but post was saved.", cleanupError);
    }

    return docRef.id;

  } catch (e) {
    console.error("❌ CRITICAL ERROR saving post:", e);
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

// 3. UPDATE CONTENT (Alias necesar)
export const updatePostContent = async (postId: string, newContent: string) => {
    return updatePostInHistory(postId, { content: newContent });
};

// 4. FETCH HISTORY
export const fetchUserHistory = async (userId: string): Promise<any[]> => {
  if (!userId) return [];
  try {
    // Query simplificat pentru siguranță (fără orderBy complex)
    // Sortarea o facem în frontend
    const q = query(collection(db, 'posts'), where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (e) { 
    console.error("Fetch error:", e);
    return []; 
  }
};

// 5. DELETE
export const deletePostFromHistory = async (postId: string) => {
  try { await deleteDoc(doc(db, 'posts', postId)); } catch (e) { console.error(e); }
};

// 6. LOCK
export const togglePostLock = async (postId: string, currentStatus: boolean) => {
  try { await updateDoc(doc(db, 'posts', postId), { isLocked: !currentStatus }); } catch (e) { console.error(e); }
};

// 7. SCHEDULE
export const schedulePost = async (postId: string, date: Date) => {
  try { await updateDoc(doc(db, 'posts', postId), { scheduledDate: date, isPublished: false }); } catch (e) { console.error(e); }
};

// 8. CHECK DUE
export const checkDuePosts = async (userId: string) => {
  try {
    const now = new Date();
    const startOfDay = new Date(now.setHours(0, 0, 0, 0));
    const endOfDay = new Date(now.setHours(23, 59, 59, 999));
    
    const q = query(
      collection(db, 'posts'),
      where('userId', '==', userId),
      where('isPublished', '==', false),
      where('scheduledDate', '>=', startOfDay),
      where('scheduledDate', '<=', endOfDay)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (e) { return []; }
};

// 9. MARK PUBLISHED
export const markPostAsPublished = async (postId: string) => {
    await updateDoc(doc(db, 'posts', postId), { isPublished: true });
};

// 10. MANUAL EVENT
export const createManualEvent = async (userId: string, title: string, date: Date, description: string) => {
    const dummyPost: Post = {
        id: 'manual',
        content: `${title}\n\n${description}`,
        adaptedContent: {},
        isGeneratingImage: false,
        scheduledDate: date,
        isLocked: true,
        imageUrl: null,
        generationType: 'single',
        type: 'event'
    };
    return savePostToHistory(userId, dummyPost, title, 100); 
};
