import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../services/firebase';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { Post } from '../../types';
import { PostCard } from '../PostCard'; // Reusing PostCard
import { Loader2, Calendar } from 'lucide-react';

export const TodaysPostFeed: React.FC = () => {
    const { user } = useAuth();
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        const q = query(
            collection(db, 'posts'),
            where('userId', '==', user.uid),
            where('type', '==', 'daily_post'),
            orderBy('sequenceNumber', 'desc')
        );

        const unsub = onSnapshot(q, (snapshot) => {
            const fetchedPosts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post));
            setPosts(fetchedPosts);
            setLoading(false);
        });

        return () => unsub();
    }, [user]);

    if (loading) return (
        <div className="flex justify-center py-10">
            <Loader2 className="animate-spin text-blue-500" />
        </div>
    );

    if (posts.length === 0) {
        return (
            <div className="text-center py-10 border border-dashed border-gray-800 rounded-xl bg-[#0a0c10]">
                <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-500">
                    <Calendar size={20} />
                </div>
                <h3 className="text-sm font-bold text-gray-400">No Daily Posts Yet</h3>
                <p className="text-xs text-gray-600 mt-1">Activate the series above to start.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {posts.map((post) => (
                <div key={post.id} className="relative pl-8">
                    {/* Timeline Line */}
                    <div className="absolute left-[11px] top-6 bottom-[-24px] w-0.5 bg-gray-800 z-0 last:bottom-auto"></div>

                    {/* Day Badge */}
                    <div className="absolute left-0 top-6 w-6 h-6 rounded-full bg-[#161b22] border border-gray-700 flex items-center justify-center z-10 text-[10px] font-bold text-blue-500">
                        {post.sequenceNumber}
                    </div>

                    <div className="mb-2 flex items-center gap-2">
                        <span className="text-xs text-blue-400 font-bold uppercase tracking-wider">Day {post.sequenceNumber}</span>
                        <span className="text-[10px] text-gray-500">• {post.topic || 'Daily Series'}</span>
                    </div>

                    <PostCard
                        post={post}
                        onSave={() => { }} // No-op for now or custom handler
                        onDelete={() => { }} // Handle deletion if needed
                        isCompact={true}
                    />
                </div>
            ))}
        </div>
    );
};
