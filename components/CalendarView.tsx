import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Post } from '../types';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Lock, Clock, Plus } from 'lucide-react';
import { createManualEvent } from '../services/postService';

interface CalendarViewProps {
    onNavigateToVault?: () => void;
}

export function CalendarView({ onNavigateToVault }: CalendarViewProps) {
  const { user, userProfile } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');
  
  // Modal Add Event
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDate, setNewEventDate] = useState('');

  const getSafeDate = (val: any) => val?.toDate ? val.toDate() : (val ? new Date(val) : new Date());

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'posts'), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snap) => {
        const loadedPosts = snap.docs.map(doc => {
            const d = doc.data();
            return { ...d, id: doc.id, createdAt: getSafeDate(d.createdAt), scheduledDate: getSafeDate(d.scheduledDate) } as any;
        });
        setPosts(loadedPosts);
    });
    return () => unsubscribe();
  }, [user]);

  const handleAddEvent = async () => {
      if (!newEventTitle || !newEventDate) return;
      await createManualEvent(user!.uid, newEventTitle, new Date(newEventDate), "Manual Event");
      setIsAddModalOpen(false);
      setNewEventTitle('');
  };

  // Verificare Agency
  if (userProfile?.subscriptionTier !== 'agency') {
      return (
          <div className="flex flex-col items-center justify-center h-[60vh] text-center animate-in fade-in">
              <Lock size={40} className="text-orange-500 mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">Agency Feature</h2>
              <p className="text-gray-400 mb-6">Upgrade to Agency Plan to unlock the full Calendar Strategy.</p>
          </div>
      );
  }

  // Calendar Helpers
  const getPostsForDay = (date: Date) => {
      return posts.filter(p => {
          const d = p.scheduledDate || p.createdAt;
          return d.getDate() === date.getDate() && d.getMonth() === date.getMonth() && d.getFullYear() === date.getFullYear();
      });
  };

  // Render Logic
  return (
    <div className="max-w-6xl mx-auto pb-20 animate-in fade-in">
        <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-4">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2"><CalendarIcon className="text-orange-500"/> Calendar</h2>
                <div className="flex bg-[#161b22] rounded-lg border border-gray-700 p-1">
                    {['month', 'week', 'day'].map(m => (
                        <button key={m} onClick={() => setViewMode(m as any)} className={`px-3 py-1 text-xs font-bold rounded ${viewMode === m ? 'bg-orange-600 text-white' : 'text-gray-400'}`}>
                            {m.charAt(0).toUpperCase() + m.slice(1)}
                        </button>
                    ))}
                </div>
            </div>
            <button onClick={() => setIsAddModalOpen(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2"><Plus size={16}/> Add Event</button>
        </div>

        {/* VIEW: MONTH */}
        {viewMode === 'month' && (
            <div className="grid grid-cols-7 gap-px bg-gray-800 border border-gray-800 rounded-xl overflow-hidden">
                {['M','T','W','T','F','S','S'].map(d => <div key={d} className="bg-[#161b22] p-3 text-center text-xs font-bold text-gray-500">{d}</div>)}
                {Array.from({ length: 35 }).map((_, idx) => {
                    const dayNum = idx - 2; // Offset simplu pt demo
                    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), dayNum);
                    const dayPosts = getPostsForDay(date);
                    
                    return (
                        <div key={idx} className="bg-[#0f1115] min-h-[100px] p-2 border-t border-gray-800">
                            {dayNum > 0 && dayNum <= 31 && (
                                <>
                                    <span className="text-xs font-bold text-gray-500">{dayNum}</span>
                                    <div className="mt-2 space-y-1">
                                        {dayPosts.map(p => (
                                            <div key={p.id} onClick={onNavigateToVault} className="text-[10px] bg-[#1c1c2e] p-1.5 rounded border border-gray-700 text-gray-300 truncate cursor-pointer hover:border-orange-500">
                                                {p.topic || "Post"}
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    )
                })}
            </div>
        )}

        {/* ADD EVENT MODAL */}
        {isAddModalOpen && (
            <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center">
                <div className="bg-[#161b22] p-6 rounded-xl border border-gray-700 w-96">
                    <h3 className="text-lg font-bold text-white mb-4">Add Event</h3>
                    <input type="text" placeholder="Event Title" className="w-full bg-black border border-gray-700 rounded-lg p-3 mb-3 text-white text-sm" value={newEventTitle} onChange={e => setNewEventTitle(e.target.value)} />
                    <input type="datetime-local" className="w-full bg-black border border-gray-700 rounded-lg p-3 mb-4 text-white text-sm" value={newEventDate} onChange={e => setNewEventDate(e.target.value)} />
                    <div className="flex gap-2">
                        <button onClick={() => setIsAddModalOpen(false)} className="flex-1 py-2 text-gray-400">Cancel</button>
                        <button onClick={handleAddEvent} className="flex-1 py-2 bg-blue-600 text-white rounded-lg font-bold">Save</button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
}
