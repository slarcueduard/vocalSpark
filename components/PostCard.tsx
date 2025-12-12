import React, { useState } from 'react';
import {
    Copy, Share2, Trash2, Calendar, Check,
    Lock, Unlock, ChevronDown, ChevronUp, Image as ImageIcon, Sparkles,
    Linkedin, Twitter, Instagram, Facebook, Wand2, MessageCircle, Hash, Smile,
    ArrowRightCircle, MoveRight, ArrowUpRight
} from 'lucide-react';
import { Post, Platform, RefinementType } from '../types';

interface PostCardProps {
    post: Post;
    isRefining?: boolean;
    onGenerateImage: (id: string, content: string) => void | Promise<void>;
    onAdaptPost: (id: string, platform: Platform, content: string) => void | Promise<void>;
    onRefinePost: (id: string, type: RefinementType, content: string) => void | Promise<void>;
    onDelete: (id: string) => void | Promise<void>;
    onToggleLock: (id: string) => void | Promise<void>;
    onManualEdit: (id: string, newContent: string) => void | Promise<void>;
    onSchedule?: (id: string, date: Date) => void | Promise<void>;
    onMarkPublished?: (id: string) => void | Promise<void>;
    onFollowUp?: (id: string, content: string) => void | Promise<void>;
    onNavigateToCalendar?: () => void;
    brandProfile?: any; // Add brandProfile prop
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
    onFollowUp,
    onNavigateToCalendar,
    brandProfile
}: PostCardProps) {



    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(post.content);
    const [isExpanded, setIsExpanded] = useState(false);
    const [copied, setCopied] = useState(false);
    const [showSchedule, setShowSchedule] = useState(false);
    const [dateInput, setDateInput] = useState('');

    // State pentru meniul Magic
    const [showMagicMenu, setShowMagicMenu] = useState(false);
    const [magicLoading, setMagicLoading] = useState<string | null>(null); // Track which magic option is loading
    const [showUrlSubmenu, setShowUrlSubmenu] = useState(false);

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
            // alert("Content copied to clipboard!"); // Removed in favor of UI feedback
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

                    {post.linkedEventId && (
                        <button
                            onClick={() => onNavigateToCalendar && onNavigateToCalendar()}
                            className={`text-[10px] flex items-center gap-1 text-orange-400 border border-orange-900/30 bg-orange-900/10 px-2 py-1 rounded transition-all hover:bg-orange-900/30 hover:border-orange-500/50 hover:shadow-lg hover:shadow-orange-900/20 active:scale-95 ${onNavigateToCalendar ? 'cursor-pointer' : 'cursor-default'}`}
                            title="View in Calendar"
                        >
                            <Calendar size={10} />
                            <span className="font-bold">{post.linkedEventTitle || "Planned Event"}</span>
                            {post.scheduledDate && <span className="opacity-75">({new Date(post.scheduledDate).toLocaleDateString()})</span>}
                            {onNavigateToCalendar && <ArrowUpRight size={10} className="ml-0.5 opacity-60" />}
                        </button>
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
                                <a
                                    href={post.imageUrl}
                                    download="social-spark-image.png"
                                    className="bg-green-600 hover:bg-green-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-all"
                                >
                                    <ImageIcon size={14} /> Download
                                </a>
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

                    {/* === MAGIC MENU (REDESIGNED) === */}
                    {showMagicMenu && !isEditing && (
                        <div className="mb-4 p-4 bg-gradient-to-br from-[#1c1c2e] to-[#161b22] rounded-2xl border border-purple-500/30 shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-300">
                            <div className="flex items-center justify-between mb-3">
                                <h4 className="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-2">
                                    <Wand2 size={14} className="animate-pulse" />
                                    Magic Tools
                                </h4>
                                <button
                                    onClick={() => setShowMagicMenu(false)}
                                    className="text-gray-500 hover:text-white transition"
                                >
                                    <ChevronUp size={14} />
                                </button>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                {/* Add Emojis */}
                                <button
                                    onClick={async () => {
                                        setMagicLoading('emojis');
                                        await onRefinePost(post.id, 'addEmojis', post.content);
                                        setMagicLoading(null);
                                    }}
                                    disabled={magicLoading !== null}
                                    className="group relative bg-[#0f1115] hover:bg-purple-900/20 border border-gray-800 hover:border-purple-500/50 rounded-xl p-3 transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed"
                                >
                                    {magicLoading === 'emojis' ? (
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                                            <span className="text-[10px] text-gray-400">Processing...</span>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="flex items-center justify-center mb-2">
                                                <div className="p-2 bg-purple-500/20 rounded-lg group-hover:scale-110 transition">
                                                    <Smile size={16} className="text-purple-400" />
                                                </div>
                                            </div>
                                            <p className="text-[11px] font-bold text-white mb-0.5">Add Emojis</p>
                                            <p className="text-[9px] text-gray-500">Make it fun</p>
                                        </>
                                    )}
                                </button>

                                {/* Add Hashtags */}
                                <button
                                    onClick={async () => {
                                        setMagicLoading('hashtags');
                                        await onRefinePost(post.id, 'addHashtags', post.content);
                                        setMagicLoading(null);
                                    }}
                                    disabled={magicLoading !== null}
                                    className="group relative bg-[#0f1115] hover:bg-blue-900/20 border border-gray-800 hover:border-blue-500/50 rounded-xl p-3 transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed"
                                >
                                    {magicLoading === 'hashtags' ? (
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                            <span className="text-[10px] text-gray-400">Processing...</span>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="flex items-center justify-center mb-2">
                                                <div className="p-2 bg-blue-500/20 rounded-lg group-hover:scale-110 transition">
                                                    <Hash size={16} className="text-blue-400" />
                                                </div>
                                            </div>
                                            <p className="text-[11px] font-bold text-white mb-0.5">Add Hashtags</p>
                                            <p className="text-[9px] text-gray-500">4 new tags</p>
                                        </>
                                    )}
                                </button>

                                {/* Ask Question */}
                                <button
                                    onClick={async () => {
                                        setMagicLoading('question');
                                        await onRefinePost(post.id, 'askQuestion', post.content);
                                        setMagicLoading(null);
                                    }}
                                    disabled={magicLoading !== null}
                                    className="group relative bg-[#0f1115] hover:bg-green-900/20 border border-gray-800 hover:border-green-500/50 rounded-xl p-3 transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed"
                                >
                                    {magicLoading === 'question' ? (
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="w-5 h-5 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                                            <span className="text-[10px] text-gray-400">Processing...</span>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="flex items-center justify-center mb-2">
                                                <div className="p-2 bg-green-500/20 rounded-lg group-hover:scale-110 transition">
                                                    <MessageCircle size={16} className="text-green-400" />
                                                </div>
                                            </div>
                                            <p className="text-[11px] font-bold text-white mb-0.5">Ask Question</p>
                                            <p className="text-[9px] text-gray-500">Boost engagement</p>
                                        </>
                                    )}
                                </button>

                                {/* Shorten */}
                                <button
                                    onClick={async () => {
                                        setMagicLoading('shorten');
                                        await onRefinePost(post.id, 'makeShorter', post.content);
                                        setMagicLoading(null);
                                    }}
                                    disabled={magicLoading !== null}
                                    className="group relative bg-[#0f1115] hover:bg-orange-900/20 border border-gray-800 hover:border-orange-500/50 rounded-xl p-3 transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed"
                                >
                                    {magicLoading === 'shorten' ? (
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                                            <span className="text-[10px] text-gray-400">Processing...</span>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="flex items-center justify-center mb-2">
                                                <div className="p-2 bg-orange-500/20 rounded-lg group-hover:scale-110 transition">
                                                    <ChevronDown size={16} className="text-orange-400" />
                                                </div>
                                            </div>
                                            <p className="text-[11px] font-bold text-white mb-0.5">Shorten</p>
                                            <p className="text-[9px] text-gray-500">Keep voice</p>
                                        </>
                                    )}
                                </button>

                                {/* Add URL */}
                                {brandProfile?.links && brandProfile.links.filter((l: string) => l).length > 0 ? (
                                    <div className="relative col-span-2 md:col-span-1">
                                        <button
                                            onClick={() => setShowUrlSubmenu(!showUrlSubmenu)}
                                            disabled={magicLoading !== null}
                                            className="w-full group relative bg-[#0f1115] hover:bg-cyan-900/20 border border-gray-800 hover:border-cyan-500/50 rounded-xl p-3 transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed"
                                        >
                                            <div className="flex items-center justify-center mb-2">
                                                <div className="p-2 bg-cyan-500/20 rounded-lg group-hover:scale-110 transition">
                                                    <ArrowRightCircle size={16} className="text-cyan-400" />
                                                </div>
                                            </div>
                                            <p className="text-[11px] font-bold text-white mb-0.5">Add URL</p>
                                            <p className="text-[9px] text-gray-500">{brandProfile.links.filter((l: string) => l).length} saved</p>
                                        </button>

                                        {/* URL Submenu */}
                                        {showUrlSubmenu && (
                                            <div className="absolute bottom-full left-0 right-0 mb-2 bg-[#0a0c10] border border-cyan-500/30 rounded-xl p-2 shadow-2xl animate-in fade-in slide-in-from-bottom-2 z-10">
                                                <p className="text-[9px] text-gray-500 uppercase font-bold mb-2 px-2">Select URL to add:</p>
                                                {brandProfile.links.filter((l: string) => l).map((link: string, idx: number) => (
                                                    <button
                                                        key={idx}
                                                        onClick={() => {
                                                            const newContent = `${post.content}\n\n🔗 ${link}`;
                                                            onManualEdit(post.id, newContent);
                                                            setShowUrlSubmenu(false);
                                                            setShowMagicMenu(false);
                                                        }}
                                                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-cyan-900/20 text-[10px] text-white border border-transparent hover:border-cyan-500/30 transition mb-1 last:mb-0 truncate"
                                                    >
                                                        <span className="text-cyan-400 font-bold">Link #{idx + 1}:</span>
                                                        <span className="ml-2 text-gray-400">{link.length > 30 ? link.substring(0, 30) + '...' : link}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="col-span-2 md:col-span-1 bg-[#0f1115] border border-dashed border-gray-800 rounded-xl p-3 flex flex-col items-center justify-center opacity-50">
                                        <ArrowRightCircle size={16} className="text-gray-600 mb-1" />
                                        <p className="text-[9px] text-gray-600 text-center">No URLs saved</p>
                                    </div>
                                )}
                            </div>
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
                                    {/* Copy Text Button (NEW) */}
                                    <button
                                        onClick={handleCopy}
                                        className={`flex items-center gap-2 px-3 py-2 border rounded-lg text-xs font-bold transition ${copied
                                                ? 'bg-green-600 border-green-500 text-white'
                                                : 'bg-[#21262d] border-gray-700 hover:border-gray-500 text-gray-300 hover:text-white'
                                            }`}
                                        title="Copy Text to Clipboard"
                                    >
                                        {copied ? <Check size={14} /> : <Copy size={14} />}
                                        {copied ? 'Copied!' : 'Copy Text'}
                                    </button>

                                    {/* Share Button */}
                                    <button
                                        onClick={handleShare}
                                        className="flex items-center gap-2 px-3 py-2 border rounded-lg text-xs font-bold transition bg-[#21262d] border-gray-700 hover:border-gray-500 text-gray-300 hover:text-white"
                                        title="Share / Copy to Clipboard"
                                    >
                                        <Share2 size={14} />
                                        Share
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
