import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { deletePostFromHistory, togglePostLock, updatePostContent, updatePostInHistory } from '../services/postService';
import { PostCard } from './PostCard';
import { Loader } from './Loader';
import { Archive, Search, Database, Ghost, ShieldCheck, Trash2, Filter } from 'lucide-react';
import { Post } from '../types';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';
import { ImageCreationModal } from './ImageCreationModal';

export function HistoryView() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'single' | 'campaign' | 'remix'>('all');

  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [activePostId, setActivePostId] = useState<string | null>(null);
  const [activePrompt, setActivePrompt] = useState('');

  useEffect(() => {
    if (!user) return;

    // --- QUERY ULTRA-SIMPLU (Anti-Eroare Index) ---
    // Cerem tot ce e al userului. Nu filtrăm, nu sortăm în DB.
    const q = query(
      collection(db, 'posts'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
        console.log(`📦 Vault: Loaded ${snapshot.size} posts.`);
        
        const formattedPosts: Post[] = snapshot.docs.map((doc) => {
            const d = doc.data();
            return { 
                id: doc.id, 
                content: d.content || "",
                imageUrl: d.imageUrl || null,
                adaptedContent: d.adaptedContent || {}, 
                isGeneratingImage: false,
                isLocked: !!d.isLocked,
                
                // Asigurăm fallback la 'single' pentru postări vechi
                generationType: d.generationType || 'single',
                type: d.type || 'post',
                createdAt: d.createdAt 
            } as any;
        });
        
        // --- SORTARE ÎN BROWSER ---
        // Cele mai noi primele
        formattedPosts.sort((a: any, b: any) => {
             const timeA = a.createdAt?.seconds || 0;
             const timeB = b.createdAt?.seconds || 0;
             return timeB - timeA;
        });

        setPosts(formattedPosts);
        setLoading(false);
    }, (error) => {
        console.error("Vault Error:", error);
        setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // --- LOGICA DE FILTRARE VIZUALĂ ---
  const getFilteredPosts = () => {
      return posts.filter(p => {
          const contentMatch = (p.content || "").toLowerCase().includes(searchTerm.toLowerCase());
          const topicMatch = ((p as any).topic || "").toLowerCase().includes(searchTerm.toLowerCase());
          
          // Filtrăm după tip (Tab-ul selectat)
          const typeMatch = filterType === 'all' || p.generationType === filterType;

          return (contentMatch || topicMatch) && typeMatch;
      });
  };

  // --- GRUPARE PE ZILE ---
  const getGroupedPosts = () => {
      const filtered = getFilteredPosts();
      const groups: Record<string, Post[]> = {};
      
      filtered.forEach(p => {
          // @ts-ignore
          const date = p.createdAt?.toDate ? p.createdAt.toDate() : new Date();
          
          const today = new Date();
          const yesterday = new Date();
          yesterday.setDate(today.getDate() - 1);

          let dateKey = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          
          if (date.toDateString() === today.toDateString()) dateKey = "Today";
          else if (date.toDateString() === yesterday.toDateString()) dateKey = "Yesterday";
            
          if (!groups[dateKey]) groups[dateKey] = [];
          groups[dateKey].push(p);
      });

      return groups;
  };

  // Handlers
  const handleDelete = async (id: string) => {
      if (window.confirm("Delete this post?")) await deletePostFromHistory(id);
  };
  
  const handleDeleteAll = async () => {
      const visiblePosts = getFilteredPosts().filter(p => !p.isLocked);
      if (visiblePosts.length === 0) { alert("No unlocked posts to delete."); return; }
      if (window.confirm(`Delete ${visiblePosts.length} unlocked posts?`)) {
          for (const p of visiblePosts) await deletePostFromHistory(p.id);
      }
  };

const handleToggleLock = async (id: string) => {
      if (!user) return;
      const post = posts.find(p => p.id === id);
      
      // Folosim funcția nouă cu userId
      if (post) {
          const success = await togglePostLock(user.uid, id, post.isLocked || false);
          if (success) {
               setPosts(prev => prev.map(p => p.id === id ? { ...p, isLocked: !p.isLocked } : p));
          }
      }
  };
  const handleUpdateContent = async (id: string, c: string) => { await updatePostContent(id, c); };
  const openImageModal = (id: string, c: string) => { setActivePostId(id); setActivePrompt(c); setIsImageModalOpen(true); };
  const handleImageSelected = (url: string) => { if (activePostId) updatePostInHistory(activePostId, { imageUrl: url }); setIsImageModalOpen(false); };

  const groupedPosts = getGroupedPosts();
  const groupKeys = Object.keys(groupedPosts);
  const lockedCount = posts.filter(p => p.isLocked).length;

  if (loading) return <div className="flex justify-center h-64 items-center text-gray-500 gap-2"><Loader /> Loading Vault...</div>;

  return (
    <div className="max-w-5xl mx-auto pb-20 animate-in fade-in">
        
        {/* Header */}
        <div className="bg-[#161b22] p-6 rounded-2xl border border-gray-800 mb-8 shadow-lg">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Archive className="text-blue-500" /> Content Vault
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">Your saved masterpieces.</p>
                </div>
                
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-gray-400 bg-black/30 px-3 py-1.5 rounded-lg border border-gray-700">
                        <Database size={14}/> {posts.length} Saved
                    </div>
                    <div className="flex items-center gap-2 text-xs font-bold text-yellow-500 bg-yellow-900/10 px-3 py-1.5 rounded-lg border border-yellow-700/30">
                        <ShieldCheck size={14}/> {lockedCount} Locked
                    </div>
                    
                    {posts.length > 0 && (
                        <button onClick={handleDeleteAll} className="flex items-center gap-2 text-xs font-bold text-red-400 bg-red-900/10 px-3 py-1.5 rounded-lg border border-red-900/30 hover:bg-red-900/30 transition">
                            <Trash2 size={14}/> Clear List
                        </button>
                    )}
                </div>
            </div>

            {/* Tabs & Search */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="flex bg-black/30 p-1 rounded-lg border border-gray-700 overflow-x-auto no-scrollbar">
                    {['all', 'single', 'campaign', 'remix'].map((t) => (
                        <button
                            key={t}
                            onClick={() => setFilterType(t as any)}
                            className={`px-4 py-1.5 text-xs font-bold rounded-md capitalize transition whitespace-nowrap ${filterType === t ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}
                        >
                            {t}
                        </button>
                    ))}
                </div>
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                    <input type="text" placeholder="Search content..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-[#0f1115] border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:border-blue-500 outline-none" />
                </div>
            </div>
        </div>

        {/* LISTA GRUPATĂ */}
        {groupKeys.length > 0 ? (
            <div className="space-y-8">
                {groupKeys.map(dateLabel => (
                    <div key={dateLabel}>
                        <div className="flex items-center gap-4 mb-4">
                            <h3 className="text-lg font-bold text-gray-300">{dateLabel}</h3>
                            <div className="h-px bg-gray-800 flex-1"></div>
                        </div>
                        <div className="grid grid-cols-1 gap-6">
                            {groupedPosts[dateLabel].map(post => (
                                <PostCard 
                                    key={post.id} 
                                    post={post} 
                                    isRefining={false}
                                    onGenerateImage={openImageModal} 
                                    onAdaptPost={() => {}} 
                                    onRefinePost={() => {}} 
                                    onDelete={handleDelete} 
                                    onToggleLock={handleToggleLock} 
                                    onManualEdit={handleUpdateContent}
                                />
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        ) : (
            <div className="text-center py-24 border-2 border-dashed border-gray-800 rounded-2xl bg-[#161b22]/30">
                <Ghost className="text-gray-600 mx-auto mb-4" size={48} />
                <h3 className="text-xl font-bold text-gray-300 mb-2">No posts found</h3>
            </div>
        )}

        {isImageModalOpen && <ImageCreationModal onClose={() => setIsImageModalOpen(false)} onSelectImage={handleImageSelected} initialPrompt={activePrompt} />}
    </div>
  );
}
