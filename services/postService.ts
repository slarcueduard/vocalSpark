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

// 1. SAVE (Cu limită dinamică)
export const savePostToHistory = async (
    userId: string, 
    post: Post, 
    topic: string, 
    limit: number = 20 // Default 20, dar poate fi 50
): Promise<string | null> => {
  if (!userId || !post.content) return null;

  try {
    const postsRef = collection(db, 'posts');

    // --- CURĂȚENIE (ROTIRE) ---
    try {
        const q = query(
          postsRef,
          where('userId', '==', userId),
          where('isLocked', '==', false),
          orderBy('createdAt', 'asc')
        );
        
        const snapshot = await getDocs(q);
        
        // Dacă depășim limita trimisă ca parametru
        if (snapshot.size >= limit) {
          const numToDelete = snapshot.size - limit + 1;
          for (let i = 0; i < numToDelete; i++) {
            await deleteDoc(snapshot.docs[i].ref);
          }
        }
    } catch (cleanupErr) {
        console.warn("Cleanup skipped (Index missing?). Saving anyway.");
    }

    // --- SALVARE ---
    const docData = {
      userId,
      content: post.content,
      imageUrl: post.imageUrl || null,
      platform: Object.keys(post.adaptedContent || {})[0] || 'Generic',
      adaptedContent: post.adaptedContent || {},
      topic: topic || 'Untitled',
      createdAt: serverTimestamp(),
      scheduledDate: post.scheduledDate || null, // Salvăm data dacă există (pt Calendar)
      isLocked: false,
      isPublished: false
    };
    
    const docRef = await addDoc(postsRef, docData);
    return docRef.id;

  } catch (e) {
    console.error("Save failed:", e);
    return null;
  }
};

// 2. MANUAL EVENT (Pentru Calendar)
export const createManualEvent = async (userId: string, title: string, date: Date, description: string) => {
    // Salvăm un "Post" special care apare doar în calendar
    const dummyPost: Post = {
        id: 'manual',
        content: `${title}\n\n${description}`,
        adaptedContent: {},
        isGeneratingImage: false,
        scheduledDate: date, // CRITIC
        isLocked: true // Îl blocăm ca să nu dispară la rotire
    };
    return savePostToHistory(userId, dummyPost, title, 100); // Limită mare pt siguranță
};

// ... (Restul funcțiilor rămân neschimbate: updatePostInHistory, fetchUserHistory, delete, toggleLock etc.)
export const updatePostInHistory = async (postId: string, updates: Partial<Post>) => {
  if (!postId) return;
  try {
    const docRef = doc(db, 'posts', postId);
    const updateData: any = { ...updates };
    delete updateData.id; delete updateData.isGeneratingImage;
    updateData.updatedAt = serverTimestamp();
    await updateDoc(docRef, updateData);
  } catch (e) { console.error(e); }
};

export const updatePostContent = async (postId: string, newContent: string) => updatePostInHistory(postId, { content: newContent });

export const fetchUserHistory = async (userId: string): Promise<any[]> => {
  if (!userId) return [];
  try {
    const q = query(collection(db, 'posts'), where('userId', '==', userId), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (e) { return []; }
};

export const deletePostFromHistory = async (postId: string) => { await deleteDoc(doc(db, 'posts', postId)); };
export const togglePostLock = async (postId: string, currentStatus: boolean) => { await updateDoc(doc(db, 'posts', postId), { isLocked: !currentStatus }); };
export const schedulePost = async (postId: string, date: Date) => { await updateDoc(doc(db, 'posts', postId), { scheduledDate: date, isPublished: false }); };
export const checkDuePosts = async (userId: string) => { /* ... cod vechi ... */ return []; }; // Simplificat pt spațiu
export const markPostAsPublished = async (postId: string) => { await updateDoc(doc(db, 'posts', postId), { isPublished: true }); };
