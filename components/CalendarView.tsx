import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Post } from '../types';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Lock, Clock, Plus, AlignLeft, Briefcase, Trash, Loader2 } from 'lucide-react';
import { deletePostFromHistory } from '../services/postService';

interface CalendarViewProps {
    onNavigateToVault?: () => void;
    onNavigateToVault?: () => void;
    // onNavigateToCreate removed
}

export function CalendarView({ onNavigateToVault }: CalendarViewProps) {
    const { user, userProfile } = useAuth();
    const [posts, setPosts] = useState<Post[]>([]);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [viewMode, setViewMode] = useState<'month' | 'week' | 'day' | 'timeline'>('month');

    const [selectedEvent, setSelectedEvent] = useState<Post | null>(null);

    const getSafeDate = (val: any) => val?.toDate ? val.toDate() : (val ? new Date(val) : new Date());

    const handleDeleteEvent = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation(); // Stop click from triggering navigation
        if (confirm("Delete this event?")) {
            await deletePostFromHistory(id);
        }
    };

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



    const handlePostClick = (p: any) => {
        if (p.type === 'event') {
            setSelectedEvent(p);
        } else {
            if (onNavigateToVault) onNavigateToVault();
        }
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
            // Priority: Scheduled Date -> Created Date (if no schedule)
            // Priority: Created Date -> Scheduled Date (Legacy pullback)
            const d = p.createdAt || p.scheduledDate;
            if (!d) return false;

            const targetDate = d.toDate ? d.toDate() : new Date(d);
            return targetDate.getDate() === date.getDate() &&
                targetDate.getMonth() === date.getMonth() &&
                targetDate.getFullYear() === date.getFullYear();
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
                            {dayPosts.map(p => {
                                const isManualEvent = p.type === 'event';
                                const displayDate = p.scheduledDate ? getSafeDate(p.scheduledDate) : getSafeDate(p.createdAt);
                                const linkedCount = isManualEvent ? posts.filter(post => post.linkedEventId === p.id).length : 0;

                                return (
                                    <div
                                        key={p.id}
                                        onClick={() => handlePostClick(p)}
                                        title={isManualEvent ? `${linkedCount} posts created` : ''}
                                        className={`p-4 border rounded-lg cursor-pointer transition flex flex-col gap-2 ${isManualEvent ? 'bg-blue-900/20 border-blue-500/50 hover:bg-blue-900/30' : 'bg-[#0f1115] border-gray-700 hover:border-orange-500'}`}
                                    >
                                        <div className="flex justify-between items-start">
                                            <span className={`font-bold text-sm ${isManualEvent ? 'text-blue-400' : 'text-orange-400'}`}>
                                                {p.topic || (isManualEvent ? "Untitled Event" : "Generated Post")}
                                            </span>
                                            <span className="text-gray-500 text-xs flex items-center gap-1">
                                                <Clock size={12} />
                                                {displayDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <p className="text-gray-400 text-sm line-clamp-2">{p.content}</p>
                                        <div className="flex justify-between items-center mt-1">
                                            <div className="flex items-center gap-2">
                                                {isManualEvent ? <div className="text-[10px] bg-blue-500/20 text-blue-300 w-fit px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">Event</div> : <div></div>}
                                                {isManualEvent && linkedCount > 0 && <span className="text-[10px] text-gray-500">{linkedCount} posts</span>}
                                            </div>
                                            <button onClick={(e) => handleDeleteEvent(e, p.id)} className="text-gray-600 hover:text-red-500 transition"><Trash size={12} /></button>
                                        </div>
                                    </div>
                                );
                            })}
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

            const weekDays = Array.from({ length: 7 }).map((_, i) => {
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
                                        <div key={p.id} onClick={() => handlePostClick(p)} className={`text-[10px] p-2 rounded border truncate cursor-pointer hover:bg-opacity-80 group relative flex justify-between items-center ${p.type === 'event' ? 'bg-blue-900/30 border-blue-500/50 text-blue-200' : 'bg-[#0f1115] border-gray-700 text-gray-300'}`}>
                                            <span className="truncate">{p.type === 'event' && <span className="text-blue-500 mr-1">●</span>}{p.topic || "Post"}</span>
                                            <button onClick={(e) => handleDeleteEvent(e, p.id)} className="hidden group-hover:block text-gray-400 hover:text-red-500 bg-[#161b22] rounded p-0.5"><Trash size={10} /></button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            );
        }

        if (viewMode === 'timeline') {
            const now = new Date();
            now.setHours(0, 0, 0, 0);

            // Filter all posts with scheduledDate >= today
            const futurePosts = posts.filter(p => {
                const sDate = p.scheduledDate ? getSafeDate(p.scheduledDate) : null;
                return sDate && sDate >= now;
            });

            // Sort by Date Ascending
            futurePosts.sort((a, b) => {
                const da = getSafeDate(a.scheduledDate).getTime();
                const db = getSafeDate(b.scheduledDate).getTime();
                return da - db;
            });

            return (
                <div className="bg-[#161b22] rounded-2xl border border-gray-800 p-6 md:p-8 min-h-[400px]">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="p-3 bg-blue-500/10 rounded-xl">
                            <AlignLeft className="text-blue-400" size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white">Timeline View</h3>
                            <p className="text-sm text-gray-400">Content Creation History ({futurePosts.length})</p>
                        </div>
                    </div>

                    {futurePosts.length > 0 ? (
                        <div className="relative border-l border-gray-800 ml-3 space-y-8 pl-8 md:pl-12">
                            {futurePosts.map(p => {
                                const isManualEvent = p.type === 'event';
                                const displayDate = getSafeDate(p.scheduledDate);
                                const linkedCount = isManualEvent ? posts.filter(post => post.linkedEventId === p.id).length : 0;
                                const isDraft = !p.isPublished;

                                return (
                                    <div key={p.id} className="relative group">
                                        {/* Dot Indicator */}
                                        <div className={`absolute -left-[41px] md:-left-[57px] top-6 w-5 h-5 rounded-full border-4 border-[#0f1115] ${isManualEvent ? 'bg-blue-500' : 'bg-orange-500'} shadow-lg shadow-black/50`}></div>

                                        {/* Date Badge */}
                                        <div className="mb-2 inline-flex items-center gap-2 bg-gray-800/50 px-3 py-1 rounded-full border border-gray-700">
                                            <CalendarIcon size={12} className="text-gray-400" />
                                            <span className="text-xs font-bold text-gray-300">
                                                {displayDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                                            </span>
                                            <span className="text-gray-600">|</span>
                                            <span className="text-xs text-gray-500 font-mono">
                                                {displayDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>

                                        {/* Card */}
                                        <div
                                            onClick={() => handlePostClick(p)}
                                            className={`cursor-pointer transition-all hover:translate-x-1 duration-300 rounded-xl border p-4 md:p-5 flex flex-col md:flex-row gap-4 ${isManualEvent ? 'bg-blue-900/10 border-blue-500/30 hover:bg-blue-900/20' : 'bg-[#0f1115] border-gray-800 hover:border-gray-600'}`}
                                        >
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    {isManualEvent && <span className="text-[10px] font-bold bg-blue-500 text-white px-2 py-0.5 rounded uppercase tracking-wider">Event</span>}
                                                    {!isManualEvent && p.platform && <span className="text-[10px] font-mono bg-gray-800 text-gray-300 px-2 py-0.5 rounded border border-gray-700">{p.platform}</span>}
                                                    <h4 className={`text-base font-bold ${isManualEvent ? 'text-blue-100' : 'text-gray-200'}`}>
                                                        {p.topic || (isManualEvent ? "Untitled Event" : "Scheduled Post")}
                                                    </h4>
                                                </div>

                                                <p className="text-sm text-gray-400 line-clamp-2 md:line-clamp-3 mb-3 leading-relaxed">
                                                    {p.content}
                                                </p>

                                                <div className="flex items-center gap-4">
                                                    {isManualEvent && (
                                                        <div className="flex items-center gap-1.5 text-xs text-blue-400/80">
                                                            <Briefcase size={12} />
                                                            <span>{linkedCount} linked posts</span>
                                                        </div>
                                                    )}
                                                    {/* Edit / Delete Actions could go here */}
                                                </div>
                                            </div>

                                            {/* Preview Image if exists */}
                                            {p.imageUrl && (
                                                <div className="w-full md:w-32 h-32 rounded-lg overflow-hidden bg-black shrink-0 border border-gray-800">
                                                    <img src={p.imageUrl} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition" alt="Post preview" />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 text-center opacity-50">
                            <Clock size={48} className="text-gray-600 mb-4" />
                            <h4 className="text-xl font-bold text-gray-400">No scheduled content</h4>
                            <p className="text-gray-600 mt-2">Schedule posts from your Vault to see them here.</p>
                        </div>
                    )}
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
                {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map(d => <div key={d} className="bg-[#161b22] p-3 text-center text-xs font-bold text-gray-500">{d}</div>)}
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
                                        {dayPosts.map(p => {
                                            const linkedCount = p.type === 'event' ? posts.filter(post => post.linkedEventId === p.id).length : 0;
                                            return (
                                                <div
                                                    key={p.id}
                                                    onClick={() => handlePostClick(p)}
                                                    title={p.type === 'event' ? `${linkedCount} posts created` : ''}
                                                    className={`text-[10px] p-1.5 rounded border truncate cursor-pointer hover:border-orange-500 group relative flex justify-between items-center ${p.type === 'event' ? 'bg-blue-900/30 border-blue-500/50 text-blue-200' : 'bg-[#1c1c2e] border-gray-700 text-gray-300'}`}
                                                >
                                                    <span className="truncate">{p.topic || "Post"}</span>
                                                    <button onClick={(e) => handleDeleteEvent(e, p.id)} className="hidden group-hover:block text-gray-400 hover:text-red-500 bg-[#161b22] rounded p-0.5 ml-1"><Trash size={10} /></button>
                                                </div>
                                            );
                                        })}
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
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2"><CalendarIcon className="text-orange-500" /> Calendar</h2>
                    <div className="flex bg-[#161b22] rounded-lg border border-gray-700 p-1">
                        {['month', 'week', 'day', 'timeline'].map(m => (
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
                        }} className="p-1 hover:bg-gray-700 rounded text-white"><ChevronLeft size={18} /></button>
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
                        }} className="p-1 hover:bg-gray-700 rounded text-white"><ChevronRight size={18} /></button>
                    </div>
                </div>
            </div>

            {renderView()}

            {/* ADD EVENT MODAL REMOVED */}

            {/* EVENT DETAILS MODAL */}
            {selectedEvent && (
                <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
                    <div className="bg-[#161b22] p-6 rounded-2xl border border-gray-700 w-full max-w-lg shadow-2xl animate-in fade-in zoom-in">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <div className="text-[10px] font-bold text-blue-400 uppercase tracking-wider mb-1">Calendar Event</div>
                                <h3 className="text-2xl font-bold text-white">{selectedEvent.topic}</h3>
                            </div>
                            <button onClick={() => setSelectedEvent(null)} className="text-gray-500 hover:text-white"><Trash size={0} className="hidden" /><span className="text-lg">✕</span></button>
                        </div>

                        <div className="bg-[#0f1115] rounded-xl p-4 border border-gray-800 mb-6">
                            <div className="flex items-center gap-2 text-gray-400 text-sm mb-3">
                                <Clock size={16} />
                                <span>{(selectedEvent.scheduledDate ? getSafeDate(selectedEvent.scheduledDate) : getSafeDate(selectedEvent.createdAt)).toLocaleString()}</span>
                            </div>
                            <p className="text-gray-300 text-sm whitespace-pre-wrap">{selectedEvent.content}</p>
                        </div>

                        {/* LINKED POSTS */}
                        <div className="mb-6">
                            <h4 className="text-sm font-bold text-gray-400 uppercase mb-3 flex items-center gap-2">
                                <AlignLeft size={14} /> Linked Content ({posts.filter(p => p.linkedEventId === selectedEvent.id).length})
                            </h4>
                            <div className="space-y-2 max-h-[200px] overflow-y-auto custom-scrollbar">
                                {posts.filter(p => p.linkedEventId === selectedEvent.id).length > 0 ? (
                                    posts.filter(p => p.linkedEventId === selectedEvent.id).map(p => (
                                        <div
                                            key={p.id}
                                            onClick={() => {
                                                if (onNavigateToVault) {
                                                    // Optional: pass ID to vault to highlight it
                                                    onNavigateToVault();
                                                }
                                            }}
                                            className="bg-[#1c1c2e] p-3 rounded-lg border border-gray-700 hover:border-blue-500 cursor-pointer transition flex items-center justify-between group"
                                        >
                                            <div className="truncate flex-1 pr-4">
                                                <span className="text-white text-sm font-medium block truncate">{p.content}</span>
                                                <span className="text-[10px] text-gray-500">{p.platform || 'Generic'} • {new Date(p.createdAt || new Date()).toLocaleDateString()}</span>
                                            </div>
                                            <div className="text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity text-xs font-bold">View</div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-gray-600 text-sm italic">No content created for this event yet.</p>
                                )}
                            </div>
                        </div>

                        <div className="flex gap-3 pt-4 border-t border-gray-800">
                            <button
                                onClick={async () => {
                                    if (confirm("Delete this event?")) {
                                        await deletePostFromHistory(selectedEvent.id);
                                        setSelectedEvent(null);
                                    }
                                }}
                                className="px-4 py-3 bg-red-900/20 text-red-400 hover:bg-red-900/40 rounded-xl font-bold text-sm transition"
                            >
                                Delete Event
                            </button>
                            {/* Create Content Removed */}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
