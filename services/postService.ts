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

// Helper pentru a curăța obiectele de valori undefined (Firebase nu le acceptă)
const sanitizePost = (post: Post, userId: string, topic: string, genType: string) => {
    return {
        userId,
        content: post.content || "",
        // Convertim undefined în null pentru Firebase
        imageUrl: post.imageUrl || null, 
        platform: post.adaptedContent ? Object.keys(post.adaptedContent)[0] || 'Generic' : 'Generic',
        adaptedContent: post.adaptedContent || {},
        topic: topic || 'Untitled',
        createdAt: serverTimestamp(),
        scheduledDate: null,
        isLocked: false,
        isPublished: false,
        generationType: genType || 'single',
        type: post.type || 'post'
    };
};

// 1. SAVE (Versiune Sigură)
export const savePostToHistory = async (
    userId: string, 
    post: Post, 
    topic: string, 
    limit: number = 50
): Promise<string | null> => {
  
  if (!userId || !post.content) {
      console.error("❌ Save aborted: Missing userId or content");
      return null;
  }

  try {
    const postsRef = collection(db, 'posts');

    // A. PREGĂTIRE DATE (Curățare)
    // Folosim generationType din post, sau 'single' ca fallback
    const genType = post.generationType || 'single';
    const docData = sanitizePost(post, userId, topic, genType);

    // B. SALVARE DIRECTĂ
    const docRef = await addDoc(postsRef, docData);
    console.log(`✅ Post saved to Vault! [${genType}] ID: ${docRef.id}`);

    // C. CURĂȚENIE (Non-blocking)
    // Încercăm să ștergem vechiturile DOAR după ce am salvat cu succes
    cleanupOldPosts(userId, limit).catch(err => console.warn("Cleanup warning:", err));

    return docRef.id;

  } catch (e) {
    console.error("❌ CRITICAL FIRESTORE ERROR:", e);
    return null;
  }
};

// Funcție internă de curățenie (izolată să nu strice salvarea)
async function cleanupOldPosts(userId: string, limit: number) {
    const postsRef = collection(db, 'posts');
    // Luăm doar postările userului, neblocate
    // NOTA: Dacă nu ai index, asta poate eșua, dar nu blochează salvarea de mai sus!
    const q = query(
        postsRef, 
        where('userId', '==', userId),
        where('isLocked', '==', false),
        orderBy('createdAt', 'asc')
    );

    const snapshot = await getDocs(q);
    if (snapshot.size > limit) {
        const numToDelete = snapshot.size - limit;
        // Ștergem cele mai vechi
        const deletionPromises = snapshot.docs.slice(0, numToDelete).map(doc => deleteDoc(doc.ref));
        await Promise.all(deletionPromises);
        console.log(`🗑️ Cleaned up ${numToDelete} old posts.`);
    }
}

// 2. UPDATE
export const updatePostInHistory = async (postId: string, updates: Partial<Post>) => {
  if (!postId) return;
  try {
    const docRef = doc(db, 'posts', postId);
    // Curățăm datele care nu trebuie scrise
    const { id, isGeneratingImage, ...cleanUpdates } = updates as any;
    cleanUpdates.updatedAt = serverTimestamp();
    await updateDoc(docRef, cleanUpdates);
    console.log("🔄 Post updated:", postId);
  } catch (e) { console.error("Update failed:", e); }
};

// Aliasuri
export const updatePostContent = async (postId: string, newContent: string) => updatePostInHistory(postId, { content: newContent });

export const fetchUserHistory = async (userId: string): Promise<any[]> => {
  if (!userId) return [];
  try {
    // Query simplu (fără orderBy complex) pt a evita erori de index
    const q = query(collection(db, 'posts'), where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (e) { return []; }
};

export const deletePostFromHistory = async (postId: string) => { await deleteDoc(doc(db, 'posts', postId)); };
export const togglePostLock = async (postId: string, currentStatus: boolean) => { await updateDoc(doc(db, 'posts', postId), { isLocked: !currentStatus }); };
export const schedulePost = async (postId: string, date: Date) => { await updateDoc(doc(db, 'posts', postId), { scheduledDate: date, isPublished: false }); };
export const markPostAsPublished = async (postId: string) => { await updateDoc(doc(db, 'posts', postId), { isPublished: true }); };
export const checkDuePosts = async (userId: string) => { /* simplificat */ return []; };

export const createManualEvent = async (userId: string, title: string, date: Date, description: string) => {
    const dummy: Post = { id: 'manual', content: `${title}\n\n${description}`, adaptedContent: {}, isGeneratingImage: false, scheduledDate: date, isLocked: true, generationType: 'single', type: 'event' };
    return savePostToHistory(userId, dummy, title, 100); 
};
