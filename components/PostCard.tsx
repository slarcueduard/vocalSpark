import React, { useState, useRef, useEffect } from 'react';
import { Post, Platform, RefinementType } from '../types';
import { 
    Instagram, Facebook, Linkedin, Twitter, Video, 
    Check, Copy, Trash2, Wand2, Download, 
    Image as ImageIcon, Share2, Smartphone, Lock, Unlock, Edit3, Save
} from 'lucide-react';
import { Loader } from './Loader';

interface PostCardProps {
  post: Post;
  isRefining: boolean;
  onGenerateImage: (postId: string, content: string) => void;
  onAdaptPost: (postId: string, platform: Platform, content: string) => void;
  onRefinePost: (postId: string, type: RefinementType, content: string) => void;
  onDelete: (postId: string) => void;
  onToggleLock: (postId: string) => void;
  onManualEdit?: (postId: string, newContent: string) => void; // Prop Nou
}

export const PostCard: React.FC<PostCardProps> = ({ 
    post, isRefining, onGenerateImage, onAdaptPost, onRefinePost, onDelete, onToggleLock, onManualEdit 
}) => {
  const [copied, setCopied] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('Original');
  const [isEditing, setIsEditing] = useState(false); // State pt Editare
  const [editContent, setEditContent] = useState(post.content);

  const [showRefineMenu, setShowRefineMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Sincronizare conținut editare
  useEffect(() => {
      setEditContent(post.content);
  }, [post.content]);

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

  const handleSaveEdit = () => {
      if (onManualEdit) {
          onManualEdit(post.id, editContent);
      }
      setIsEditing(false);
  };

  // ... (Restul funcțiilor handleNativeShare etc. rămân la fel) ...
  const handleNativeShare = async () => { /* Codul vechi pt share */ 
      const contentToShare = activeTab === 'Original' ? post.content : post.adaptedContent[activeTab as Platform] || post.content;
      if (!navigator.share) { handleCopy(); alert("Sharing not supported."); return; }
      setIsSharing(true);
      try {
          const shareData: any = { title: 'Post', text: contentToShare };
          if (post.imageUrl && !post.imageUrl.startsWith('http')) {
               const response = await fetch(post.imageUrl);
               const blob = await response.blob();
               const file = new File([blob], 'image.png', { type: 'image/png' });
               shareData.files = [file];
          }
          await navigator.share(shareData);
      } catch (e) {} finally { setIsSharing(false); }
  };

  const displayContent = activeTab === 'Original' ? post.content : (post.adaptedContent[activeTab as Platform] || "Loading adaptation...");
  const platforms = [
      { id: Platform.Instagram, icon: Instagram },
      { id: Platform.TikTok, icon: Video },
      { id: Platform.Facebook, icon: Facebook },
      { id: Platform.X, icon: Twitter },
      { id: Platform.LinkedIn, icon: Linkedin },
  ];

  return (
    <div className={`bg-[#161b22] border rounded-2xl overflow-hidden transition shadow-xl flex flex-col md:flex-row group ${post.isLocked ? 'border-yellow-500/30 shadow-yellow-900/10' : 'border-gray-800 hover:border-gray-600'}`}>
        
        {/* A. COLOANA IMAGINE */}
        <div className="w-full md:w-1/3 bg-black relative group min-h-[250px] border-b md:border-b-0 md:border-r border-gray-800 flex items-center justify-center">
            {post.isGeneratingImage ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-blue-500 animate-pulse bg-[#0f1115]">
                    <ImageIcon className="w-10 h-10 mb-2" />
                    <span className="text-xs font-bold uppercase tracking-widest">Designing...</span>
                </div>
            ) : post.imageUrl ? (
                <>
                    <img src={post.imageUrl} alt="Post visual" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex flex-col items-center justify-center gap-3 backdrop-blur-sm p-4">
                        <a href={post.imageUrl} download="social-spark.png" className="flex items-center gap-2 px-4 py-2 bg-white text-black hover:bg-gray-200 rounded-lg text-xs font-bold transition w-full justify-center">
                            <Download className="w-4 h-4" /> Download
                        </a>
                        {/* Dezactivăm Regenerarea în Istoric dacă vrem, sau o lăsăm */}
                        <button onClick={() => onGenerateImage(post.id, post.content)} className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white hover:bg-gray-700 rounded-lg text-xs font-bold border border-gray-600 transition w-full justify-center">
                            <ImageIcon className="w-4 h-4" /> Regenerate
                        </button>
                    </div>
                </>
            ) : (
                <div className="flex flex-col items-center justify-center text-gray-600 p-6 text-center w-full h-full bg-[#0f1115]">
                    <ImageIcon className="w-12 h-12 mb-3 opacity-20" />
                    <button onClick={() => onGenerateImage(post.id, post.content)} className="text-xs font-bold border border-gray-700 bg-gray-800/50 px-4 py-2.5 rounded-lg hover:border-blue-500 hover:text-blue-400 hover:bg-blue-500/10 transition flex items-center gap-2">
                        <Wand2 size={14} /> Create Visual
                    </button>
                </div>
            )}
        </div>

        {/* B. COLOANA CONȚINUT */}
        <div className="flex-1 p-6 flex flex-col">
            
            <div className="flex justify-between items-start mb-4">
                <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded border ${activeTab === 'Original' ? 'bg-gray-800 text-gray-400 border-gray-700' : 'bg-blue-900/20 text-blue-400 border-blue-500/30'}`}>
                    {activeTab === 'Original' ? 'Base Content' : `Adapted for ${activeTab}`}
                </span>
                
                <div className="flex gap-1">
                    {/* Buton LOCK */}
                    <button 
                        onClick={() => onToggleLock(post.id)} 
                        className={`p-2 transition rounded-lg ${post.isLocked ? 'text-yellow-400 bg-yellow-400/10' : 'text-gray-600 hover:text-yellow-500'}`} 
                        title={post.isLocked ? "Locked (Safe from auto-delete)" : "Unlock"}
                    >
                        {post.isLocked ? <Lock size={16} fill="currentColor" /> : <Unlock size={16} />}
                    </button>

                    {/* Buton EDIT (Dacă avem funcția) */}
                    {onManualEdit && activeTab === 'Original' && (
                        <button 
                            onClick={() => isEditing ? handleSaveEdit() : setIsEditing(true)}
                            className={`p-2 transition rounded-lg ${isEditing ? 'text-green-400 bg-green-400/10' : 'text-gray-600 hover:text-blue-400'}`}
                            title="Edit Text"
                        >
                            {isEditing ? <Save size={16} /> : <Edit3 size={16} />}
                        </button>
                    )}

                    <button onClick={() => onDelete(post.id)} className="p-2 text-gray-600 hover:text-red-500 transition" title="Delete"><Trash2 size={16} /></button>
                </div>
            </div>
            
            {/* Text Body */}
            <div className="flex-1 mb-6 relative min-h-[120px]">
                {isRefining && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#161b22]/80 backdrop-blur-sm z-10 rounded-lg border border-gray-700">
                        <Loader /> 
                    </div>
                )}
                
                {isEditing ? (
                    <textarea 
                        className="w-full h-full bg-[#0f1115] border border-blue-500/50 rounded-lg p-3 text-gray-200 text-sm leading-relaxed resize-none outline-none focus:ring-1 focus:ring-blue-500"
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                    />
                ) : (
                    <textarea 
                        readOnly
                        className="w-full h-full bg-transparent text-gray-300 text-sm leading-relaxed resize-none outline-none cursor-text scrollbar-hide"
                        value={displayContent}
                    />
                )}
            </div>

            {/* Footer */}
            <div className="border-t border-gray-800 pt-4 space-y-5">
                <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                    {platforms.map((p) => (
                        <button key={p.id} onClick={() => { setActiveTab(p.id); onAdaptPost(post.id, p.id, post.content); }} className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-all duration-200 ${activeTab === p.id ? 'bg-blue-600 text-white border-blue-500 shadow-lg' : 'bg-transparent text-gray-700 border-gray-800 hover:text-gray-400'}`}>
                            <p.icon size={16} />
                        </button>
                    ))}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    <button onClick={handleCopy} className="py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-xs font-bold text-gray-300 flex items-center justify-center gap-2 transition-all active:scale-95">
                        {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />} {copied ? 'Copied!' : 'Copy'}
                    </button>
                    <button onClick={handleNativeShare} className="py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-xs font-bold text-gray-300 flex items-center justify-center gap-2 transition-all active:scale-95">
                        <Smartphone size={14} /> Share
                    </button>
                    
                    {/* Refine Menu */}
                    <div className="relative col-span-2 sm:col-span-1" ref={menuRef}>
                        <button onClick={() => setShowRefineMenu(!showRefineMenu)} className={`w-full h-full py-2 border border-gray-700 rounded-lg flex items-center justify-center gap-2 text-xs font-bold transition-all ${showRefineMenu ? 'bg-blue-900/30 text-blue-400 border-blue-500/50' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}>
                            <Wand2 size={14} /> Refine
                        </button>
                        {showRefineMenu && (
                            <div className="absolute bottom-full right-0 mb-2 w-full sm:w-48 bg-[#1c1c2e] border border-gray-700 rounded-xl shadow-2xl overflow-hidden z-20 animate-in fade-in zoom-in-95 duration-100">
                                <div className="p-1 space-y-0.5">
                                    <button onClick={() => onRefinePost(post.id, 'makeShorter', post.content)} className="w-full text-left px-3 py-2 text-xs text-gray-300 hover:bg-blue-600 hover:text-white rounded-lg transition">Shorten</button>
                                    <button onClick={() => onRefinePost(post.id, 'addEmojis', post.content)} className="w-full text-left px-3 py-2 text-xs text-gray-300 hover:bg-blue-600 hover:text-white rounded-lg transition">Emojify ✨</button>
                                    <button onClick={() => onRefinePost(post.id, 'askQuestion', post.content)} className="w-full text-left px-3 py-2 text-xs text-gray-300 hover:bg-blue-600 hover:text-white rounded-lg transition">Question</button>
                                    <button onClick={() => onRefinePost(post.id, 'formal', post.content)} className="w-full text-left px-3 py-2 text-xs text-gray-300 hover:bg-blue-600 hover:text-white rounded-lg transition">Formal</button>
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
