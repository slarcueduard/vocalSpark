import React, { useState } from 'react';
import {
    Copy, Share2, Trash2, Calendar, Check,
    Lock, Unlock, ChevronDown, ChevronUp, Image as ImageIcon, Sparkles,
    Linkedin, Twitter, Instagram, Facebook, Wand2, MessageCircle, Hash, Smile,
    ArrowRightCircle, MoveRight
} from 'lucide-react';
import { Post, Platform, RefinementType } from '../types';

interface PostCardProps {
    post: Post;
    isRefining?: boolean;
    onGenerateImage: (id: string, content: string) => void;
    onAdaptPost: (id: string, platform: Platform, content: string) => void;
    onRefinePost: (id: string, type: RefinementType, content: string) => void;
    onDelete: (id: string) => void;
    onToggleLock: (id: string) => void;
    onManualEdit: (id: string, newContent: string) => void;
    onSchedule?: (id: string, date: Date) => void;
    onMarkPublished?: (id: string) => void;
    onFollowUp?: (id: string, content: string) => void;
}

export function PostCard({
    post,
    isRefining,
    onGenerateImage,
    onAdaptPost,
    onRefinePost,
    onDelete,
    onToggleLock,
    onManualEdit,
    onSchedule,
    onFollowUp
}: PostCardProps) {

    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(post.content);
    const [isExpanded, setIsExpanded] = useState(false);
    const [copied, setCopied] = useState(false);
    const [showSchedule, setShowSchedule] = useState(false);
    const [dateInput, setDateInput] = useState('');

    // State pentru meniul Magic
    const [showMagicMenu, setShowMagicMenu] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(post.content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Social Spark Post',
                    text: post.content,
                    url: post.imageUrl || ''
                });
            } catch (err) { console.log('Share canceled'); }
        } else {
            handleCopy();
            alert("Content copied to clipboard!");
        }
    };

    const handleSaveEdit = () => {
        onManualEdit(post.id, editContent);
        setIsEditing(false);
    };

    const contentPreview = isExpanded ? post.content : post.content.slice(0, 300) + (post.content.length > 300 ? '...' : '');

    // --- TAGGING LOGIC ---
    let badgeLabel = 'SINGLE POST';
    let badgeColor = 'bg-blue-900/30 text-blue-400 border-blue-800';

    if (post.generationType === 'campaign') {
        badgeLabel = 'CAMPAIGN';
        badgeColor = 'bg-purple-900/30 text-purple-400 border-purple-800';
    } else if (post.generationType === 'remix') {
        badgeLabel = 'REMIX';
        badgeColor = 'bg-green-900/30 text-green-400 border-green-800';
    }

    // Platform Icons Helper
    const PlatformIcon = ({ p }: { p: string }) => {
        switch (p) {
            case 'LinkedIn': return <Linkedin size={14} />;
            case 'X (Twitter)': return <Twitter size={14} />;
            case 'Instagram': return <Instagram size={14} />;
            case 'Facebook': return <Facebook size={14} />;
            default: return <Share2 size={14} />;
        }
    };

    return (
        <div className={`bg-[#161b22] border rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-2xl ${post.isLocked ? 'border-yellow-500/50 shadow-yellow-900/10' : 'border-gray-800 hover:border-gray-600'}`}>

            {/* HEADER */}
            <div className="flex items-center justify-between p-4 border-b border-gray-800 bg-[#0f1115]/50">
                <div className="flex items-center gap-3">
                    {/* Tag Tip Generare */}
                    <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider border ${badgeColor}`}>
                        {badgeLabel}
                    </span>

                    {/* Platform Tag */}
                    {post.platform && post.platform !== 'Generic' && (
                        <span className="text-[10px] text-gray-400 font-mono uppercase bg-gray-800/50 px-2 flex items-center gap-1 py-1 rounded border border-gray-700">
                            <PlatformIcon p={post.platform} /> {post.platform}
                        </span>
                    )}

                    {post.scheduledDate && (
                        <span className="text-[10px] flex items-center gap-1 text-green-400 border border-green-900/30 bg-green-900/10 px-2 py-1 rounded">
                            <Calendar size={10} /> {new Date(post.scheduledDate).toLocaleDateString()}
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    {/* FOLLOW UP BUTTON (NEW) */}
                    {onFollowUp && (
                        <button
                            onClick={() => onFollowUp(post.id, post.content)}
                            className="p-1.5 rounded-lg text-blue-400 hover:bg-blue-400/10 transition flex items-center gap-1"
                            title="Generate Follow-up Post"
                        >
                            <ArrowRightCircle size={16} />
                            <span className="text-xs font-bold hidden md:inline">Follow-up</span>
                        </button>
                    )}

                    <div className="w-px h-4 bg-gray-800 mx-1"></div>

                    <button
                        onClick={() => onToggleLock(post.id)}
                        className={`p-1.5 rounded-lg transition ${post.isLocked ? 'text-yellow-400 hover:bg-yellow-400/10' : 'text-gray-600 hover:text-gray-400'}`}
                        title={post.isLocked ? "Unlock Post" : "Lock Post (Prevent Deletion)"}
                    >
                        {post.isLocked ? <Lock size={14} /> : <Unlock size={14} />}
                    </button>
                    <button
                        onClick={() => onDelete(post.id)}
                        className="p-1.5 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-400/10 transition"
                        title="Delete"
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            </div>

            <div className="flex flex-col md:flex-row">

                {/* IMAGE SECTION */}
                <div className="w-full md:w-1/3 min-h-[250px] bg-[#0a0c10] border-b md:border-b-0 md:border-r border-gray-800 flex items-center justify-center relative group overflow-hidden">
                    {post.imageUrl ? (
                        <>
                            <img
                                src={post.imageUrl}
                                alt="Post visual"
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all duration-300 gap-2">
                                <button
                                    onClick={() => onGenerateImage(post.id, post.imagePrompt || post.content)}
                                    className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-all"
                                >
                                    <Sparkles size={14} /> Regenerate
                                </button>
                            </div>
                        </>
                    ) : (
                        <button
                            onClick={() => onGenerateImage(post.id, post.imagePrompt || post.content)}
                            className="flex flex-col items-center gap-3 text-gray-600 hover:text-blue-400 transition group/btn"
                        >
                            <div className="p-4 bg-[#161b22] rounded-2xl border border-gray-800 group-hover/btn:border-blue-500/50 group-hover/btn:bg-blue-500/10 transition-all">
                                <ImageIcon size={24} />
                            </div>
                            <span className="text-xs font-bold uppercase tracking-wider">Create Visual</span>
                        </button>
                    )}
                </div>

                {/* CONTENT SECTION */}
                <div className="flex-1 p-5 flex flex-col">

                    {/* Text Body */}
                    <div className="flex-1 mb-4">
                        {isEditing ? (
                            <textarea
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                className="w-full h-48 bg-[#0a0c10] border border-gray-700 rounded-lg p-3 text-sm text-gray-300 focus:border-blue-500 outline-none resize-none font-sans leading-relaxed"
                            />
                        ) : (
                            <div className="prose prose-invert max-w-none">
                                <p className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed font-light">
                                    {contentPreview}
                                </p>
                                {post.content.length > 300 && (
                                    <button
                                        onClick={() => setIsExpanded(!isExpanded)}
                                        className="text-xs text-blue-400 hover:text-blue-300 mt-2 flex items-center gap-1 font-bold"
                                    >
                                        {isExpanded ? <>Show Less <ChevronUp size={12} /></> : <>Read More <ChevronDown size={12} /></>}
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    {/* === ACTION BAR === */}

                    {/* MAGIC MENU (EXPANDABLE) */}
                    {showMagicMenu && !isEditing && (
                        <div className="mb-4 p-3 bg-[#1c1c2e] rounded-xl border border-purple-500/30 animate-in fade-in slide-in-from-bottom-2 grid grid-cols-2 md:grid-cols-4 gap-2">
                            {/* Emojis */}
                            <button onClick={() => onRefinePost(post.id, 'addEmojis', post.content)} className="flex items-center justify-center gap-2 p-2 rounded hover:bg-white/5 text-[10px] text-gray-400 hover:text-purple-400 transition">
                                <Smile size={12} /> Add Emojis
                            </button>
                            {/* Hashtags */}
                            <button onClick={() => onRefinePost(post.id, 'addHashtags', post.content)} className="flex items-center justify-center gap-2 p-2 rounded hover:bg-white/5 text-[10px] text-gray-400 hover:text-blue-400 transition">
                                <Hash size={12} /> Hashtags
                            </button>
                            {/* Question */}
                            <button onClick={() => onRefinePost(post.id, 'askQuestion', post.content)} className="flex items-center justify-center gap-2 p-2 rounded hover:bg-white/5 text-[10px] text-gray-400 hover:text-green-400 transition">
                                <MessageCircle size={12} /> Ask Question
                            </button>
                            {/* Shorter */}
                            <button onClick={() => onRefinePost(post.id, 'makeShorter', post.content)} className="flex items-center justify-center gap-2 p-2 rounded hover:bg-white/5 text-[10px] text-gray-400 hover:text-orange-400 transition">
                                <ChevronDown size={12} /> Shorten
                            </button>
                        </div>
                    )}

                    <div className="flex flex-col gap-3 pt-4 border-t border-gray-800/50">

                        {isEditing ? (
                            <div className="flex gap-2 w-full">
                                <button onClick={handleSaveEdit} className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg text-xs font-bold">Save Changes</button>
                                <button onClick={() => setIsEditing(false)} className="px-4 py-2 bg-gray-800 text-gray-400 rounded-lg text-xs font-bold">Cancel</button>
                            </div>
                        ) : (
                            <div className="flex flex-wrap items-center justify-between gap-y-3">
                                {/* Left: Actions */}
                                <div className="flex items-center gap-2">
                                    {/* Share Button (NEW) */}
                                    <button
                                        onClick={handleShare}
                                        className="flex items-center gap-2 px-3 py-2 bg-[#21262d] border border-gray-700 hover:border-gray-500 rounded-lg text-xs font-bold text-gray-300 transition hover:text-white"
                                        title="Share / Copy to Clipboard"
                                    >
                                        <Share2 size={14} /> Share
                                    </button>

                                    {/* Magic Button (NEW) */}
                                    <button
                                        onClick={() => setShowMagicMenu(!showMagicMenu)}
                                        className={`flex items-center gap-2 px-3 py-2 border rounded-lg text-xs font-bold transition ${showMagicMenu ? 'bg-purple-900/20 text-purple-400 border-purple-500/50' : 'bg-transparent text-gray-400 border-gray-700 hover:border-purple-500/50 hover:text-purple-400'}`}
                                        title="AI Refinements"
                                    >
                                        <Wand2 size={14} /> Magic
                                    </button>
                                </div>

                                {/* Right: Adapt & Schedule */}
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] text-gray-600 font-bold uppercase mr-1">Adapt to:</span>
                                    <div className="flex gap-1">
                                        <button onClick={() => onAdaptPost(post.id, 'LinkedIn' as any, post.content)} className="p-1.5 bg-gray-800/50 hover:bg-[#0077b5]/20 hover:text-[#0077b5] rounded-md text-gray-500 transition border border-transparent hover:border-[#0077b5]/50" title="LinkedIn"><Linkedin size={14} /></button>
                                        <button onClick={() => onAdaptPost(post.id, 'X (Twitter)' as any, post.content)} className="p-1.5 bg-gray-800/50 hover:bg-white/10 hover:text-white rounded-md text-gray-500 transition border border-transparent hover:border-gray-500" title="X (Twitter)"><Twitter size={14} /></button>
                                        <button onClick={() => onAdaptPost(post.id, 'Instagram' as any, post.content)} className="p-1.5 bg-gray-800/50 hover:bg-pink-500/20 hover:text-pink-400 rounded-md text-gray-500 transition border border-transparent hover:border-pink-500/50" title="Instagram"><Instagram size={14} /></button>
                                    </div>

                                    {/* Schedule */}
                                    <div className="h-4 w-px bg-gray-800 mx-1"></div>

                                    {showSchedule ? (
                                        <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-2 bg-[#0a0c10] border border-gray-700 rounded-lg p-1">
                                            <input
                                                type="date"
                                                className="bg-transparent text-white text-[10px] outline-none"
                                                onChange={(e) => setDateInput(e.target.value)}
                                            />
                                            <button
                                                onClick={() => {
                                                    if (dateInput && onSchedule) {
                                                        onSchedule(post.id, new Date(dateInput));
                                                        setShowSchedule(false);
                                                    }
                                                }}
                                                className="text-green-400 hover:text-white"
                                            >
                                                <Check size={12} />
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => setShowSchedule(true)}
                                            className="p-2 text-gray-400 hover:text-blue-400 transition hover:bg-blue-900/10 rounded-lg"
                                            title="Schedule Post"
                                        >
                                            <Calendar size={16} />
                                        </button>
                                    )}

                                    <button onClick={() => setIsEditing(true)} className="md:hidden text-xs text-gray-500 underline ml-2">Edit</button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
