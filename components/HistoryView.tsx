import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { fetchUserHistory, deletePostFromHistory, togglePostLock, updatePostContent } from '../services/postService';
import { PostCard } from './PostCard';
import { Loader } from './Loader';
import { Archive, Search, Database, Ghost, Info, ShieldCheck } from 'lucide-react';
import { Post } from '../types';

export function HistoryView() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (user) loadHistory();
  }, [user]);

  const loadHistory = async () => {
    if (!user) return;
    setLoading(true);
    
    try {
        const history = await fetchUserHistory(user.uid);
        
        // --- MAPARE DEFENSIVĂ (Aici reparăm datele corupte) ---
        const formattedPosts: Post[] = history.map((item: any) => ({
            id: item.id || Math.random().toString(), // Fallback ID
            content: item.content || "", // Fallback Content
            imageUrl: item.imageUrl || null,
            // CRITIC: Asigurăm că adaptedContent este mereu obiect, nu undefined
            adaptedContent: item.adaptedContent || {}, 
            isGeneratingImage: false,
            isLocked: !!item.isLocked // Convertim la boolean sigur
        }));

        setPosts(formattedPosts);
    } catch (e) {
        console.error("Failed to load history:", e);
    } finally {
        setLoading(false);
    }
  };

  // --- ACȚIUNI ---
  const handleDelete = async (id: string) => {
      if (window.confirm("Delete this post permanently?")) { // window.confirm e mai sigur
          await deletePostFromHistory(id);
          setPosts(prev => prev.filter(p => p.id !== id));
      }
  };

  const handleToggleLock = async (id: string) => {
      const post = posts.find(p => p.id === id);
      if (post) {
          const newStatus = !post.isLocked;
          // Update local optimistic
          setPosts(prev => prev.map(p => p.id === id ? { ...p, isLocked: newStatus } : p));
          // Update DB
          await togglePostLock(id, post.isLocked || false);
      }
  };

  const handleUpdateContent = async (id: string, newContent: string) => {
      setPosts(prev => prev.map(p => p.id === id ? { ...p, content: newContent } : p));
      await updatePostContent(id, newContent);
  };

  const filteredPosts = posts.filter(p => 
      (p.content || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const lockedCount = posts.filter(p => p.isLocked).length;

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-gray-500 gap-2">
        <Loader /> Loading Vault...
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto pb-20 animate-in fade-in">
        
        {/* HEADER */}
        <div className="bg-[#161b22] p-6 rounded-2xl border border-gray-800 mb-8 shadow-lg">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Archive className="text-blue-500" /> Content Vault
                    </h2>
                </div>
                {/* Stats */}
                <div className="flex gap-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-gray-400 bg-black/30 px-3 py-1.5 rounded-lg border border-gray-700">
                        <Database size={14}/> {posts.length} / 10 Saved
                    </div>
                    <div className="flex items-center gap-2 text-xs font-bold text-yellow-500 bg-yellow-900/10 px-3 py-1.5 rounded-lg border border-yellow-700/30">
                        <ShieldCheck size={14}/> {lockedCount} Locked
                    </div>
                </div>
            </div>
            
            {/* Hint Box */}
            <div className="bg-blue-900/10 border border-blue-800/30 p-3 rounded-lg flex gap-3 items-start">
                <Info className="text-blue-400 shrink-0 mt-0.5" size={16} />
                <div className="text-xs text-gray-400">
                    <p className="mb-1"><strong className="text-blue-300">How it works:</strong> Your generated posts are auto-saved here. The Vault holds the last <strong>10 recent posts</strong>.</p>
                    <p>To prevent a post from being auto-deleted, click the <strong className="text-yellow-500">Lock Icon 🔒</strong>. Locked posts are safe forever.</p>
                </div>
            </div>
        </div>

        {/* Search */}
        <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
            <input 
                type="text" 
                placeholder="Search your saved content..." 
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
                        // În Vault, dezactivăm generarea de imagini noi pentru a simplifica,
                        // dar păstrăm funcțiile de editare și blocare
                        onGenerateImage={() => {}} 
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
                <p className="text-sm text-gray-500">Start creating in the Studio to populate your library.</p>
            </div>
        )}
    </div>
  );
}
