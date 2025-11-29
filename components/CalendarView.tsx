import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Post, Platform } from '../types';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Lock } from 'lucide-react';

interface CalendarViewProps {
    onNavigateToVault: () => void; // Funcție să ne ducă în Vault
}

export function CalendarView({ onNavigateToVault }: CalendarViewProps) {
  const { user, userProfile } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');

  // Restricție Agency
  const isAgency = userProfile?.subscriptionTier === 'agency';

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'posts'), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snap) => {
        const loadedPosts = snap.docs.map(doc => {
            const d = doc.data();
            return { ...d, id: doc.id, createdAt: d.createdAt?.toDate ? d.createdAt.toDate() : new Date() } as any;
        });
        setPosts(loadedPosts);
    });
    return () => unsubscribe();
  }, [user]);

  if (!isAgency) {
      return (
          <div className="flex flex-col items-center justify-center h-[60vh] text-center">
              <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mb-6">
                  <Lock size={40} className="text-orange-500" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Agency Feature</h2>
              <p className="text-gray-400 mb-6 max-w-md">The Strategic Content Calendar is available exclusively on the Agency Plan.</p>
              <button className="px-6 py-3 bg-orange-600 text-white font-bold rounded-xl opacity-50 cursor-not-allowed">Upgrade to Unlock</button>
          </div>
      );
  }

  // Helpers Data
  const startOfWeek = new Date(currentDate);
  startOfWeek.setDate(currentDate.getDate() - currentDate.getDay() + 1); // Monday

  const getPlatformColor = (p: string) => {
      if (p.includes('Instagram')) return 'bg-pink-500/20 text-pink-300 border-pink-500/50';
      if (p.includes('LinkedIn')) return 'bg-blue-500/20 text-blue-300 border-blue-500/50';
      if (p.includes('X')) return 'bg-gray-700 text-white border-gray-500';
      return 'bg-purple-500/20 text-purple-300 border-purple-500/50';
  };

  const renderPostItem = (post: any) => (
      <div 
        key={post.id} 
        onClick={onNavigateToVault}
        className={`text-[10px] p-1.5 rounded border mb-1 cursor-pointer hover:opacity-80 truncate ${getPlatformColor(post.platform)}`}
      >
          {post.topic || "Post"}
      </div>
  );

  return (
    <div className="max-w-6xl mx-auto pb-20 animate-in fade-in">
        {/* Header & Controls */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
            <div className="flex items-center gap-2">
                <CalendarIcon className="text-orange-500" />
                <h2 className="text-2xl font-bold text-white">Campaign Calendar</h2>
            </div>
            
            <div className="flex gap-4">
                {/* View Switcher */}
                <div className="flex bg-[#161b22] p-1 rounded-lg border border-gray-700">
                    {['month', 'week', 'day'].map((m) => (
                        <button 
                            key={m}
                            onClick={() => setViewMode(m as any)}
                            className={`px-3 py-1 text-xs font-bold rounded transition ${viewMode === m ? 'bg-orange-600 text-white' : 'text-gray-400 hover:text-white'}`}
                        >
                            {m.charAt(0).toUpperCase() + m.slice(1)}
                        </button>
                    ))}
                </div>

                {/* Navigation */}
                <div className="flex items-center gap-2 bg-[#161b22] p-1 rounded-lg border border-gray-700">
                    <button onClick={() => {
                        const d = new Date(currentDate);
                        if (viewMode === 'month') d.setMonth(d.getMonth() - 1);
                        else if (viewMode === 'week') d.setDate(d.getDate() - 7);
                        else d.setDate(d.getDate() - 1);
                        setCurrentDate(d);
                    }} className="p-1 hover:bg-gray-700 rounded text-white"><ChevronLeft size={18}/></button>
                    
                    <span className="text-xs font-bold text-white w-24 text-center">
                        {currentDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                    </span>
                    
                    <button onClick={() => {
                        const d = new Date(currentDate);
                        if (viewMode === 'month') d.setMonth(d.getMonth() + 1);
                        else if (viewMode === 'week') d.setDate(d.getDate() + 7);
                        else d.setDate(d.getDate() + 1);
                        setCurrentDate(d);
                    }} className="p-1 hover:bg-gray-700 rounded text-white"><ChevronRight size={18}/></button>
                </div>
            </div>
        </div>

        {/* MONTH VIEW */}
        {viewMode === 'month' && (
            <div className="grid grid-cols-7 gap-px bg-gray-800 border border-gray-800 rounded-xl overflow-hidden">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => <div key={d} className="bg-[#161b22] p-3 text-center text-xs font-bold text-gray-500">{d}</div>)}
                
                {Array.from({ length: 35 }).map((_, idx) => {
                    // Logică simplificată pt demo (trebuie calculată corect ziua reală)
                    const dayNum = idx - 2; // Offset dummy
                    const isToday = dayNum === new Date().getDate();
                    
                    // Filtrăm postările din acea zi
                    const dayPosts = posts.filter(p => {
                        // @ts-ignore
                        return p.createdAt.getDate() === dayNum && p.createdAt.getMonth() === currentDate.getMonth();
                    });

                    return (
                        <div key={idx} className="bg-[#0f1115] min-h-[100px] p-2 border-t border-gray-800 hover:bg-[#13151a] transition">
                            {dayNum > 0 && dayNum <= 31 && (
                                <>
                                    <span className={`text-xs font-bold ${isToday ? 'text-orange-400' : 'text-gray-500'}`}>{dayNum}</span>
                                    <div className="mt-2 space-y-1">
                                        {dayPosts.map(renderPostItem)}
                                    </div>
                                </>
                            )}
                        </div>
                    )
                })}
            </div>
        )}

        {/* WEEK / DAY VIEW (Placeholders pentru MVP) */}
        {viewMode !== 'month' && (
            <div className="text-center py-20 text-gray-500 bg-[#161b22] rounded-xl border border-gray-800">
                Detailed {viewMode} view coming in next update. Use Month view for now.
            </div>
        )}
    </div>
  );
}
