import React, { useState } from 'react';
import { 
  Copy, Share, RefreshCw, Trash2, Calendar, Check, 
  Lock, Unlock, ChevronDown, ChevronUp, Image as ImageIcon, Sparkles, Send 
} from 'lucide-react';
import { Post, Platform } from '../types';

interface PostCardProps {
  post: Post;
  isRefining?: boolean;
  onGenerateImage: (id: string, content: string) => void;
  onAdaptPost: (id: string, platform: Platform, content: string) => void;
  onRefinePost: (id: string, type: 'shorter' | 'longer' | 'funnier' | 'professional', content: string) => void;
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
  onSchedule,
  onMarkPublished
}: PostCardProps) {
  
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const [dateInput, setDateInput] = useState('');

  const handleCopy = () => {
    navigator.clipboard.writeText(post.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveEdit = () => {
    onManualEdit(post.id, editContent);
    setIsEditing(false);
  };

  const contentPreview = isExpanded ? post.content : post.content.slice(0, 250) + (post.content.length > 250 ? '...' : '');

  return (
    <div className={`bg-[#161b22] border rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-2xl ${post.isLocked ? 'border-yellow-500/50 shadow-yellow-900/10' : 'border-gray-800 hover:border-gray-600'}`}>
      
      {/* HEADER: Platform & Actions */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800 bg-[#0f1115]/50">
        <div className="flex items-center gap-3">
            <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider ${
                post.platform === 'LinkedIn' ? 'bg-blue-900/30 text-blue-400 border border-blue-800' :
                post.platform === 'Twitter' ? 'bg-sky-900/30 text-sky-400 border border-sky-800' :
                post.platform === 'Instagram' ? 'bg-pink-900/30 text-pink-400 border border-pink-800' :
                'bg-gray-800 text-gray-400 border border-gray-700'
            }`}>
                {post.platform || 'General'}
            </span>
            {post.scheduledDate && (
                <span className="text-[10px] flex items-center gap-1 text-green-400">
                    <Calendar size={10} /> {new Date(post.scheduledDate).toLocaleDateString()}
                </span>
            )}
        </div>
        
        <div className="flex items-center gap-2">
            <button 
                onClick={() => onToggleLock(post.id)}
                className={`p-1.5 rounded-lg transition ${post.isLocked ? 'text-yellow-400 hover:bg-yellow-400/10' : 'text-gray-600 hover:text-gray-400'}`}
                title={post.isLocked ? "Unlock Post" : "Lock Post"}
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
          
          {/* LEFT: IMAGE SECTION (AICI ERA EROAREA, ACUM E CORECTAT) */}
          <div className="w-full md:w-1/3 h-64 md:h-auto bg-[#0a0c10] border-b md:border-b-0 md:border-r border-gray-800 flex items-center justify-center relative group overflow-hidden">
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

          {/* RIGHT: CONTENT SECTION */}
          <div className="flex-1 p-5 flex flex-col">
              
              {/* Text Content */}
              <div className="flex-1 mb-4">
                  {isEditing ? (
                      <textarea 
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="w-full h-48 bg-[#0a0c10] border border-gray-700 rounded-lg p-3 text-sm text-gray-300 focus:border-blue-500 outline-none resize-none"
                      />
                  ) : (
                      <div className="prose prose-invert max-w-none">
                          <p className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">
                              {contentPreview}
                          </p>
                          {post.content.length > 250 && (
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

              {/* Action Bar */}
              <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-gray-800/50">
                  {isEditing ? (
                      <button onClick={handleSaveEdit} className="bg-green-600 text-white px-4 py-1.5 rounded-lg text-xs font-bold">Save</button>
                  ) : (
                      <>
                        <button onClick={handleCopy} className="flex items-center gap-2 px-3 py-1.5 bg-[#1c1c2e] hover:bg-[#252538] border border-gray-700 rounded-lg text-xs text-gray-300 transition">
                            {copied ? <Check size={14} className="text-green-400"/> : <Copy size={14}/>} {copied ? 'Copied' : 'Copy'}
                        </button>
                        
                        <button onClick={() => setIsEditing(true)} className="px-3 py-1.5 bg-[#1c1c2e] hover:bg-[#252538] border border-gray-700 rounded-lg text-xs text-gray-300 transition">
                            Edit
                        </button>

                        <div className="h-4 w-px bg-gray-700 mx-1 hidden md:block"></div>

                        {/* Refine Options */}
                        <button onClick={() => onRefinePost(post.id, 'shorter', post.content)} className="hidden md:flex items-center gap-1 px-2 py-1.5 text-[10px] text-gray-500 hover:text-white transition">
                            Shorten
                        </button>
                        <button onClick={() => onRefinePost(post.id, 'funnier', post.content)} className="hidden md:flex items-center gap-1 px-2 py-1.5 text-[10px] text-gray-500 hover:text-white transition">
                            Fun
                        </button>

                        {/* Scheduling */}
                        {showSchedule ? (
                            <div className="flex items-center gap-2 ml-auto animate-in fade-in slide-in-from-right-2">
                                <input 
                                    type="date" 
                                    className="bg-[#0a0c10] border border-gray-700 text-white text-xs rounded px-2 py-1 outline-none"
                                    onChange={(e) => setDateInput(e.target.value)}
                                />
                                <button 
                                    onClick={() => {
                                        if(dateInput && onSchedule) {
                                            onSchedule(post.id, new Date(dateInput));
                                            setShowSchedule(false);
                                        }
                                    }}
                                    className="text-green-400 hover:text-green-300"
                                >
                                    <Check size={14}/>
                                </button>
                            </div>
                        ) : (
                            <button 
                                onClick={() => setShowSchedule(true)}
                                className="ml-auto flex items-center gap-2 px-3 py-1.5 text-xs text-blue-400 hover:bg-blue-900/20 rounded-lg transition"
                            >
                                <Calendar size={14} /> Schedule
                            </button>
                        )}
                      </>
                  )}
              </div>
          </div>
      </div>
    </div>
  );
}
