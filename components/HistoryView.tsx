import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { fetchUserHistory, deletePostFromHistory } from '../services/postService';
import { PostCard } from './PostCard';
import { Loader } from './Loader';
import { Archive, Search, Database, Ghost } from 'lucide-react';
import { Post } from '../types';

export function HistoryView() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (user) {
      loadHistory();
    }
  }, [user]);

  const loadHistory = async () => {
    setLoading(true);
    try {
        const history = await fetchUserHistory(user!.uid);
        const formattedPosts: Post[] = history.map((item: any) => ({
            id: item.id,
            content: item.content,
            imageUrl: item.imageUrl,
            adaptedContent: {}, 
            isGeneratingImage: false,
            isLocked: false
        }));
        setPosts(formattedPosts);
    } catch (e) {
        console.error("Failed to load history");
    } finally {
        setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
      if (confirm("Remove this post from Vault?")) {
          await deletePostFromHistory(id);
          setPosts(prev => prev.filter(p => p.id !== id));
      }
  };

  const filteredPosts = posts.filter(p => 
      p.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return (
      <div className="flex items-center justify-center h-64">
          <Loader /> <span className="ml-3 text-gray-500">Unlocking Vault...</span>
      </div>
  );

  return (
    <div className="max-w-4xl mx-auto pb-20 animate-in fade-in">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 bg-[#161b22] p-6 rounded-2xl border border-gray-800 shadow-lg">
            <div>
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <Archive className="text-blue-500" /> Content Vault
                </h2>
                <p className="text-sm text-gray-500 mt-1">Secure storage for your viral hits.</p>
            </div>

            <div className="flex items-center gap-4 w-full md:w-auto">
                <div className="flex items-center gap-2 text-xs font-bold text-gray-400 bg-black/30 px-3 py-2 rounded-lg border border-gray-700">
                    <Database size={14} className="text-purple-500"/> 
                    <span>{posts.length} / 10 Saved</span>
                </div>

                <div className="relative flex-1 md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                    <input 
                        type="text" 
                        placeholder="Search history..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-[#0f1115] border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:border-blue-500 outline-none"
                    />
                </div>
            </div>
        </div>

        {/* Grid */}
        {filteredPosts.length > 0 ? (
            <div className="grid grid-cols-1 gap-6">
                {filteredPosts.map(post => (
                    <PostCard 
                        key={post.id} 
                        post={post} 
                        isRefining={false}
                        onGenerateImage={() => {}} 
                        onAdaptPost={() => {}} 
                        onRefinePost={() => {}} 
                        onDelete={handleDelete} 
                        onToggleLock={() => {}} 
                    />
                ))}
            </div>
        ) : (
            // --- EMPTY STATE (NOU) ---
            <div className="flex flex-col items-center justify-center py-24 border-2 border-dashed border-gray-800 rounded-2xl bg-[#161b22]/30">
                <div className="w-20 h-20 bg-gray-800/50 rounded-full flex items-center justify-center mb-4 border border-gray-700">
                    <Ghost className="text-gray-600" size={40} />
                </div>
                <h3 className="text-xl font-bold text-gray-300 mb-2">The Vault is Empty</h3>
                <p className="text-sm text-gray-500 max-w-xs text-center">
                    Your generated posts will be automatically saved here. 
                    Create something awesome to see it appear!
                </p>
            </div>
        )}
    </div>
  );
}
