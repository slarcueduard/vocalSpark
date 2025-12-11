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
  setDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase';
import { Post } from '../types';

// 1. SAVE (Cu Logica de Rotire "FIFO" - First In First Out, dar protejând Pinned)
export const savePostToHistory = async (
  userId: string,
  post: Post,
  topic: string,
  limit: number = 20
): Promise<string | null> => {

  if (!userId || !post.content) return null;

  try {
    const postsRef = collection(db, 'posts');

    // A. SALVĂM ÎNTÂI (Prioritate 0 - Siguranța Datelor)
    const docData = {
      userId,
      content: post.content || "",
      imageUrl: post.imageUrl || null,
      platform: post.adaptedContent ? Object.keys(post.adaptedContent)[0] || 'Generic' : 'Generic',
      adaptedContent: post.adaptedContent || {},
      topic: topic || 'Untitled',
      createdAt: serverTimestamp(),
      scheduledDate: post.scheduledDate || null,
      isLocked: false, // Default neblocat
      isPublished: false,
      generationType: post.generationType || 'single',
      type: post.type || 'post',
      parentId: post.parentId || null,
      linkedEventId: post.linkedEventId || null,
      linkedEventTitle: post.linkedEventTitle || null
    };

    let docRef;
    if (post.id && post.id.length > 10 && post.id !== 'manual') {
      docRef = doc(db, 'posts', post.id);
      await setDoc(docRef, docData);
    } else {
      docRef = await addDoc(postsRef, docData);
    }

    console.log("✅ Post saved. ID:", docRef.id);

    // B. CURĂȚENIE INTELIGENTĂ (Async)
    // Nu blocăm thread-ul principal, facem asta în fundal
    // Transmitem ID-ul curent pentru a NU fi sters accidental (cat timp timestamp-ul e null/0)
    cleanUpVault(userId, limit, docRef.id);


    return docRef.id;

  } catch (e) {
    console.error("❌ Save failed:", e);
    return null;
  }
};

// Funcție separată de curățenie (nu o exportăm, e internă)
async function cleanUpVault(userId: string, limit: number, ignoreId?: string) {
  try {
    const postsRef = collection(db, 'posts');
    // Luăm toate postările userului (fără sortare în DB ca să nu ceară index)
    const q = query(postsRef, where('userId', '==', userId));
    const snapshot = await getDocs(q);

    const allPosts = snapshot.docs.map(d => ({ id: d.id, ...d.data(), ref: d.ref }));

    // Filtrăm doar pe cele NEBLOCATE (Disposable)
    // Cele blocate (isLocked == true) sunt imune la ștergere
    // Cele blocate (isLocked == true) sau cel tocmai creat sunt imune la ștergere
    // @ts-ignore
    const disposablePosts = allPosts.filter(p => !p.isLocked && p.id !== ignoreId);

    // Le sortăm manual: Cele mai VECHI la început
    disposablePosts.sort((a: any, b: any) => {
      const timeA = a.createdAt?.seconds || 0;
      const timeB = b.createdAt?.seconds || 0;
      return timeA - timeB; // Ascending (Oldest first)
    });

    // Verificăm dacă depășim limita
    // Notă: Limita se aplică la total, sau doar la cele neblocate? 
    // De obicei: Total Posts = Locked + Unlocked. 
    // Dacă Total > Limit, ștergem din Unlocked.

    const totalPostsCount = allPosts.length;

    if (totalPostsCount > limit) {
      const numberToDelete = totalPostsCount - limit;
      // Ștergem primele N cele mai vechi care nu sunt blocate
      // Dacă nu avem destule neblocate, nu ștergem nimic (userul are doar locked items)
      const toDelete = disposablePosts.slice(0, numberToDelete);

      for (const p of toDelete) {
        await deleteDoc(p.ref);
        console.log("🗑️ Auto-deleted old post:", p.id);
      }
    }

  } catch (e) {
    console.warn("Cleanup warning:", e);
  }
}

// 2. TOGGLE LOCK (Cu limita de 5)
export const togglePostLock = async (userId: string, postId: string, currentStatus: boolean): Promise<boolean> => {
  try {
    // Dacă vrea să blocheze (să dea Pin), verificăm dacă are deja 5
    if (!currentStatus) { // !currentStatus înseamnă că vrea să devină true
      const q = query(collection(db, 'posts'), where('userId', '==', userId), where('isLocked', '==', true));
      const snapshot = await getDocs(q);
      if (snapshot.size >= 5) {
        alert("You can only pin up to 5 posts! Unpin another one first.");
        return false; // Nu am făcut modificarea
      }
    }

    await updateDoc(doc(db, 'posts', postId), { isLocked: !currentStatus });
    return true; // Succes
  } catch (e) {
    console.error("Lock failed:", e);
    return false;
  }
};

// ... Restul funcțiilor standard (Update, Fetch, Delete, Schedule) ...

export const updatePostInHistory = async (postId: string, updates: Partial<Post>) => {
  if (!postId) return;
  try {
    const docRef = doc(db, 'posts', postId);
    const updateData: any = { ...updates };
    delete updateData.id; delete updateData.isGeneratingImage;
    updateData.updatedAt = serverTimestamp();
    await updateDoc(docRef, updateData);
    console.log(`✅ [History] Updated post ${postId} with:`, Object.keys(updates));
  } catch (e) {
    console.error(`❌ [History] Update failed for ${postId}:`, e);
  }
};

export const updatePostContent = async (postId: string, newContent: string) => updatePostInHistory(postId, { content: newContent });

export const fetchUserHistory = async (userId: string): Promise<any[]> => {
  if (!userId) return [];
  try {
    const q = query(collection(db, 'posts'), where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (e) { return []; }
};

export const deletePostFromHistory = async (postId: string) => { await deleteDoc(doc(db, 'posts', postId)); };
export const schedulePost = async (postId: string, date: Date) => { await updateDoc(doc(db, 'posts', postId), { scheduledDate: date, isPublished: false }); };
export const markPostAsPublished = async (postId: string) => { await updateDoc(doc(db, 'posts', postId), { isPublished: true }); };
export const checkDuePosts = async (userId: string) => {
  try {
    const now = new Date();
    const start = new Date(now.setHours(0, 0, 0, 0));
    const end = new Date(now.setHours(23, 59, 59, 999));
    const q = query(collection(db, 'posts'), where('userId', '==', userId), where('scheduledDate', '>=', start), where('scheduledDate', '<=', end));
    const s = await getDocs(q);
    return s.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (e) { return []; }
};
export const createManualEvent = async (userId: string, title: string, date: Date, description: string) => {
  const dummy: Post = { id: 'manual', content: `${title}\n\n${description}`, adaptedContent: {}, isGeneratingImage: false, scheduledDate: date, isLocked: true, generationType: 'single', type: 'event' };
  return savePostToHistory(userId, dummy, title, 100);
};
