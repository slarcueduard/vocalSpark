import React, { useState, useRef, useEffect } from 'react';
import { Post, Platform, RefinementType } from '../types';
import { 
    Instagram, Facebook, Linkedin, Twitter, Video, 
    Check, Copy, Trash2, Wand2, Download, 
    Image as ImageIcon, Share2, Smartphone, Lock, Unlock, Edit3, Save,
    CalendarClock, CheckCircle, Bookmark
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
  onManualEdit?: (postId: string, newContent: string) => void;
  onSchedule?: (postId: string, date: Date) => void;
  onMarkPublished?: (postId: string) => void;
  onSaveToVault?: (post: Post) => void; // Prop Nou
}

export const PostCard: React.FC<PostCardProps> = ({ 
    post, isRefining, onGenerateImage, onAdaptPost, onRefinePost, onDelete, onToggleLock, onManualEdit, onSchedule, onMarkPublished, onSaveToVault 
}) => {
  const [copied, setCopied] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [shareMessage, setShareMessage] = useState('');
  const [activeTab, setActiveTab] = useState<string>('Original');
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);

  const [showRefineMenu, setShowRefineMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const dateInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setEditContent(post.content); }, [post.content]);

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
  
  const handleSaveEdit = () => { if (onManualEdit) onManualEdit(post.id, editContent); setIsEditing(false); };

  const getBadgeLabel = () => {
      if (activeTab !== 'Original') return `ADAPTED FOR ${activeTab.toUpperCase()}`;
      switch (post.generationType) {
          case 'campaign': return '📅 CAMPAIGN POST';
          case 'remix': return '♻️ REMIXED CONTENT';
          default: return '✨ SINGLE POST';
      }
  };

  const getBadgeColor = () => {
      if (activeTab !== 'Original') return 'bg-blue-900/20 text-blue-400 border-blue-500/30';
      switch (post.generationType) {
          case 'campaign': return 'bg-purple-900/20 text-purple-400 border-purple-500/30';
          case 'remix': return 'bg-green-900/20 text-green-400 border-green-500/30';
          default: return 'bg-gray-800 text-gray-400 border-gray-700';
      }
  };

  const handleNativeShare = async () => {
      const contentToShare = activeTab === 'Original' ? post.content : post.adaptedContent[activeTab as Platform] || post.content;
      if (!navigator.share) { handleCopy(); alert("Sharing not supported. Copied!"); return; }
      setIsSharing(true);
      try {
          await navigator.clipboard.writeText(contentToShare);
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

  const handleRefineClick = (type: RefinementType) => {
      const contentToRefine = activeTab === 'Original' ? post.content : (post.adaptedContent[activeTab as Platform] || post.content);
      onRefinePost(post.id, type, contentToRefine);
      setShowRefineMenu(false);
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.value && onSchedule) {
          const date = new Date(e.target.value);
          onSchedule(post.id, date);
      }
  };

  const scheduledDateDisplay = post.scheduledDate 
    // @ts-ignore
    ? new Date(post.scheduledDate.toDate ? post.scheduledDate.toDate() : post.scheduledDate).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    : null;

  const displayContent = activeTab === 'Original' ? post.content : (post.adaptedContent[activeTab as Platform] || "Loading adaptation...");
  const platforms = [
      { id: Platform.Instagram, icon: Instagram },
      { id: Platform.TikTok, icon: Video },
      { id: Platform.Facebook, icon: Facebook },
      { id: Platform.X, icon: Twitter },
      { id: Platform.LinkedIn, icon: Linkedin },
  ];

  return (
    <div className={`bg-[#161b22] border rounded-2xl overflow-hidden transition shadow-xl flex flex-col md:flex-row group relative ${post.isLocked ? 'border-yellow-500/30 shadow-yellow-900/20' : 'border-gray-800 hover:border-gray-600'}`}>
        
        {/* Header Status Strip */}
        {post.isPublished && (
             <div className="absolute top-0 left-0 w-full h-1 bg-green-500 z-10"></div>
        )}

      {/* --- IMAGE SECTION --- */}
<div className="w-full h-48 bg-[#0a0c10] border-r border-gray-800 flex items-center justify-center relative group overflow-hidden">
    {post.imageUrl ? (
        <>
            <img 
                src={post.imageUrl} 
                alt="Post Visual" 
                className="w-full h-full object-cover"
            />
            {/* Overlay Edit */}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all duration-300">
                <button 
                    onClick={() => onGenerateImage(post.id, post.imagePrompt || post.content)}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2"
                >
                    <Sparkles size={14} /> Change Image
                </button>
            </div>
        </>
    ) : (
        <button 
            onClick={() => onGenerateImage(post.id, post.imagePrompt || post.content)}
            className="flex flex-col items-center gap-2 text-gray-600 hover:text-blue-400 transition group/btn"
        >
            <div className="p-3 bg-[#161b22] rounded-xl border border-gray-700 group-hover/btn:border-blue-500/50 transition">
                 <ImageIcon size={24} />
            </div>
            <span className="text-xs font-bold">Create Visual</span>
        </button>
    )}
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

        {/* B. CONȚINUT */}
        <div className="flex-1 p-6 flex flex-col">
            
            <div className="flex justify-between items-start mb-4">
                <div className="flex flex-col gap-2">
                    <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded border w-fit ${getBadgeColor()}`}>
                        {getBadgeLabel()}
                    </span>
                    {scheduledDateDisplay && (
                        <span className={`text-[10px] font-bold px-2 py-1 rounded flex items-center gap-1 ${post.isPublished ? 'bg-green-900/30 text-green-400' : 'bg-orange-900/30 text-orange-300'}`}>
                            {post.isPublished ? <CheckCircle size={10}/> : <CalendarClock size={10}/>}
                            {scheduledDateDisplay}
                        </span>
                    )}
                </div>
                
                <div className="flex gap-1">
                    {onSchedule && (
                        <>
                            <button onClick={() => dateInputRef.current?.showPicker()} className="p-2 text-gray-600 hover:text-orange-400 transition" title="Schedule">
                                <CalendarClock size={16} />
                            </button>
                            <input type="datetime-local" ref={dateInputRef} onChange={handleDateChange} className="absolute opacity-0 w-0 h-0" />
                        </>
                    )}
                    
                    <button onClick={() => onToggleLock(post.id)} className={`p-2 transition rounded-lg ${post.isLocked ? 'text-yellow-400 bg-yellow-400/10' : 'text-gray-600 hover:text-yellow-500'}`} title={post.isLocked ? "Pinned" : "Pin to Vault"}>
                        {post.isLocked ? <Lock size={16} fill="currentColor" /> : <Unlock size={16} />}
                    </button>
                    
                    {onManualEdit && activeTab === 'Original' && (
                        <button onClick={() => isEditing ? handleSaveEdit() : setIsEditing(true)} className={`p-2 transition rounded-lg ${isEditing ? 'text-green-400' : 'text-gray-600 hover:text-blue-400'}`}>
                            {isEditing ? <Save size={16} /> : <Edit3 size={16} />}
                        </button>
                    )}
                    
                    <button onClick={() => onDelete(post.id)} className="p-2 text-gray-600 hover:text-red-500 transition"><Trash2 size={16} /></button>
                </div>
            </div>
            
            <div className="flex-1 mb-6 relative min-h-[120px]">
                {isEditing ? (
                    <textarea 
                        className="w-full h-full bg-[#0f1115] border border-blue-500/50 rounded-lg p-3 text-gray-200 text-sm leading-relaxed resize-none outline-none focus:ring-1 focus:ring-blue-500 min-h-[150px]"
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                    />
                ) : (
                    <textarea 
                        readOnly
                        className="w-full h-full bg-transparent text-gray-300 text-base md:text-sm leading-relaxed resize-none outline-none cursor-text min-h-[200px] md:min-h-[120px]"
                        value={displayContent}
                    />
                )}
            </div>

            {/* FOOTER ACTIONS */}
            <div className="border-t border-gray-800 pt-4 space-y-4">
                <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                    {platforms.map((p) => (
                        <button key={p.id} onClick={() => { setActiveTab(p.id); if (!post.adaptedContent[p.id]) onAdaptPost(post.id, p.id, post.content); }} className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-all duration-200 ${activeTab === p.id ? 'bg-blue-600 text-white border-blue-500 shadow-lg' : !!post.adaptedContent[p.id] ? 'bg-gray-800 text-gray-300 border-gray-500' : 'bg-transparent text-gray-700 border-gray-800 hover:text-gray-400'}`}>
                            <p.icon size={16} />
                        </button>
                    ))}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <button onClick={handleCopy} className="py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-xs font-bold text-gray-300 flex items-center justify-center gap-2 transition-all active:scale-95">
                        {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />} Copy
                    </button>
                    
                    <button onClick={handleNativeShare} className="py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-xs font-bold text-gray-300 flex items-center justify-center gap-2 transition-all active:scale-95">
                        <Smartphone size={14} /> Share
                    </button>

                    <div className="relative" ref={menuRef}>
                        <button onClick={() => setShowRefineMenu(!showRefineMenu)} className="w-full h-full py-2 border border-gray-700 rounded-lg flex items-center justify-center gap-2 text-xs font-bold transition-all bg-gray-800 text-gray-300 hover:bg-gray-700">
                            <Wand2 size={14} /> Refine
                        </button>
                        {showRefineMenu && (
                            <div className="absolute bottom-full left-0 mb-2 w-full bg-[#1c1c2e] border border-gray-700 rounded-xl shadow-2xl overflow-hidden z-20 p-1 space-y-0.5">
                                <button onClick={() => handleRefineClick('makeShorter')} className="w-full text-left px-3 py-2 text-xs text-gray-300 hover:bg-blue-600 hover:text-white rounded-lg">Shorten</button>
                                <button onClick={() => handleRefineClick('addEmojis')} className="w-full text-left px-3 py-2 text-xs text-gray-300 hover:bg-blue-600 hover:text-white rounded-lg">Emojify</button>
                                <button onClick={() => handleRefineClick('formal')} className="w-full text-left px-3 py-2 text-xs text-gray-300 hover:bg-blue-600 hover:text-white rounded-lg">Formal</button>
                            </div>
                        )}
                    </div>

                    {/* SAVE BUTTON (MANUAL) */}
                    {onSaveToVault && (
                        <div className="relative group/save">
                            <button 
                                onClick={() => onSaveToVault(post)}
                                disabled={post.isSaved}
                                className={`w-full h-full py-2 border rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-95 ${
                                    post.isSaved 
                                    ? 'bg-green-900/20 border-green-500/50 text-green-400 cursor-default' 
                                    : 'bg-blue-600 hover:bg-blue-500 border-blue-500 text-white shadow-lg shadow-blue-900/20'
                                }`}
                            >
                                {post.isSaved ? <CheckCircle size={14} /> : <Bookmark size={14} />}
                                {post.isSaved ? 'Saved' : 'Save'}
                            </button>
                            {!post.isSaved && (
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-gray-300 text-[10px] rounded border border-gray-700 opacity-0 group-hover/save:opacity-100 transition pointer-events-none whitespace-nowrap z-20">
                                    Add to Vault
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    </div>
  );
};
