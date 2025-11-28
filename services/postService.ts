import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  getDocs, 
  deleteDoc, 
  doc, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from './firebase';
import { Post } from '../types';

const VAULT_LIMIT = 10;

export const savePostToHistory = async (userId: string, post: Post, topic: string) => {
  if (!userId || !post.content) {
      console.error("Invalid data for saving post");
      return;
  }

  try {
    const postsRef = collection(db, 'posts');

    // 1. Check Limit
    const q = query(
      postsRef,
      where('userId', '==', userId),
      orderBy('createdAt', 'asc')
    );
    
    const snapshot = await getDocs(q);

    if (snapshot.size >= VAULT_LIMIT) {
      const numToDelete = snapshot.size - VAULT_LIMIT + 1;
      for (let i = 0; i < numToDelete; i++) {
        await deleteDoc(snapshot.docs[i].ref);
      }
    }

    // 2. Detect Platform
    let platformName = 'Generic';
    const keys = Object.keys(post.adaptedContent || {});
    if (keys.length > 0) platformName = keys[0];

    // 3. Save
    await addDoc(postsRef, {
      userId,
      content: post.content,
      imageUrl: post.imageUrl || null,
      platform: platformName,
      topic: topic || 'Untitled',
      createdAt: serverTimestamp(),
      isLocked: false
    });
    
    console.log("✅ Post saved to Vault.");

  } catch (e) {
    console.error("❌ Error saving post:", e);
  }
};

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

export const deletePostFromHistory = async (postId: string) => {
  try {
    await deleteDoc(doc(db, 'posts', postId));
  } catch (e) {
    console.error("Error deleting post:", e);
    throw e;
  }
};
