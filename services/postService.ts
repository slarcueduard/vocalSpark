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

// 1. SAVE (SIMPLIFICAT - FĂRĂ LIMITĂ MOMENTAN PENTRU A GARANTA SALVAREA)
export const savePostToHistory = async (
    userId: string, 
    post: Post, 
    topic: string, 
    limit: number = 50 // Păstrăm param dar nu îl folosim momentan ca să nu blocăm salvarea
): Promise<string | null> => {
  
  if (!userId || !post.content) {
      console.error("❌ Save aborted: Missing data");
      return null;
  }

  try {
    const postsRef = collection(db, 'posts');

    // PREPARARE DATE
    // Ne asigurăm că nu există câmpuri undefined
    const docData = {
      userId,
      content: post.content || "",
      imageUrl: post.imageUrl || null,
      // Dacă e undefined, punem string gol
      platform: post.adaptedContent ? Object.keys(post.adaptedContent)[0] || 'Generic' : 'Generic',
      adaptedContent: post.adaptedContent || {},
      topic: topic || 'Untitled',
      createdAt: serverTimestamp(),
      scheduledDate: null,
      isLocked: false,
      isPublished: false,
      // CRITIC: Dacă nu vine tipul, punem 'single'
      generationType: post.generationType || 'single', 
      type: post.type || 'post'
    };

    console.log("💾 Saving to Firestore:", docData.generationType);

    // SALVARE DIRECTĂ
    const docRef = await addDoc(postsRef, docData);
    
    console.log("✅ Saved ID:", docRef.id);
    return docRef.id;

  } catch (e) {
    console.error("❌ CRITICAL SAVE ERROR:", e);
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
  } catch (e) { console.error(e); }
};

export const updatePostContent = async (postId: string, newContent: string) => updatePostInHistory(postId, { content: newContent });

// 3. FETCH
export const fetchUserHistory = async (userId: string): Promise<any[]> => {
  if (!userId) return [];
  try {
    const q = query(collection(db, 'posts'), where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (e) { return []; }
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
