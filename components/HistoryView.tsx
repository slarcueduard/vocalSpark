import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { deletePostFromHistory, togglePostLock, updatePostContent } from '../services/postService';
import { PostCard } from './PostCard';
import { Loader } from './Loader';
import { Archive, Search, Database, Ghost, Info, ShieldCheck } from 'lucide-react';
import { Post } from '../types';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';
// Importăm și modalul de imagini dacă vrem să generăm din istoric (Opțional, vezi nota de mai jos)
import { ImageCreationModal } from './ImageCreationModal';
import { updatePostInHistory } from '../services/postService';

export function HistoryView() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // State pentru Imagine în Vault
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [activePostId, setActivePostId] = useState<string | null>(null);
  const [activePrompt, setActivePrompt] = useState('');

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'posts'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
        const formattedPosts: Post[] = snapshot.docs.map((doc) => {
            const data = doc.data();
            return {
                id: doc.id,
                content: data.content || "",
                imageUrl: data.imageUrl || null,
                adaptedContent: data.adaptedContent || {}, 
                isGeneratingImage: false,
                isLocked: !!data.isLocked
            };
        });
        setPosts(formattedPosts);
        setLoading(false);
    }, (error) => {
        console.error("Vault Error:", error);
        setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleDelete = async (id: string) => {
      if (window.confirm("Delete from Vault?")) {
          await deletePostFromHistory(id);
      }
  };

  const handleToggleLock = async (id: string) => {
      const post = posts.find(p => p.id === id);
      if (post) await togglePostLock(id, post.isLocked || false);
  };

  const handleUpdateContent = async (id: string, newContent: string) => {
      await updatePostContent(id, newContent);
  };

  // --- LOGICĂ GENERARE IMAGINE ÎN ISTORIC ---
  const openImageModal = (id: string, content: string) => {
      setActivePostId(id);
      setActivePrompt(content);
      setIsImageModalOpen(true);
  };

  const handleImageSelected = (url: string) => {
      if (activePostId) {
          // Salvăm imaginea direct în bază
          updatePostInHistory(activePostId, { imageUrl: url });
      }
      setIsImageModalOpen(false);
  };

  const filteredPosts = posts.filter(p => 
      (p.content || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const lockedCount = posts.filter(p => p.isLocked).length;

  if (loading) return <div className="flex justify-center h-64 items-center text-gray-500 gap-2"><Loader /> Loading Vault...</div>;

  return (
    <div className="max-w-5xl mx-auto pb-20 animate-in fade-in">
        
        {/* Header */}
        <div className="bg-[#161b22] p-6 rounded-2xl border border-gray-800 mb-8 shadow-lg">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Archive className="text-blue-500" /> Content Vault
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">Your saved masterpieces.</p>
                </div>
                <div className="flex gap-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-gray-400 bg-black/30 px-3 py-1.5 rounded-lg border border-gray-700">
                        <Database size={14}/> {posts.length} / 20 Saved
                    </div>
                    <div className="flex items-center gap-2 text-xs font-bold text-yellow-500 bg-yellow-900/10 px-3 py-1.5 rounded-lg border border-yellow-700/30">
                        <ShieldCheck size={14}/> {lockedCount} Locked
                    </div>
                </div>
            </div>
        </div>

        {/* Search */}
        <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
            <input 
                type="text" 
                placeholder="Search saved content..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#0f1115] border border-gray-700 rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:border-blue-500 outline-none"
            />
        </div>

        {/* Grid */}
        {filteredPosts.length > 0 ? (
            <div className="grid grid-cols-1 gap-8">
                {filteredPosts.map(post => (
                    <PostCard 
                        key={post.id} 
                        post={post} 
                        isRefining={false}
                        
                        // ACUM PUTEM GENERA IMAGINI ȘI AICI
                        onGenerateImage={openImageModal} 
                        
                        // Adapt și Refine momentan doar updatează textul local, 
                        // ideal ar fi să fie legate și ele la updatePostContent
                        onAdaptPost={() => {}} 
                        onRefinePost={() => {}} 
                        
                        onDelete={handleDelete} 
                        onToggleLock={handleToggleLock} 
                        onManualEdit={handleUpdateContent}
                    />
                ))}
            </div>
        ) : (
            <div className="text-center py-24 border-2 border-dashed border-gray-800 rounded-2xl bg-[#161b22]/30">
                <Ghost className="text-gray-600 mx-auto mb-4" size={48} />
                <h3 className="text-xl font-bold text-gray-300 mb-2">Vault is Empty</h3>
                <p className="text-sm text-gray-500">Generated posts will appear here automatically.</p>
            </div>
        )}

        {/* Modalul de Imagini (pentru Vault) */}
        {isImageModalOpen && (
            <ImageCreationModal 
                onClose={() => setIsImageModalOpen(false)}
                onSelectImage={handleImageSelected}
                initialPrompt={activePrompt}
            />
        )}
    </div>
  );
}
