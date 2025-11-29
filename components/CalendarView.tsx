import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Post } from '../types';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';

export function CalendarView() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'posts'), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snap) => {
        const loadedPosts = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post));
        setPosts(loadedPosts);
    });
    return () => unsubscribe();
  }, [user]);

  // Helper: Get days in month
  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay(); // 0 = Sun

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  
  // Ajustăm ca Luni să fie prima zi (Europe standard)
  const startOffset = firstDay === 0 ? 6 : firstDay - 1; 

  const days = [];
  for (let i = 0; i < startOffset; i++) days.push(null); // Padding
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  // Match posts to days (Simulare: Dacă am avea scheduledDate. Acum folosim createdAt)
  const getPostsForDay = (day: number) => {
      return posts.filter(p => {
          // @ts-ignore
          const d = p.createdAt?.toDate ? p.createdAt.toDate() : new Date();
          return d.getDate() === day && d.getMonth() === month && d.getFullYear() === year;
      });
  };

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  return (
    <div className="max-w-6xl mx-auto pb-20 animate-in fade-in">
        <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <CalendarIcon className="text-purple-500" /> Content Calendar
            </h2>
            <div className="flex items-center gap-4 bg-[#161b22] p-2 rounded-xl border border-gray-800">
                <button onClick={() => setCurrentDate(new Date(year, month - 1, 1))} className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white"><ChevronLeft size={20}/></button>
                <span className="text-sm font-bold text-white w-32 text-center">{monthNames[month]} {year}</span>
                <button onClick={() => setCurrentDate(new Date(year, month + 1, 1))} className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white"><ChevronRight size={20}/></button>
            </div>
        </div>

        <div className="grid grid-cols-7 gap-px bg-gray-800 border border-gray-800 rounded-2xl overflow-hidden shadow-2xl">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                <div key={day} className="bg-[#161b22] p-4 text-xs font-bold text-gray-500 uppercase text-center">
                    {day}
                </div>
            ))}
            
            {days.map((day, idx) => {
                const dayPosts = day ? getPostsForDay(day) : [];
                return (
                    <div key={idx} className={`bg-[#0f1115] min-h-[120px] p-3 border-t border-gray-800 relative group transition hover:bg-[#141414]`}>
                        {day && (
                            <>
                                <span className={`text-sm font-medium ${day === new Date().getDate() && month === new Date().getMonth() ? 'text-blue-400 bg-blue-900/20 px-2 py-0.5 rounded-full' : 'text-gray-400'}`}>
                                    {day}
                                </span>
                                <div className="mt-2 space-y-1">
                                    {dayPosts.map(p => (
                                        <div key={p.id} className="text-[10px] bg-[#1c1c2e] p-1.5 rounded border border-gray-700 text-gray-300 truncate cursor-pointer hover:border-purple-500 hover:text-white">
                                            {p.topic || "Post"}
                                        </div>
                                    ))}
                                    {/* Placeholder pentru postări viitoare */}
                                    {day > new Date().getDate() && dayPosts.length === 0 && (
                                        <div className="opacity-0 group-hover:opacity-100 text-[10px] text-gray-600 text-center mt-4 cursor-pointer hover:text-gray-400">
                                            + Plan
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                );
            })}
        </div>
    </div>
  );
}
