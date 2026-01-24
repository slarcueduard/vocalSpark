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

// 1. SAVE (With Auto-Delete Logic)
export const savePostToHistory = async (
  userId: string,
  post: Post,
  topic: string,
  limit: number = 25
): Promise<{ id: string; autoDeletedCount: number } | null> => {

  if (!userId || !post.content) return null;

  try {
    const postsRef = collection(db, 'posts');

    // A. CHECK LIMIT & AUTO-DELETE
    const userPostsQuery = query(postsRef, where('userId', '==', userId), orderBy('createdAt', 'asc'));
    const snapshot = await getDocs(userPostsQuery);
    const currentCount = snapshot.size;

    let autoDeletedCount = 0;

    if (currentCount >= limit) {
      // Find eligible posts to delete (Oldest first, NOT locked)
      // We need to delete enough to make room. usually just 1, but handle edge case.
      const neededSpace = (currentCount - limit) + 1;
      let deletedSoFar = 0;

      for (const doc of snapshot.docs) {
        if (deletedSoFar >= neededSpace) break;

        const data = doc.data();
        if (!data.isLocked) { // Only delete if NOT locked
          await deleteDoc(doc.ref);
          deletedSoFar++;
          autoDeletedCount++;
        }
      }

      // If we couldn't free up enough space (e.g. all are locked)
      if (deletedSoFar < neededSpace) {
        alert(`Vault full! You have ${currentCount} posts and they are all LOCKED (pinned). Unpin some to save new ones.`);
        return null;
      }
    }

    // B. SAVE THE POST
    const docData = {
      userId,
      content: post.content || "",
      imageUrl: post.imageUrl || null,
      platform: post.adaptedContent ? Object.keys(post.adaptedContent)[0] || 'Generic' : 'Generic',
      adaptedContent: post.adaptedContent || {},
      topic: topic || 'Untitled',
      createdAt: serverTimestamp(),
      scheduledDate: post.scheduledDate || null,
      isLocked: false, // Default unlocked
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

    console.log("✅ Post saved. ID:", docRef.id, "Auto-deleted:", autoDeletedCount);

    return { id: docRef.id, autoDeletedCount };

  } catch (e) {
    console.error("❌ Save failed:", e);
    return null;
  }
};


// 2. TOGGLE LOCK (With limit of 5)
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
