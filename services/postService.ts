import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  deleteDoc, 
  doc, 
  updateDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from './firebase';
import { Post } from '../types';

const VAULT_LIMIT = 50; // Limită generoasă pentru siguranță

// 1. SAVE (Salvarea "Blindată")
export const savePostToHistory = async (
    userId: string, 
    post: Post, 
    topic: string, 
    limit: number = 20
): Promise<string | null> => {
  console.log("💾 [Service] Attempting to save post...", { userId, type: post.generationType });

  if (!userId || !post.content) {
      console.error("❌ [Service] Save aborted: Missing data");
      return null;
  }

  try {
    const postsRef = collection(db, 'posts');

    // 1. PREGĂTIM DATELE (Curățăm orice undefined)
    // Firebase urăște 'undefined', preferă 'null' sau string gol
    const docData = {
      userId,
      content: post.content || "",
      imageUrl: post.imageUrl || null,
      // Dacă adaptedContent e undefined, punem obiect gol
      adaptedContent: post.adaptedContent || {}, 
      platform: post.adaptedContent ? Object.keys(post.adaptedContent)[0] || 'Generic' : 'Generic',
      topic: topic || 'Untitled',
      createdAt: serverTimestamp(),
      scheduledDate: null,
      isLocked: false,
      isPublished: false,
      // Asigurăm că avem tipul setat
      generationType: post.generationType || 'single', 
      type: post.type || 'post'
    };

    // 2. SALVĂM DIRECT
    const docRef = await addDoc(postsRef, docData);
    console.log("✅ [Service] Saved successfully! ID:", docRef.id);

    // 3. CURĂȚENIE (Non-Blocking)
    // Facem asta după salvare, într-un bloc try/catch separat
    // Interogăm doar după userId (fără sortare complexă) pentru a evita erorile de index
    try {
        const q = query(postsRef, where('userId', '==', userId));
        const snapshot = await getDocs(q);
        
        // Sortăm în memorie pentru a găsi pe cele vechi
        if (snapshot.size > limit) {
            const docs = snapshot.docs.map(d => ({ id: d.id, data: d.data(), ref: d.ref }));
            // Sortăm manual: Cele mai noi primele
            // @ts-ignore
            docs.sort((a, b) => (b.data.createdAt?.seconds || 0) - (a.data.createdAt?.seconds || 0));

            // Păstrăm doar primele 'limit' elemente, restul le ștergem
            // Dar NU ștergem ce e Locked
            const toDelete = docs.slice(limit).filter(doc => !doc.data.isLocked);
            
            for (const oldDoc of toDelete) {
                await deleteDoc(oldDoc.ref);
                console.log("🗑️ [Service] Auto-deleted old post:", oldDoc.id);
            }
        }
    } catch (cleanupErr) {
        console.warn("⚠️ [Service] Cleanup warning:", cleanupErr);
    }

    return docRef.id;

  } catch (e) {
    console.error("❌ [Service] CRITICAL SAVE ERROR:", e);
    return null;
  }
};

// ... Restul funcțiilor (Standard) ...

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
    // QUERY SIMPLU: Doar userId. Fără orderBy, fără filtre complexe.
    // Asta rezolvă problema "Nu apare nimic".
    const q = query(collection(db, 'posts'), where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (e) { 
    console.error("Fetch error:", e);
    return []; 
  }
};

export const deletePostFromHistory = async (postId: string) => { await deleteDoc(doc(db, 'posts', postId)); };
export const togglePostLock = async (postId: string, currentStatus: boolean) => { await updateDoc(doc(db, 'posts', postId), { isLocked: !currentStatus }); };
export const schedulePost = async (postId: string, date: Date) => { await updateDoc(doc(db, 'posts', postId), { scheduledDate: date, isPublished: false }); };
export const checkDuePosts = async (userId: string) => {
    try {
      const now = new Date();
      const start = new Date(now.setHours(0,0,0,0));
      const end = new Date(now.setHours(23,59,59,999));
      const q = query(collection(db, 'posts'), where('userId', '==', userId), where('scheduledDate', '>=', start), where('scheduledDate', '<=', end));
      const s = await getDocs(q);
      return s.docs.map(d => ({id: d.id, ...d.data()}));
    } catch(e) { return []; }
};
export const markPostAsPublished = async (postId: string) => { await updateDoc(doc(db, 'posts', postId), { isPublished: true }); };
export const createManualEvent = async (userId: string, title: string, date: Date, description: string) => {
    const dummy: Post = { id: 'manual', content: `${title}\n\n${description}`, adaptedContent: {}, isGeneratingImage: false, scheduledDate: date, isLocked: true, generationType: 'single', type: 'event' };
    return savePostToHistory(userId, dummy, title, 100); 
};
