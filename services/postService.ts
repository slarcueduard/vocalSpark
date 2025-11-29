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
      adaptedContent: post.adaptedContent || {},
      topic: topic || 'Untitled',
      createdAt: serverTimestamp(),
      isLocked: false,
      isPublished: false, // Default
      scheduledDate: null // Default
    });
    
    console.log("✅ Post saved. ID:", docRef.id);
    return docRef.id;

  } catch (e) {
    console.error("❌ Error saving post:", e);
    return null;
  }
};

// 2. UPDATE GENERAL
export const updatePostInHistory = async (postId: string, updates: Partial<Post>) => {
  if (!postId) return;
  try {
    const docRef = doc(db, 'posts', postId);
    // Filtrăm câmpurile care nu trebuie în DB
    const updateData: any = { ...updates };
    delete updateData.id;
    delete updateData.isGeneratingImage;
    
    updateData.updatedAt = serverTimestamp();

    await updateDoc(docRef, updateData);
    console.log("🔄 Post updated in Vault:", postId);
  } catch (e) {
    console.error("Error updating post:", e);
  }
};

// 3. UPDATE CONTENT (Alias)
export const updatePostContent = async (postId: string, newContent: string) => {
    return updatePostInHistory(postId, { content: newContent });
};

// 4. FETCH
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
      console.error("Lock toggle failed:", e);
  }
};

// 7. SCHEDULE POST (NOU)
export const schedulePost = async (postId: string, date: Date) => {
  try {
    const docRef = doc(db, 'posts', postId);
    await updateDoc(docRef, {
      scheduledDate: date,
      isPublished: false
    });
    console.log(`📅 Post ${postId} scheduled for ${date}`);
  } catch (e) {
    console.error("Schedule failed:", e);
  }
};

// 8. CHECK DUE POSTS (NOU - Pentru Notificări)
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
    // Uneori dă eroare de index compus aici, o ignorăm silențios pt moment sau cerem index
    console.warn("Check due posts warning (Index might be needed):", e);
    return [];
  }
};

// 9. MARK AS PUBLISHED (NOU)
export const markPostAsPublished = async (postId: string) => {
    await updateDoc(doc(db, 'posts', postId), { isPublished: true });
};
