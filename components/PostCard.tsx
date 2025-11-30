import React, { useState, useRef, useEffect } from 'react';
import { Post, Platform, RefinementType } from '../types';
import { 
    Instagram, Facebook, Linkedin, Twitter, Video, 
    Check, Copy, Trash2, Wand2, Download, 
    Image as ImageIcon, Share2, Smartphone, Lock, Unlock, Edit3, Save,
    CalendarClock, CheckCircle
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
}

export const PostCard: React.FC<PostCardProps> = ({ 
    post, isRefining, onGenerateImage, onAdaptPost, onRefinePost, onDelete, onToggleLock, onManualEdit, onSchedule, onMarkPublished 
}) => {
  // --- STATE-URI LOCALE ---
  const [copied, setCopied] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [shareMessage, setShareMessage] = useState('');
  
  // Tab-uri pentru conținut adaptat (Original vs Instagram vs LinkedIn...)
  const [activeTab, setActiveTab] = useState<string>('Original');
  
  // Editare
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);

  // Meniul Refine (Popup)
  const [showRefineMenu, setShowRefineMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const dateInputRef = useRef<HTMLInputElement>(null);

  // Sincronizăm conținutul de editare când se schimbă postul
  useEffect(() => {
      setEditContent(post.content);
  }, [post.content]);

  // Închidem meniul Refine dacă dăm click în afară
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowRefineMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- FUNCȚII DE ACȚIUNE ---

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

  // Logica "Smart Share" pentru mobil
  const handleNativeShare = async () => {
    const contentToShare = activeTab === 'Original' ? post.content : post.adaptedContent[activeTab as Platform] || post.content;
    
    // Verificăm suportul browserului
    if (!navigator.share) {
        handleCopy();
        alert("Sharing not supported on this browser. Text copied!");
        return;
    }

    setIsSharing(true);
    setShareMessage("Copying Caption...");

    try {
        // 1. Copiem textul (pt FB/Insta care ignoră textul la share de fișiere)
        await navigator.clipboard.writeText(contentToShare);
        setShareMessage("Caption Copied! Opening Share...");
        await new Promise(r => setTimeout(r, 800));

        const shareData: any = {
            title: 'New Post',
            text: contentToShare 
        };

        // 2. Atașăm imaginea dacă există
        if (post.imageUrl && !post.imageUrl.startsWith('http')) {
             const response = await fetch(post.imageUrl);
             const blob = await response.blob();
             const file = new File([blob], 'image.png', { type: 'image/png' });
             shareData.files = [file];
        }

        await navigator.share(shareData);
        setShareMessage(""); 

    } catch (err) {
        console.error("Share failed:", err);
        setShareMessage("Share cancelled");
        setTimeout(() => setShareMessage(""), 2000);
    } finally {
        setIsSharing(false);
    }
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

  // Formatare dată
  const scheduledDateDisplay = post.scheduledDate 
    // @ts-ignore (Firebase Timestamp handling)
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

  // Check post type for special rendering (Remix Mode)
  const isScript = (post as any).type === 'script' || displayContent.includes('(Visual)') || displayContent.includes('[Visual]');
  const isThread = (post as any).type === 'thread';

  return (
    <div className={`bg-[#161b22] border rounded-2xl overflow-hidden transition shadow-xl flex flex-col md:flex-row group relative ${post.isLocked ? 'border-yellow-500/50 shadow-yellow-900/20' : 'border-gray-800 hover:border-gray-600'}`}>
        
        {/* Toast Message */}
        {shareMessage && (
            <div className="absolute inset-0 z-50 bg-black/80 flex items-center justify-center backdrop-blur-sm animate-in fade-in">
                <div className="bg-gray-800 px-6 py-3 rounded-full text-white font-bold shadow-xl flex items-center gap-2">
                    <Check size={18} className="text-green-400" /> {shareMessage}
                </div>
            </div>
        )}

        {/* Header Verde dacă e Publicat */}
        {post.isPublished && (
             <div className="absolute top-0 left-0 w-full h-1 bg-green-500 z-10"></div>
        )}

        {/* --- COLOANA STÂNGA: IMAGINE --- */}
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

        {/* --- COLOANA DREAPTA: CONȚINUT --- */}
        <div className="flex-1 p-6 flex flex-col">
            
            {/* Header Card */}
            <div className="flex justify-between items-start mb-4">
                <div className="flex flex-col gap-2">
                    <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded border w-fit ${activeTab === 'Original' ? 'bg-gray-800 text-gray-400 border-gray-700' : 'bg-blue-900/20 text-blue-400 border-blue-500/30'}`}>
                        {activeTab === 'Original' ? 'Base Content' : `Adapted for ${activeTab}`}
                    </span>
                    {/* Status Programare */}
                    {scheduledDateDisplay && (
                        <span className={`text-[10px] font-bold px-2 py-1 rounded flex items-center gap-1 ${post.isPublished ? 'bg-green-900/30 text-green-400' : 'bg-orange-900/30 text-orange-300'}`}>
                            {post.isPublished ? <CheckCircle size={10}/> : <CalendarClock size={10}/>}
                            {scheduledDateDisplay}
                        </span>
                    )}
                </div>
                
                <div className="flex gap-1">
                    {/* Buton Calendar */}
                    {onSchedule && (
                        <>
                            <button onClick={() => dateInputRef.current?.showPicker()} className="p-2 text-gray-600 hover:text-orange-400 transition" title="Schedule">
                                <CalendarClock size={16} />
                            </button>
                            <input type="datetime-local" ref={dateInputRef} onChange={handleDateChange} className="absolute opacity-0 w-0 h-0" />
                        </>
                    )}
                    
                    {/* Mark Published */}
                    {onMarkPublished && !post.isPublished && post.scheduledDate && (
                        <button onClick={() => onMarkPublished(post.id)} className="p-2 text-gray-600 hover:text-green-400 transition" title="Mark Published">
                            <CheckCircle size={16} />
                        </button>
                    )}

                    {/* Lock */}
                    <button onClick={() => onToggleLock(post.id)} className={`p-2 transition rounded-lg ${post.isLocked ? 'text-yellow-400 bg-yellow-400/10' : 'text-gray-600 hover:text-yellow-500'}`} title={post.isLocked ? "Locked" : "Pin"}>
                        {post.isLocked ? <Lock size={16} fill="currentColor" /> : <Unlock size={16} />}
                    </button>

                    {/* Edit */}
                    {onManualEdit && activeTab === 'Original' && (
                        <button onClick={() => isEditing ? handleSaveEdit() : setIsEditing(true)} className={`p-2 transition rounded-lg ${isEditing ? 'text-green-400' : 'text-gray-600 hover:text-blue-400'}`} title="Edit">
                            {isEditing ? <Save size={16} /> : <Edit3 size={16} />}
                        </button>
                    )}

                    {/* Delete */}
                    <button onClick={() => onDelete(post.id)} className="p-2 text-gray-600 hover:text-red-500 transition" title="Delete"><Trash2 size={16} /></button>
                </div>
            </div>
            
            {/* --- TEXT CONTENT AREA (Cu Logică Remix) --- */}
            <div className="flex-1 mb-6 relative min-h-[120px]">
                {isRefining && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#161b22]/80 backdrop-blur-sm z-10 rounded-lg border border-gray-700">
                        <Loader /> 
                    </div>
                )}
                
                {isEditing ? (
                    <textarea 
                        className="w-full h-full bg-[#0f1115] border border-blue-500/50 rounded-lg p-3 text-gray-200 text-base md:text-sm leading-relaxed resize-none outline-none focus:ring-1 focus:ring-blue-500 min-h-[150px]"
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                    />
                ) : (
                    <>
                        {/* MOD VIZUAL PENTRU TIKTOK SCRIPT */}
                        // ...
// În PostCard.tsx

                        {/* MOD VIZUAL PENTRU TIKTOK SCRIPT */}
                        {isScript ? (
                            <div className="w-full h-full bg-[#0a0c10] border border-gray-700 rounded-lg p-4 overflow-y-auto max-h-[300px] custom-scrollbar font-mono text-xs text-gray-300">
                                <div className="flex items-center gap-2 mb-3 text-pink-500 font-bold uppercase border-b border-gray-800 pb-2">
                                    <Video size={14}/> Script Breakdown
                                </div>
                                {displayContent.split('\n').map((line, i) => {
                                    // Detectăm liniile care descriu vizualul
                                    const isVisual = line.toLowerCase().includes('visual') || line.includes('[');
                                    
                                    return (
                                        <div 
                                            key={i} 
                                            className={`mb-3 pl-2 border-l-2 ${
                                                isVisual 
                                                ? 'border-blue-500 text-blue-300 cursor-pointer hover:bg-blue-900/20 p-1 rounded' 
                                                : line.includes('Audio') ? 'border-green-500 text-green-300' : 'border-transparent text-gray-400'
                                            }`}
                                            // AICI E MAGIA: Click pe vizual -> Deschide generatorul de imagini
                                            onClick={() => {
                                                if (isVisual) {
                                                    // Curățăm textul (scoatem "Visual:", paranteze)
                                                    const cleanPrompt = line.replace(/Visual:|\[|\]|\(|\)/g, '').trim();
                                                    onGenerateImage(post.id, cleanPrompt);
                                                }
                                            }}
                                            title={isVisual ? "Click to generate this scene!" : ""}
                                        >
                                            {line} 
                                            {isVisual && <ImageIcon size={10} className="inline ml-2 opacity-50"/>}
                                        </div>
                                    );
                                })}
                            </div>
                        ) : 
// ...
                        /* MOD VIZUAL PENTRU THREADS */
                        isThread || (displayContent.includes('1/') && displayContent.includes('2/')) ? (
                            <div className="w-full h-full bg-[#0a0c10] border border-gray-700 rounded-lg p-4 overflow-y-auto max-h-[300px] custom-scrollbar space-y-4">
                                <div className="flex items-center gap-2 mb-2 text-blue-400 font-bold uppercase"><Twitter size={14}/> Thread Preview</div>
                                {displayContent.split(/\n\n/).filter(t => t.trim().length > 5).map((tweet, i) => (
                                    <div key={i} className="relative pl-4 border-l-2 border-gray-700 pb-4">
                                        <div className="absolute -left-[5px] top-0 w-2 h-2 bg-blue-500 rounded-full"></div>
                                        <p className="text-sm text-gray-300 leading-relaxed">{tweet}</p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            /* MOD STANDARD TEXTAREA */
                            <textarea 
                                readOnly
                                className="w-full h-full bg-transparent text-gray-300 text-base md:text-sm leading-relaxed resize-none outline-none cursor-text min-h-[200px] md:min-h-[120px] scrollbar-hide"
                                value={displayContent}
                            />
                        )}
                    </>
                )}
            </div>

            {/* Footer Controls */}
            <div className="border-t border-gray-800 pt-4 space-y-5">
                <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                    {platforms.map((p) => (
                        <button key={p.id} onClick={() => { setActiveTab(p.id); if (!post.adaptedContent[p.id]) onAdaptPost(post.id, p.id, post.content); }} className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-all duration-200 ${activeTab === p.id ? 'bg-blue-600 text-white border-blue-500 shadow-lg' : !!post.adaptedContent[p.id] ? 'bg-gray-800 text-gray-300 border-gray-500' : 'bg-transparent text-gray-700 border-gray-800 hover:text-gray-400'}`}>
                            <p.icon size={16} />
                        </button>
                    ))}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    <button onClick={handleCopy} className="py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-xs font-bold text-gray-300 flex items-center justify-center gap-2 transition-all active:scale-95">
                        {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />} {copied ? 'Copied!' : 'Copy'}
                    </button>
                    <button onClick={handleNativeShare} className="py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-xs font-bold text-gray-300 flex items-center justify-center gap-2 transition-all active:scale-95">
                        <Smartphone size={14} /> {isSharing ? 'Sharing...' : 'Share'}
                    </button>
                    
                    {/* Refine Menu */}
                    <div className="relative col-span-2 sm:col-span-1" ref={menuRef}>
                        <button onClick={() => setShowRefineMenu(!showRefineMenu)} className="w-full h-full py-2 border border-gray-700 rounded-lg flex items-center justify-center gap-2 text-xs font-bold transition-all bg-gray-800 text-gray-300 hover:bg-gray-700">
                            <Wand2 size={14} /> Refine
                        </button>
                        {showRefineMenu && (
                            <div className="absolute bottom-full right-0 mb-2 w-full sm:w-48 bg-[#1c1c2e] border border-gray-700 rounded-xl shadow-2xl overflow-hidden z-20 animate-in fade-in zoom-in-95 duration-100">
                                <div className="p-1 space-y-0.5">
                                    <button onClick={() => handleRefineClick('makeShorter')} className="w-full text-left px-3 py-2 text-xs text-gray-300 hover:bg-blue-600 hover:text-white rounded-lg transition">Shorten</button>
                                    <button onClick={() => handleRefineClick('addEmojis')} className="w-full text-left px-3 py-2 text-xs text-gray-300 hover:bg-blue-600 hover:text-white rounded-lg transition">Emojify</button>
                                    <button onClick={() => handleRefineClick('askQuestion')} className="w-full text-left px-3 py-2 text-xs text-gray-300 hover:bg-blue-600 hover:text-white rounded-lg transition">Question</button>
                                    <button onClick={() => handleRefineClick('formal')} className="w-full text-left px-3 py-2 text-xs text-gray-300 hover:bg-blue-600 hover:text-white rounded-lg transition">Formal</button>
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
