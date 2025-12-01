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
    limit: number = 20 
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
      platform: post.adaptedContent ? Object.keys(post.adaptedContent)[0] : 'Generic',
      adaptedContent: post.adaptedContent || {},
      topic: topic || 'Untitled',
      createdAt: serverTimestamp(),
      scheduledDate: post.scheduledDate || null,
      isLocked: false,
      isPublished: false,
      generationType: post.generationType || 'single',
      type: post.type || 'post'
    };
    
    const docRef = await addDoc(postsRef, docData);
    return docRef.id;

  } catch (e) {
    console.error("Save failed:", e);
    return null;
  }
};

// 2. MANUAL EVENT (Pentru Calendar)
// Aceasta era funcția duplicată. Acum apare o singură dată.
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
    // Salvăm cu o limită mare (100) pentru a nu șterge alte postări importante
    return savePostToHistory(userId, dummyPost, title, 100); 
};

// 3. UPDATE GENERAL
export const updatePostInHistory = async (postId: string, updates: Partial<Post>) => {
  if (!postId) return;
  try {
    const docRef = doc(db, 'posts', postId);
    const updateData: any = { ...updates };
    delete updateData.id; 
    delete updateData.isGeneratingImage;
    
    updateData.updatedAt = serverTimestamp();
    await updateDoc(docRef, updateData);
  } catch (e) { console.error(e); }
};

// Alias pentru update content
export const updatePostContent = async (postId: string, newContent: string) => {
    return updatePostInHistory(postId, { content: newContent });
};

// 4. FETCH HISTORY
export const fetchUserHistory = async (userId: string): Promise<any[]> => {
  if (!userId) return [];
  try {
    const q = query(collection(db, 'posts'), where('userId', '==', userId), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (e) { return []; }
};

// 5. DELETE, LOCK, SCHEDULE, MARK
export const deletePostFromHistory = async (postId: string) => { 
    await deleteDoc(doc(db, 'posts', postId)); 
};

export const togglePostLock = async (postId: string, currentStatus: boolean) => { 
    await updateDoc(doc(db, 'posts', postId), { isLocked: !currentStatus }); 
};

export const schedulePost = async (postId: string, date: Date) => { 
    await updateDoc(doc(db, 'posts', postId), { scheduledDate: date, isPublished: false }); 
};

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
  } catch (e) {
    return [];
  }
};

export const markPostAsPublished = async (postId: string) => { 
    await updateDoc(doc(db, 'posts', postId), { isPublished: true }); 
};
