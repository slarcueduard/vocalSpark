import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { fetchUserHistory, deletePostFromHistory } from '../services/postService';
import { PostCard } from './PostCard';
import { Loader } from './Loader';
import { Archive, Search } from 'lucide-react';
import { Post } from '../types';

export function HistoryView() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Încărcăm datele la montare
  useEffect(() => {
    if (user) {
      loadHistory();
    }
  }, [user]);

  const loadHistory = async () => {
    setLoading(true);
    const history = await fetchUserHistory(user!.uid);
    // Mapăm datele din DB la tipul 'Post' folosit de componente
    const formattedPosts: Post[] = history.map((item: any) => ({
        id: item.id,
        content: item.content,
        imageUrl: item.imageUrl,
        adaptedContent: {}, // Istoricul simplificat momentan
        isGeneratingImage: false,
        isLocked: false
    }));
    setPosts(formattedPosts);
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
      if (confirm("Are you sure you want to remove this from your Vault?")) {
          await deletePostFromHistory(id);
          setPosts(prev => prev.filter(p => p.id !== id));
      }
  };

  // Filtrare după căutare
  const filteredPosts = posts.filter(p => 
      p.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return (
      <div className="flex items-center justify-center h-64">
          <Loader /> <span className="ml-3 text-gray-500">Opening Vault...</span>
      </div>
  );

  return (
    <div className="max-w-4xl mx-auto pb-20 animate-in fade-in">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
            <div>
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <Archive className="text-blue-500" /> Content Vault
                </h2>
                <p className="text-sm text-gray-500">Your saved masterpieces.</p>
            </div>

            {/* Search Bar */}
            <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                <input 
                    type="text" 
                    placeholder="Search history..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-[#161b22] border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:border-blue-500 outline-none"
                />
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
                        onGenerateImage={() => {}} // Dezactivat în history momentan
                        onAdaptPost={() => {}} 
                        onRefinePost={() => {}} 
                        onDelete={handleDelete} 
                        onToggleLock={() => {}} 
                    />
                ))}
            </div>
        ) : (
            <div className="text-center py-20 border-2 border-dashed border-gray-800 rounded-2xl">
                <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Archive className="text-gray-600" size={32} />
                </div>
                <p className="text-gray-400">No saved posts yet.</p>
                <p className="text-xs text-gray-600">Start creating to fill your vault.</p>
            </div>
        )}
    </div>
  );
}
