import React, { useState } from 'react';
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

  const handleCopy = () => {
    const contentToCopy = activeTab === 'Original' ? post.content : post.adaptedContent[activeTab as Platform] || post.content;
    navigator.clipboard.writeText(contentToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Funcție pentru a determina ce conținut afișăm (Original sau Adaptat)
  const displayContent = activeTab === 'Original' ? post.content : (post.adaptedContent[activeTab as Platform] || "Loading adaptation...");

  // Lista platformelor pentru butoane
  const platforms = [
      { id: Platform.Instagram, icon: InstagramIcon },
      { id: Platform.TikTok, icon: TikTokIcon },
      { id: Platform.Facebook, icon: FacebookIcon },
      { id: Platform.X, icon: XIcon },
      { id: Platform.LinkedIn, icon: LinkedInIcon },
  ];

  return (
    <div className="bg-brand-bg-light border border-gray-700 rounded-2xl overflow-hidden hover:border-brand-primary/50 transition shadow-lg flex flex-col md:flex-row">
        
        {/* A. IMAGINEA (Stânga pe Desktop, Sus pe Mobil) */}
        <div className="w-full md:w-1/3 bg-black relative group min-h-[250px]">
            {post.isGeneratingImage ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-brand-primary animate-pulse">
                    <ImageIcon className="w-10 h-10 mb-2" />
                    <span className="text-xs font-bold uppercase tracking-widest">Designing...</span>
                </div>
            ) : post.imageUrl ? (
                <>
                    <img src={post.imageUrl} alt="Post visual" className="w-full h-full object-cover" />
                    {/* Hover Actions pentru Imagine */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-3">
                        <button 
                            onClick={() => window.open(post.imageUrl!, '_blank')}
                            className="p-2 bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-md text-white transition"
                            title="Download / View"
                        >
                            <DownloadIcon className="w-5 h-5" />
                        </button>
                        <button 
                            onClick={() => onGenerateImage(post.id, post.content)}
                            className="p-2 bg-brand-primary hover:bg-brand-primary/80 rounded-full text-black transition"
                            title="Regenerate Image"
                        >
                            <MagicWandIcon className="w-5 h-5" />
                        </button>
                    </div>
                </>
            ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-600">
                    <ImageIcon className="w-10 h-10 mb-2 opacity-50" />
                    <button 
                        onClick={() => onGenerateImage(post.id, post.content)}
                        className="text-xs border border-gray-600 px-3 py-1.5 rounded-full hover:border-brand-primary hover:text-brand-primary transition"
                    >
                        Generate Image
                    </button>
                </div>
            )}
        </div>

        {/* B. CONȚINUTUL (Dreapta) */}
        <div className="flex-1 p-6 flex flex-col">
            
            {/* Text Content */}
            <div className="flex-1 mb-6">
                <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                        {activeTab === 'Original' ? 'Base Content' : `Adapted for ${activeTab}`}
                    </span>
                    <button onClick={() => onDelete(post.id)} className="text-gray-600 hover:text-red-500 transition">
                        <TrashIcon className="w-4 h-4" />
                    </button>
                </div>
                
                {isRefining ? (
                    <div className="py-4 flex items-center gap-2 text-brand-secondary">
                        <Loader size="sm" /> <span className="text-sm">Refining text...</span>
                    </div>
                ) : (
                    <p className="text-brand-text text-sm leading-relaxed whitespace-pre-wrap">
                        {displayContent}
                    </p>
                )}
            </div>

            <div className="border-t border-gray-800 pt-4 space-y-4">
                
                {/* 1. ADAPT FOR (Butoanele Rotunde) */}
                <div>
                    <p className="text-[10px] font-bold text-gray-500 uppercase mb-2 text-center">Adapt For</p>
                    <div className="flex justify-center gap-3">
                        {platforms.map((p) => {
                            const Icon = p.icon;
                            const isActive = activeTab === p.id;
                            const hasContent = !!post.adaptedContent[p.id];

                            return (
                                <button
                                    key={p.id}
                                    onClick={() => {
                                        setActiveTab(p.id);
                                        if (!hasContent) {
                                            onAdaptPost(post.id, p.id, post.content);
                                        }
                                    }}
                                    className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all duration-200 ${
                                        isActive 
                                        ? 'bg-brand-primary text-black border-brand-primary scale-110 shadow-[0_0_10px_rgba(0,255,148,0.3)]' 
                                        : hasContent 
                                            ? 'bg-gray-800 text-white border-gray-600 hover:border-gray-400'
                                            : 'bg-transparent text-gray-600 border-gray-700 hover:border-gray-500'
                                    }`}
                                    title={p.id}
                                >
                                    <Icon className="w-5 h-5" />
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* 2. ACTIONS (Copy, Download) */}
                <div className="flex gap-2 pt-2">
                    <button 
                        onClick={handleCopy}
                        className="flex-1 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-xs font-bold text-white flex items-center justify-center gap-2 transition"
                    >
                        {copied ? <CheckIcon className="w-4 h-4 text-green-400" /> : <ClipboardIcon className="w-4 h-4" />}
                        {copied ? 'Copied!' : 'Copy Text'}
                    </button>
                    
                    {/* Buton Refine rapid */}
                    <button 
                        onClick={() => onRefinePost(post.id, 'makeShorter', displayContent)}
                        className="px-3 py-2 border border-gray-700 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white text-xs transition"
                        title="Make Shorter"
                    >
                        Shorten
                    </button>
                </div>
            </div>
        </div>
    </div>
  );
};
