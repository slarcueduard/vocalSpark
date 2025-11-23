import React, { useState, useRef, useEffect } from 'react';
import { Post, Platform, RefinementType } from '../types';
import { 
    InstagramIcon, 
    FacebookIcon, 
    TikTokIcon, 
    XIcon, 
    LinkedInIcon, 
    CheckIcon, 
    ClipboardIcon, 
    TrashIcon, 
    MagicWandIcon,
    DownloadIcon,
    ImageIcon
} from './Icons';
import { Loader } from './Loader';

interface PostCardProps {
  post: Post;
  isRefining: boolean;
  onGenerateImage: (postId: string, content: string) => void;
  onAdaptPost: (postId: string, platform: Platform, content: string) => void;
  onRefinePost: (postId: string, type: RefinementType, content: string) => void;
  onDelete: (postId: string) => void;
  onToggleLock: (postId: string) => void;
}

export const PostCard: React.FC<PostCardProps> = ({ 
    post, isRefining, onGenerateImage, onAdaptPost, onRefinePost, onDelete, onToggleLock 
}) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('Original');
  
  // State pentru meniul de Refine (cel din poză)
  const [showRefineMenu, setShowRefineMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Închide meniul dacă dai click în afară
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowRefineMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCopy = () => {
    const contentToCopy = activeTab === 'Original' ? post.content : post.adaptedContent[activeTab as Platform] || post.content;
    navigator.clipboard.writeText(contentToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRefineClick = (type: RefinementType) => {
      const contentToRefine = activeTab === 'Original' ? post.content : (post.adaptedContent[activeTab as Platform] || post.content);
      onRefinePost(post.id, type, contentToRefine);
      setShowRefineMenu(false);
  };

  const displayContent = activeTab === 'Original' ? post.content : (post.adaptedContent[activeTab as Platform] || "Loading adaptation...");

  const platforms = [
      { id: Platform.Instagram, icon: InstagramIcon },
      { id: Platform.TikTok, icon: TikTokIcon },
      { id: Platform.Facebook, icon: FacebookIcon },
      { id: Platform.X, icon: XIcon },
      { id: Platform.LinkedIn, icon: LinkedInIcon },
  ];

  return (
    <div className="bg-brand-bg-light border border-gray-700 rounded-2xl overflow-hidden hover:border-brand-primary/50 transition shadow-lg flex flex-col md:flex-row">
        
        {/* A. IMAGINEA */}
        <div className="w-full md:w-1/3 bg-black relative group min-h-[250px] border-r border-gray-800">
            {post.isGeneratingImage ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-brand-primary animate-pulse">
                    <ImageIcon className="w-10 h-10 mb-2" />
                    <span className="text-xs font-bold uppercase tracking-widest">Designing...</span>
                </div>
            ) : post.imageUrl ? (
                <>
                    <img src={post.imageUrl} alt="Post visual" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-3 backdrop-blur-sm">
                        <button 
                            onClick={() => window.open(post.imageUrl!, '_blank')}
                            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white text-xs font-bold border border-white/20 transition"
                        >
                            <DownloadIcon className="w-4 h-4" /> Download
                        </button>
                    </div>
                </>
            ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-600 p-6 text-center">
                    <ImageIcon className="w-12 h-12 mb-3 opacity-30" />
                    <button 
                        onClick={() => onGenerateImage(post.id, post.content)}
                        className="text-xs border border-gray-600 px-4 py-2 rounded-lg hover:border-brand-primary hover:text-brand-primary hover:bg-brand-primary/5 transition"
                    >
                        Generate Visual
                    </button>
                </div>
            )}
        </div>

        {/* B. CONȚINUTUL */}
        <div className="flex-1 p-6 flex flex-col">
            
            {/* Content Header */}
            <div className="flex justify-between items-center mb-3">
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500 bg-gray-800 px-2 py-1 rounded">
                    {activeTab === 'Original' ? 'Base Content' : `Adapted for ${activeTab}`}
                </span>
                <button onClick={() => onDelete(post.id)} className="text-gray-600 hover:text-red-500 transition p-1">
                    <TrashIcon className="w-4 h-4" />
                </button>
            </div>
            
            {/* Text Body */}
            <div className="flex-1 mb-6 relative">
                {isRefining ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-brand-bg-light/50 backdrop-blur-sm z-10">
                        <Loader size="sm" /> 
                        <span className="text-xs text-brand-secondary mt-2 font-medium">Polishing text...</span>
                    </div>
                ) : null}
                
                <p className="text-brand-text text-sm leading-relaxed whitespace-pre-wrap min-h-[100px]">
                    {displayContent}
                </p>
            </div>

            {/* Footer Controls */}
            <div className="border-t border-gray-800 pt-4 space-y-5">
                
                {/* 1. Platform Toggles */}
                <div className="flex flex-col items-center">
                    <span className="text-[10px] text-gray-500 font-bold mb-2 uppercase tracking-wider">Adapt For</span>
                    <div className="flex gap-2">
                        {platforms.map((p) => {
                            const Icon = p.icon;
                            const isActive = activeTab === p.id;
                            const hasContent = !!post.adaptedContent[p.id];

                            return (
                                <button
                                    key={p.id}
                                    onClick={() => {
                                        setActiveTab(p.id);
                                        if (!hasContent) onAdaptPost(post.id, p.id, post.content);
                                    }}
                                    className={`w-9 h-9 rounded-full flex items-center justify-center border transition-all duration-300 ${
                                        isActive 
                                        ? 'bg-brand-primary text-black border-brand-primary scale-110 shadow-[0_0_15px_rgba(0,255,148,0.4)]' 
                                        : hasContent 
                                            ? 'bg-gray-800 text-gray-300 border-gray-600 hover:border-gray-400'
                                            : 'bg-transparent text-gray-600 border-gray-700 hover:border-gray-500 hover:text-gray-400'
                                    }`}
                                    title={p.id}
                                >
                                    <Icon className="w-4 h-4" />
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* 2. Action Buttons Row */}
                <div className="flex gap-3">
                    {/* Copy Button */}
                    <button 
                        onClick={handleCopy}
                        className="flex-1 py-2.5 bg-gray-800 hover:bg-gray-750 border border-gray-700 hover:border-gray-600 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-2 transition-all"
                    >
                        {copied ? <CheckIcon className="w-4 h-4 text-green-400" /> : <ClipboardIcon className="w-4 h-4" />}
                        {copied ? 'Copied!' : 'Copy Text'}
                    </button>
                    
                    {/* Download Image (dacă există) */}
                    {post.imageUrl && (
                        <button 
                            onClick={() => window.open(post.imageUrl!, '_blank')}
                            className="flex-1 py-2.5 bg-gray-800 hover:bg-gray-750 border border-gray-700 hover:border-gray-600 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-2 transition-all"
                        >
                            <DownloadIcon className="w-4 h-4" />
                            Download
                        </button>
                    )}

                    {/* MAGIC REFINE MENU (DropDown) */}
                    <div className="relative" ref={menuRef}>
                        <button 
                            onClick={() => setShowRefineMenu(!showRefineMenu)}
                            className={`h-full aspect-square border border-gray-600 rounded-xl flex items-center justify-center text-gray-400 transition-all ${showRefineMenu ? 'bg-brand-secondary text-white border-brand-secondary shadow-lg shadow-brand-secondary/20' : 'hover:border-brand-secondary hover:text-brand-secondary'}`}
                            title="Refine with AI"
                        >
                            <MagicWandIcon className="w-5 h-5" />
                        </button>

                        {/* The Pop-up Menu */}
                        {showRefineMenu && (
                            <div className="absolute bottom-full right-0 mb-2 w-48 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl overflow-hidden z-20 animate-fadeIn origin-bottom-right">
                                <div className="p-1">
                                    <button onClick={() => handleRefineClick('makeShorter')} className="w-full text-left px-3 py-2 text-xs text-gray-300 hover:bg-gray-700 hover:text-white rounded-lg transition">
                                        Make it Shorter
                                    </button>
                                    <button onClick={() => handleRefineClick('addEmojis')} className="w-full text-left px-3 py-2 text-xs text-gray-300 hover:bg-gray-700 hover:text-white rounded-lg transition">
                                        Add Emojis ✨
                                    </button>
                                    <button onClick={() => handleRefineClick('askQuestion')} className="w-full text-left px-3 py-2 text-xs text-gray-300 hover:bg-gray-700 hover:text-white rounded-lg transition">
                                        Ask a Question
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};
