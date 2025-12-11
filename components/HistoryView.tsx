import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { deletePostFromHistory, togglePostLock, updatePostContent, updatePostInHistory, savePostToHistory } from '../services/postService';
import { PostCard } from './PostCard';
import { Loader } from './Loader';
import { Archive, Search, Database, Ghost, ShieldCheck, Trash2, Lock, Unlock } from 'lucide-react';
import { Post, Tone } from '../types';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';
import { ImageCreationModal } from './ImageCreationModal';
import { generateSocialMediaPosts } from '../services/geminiService';

export function HistoryView({ onNavigateToCalendar }: { onNavigateToCalendar?: () => void }) {
    const { user } = useAuth();
    // ... (lines 15-296 same) ...

    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<'all' | 'single' | 'campaign' | 'remix'>('all');

    // --- NOU: FILTRU LOCKED ---
    const [showLockedOnly, setShowLockedOnly] = useState(false);

    const [isImageModalOpen, setIsImageModalOpen] = useState(false);
    const [activePostId, setActivePostId] = useState<string | null>(null);
    const [activePrompt, setActivePrompt] = useState('');
    const [generatingFollowUpId, setGeneratingFollowUpId] = useState<string | null>(null);

    useEffect(() => {
        if (!user) return;

        const q = query(collection(db, 'posts'), where('userId', '==', user.uid));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const formattedPosts: Post[] = snapshot.docs.map((doc) => {
                const d = doc.data();
                return {
                    id: doc.id,
                    content: d.content || "",
                    imageUrl: d.imageUrl || null, // Aici vine Base64-ul salvat
                    adaptedContent: d.adaptedContent || {},
                    isGeneratingImage: false,
                    isLocked: !!d.isLocked,
                    generationType: d.generationType || 'single',
                    type: d.type || 'post',
                    createdAt: d.createdAt,
                    parentId: d.parentId,
                    platform: d.platform,
                    linkedEventId: d.linkedEventId,
                    linkedEventTitle: d.linkedEventTitle,
                    scheduledDate: d.scheduledDate ? (d.scheduledDate.toDate ? d.scheduledDate.toDate() : new Date(d.scheduledDate)) : null
                } as any;
            });

            // Sortare Descrescatoare (Noi -> Vechi)
            formattedPosts.sort((a: any, b: any) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

            setPosts(formattedPosts);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    // --- LOGICA DE FILTRARE ---
    const getFilteredPosts = () => {
        return posts.filter(p => {
            const contentMatch = (p.content || "").toLowerCase().includes(searchTerm.toLowerCase());

            // Filtru Tip
            const typeMatch = filterType === 'all' || p.generationType === filterType;

            // Filtru Locked (NOU)
            const lockMatch = showLockedOnly ? p.isLocked : true;

            return contentMatch && typeMatch && lockMatch;
        });
    };

    // --- GRUPARE PE ZILE ---
    const getGroupedPosts = () => {
        const filtered = getFilteredPosts();
        const groups: Record<string, Post[]> = {};

        filtered.forEach(p => {
            // @ts-ignore
            const date = p.createdAt?.toDate ? p.createdAt.toDate() : new Date();
            const today = new Date();
            const yesterday = new Date();
            yesterday.setDate(today.getDate() - 1);

            let dateKey = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            if (date.toDateString() === today.toDateString()) dateKey = "Today";
            else if (date.toDateString() === yesterday.toDateString()) dateKey = "Yesterday";

            if (!groups[dateKey]) groups[dateKey] = [];
            groups[dateKey].push(p);
        });
        return groups;
    };

    const handleDelete = async (id: string) => {
        if (window.confirm("Delete this post?")) await deletePostFromHistory(id);
    };

    const handleDeleteAll = async () => {
        const unlockedPosts = posts.filter(p => !p.isLocked);
        if (unlockedPosts.length === 0) { alert("No unlocked posts to delete."); return; }
        if (window.confirm(`Delete ${unlockedPosts.length} unlocked posts? Locked posts will be safe.`)) {
            for (const p of unlockedPosts) await deletePostFromHistory(p.id);
        }
    };

    const handleToggleLock = async (id: string) => {
        if (!user) return;
        const post = posts.find(p => p.id === id);
        if (post) {
            await togglePostLock(user.uid, id, post.isLocked || false);
            // UI update is automatic via onSnapshot
        }
    };

    const handleUpdateContent = async (id: string, c: string) => { await updatePostContent(id, c); };

    // FIX IMAGE: Folosim imaginea selectata (care va veni Base64) si o salvam in DB
    const openImageModal = (id: string, c: string) => { setActivePostId(id); setActivePrompt(c); setIsImageModalOpen(true); };
    const handleImageSelected = async (url: string) => {
        // Daca url este blob:, ar trebui convertit in App.tsx sau ImageCreationModal.
        // Aici presupunem ca primim Base64 sau URL valid.
        if (activePostId) await updatePostInHistory(activePostId, { imageUrl: url });
        setIsImageModalOpen(false);
    };

    const handleFollowUp = async (parentId: string, parentContent: string) => {
        if (!user) return;
        // Optional: Remove confirm if we want instant action, but kept for safety.
        // const confirmGen = window.confirm("Generate a follow-up post? (1 Credit)");
        // if (!confirmGen) return; 

        setGeneratingFollowUpId(parentId);
        try {
            console.log("Starting Follow-up Generation for Parent:", parentId);
            const generated = await generateSocialMediaPosts(
                "Follow-up",
                Tone.Professional,
                1,
                "English",
                "",
                undefined,
                undefined,
                undefined,
                'engagement',
                false,
                false,
                false,
                [],
                true,
                parentContent
            );
            console.log("Generated Content:", generated);

            if (generated && generated.length > 0) {
                const newPost = generated[0];

                const parentPost = posts.find(p => p.id === parentId);
                const inheritedType = parentPost?.generationType || 'single';

                const postToSave: any = {
                    content: newPost.content,
                    type: 'post',
                    generationType: inheritedType, // Inherit so it shows up in the same filter tab
                    imageUrl: null,
                    adaptedContent: {},
                    isLocked: false,
                    parentId: parentId, // Ensure link is established
                    platform: newPost.platform || 'Generic'
                };

                if (!newPost.content || newPost.content.trim().length === 0) {
                    throw new Error("Generated content was empty.");
                }

                console.log("Saving to DB:", postToSave);
                const savedId = await savePostToHistory(user.uid, postToSave, "Follow-up Post");

                if (!savedId) {
                    throw new Error("Database save failed (Validation or Network).");
                }

                console.log("Saved successfully, ID:", savedId);
            } else {
                console.warn("No content generated");
                alert("AI returned no content. This happens occasionally. Please try again.");
            }
        } catch (e: any) {
            console.error("Follow-up Error:", e);
            alert("Error: " + (e.message || "Something went wrong"));
        } finally {
            setGeneratingFollowUpId(null);
        }
    };

    const groupedPosts = getGroupedPosts();
    const groupKeys = Object.keys(groupedPosts);
    const lockedCount = posts.filter(p => p.isLocked).length;

    if (loading) return <div className="flex justify-center h-64 items-center text-gray-500 gap-2"><Loader /> Loading Vault...</div>;

    return (
        <div className="max-w-5xl mx-auto pb-20 animate-in fade-in">

            {/* HEADER */}
            <div className="bg-[#161b22] p-6 rounded-2xl border border-gray-800 mb-8 shadow-lg">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                            <Archive className="text-blue-500" /> Content Vault
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">Your saved masterpieces.</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 text-xs font-bold text-gray-400 bg-black/30 px-3 py-1.5 rounded-lg border border-gray-700">
                            <Database size={14} /> {posts.length} Saved
                        </div>

                        {/* BUTTON: TOGGLE LOCKED VIEW */}
                        <button
                            onClick={() => setShowLockedOnly(!showLockedOnly)}
                            className={`flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-lg border transition ${showLockedOnly
                                ? 'bg-yellow-500 text-black border-yellow-600 shadow-lg shadow-yellow-500/20'
                                : 'text-yellow-500 bg-yellow-900/10 border-yellow-700/30 hover:bg-yellow-900/30'
                                }`}
                        >
                            {showLockedOnly ? <Lock size={14} fill="currentColor" /> : <ShieldCheck size={14} />}
                            {showLockedOnly ? 'Showing Locked' : `${lockedCount} Locked`}
                        </button>

                        {posts.length > 0 && (
                            <button onClick={handleDeleteAll} className="flex items-center gap-2 text-xs font-bold text-red-400 bg-red-900/10 px-3 py-1.5 rounded-lg border border-red-900/30 hover:bg-red-900/30 transition">
                                <Trash2 size={14} /> Clear List
                            </button>
                        )}
                    </div>
                </div>

                {/* TABS & SEARCH */}
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex bg-black/30 p-1 rounded-lg border border-gray-700 overflow-x-auto no-scrollbar">
                        {['all', 'single', 'campaign', 'remix'].map((t) => (
                            <button
                                key={t}
                                onClick={() => setFilterType(t as any)}
                                className={`px-4 py-1.5 text-xs font-bold rounded-md capitalize transition whitespace-nowrap ${filterType === t ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}
                            >
                                {t}
                            </button>
                        ))}
                    </div>
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                        <input type="text" placeholder="Search content..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-[#0f1115] border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:border-blue-500 outline-none" />
                    </div>
                </div>
            </div>

            {/* LISTA POSTARI */}
            {groupKeys.length > 0 ? (
                <div className="space-y-8">
                    {groupKeys.map(dateLabel => {
                        // 1. Identificam Parent Posts (cele care nu au parentId sau parentId nu e in lista curenta)
                        const todaysPosts = groupedPosts[dateLabel];
                        const allIds = new Set(todaysPosts.map(p => p.id));

                        const rootPosts = todaysPosts.filter(p => !p.parentId || !allIds.has(p.parentId));

                        // 2. Mapare Children pentru randare usoara
                        const childrenMap: Record<string, Post[]> = {};
                        todaysPosts.filter(p => p.parentId && allIds.has(p.parentId)).forEach(p => {
                            if (!childrenMap[p.parentId!]) childrenMap[p.parentId!] = [];
                            childrenMap[p.parentId!].push(p);
                        });

                        return (
                            <div key={dateLabel}>
                                <div className="flex items-center gap-4 mb-4">
                                    <h3 className="text-lg font-bold text-gray-300">{dateLabel}</h3>
                                    <div className="h-px bg-gray-800 flex-1"></div>
                                </div>
                                <div className="grid grid-cols-1 gap-6">
                                    {rootPosts.map(post => {
                                        const isGeneratingThis = generatingFollowUpId === post.id;

                                        return (
                                            <div key={post.id} className="flex flex-col gap-4">
                                                {/* PARENT POST */}
                                                <div className={`transition-all duration-500 ease-in-out ${isGeneratingThis ? 'scale-95 opacity-80' : ''}`}>
                                                    <PostCard
                                                        post={post}
                                                        isRefining={false}
                                                        onGenerateImage={openImageModal}
                                                        onAdaptPost={() => { }}
                                                        onRefinePost={() => { }}
                                                        onDelete={handleDelete}
                                                        onToggleLock={handleToggleLock}
                                                        onManualEdit={handleUpdateContent}
                                                        onFollowUp={handleFollowUp}
                                                        onNavigateToCalendar={onNavigateToCalendar}
                                                    />
                                                </div>

                                                {/* CHILDREN (FOLLOW-UPS) */}
                                                {childrenMap[post.id]?.map(childPost => (
                                                    <div key={childPost.id} className="pl-6 md:pl-12 relative animate-in fade-in slide-in-from-top-2">
                                                        {/* Connector Line */}
                                                        <div className="absolute left-0 top-[-20px] bottom-1/2 w-6 border-l-2 border-b-2 border-gray-700 rounded-bl-2xl"></div>

                                                        <div className="relative border-2 border-cyan-500/30 rounded-2xl overflow-hidden shadow-lg shadow-cyan-900/10 hover:border-cyan-500/60 transition-colors">
                                                            <div className="absolute top-0 left-0 bg-cyan-900/40 text-cyan-200 text-[10px] font-bold px-2 py-0.5 rounded-br-lg z-10 border-r border-b border-cyan-500/30">
                                                                Follow-up
                                                            </div>
                                                            <PostCard
                                                                post={childPost}
                                                                isRefining={false}
                                                                onGenerateImage={openImageModal}
                                                                onAdaptPost={() => { }}
                                                                onRefinePost={() => { }}
                                                                onDelete={handleDelete}
                                                                onToggleLock={handleToggleLock}
                                                                onManualEdit={handleUpdateContent}
                                                                onFollowUp={handleFollowUp}
                                                                onNavigateToCalendar={onNavigateToCalendar}
                                                            />
                                                        </div>
                                                    </div>
                                                ))}

                                                {/* GENERATING SKELETON (SHOWN WHEN GENERATING FOLLOW UP) */}
                                                {isGeneratingThis && (
                                                    <div className="pl-6 md:pl-12 relative animate-in zoom-in fade-in duration-500">
                                                        {/* Connector Line */}
                                                        <div className="absolute left-0 top-[-20px] bottom-1/2 w-6 border-l-2 border-b-2 border-cyan-500/50 rounded-bl-2xl"></div>

                                                        <div className="relative border-2 border-cyan-500/30 border-dashed rounded-2xl overflow-hidden bg-[#161b22]/50 p-6 flex flex-col items-center justify-center gap-3 min-h-[150px]">
                                                            <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
                                                            <p className="text-cyan-400 font-bold text-sm animate-pulse">Drafting Part 2...</p>
                                                            <p className="text-xs text-gray-500">Analyzing style & continuity</p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="text-center py-24 border-2 border-dashed border-gray-800 rounded-2xl bg-[#161b22]/30">
                    <Ghost className="text-gray-600 mx-auto mb-4" size={48} />
                    <h3 className="text-xl font-bold text-gray-300 mb-2">No posts found</h3>
                    {showLockedOnly && <p className="text-gray-500">Try turning off the "Locked" filter.</p>}
                </div>
            )}

            {isImageModalOpen && <ImageCreationModal onClose={() => setIsImageModalOpen(false)} onSelectImage={handleImageSelected} initialPrompt={activePrompt} />}
        </div>
    );
}
