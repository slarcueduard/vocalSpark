import React, { useState } from 'react';
import { 
  Copy, Share2, Trash2, Calendar, Check, 
  Lock, Unlock, ChevronDown, ChevronUp, Image as ImageIcon, Sparkles, 
  Linkedin, Twitter, Instagram, Facebook, Wand2, MessageCircle, Hash, Smile
} from 'lucide-react';
import { Post, Platform } from '../types';

interface PostCardProps {
  post: Post;
  isRefining?: boolean;
  onGenerateImage: (id: string, content: string) => void;
  onAdaptPost: (id: string, platform: Platform, content: string) => void;
  onRefinePost: (id: string, type: 'shorter' | 'longer' | 'funnier' | 'professional' | 'emojis' | 'hashtags' | 'question', content: string) => void;
  onDelete: (id: string) => void;
  onToggleLock: (id: string) => void;
  onManualEdit: (id: string, newContent: string) => void;
  onSchedule?: (id: string, date: Date) => void;
  onMarkPublished?: (id: string) => void;
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
  onSchedule
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
          alert("Share not supported on this browser. Content copied!");
          handleCopy();
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
                <span className="text-[10px] text-gray-500 font-mono uppercase bg-gray-800/50 px-2 py-1 rounded border border-gray-700">
                    {post.platform}
                </span>
            )}

            {post.scheduledDate && (
                <span className="text-[10px] flex items-center gap-1 text-green-400 border border-green-900/30 bg-green-900/10 px-2 py-1 rounded">
                    <Calendar size={10} /> {new Date(post.scheduledDate).toLocaleDateString()}
                </span>
            )}
        </div>
        
        <div className="flex items-center gap-2">
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
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all duration-300">
                          <button 
                              onClick={() => onGenerateImage(post.id, post.imagePrompt || post.content)}
                              className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-all"
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
                                  {isExpanded ? <>Show Less <ChevronUp size={12}/></> : <>Read More <ChevronDown size={12}/></>}
                              </button>
                          )}
                      </div>
                  )}
              </div>

              {/* === ACTION BAR (RESTORED FEATURES) === */}
              
              {/* 1. MAGIC / REFINE MENU */}
              {showMagicMenu && !isEditing && (
                  <div className="mb-4 p-3 bg-[#0a0c10] rounded-xl border border-purple-500/30 animate-in fade-in slide-in-from-bottom-2 grid grid-cols-2 md:grid-cols-4 gap-2">
                      <button onClick={() => onRefinePost(post.id, 'emojis', post.content)} className="flex items-center justify-center gap-2 p-2 rounded hover:bg-white/5 text-[10px] text-gray-400 hover:text-purple-400 transition border border-transparent hover:border-purple-500/30">
                          <Smile size={12}/> Add Emojis
                      </button>
                      <button onClick={() => onRefinePost(post.id, 'hashtags', post.content)} className="flex items-center justify-center gap-2 p-2 rounded hover:bg-white/5 text-[10px] text-gray-400 hover:text-blue-400 transition border border-transparent hover:border-blue-500/30">
                          <Hash size={12}/> Hashtags
                      </button>
                      <button onClick={() => onRefinePost(post.id, 'question', post.content)} className="flex items-center justify-center gap-2 p-2 rounded hover:bg-white/5 text-[10px] text-gray-400 hover:text-green-400 transition border border-transparent hover:border-green-500/30">
                          <MessageCircle size={12}/> Ask Question
                      </button>
                      <button onClick={() => onRefinePost(post.id, 'shorter', post.content)} className="flex items-center justify-center gap-2 p-2 rounded hover:bg-white/5 text-[10px] text-gray-400 hover:text-orange-400 transition border border-transparent hover:border-orange-500/30">
                          <ChevronDown size={12}/> Shorten
                      </button>
                  </div>
              )}

              {/* 2. BUTTONS ROW */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-gray-800/50">
                  
                  {isEditing ? (
                      <div className="flex gap-2 w-full">
                        <button onClick={handleSaveEdit} className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg text-xs font-bold">Save Changes</button>
                        <button onClick={() => setIsEditing(false)} className="px-4 py-2 bg-gray-800 text-gray-400 rounded-lg text-xs font-bold">Cancel</button>
                      </div>
                  ) : (
                      <>
                        {/* Left: Primary Actions */}
                        <div className="flex items-center gap-2">
                            <button onClick={handleCopy} className={`flex items-center gap-2 px-3 py-2 bg-[#1c1c2e] border border-gray-700 rounded-lg text-xs font-bold transition hover:bg-white hover:text-black ${copied ? 'text-green-400 border-green-500' : 'text-gray-300'}`}>
                                {copied ? <Check size={14}/> : <Copy size={14}/>} {copied ? 'Copied' : 'Copy'}
                            </button>
                            
                            <button onClick={handleShare} className="p-2 bg-[#1c1c2e] hover:bg-[#252538] border border-gray-700 rounded-lg text-gray-400 hover:text-white transition" title="Share Native">
                                <Share2 size={16}/>
                            </button>
                            
                            <button 
                                onClick={() => setShowMagicMenu(!showMagicMenu)} 
                                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition border ${showMagicMenu ? 'bg-purple-500/20 text-purple-400 border-purple-500/50' : 'bg-[#1c1c2e] text-gray-300 border-gray-700 hover:border-purple-500/50 hover:text-purple-400'}`}
                            >
                                <Wand2 size={14} /> Magic
                            </button>
                        </div>

                        {/* Right: Adaptation & Schedule */}
                        <div className="flex items-center gap-2 ml-auto">
                            <div className="h-6 w-px bg-gray-800 hidden md:block"></div>
                            
                            {/* Platform Icons (Quick Adapt) */}
                            <div className="hidden md:flex gap-1">
                                <button onClick={() => onAdaptPost(post.id, 'LinkedIn' as any, post.content)} className="p-1.5 hover:bg-blue-900/30 rounded text-gray-500 hover:text-blue-400 transition" title="Adapt for LinkedIn"><Linkedin size={14}/></button>
                                <button onClick={() => onAdaptPost(post.id, 'Twitter' as any, post.content)} className="p-1.5 hover:bg-sky-900/30 rounded text-gray-500 hover:text-sky-400 transition" title="Adapt for X"><Twitter size={14}/></button>
                                <button onClick={() => onAdaptPost(post.id, 'Instagram' as any, post.content)} className="p-1.5 hover:bg-pink-900/30 rounded text-gray-500 hover:text-pink-400 transition" title="Adapt for Insta"><Instagram size={14}/></button>
                            </div>

                            {/* Schedule */}
                            {showSchedule ? (
                                <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-2 bg-[#0a0c10] border border-gray-700 rounded-lg p-1">
                                    <input 
                                        type="date" 
                                        className="bg-transparent text-white text-[10px] outline-none"
                                        onChange={(e) => setDateInput(e.target.value)}
                                    />
                                    <button 
                                        onClick={() => {
                                            if(dateInput && onSchedule) {
                                                onSchedule(post.id, new Date(dateInput));
                                                setShowSchedule(false);
                                            }
                                        }}
                                        className="text-green-400 hover:text-white"
                                    >
                                        <Check size={12}/>
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
                            
                            <button onClick={() => setIsEditing(true)} className="md:hidden text-xs text-gray-500 underline">Edit</button>
                        </div>
                      </>
                  )}
              </div>
          </div>
      </div>
    </div>
  );
}
