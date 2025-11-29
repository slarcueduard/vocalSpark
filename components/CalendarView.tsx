import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Post } from '../types';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Lock, Clock, Plus, AlignLeft } from 'lucide-react';
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
  const [newEventDesc, setNewEventDesc] = useState(''); // <--- Description
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
      // Salvăm descrierea în conținut
      await createManualEvent(user!.uid, newEventTitle, new Date(newEventDate), newEventDesc);
      setIsAddModalOpen(false);
      setNewEventTitle('');
      setNewEventDesc('');
  };

  if (userProfile?.subscriptionTier !== 'agency') {
      return (
          <div className="flex flex-col items-center justify-center h-[60vh] text-center animate-in fade-in">
              <Lock size={40} className="text-orange-500 mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">Agency Feature</h2>
              <p className="text-gray-400 mb-6">Upgrade to Agency Plan to unlock the full Calendar Strategy.</p>
          </div>
      );
  }

  const getPostsForDay = (date: Date) => {
      return posts.filter(p => {
          const d = p.scheduledDate || p.createdAt;
          return d.getDate() === date.getDate() && d.getMonth() === date.getMonth() && d.getFullYear() === date.getFullYear();
      });
  };

  // --- LOGICA PENTRU WEEK / DAY VIEW ---
  const renderView = () => {
      if (viewMode === 'day') {
          const dayPosts = getPostsForDay(currentDate);
          return (
              <div className="bg-[#161b22] rounded-xl border border-gray-800 p-6 min-h-[400px]">
                  <h3 className="text-xl font-bold text-white mb-4">{currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</h3>
                  {dayPosts.length > 0 ? (
                      <div className="space-y-3">
                          {dayPosts.map(p => (
                              <div key={p.id} onClick={onNavigateToVault} className="p-4 bg-[#0f1115] border border-gray-700 rounded-lg cursor-pointer hover:border-orange-500 transition">
                                  <div className="flex justify-between items-start mb-2">
                                      <span className="text-orange-400 font-bold text-sm">{p.topic || "Untitled Event"}</span>
                                      <span className="text-gray-500 text-xs flex items-center gap-1"><Clock size={12}/> {p.scheduledDate ? getSafeDate(p.scheduledDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'All Day'}</span>
                                  </div>
                                  <p className="text-gray-400 text-sm line-clamp-2">{p.content}</p>
                              </div>
                          ))}
                      </div>
                  ) : (
                      <p className="text-gray-500 italic">No events scheduled for today.</p>
                  )}
              </div>
          );
      }

      if (viewMode === 'week') {
          const startOfWeek = new Date(currentDate);
          const day = startOfWeek.getDay();
          const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Monday start
          startOfWeek.setDate(diff);

          const weekDays = Array.from({length: 7}).map((_, i) => {
              const d = new Date(startOfWeek);
              d.setDate(d.getDate() + i);
              return d;
          });

          return (
              <div className="grid grid-cols-7 gap-2">
                  {weekDays.map((date, idx) => {
                      const isToday = date.getDate() === new Date().getDate() && date.getMonth() === new Date().getMonth();
                      const dayPosts = getPostsForDay(date);
                      return (
                        <div key={idx} className={`bg-[#161b22] rounded-xl border ${isToday ? 'border-orange-500/50' : 'border-gray-800'} p-3 min-h-[300px]`}>
                             <div className={`text-center text-xs font-bold mb-3 ${isToday ? 'text-orange-400' : 'text-gray-400'}`}>
                                 {date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' })}
                             </div>
                             <div className="space-y-2">
                                 {dayPosts.map(p => (
                                    <div key={p.id} onClick={onNavigateToVault} className="text-[10px] bg-[#0f1115] p-2 rounded border border-gray-700 text-gray-300 truncate cursor-pointer hover:bg-gray-800">
                                        {p.topic || "Post"}
                                    </div>
                                 ))}
                             </div>
                        </div>
                      );
                  })}
              </div>
          );
      }

      // MONTH VIEW (Standard)
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const firstDayIndex = new Date(year, month, 1).getDay(); 
      const startOffset = firstDayIndex === 0 ? 6 : firstDayIndex - 1; 
      const days = [];
      for (let i = 0; i < startOffset; i++) days.push(null);
      for (let i = 1; i <= daysInMonth; i++) days.push(i);

      return (
        <div className="grid grid-cols-7 gap-px bg-gray-800 border border-gray-800 rounded-xl overflow-hidden shadow-2xl">
            {['M','T','W','T','F','S','S'].map(d => <div key={d} className="bg-[#161b22] p-3 text-center text-xs font-bold text-gray-500">{d}</div>)}
            {days.map((day, idx) => {
                const dayNum = day || 0;
                const date = new Date(year, month, dayNum);
                const dayPosts = day ? getPostsForDay(date) : [];
                return (
                    <div key={idx} className="bg-[#0f1115] min-h-[100px] p-2 border-t border-gray-800">
                        {dayNum > 0 && (
                            <>
                                <span className="text-xs font-bold text-gray-500">{dayNum}</span>
                                <div className="mt-2 space-y-1 overflow-y-auto max-h-[70px] custom-scrollbar">
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
      );
  };

  return (
    <div className="max-w-6xl mx-auto pb-20 animate-in fade-in">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
            <div className="flex items-center gap-4">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2"><CalendarIcon className="text-orange-500"/> Calendar</h2>
                <div className="flex bg-[#161b22] rounded-lg border border-gray-700 p-1">
                    {['month', 'week', 'day'].map(m => (
                        <button key={m} onClick={() => setViewMode(m as any)} className={`px-3 py-1 text-xs font-bold rounded transition ${viewMode === m ? 'bg-orange-600 text-white' : 'text-gray-400 hover:text-white'}`}>
                            {m.charAt(0).toUpperCase() + m.slice(1)}
                        </button>
                    ))}
                </div>
            </div>
            
            <div className="flex gap-4 items-center">
                <div className="flex items-center gap-2 bg-[#161b22] p-1 rounded-lg border border-gray-700">
                    <button onClick={() => {
                        const d = new Date(currentDate);
                        if (viewMode === 'month') d.setMonth(d.getMonth() - 1);
                        else if (viewMode === 'week') d.setDate(d.getDate() - 7);
                        else d.setDate(d.getDate() - 1);
                        setCurrentDate(d);
                    }} className="p-1 hover:bg-gray-700 rounded text-white"><ChevronLeft size={18}/></button>
                    <span className="text-xs font-bold text-white w-24 text-center">
                        {viewMode === 'day' 
                           ? currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                           : currentDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                    </span>
                    <button onClick={() => {
                        const d = new Date(currentDate);
                        if (viewMode === 'month') d.setMonth(d.getMonth() + 1);
                        else if (viewMode === 'week') d.setDate(d.getDate() + 7);
                        else d.setDate(d.getDate() + 1);
                        setCurrentDate(d);
                    }} className="p-1 hover:bg-gray-700 rounded text-white"><ChevronRight size={18}/></button>
                </div>
                <button onClick={() => setIsAddModalOpen(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-lg hover:bg-blue-500"><Plus size={16}/> Add Event</button>
            </div>
        </div>

        {renderView()}

        {/* ADD EVENT MODAL */}
        {isAddModalOpen && (
            <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
                <div className="bg-[#161b22] p-6 rounded-2xl border border-gray-700 w-full max-w-md shadow-2xl">
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><Plus className="text-blue-500"/> Add Manual Event</h3>
                    
                    <div className="space-y-4 mb-6">
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Title</label>
                            <input type="text" placeholder="e.g. Black Friday Launch" className="w-full bg-[#0f1115] border border-gray-700 rounded-xl p-3 text-white text-sm focus:border-blue-500 outline-none" value={newEventTitle} onChange={e => setNewEventTitle(e.target.value)} />
                        </div>
                        
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Description</label>
                            <textarea placeholder="Event details..." className="w-full bg-[#0f1115] border border-gray-700 rounded-xl p-3 text-white text-sm focus:border-blue-500 outline-none h-24 resize-none" value={newEventDesc} onChange={e => setNewEventDesc(e.target.value)} />
                        </div>

                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Date & Time</label>
                            <input type="datetime-local" className="w-full bg-[#0f1115] border border-gray-700 rounded-xl p-3 text-white text-sm focus:border-blue-500 outline-none" value={newEventDate} onChange={e => setNewEventDate(e.target.value)} />
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <button onClick={() => setIsAddModalOpen(false)} className="flex-1 py-3 text-gray-400 hover:text-white font-bold text-sm">Cancel</button>
                        <button onClick={handleAddEvent} className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-sm shadow-lg">Save Event</button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
}
