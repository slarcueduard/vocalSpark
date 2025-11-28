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

// Salvează un post nou
export const savePostToHistory = async (userId: string, post: Post, topic: string) => {
  try {
    await addDoc(collection(db, 'posts'), {
      userId,
      content: post.content,
      imageUrl: post.imageUrl || null,
      platform: Object.keys(post.adaptedContent)[0] || 'Generic', // Prima platformă sau generic
      topic: topic,
      createdAt: serverTimestamp(),
      isLocked: false
    });
    console.log("Post saved to Vault.");
  } catch (e) {
    console.error("Error saving post:", e);
  }
};

// Aduce toate postările unui user (pentru History View)
export const fetchUserHistory = async (userId: string): Promise<any[]> => {
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

// Șterge un post din istoric
export const deletePostFromHistory = async (postId: string) => {
  try {
    await deleteDoc(doc(db, 'posts', postId));
  } catch (e) {
    console.error("Error deleting post:", e);
    throw e;
  }
};
