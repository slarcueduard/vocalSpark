import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Post } from '../types';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Lock, Clock } from 'lucide-react';

interface CalendarViewProps {
    onNavigateToVault?: () => void;
}

export function CalendarView({ onNavigateToVault }: CalendarViewProps) {
  const { user, userProfile } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');

  // Helper de siguranță pentru date (PREVINE CRASH-UL)
  const getSafeDate = (val: any): Date => {
      if (!val) return new Date(); // Fallback la azi
      if (val.toDate) return val.toDate(); // Firebase Timestamp
      if (val instanceof Date) return val; // Deja Date
      return new Date(val); // String sau Number
  };

  useEffect(() => {
    if (!user) return;
    
    // Ascultăm doar postările userului
    const q = query(collection(db, 'posts'), where('userId', '==', user.uid));
    
    const unsubscribe = onSnapshot(q, (snap) => {
        const loadedPosts = snap.docs.map(doc => {
            const d = doc.data();
            return { 
                ...d, 
                id: doc.id,
                // Convertim datele imediat ce vin, sigur
                createdAt: getSafeDate(d.createdAt),
                scheduledDate: d.scheduledDate ? getSafeDate(d.scheduledDate) : null
            } as any;
        });
        setPosts(loadedPosts);
    });
    return () => unsubscribe();
  }, [user]);

  // Verificare Agency
  const isAgency = userProfile?.subscriptionTier === 'agency';
  if (!isAgency) {
      return (
          <div className="flex flex-col items-center justify-center h-[60vh] text-center animate-in fade-in">
              <div className="w-20 h-20 bg-[#161b22] rounded-full flex items-center justify-center mb-6 border border-gray-800">
                  <Lock size={40} className="text-orange-500" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Agency Feature</h2>
              <p className="text-gray-400 mb-6 max-w-md">The Strategic Content Calendar is available exclusively on the Agency Plan.</p>
              <div className="px-6 py-3 bg-gray-800/50 border border-gray-700 text-gray-300 font-bold rounded-xl">
                  Upgrade to Unlock
              </div>
          </div>
      );
  }

  // Helpers Calendar Logic
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay(); 
  const startOffset = firstDayIndex === 0 ? 6 : firstDayIndex - 1; // Luni start

  const days = [];
  for (let i = 0; i < startOffset; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  const getPostsForDay = (day: number) => {
      return posts.filter(p => {
          // Folosim data programată dacă există, altfel data creării
          // @ts-ignore
          const d = p.scheduledDate || p.createdAt;
          return d.getDate() === day && d.getMonth() === month && d.getFullYear() === year;
      });
  };

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  return (
    <div className="max-w-6xl mx-auto pb-20 animate-in fade-in">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
            <div className="flex items-center gap-2">
                <CalendarIcon className="text-orange-500" />
                <h2 className="text-2xl font-bold text-white">Campaign Calendar</h2>
            </div>
            
            <div className="flex gap-4">
                <div className="flex items-center gap-2 bg-[#161b22] p-1 rounded-lg border border-gray-700">
                    <button onClick={() => setCurrentDate(new Date(year, month - 1, 1))} className="p-1 hover:bg-gray-700 rounded text-white"><ChevronLeft size={18}/></button>
                    <span className="text-xs font-bold text-white w-32 text-center">
                        {monthNames[month]} {year}
                    </span>
                    <button onClick={() => setCurrentDate(new Date(year, month + 1, 1))} className="p-1 hover:bg-gray-700 rounded text-white"><ChevronRight size={18}/></button>
                </div>
            </div>
        </div>

        {/* Month Grid */}
        <div className="grid grid-cols-7 gap-px bg-gray-800 border border-gray-800 rounded-xl overflow-hidden shadow-2xl">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => <div key={d} className="bg-[#161b22] p-3 text-center text-[10px] font-bold text-gray-500 uppercase">{d}</div>)}
            
            {days.map((day, idx) => {
                const dayPosts = day ? getPostsForDay(day) : [];
                const isToday = day === new Date().getDate() && month === new Date().getMonth();

                return (
                    <div key={idx} className={`bg-[#0f1115] min-h-[100px] p-2 border-t border-gray-800 hover:bg-[#13151a] transition relative group`}>
                        {day && (
                            <>
                                <span className={`text-xs font-bold ${isToday ? 'text-black bg-orange-500 px-1.5 py-0.5 rounded-full' : 'text-gray-500'}`}>{day}</span>
                                <div className="mt-2 space-y-1 overflow-y-auto max-h-[80px] custom-scrollbar">
                                    {dayPosts.map(p => (
                                        <div 
                                            key={p.id} 
                                            onClick={onNavigateToVault}
                                            className="text-[10px] bg-[#1c1c2e] p-1.5 rounded border border-gray-700 text-gray-300 truncate cursor-pointer hover:border-orange-500 hover:text-white flex items-center gap-1"
                                        >
                                            {p.scheduledDate && <Clock size={8} className="text-orange-400"/>}
                                            {p.topic || "Untitled Post"}
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                )
            })}
        </div>
    </div>
  );
}
