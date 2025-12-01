import React, { useState, useEffect, useRef } from 'react';
import { generateSocialMediaPosts, adaptPostForPlatform, refinePostContent } from './services/geminiService';
import { savePostToHistory, updatePostInHistory, schedulePost, markPostAsPublished, checkDuePosts } from './services/postService';
import { Post, Tone, Platform, AppMode, ViralHook, RefinementType, PostObjective, GenerationType } from './types';
import { TONES, PLATFORMS, OBJECTIVES, getRandomVibe } from './constants';
import { Loader } from './components/Loader';
import { SparklesIcon, ImageIcon, BriefcaseIcon } from './components/Icons';
import { Lock, X, HelpCircle, Globe, Bell, Repeat, CheckCircle } from 'lucide-react'; 
import { ImageCreationModal } from './components/ImageCreationModal';
import { BrandProfileModal } from './components/BrandProfileModal';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { MainLayout } from './layouts/MainLayout';
import { PhonePreview } from './components/PhonePreview';
import { PostCard } from './components/PostCard';
import { LandingPage } from './components/LandingPage';
import { HistoryView } from './components/HistoryView';
import { CalendarView } from './components/CalendarView';

const SocialSparkApp: React.FC = () => {
  const { user, brandProfile, saveBrandProfile, checkCredits, isTrialExpired, loading, userProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // --- NAVIGARE ---
  const [currentView, setCurrentView] = useState<'create' | 'history' | 'calendar'>('create');

  // --- MODURI DE LUCRU ---
  const [appMode, setAppMode] = useState<'creator' | 'remix'>('creator');
  const [isCampaignMode, setIsCampaignMode] = useState(false);
  
  // --- INPUT STATES ---
  const [topic, setTopic] = useState('');
  const [tone, setTone] = useState<Tone>(Tone.Inspirational);
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>(Platform.Instagram);
  const [objective, setObjective] = useState<PostObjective>('engagement');
  const [campaignCount, setCampaignCount] = useState(3);
  const [remixFormats, setRemixFormats] = useState<string[]>(['LinkedIn Post', 'Twitter Thread']);
  
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  
  // --- FEATURE FLAGS ---
  const [useRealTime, setUseRealTime] = useState(false);
  
  // --- UI FEEDBACK ---
  const [vibeMessage, setVibeMessage] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  // --- MODALE ---
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isBrandProfileModalOpen, setIsBrandProfileModalOpen] = useState(false);
  
  // --- IMAGINE LOGIC ---
  const [activePostIdForImage, setActivePostIdForImage] = useState<string | null>(null); 
  const [currentPromptForImage, setCurrentPromptForImage] = useState('');

  const [refiningPostId, setRefiningPostId] = useState<string | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // --- HELPERS ---
  const showVibe = () => {
      setVibeMessage(getRandomVibe());
      setTimeout(() => setVibeMessage(null), 4000);
  };

  const handleSwitchMode = (mode: 'single' | 'campaign' | 'remix') => {
      setPosts([]); // Resetăm lista pentru claritate
      setError(null);
      if (mode === 'single') { setAppMode('creator'); setIsCampaignMode(false); }
      else if (mode === 'campaign') { setAppMode('creator'); setIsCampaignMode(true); }
      else if (mode === 'remix') { setAppMode('remix'); setIsCampaignMode(false); }
  };

  const toggleRemixFormat = (fmt: string) => {
      if (remixFormats.includes(fmt)) { if (remixFormats.length > 1) setRemixFormats(prev => prev.filter(f => f !== fmt)); } 
      else { setRemixFormats(prev => [...prev, fmt]); }
  };

  // --- EFFECTS ---

  // 1. Notificări la Login
  useEffect(() => {
      const checkReminders = async () => {
          if (user) {
              const duePosts = await checkDuePosts(user.uid);
              if (duePosts.length > 0) {
                  setNotification(`🔔 ${duePosts.length} posts scheduled for today!`);
                  setTimeout(() => setNotification(null), 10000);
              }
          }
      };
      checkReminders();
  }, [user]);

  // 2. Auto-Sugestie
  useEffect(() => {
    if (!loading && brandProfile?.industry && topic === '' && posts.length === 0 && appMode === 'creator') {
        const lang = brandProfile.language || 'English';
        const niche = brandProfile.industry;
        let templates: string[] = [`3 tips for ${niche}`, `How to start in ${niche}`];
        if (lang === 'Romanian') templates = [`3 mituri despre ${niche}`, `Cum să începi cu ${niche}`, `Secrete din ${niche}`];
        setTopic(templates[Math.floor(Math.random() * templates.length)] || "");
    }
  }, [loading, brandProfile, appMode]); 

  // --- CORE LOGIC ---

  const urlToBase64 = async (url: string): Promise<{data: string, mimeType: string} | null> => {
      try {
          const response = await fetch(url);
          const blob = await response.blob();
          return new Promise((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve({ data: (reader.result as string).split(',')[1], mimeType: blob.type });
              reader.readAsDataURL(blob);
          });
      } catch (e) { return null; }
  };

  // Gestionare Modal Imagini
  const openImageModalForPost = (postId: string, content: string) => {
      setActivePostIdForImage(postId);
      setCurrentPromptForImage(content);
      setIsImageModalOpen(true);
  };

  const openImageModalGlobal = () => {
      setActivePostIdForImage(null);
      setCurrentPromptForImage(topic);
      setIsImageModalOpen(true);
  };

  const handleImageSelected = (url: string) => {
      if (activePostIdForImage) {
          // Update Post existent
          setPosts(prev => prev.map(p => p.id === activePostIdForImage ? { ...p, imageUrl: url } : p));
          updatePostInHistory(activePostIdForImage, { imageUrl: url });
      } else {
          // Update Input Principal
          setAttachedImage(url);
      }
      setIsImageModalOpen(false);
      setActivePostIdForImage(null);
  };

  // --- GENERATE ---
  const handleGenerate = async () => {
    if (!topic.trim() && !attachedImage) { 
        setError(appMode === 'remix' ? "Paste content to remix." : "Please write a topic."); 
        return; 
    }
    
    let count = 1;
    if (isCampaignMode) count = campaignCount;
    if (appMode === 'remix') count = remixFormats.length;
    
    const cost = useRealTime ? 10 : (1 * count);

    if (!checkCredits(cost)) { 
        if (isTrialExpired) return; 
        alert(`Insufficient credits! This action requires ${cost} credits.`); 
        return; 
    }

    setIsLoading(true); setError(null);
    try {
      let imgData = undefined, imgMime = undefined;
      if (attachedImage) {
          if (attachedImage.startsWith('data:')) {
              const parts = attachedImage.split(',');
              imgData = parts[1];
              imgMime = parts[0].split(':')[1].split(';')[0];
          } else {
              const converted = await urlToBase64(attachedImage);
              if(converted) { imgData = converted.data; imgMime = converted.mimeType; }
          }
      }

      const generatedPosts = await generateSocialMediaPosts(
          topic, tone, count, 
          brandProfile?.language || 'English',
          brandProfile?.voiceDNA || '',
          brandProfile || undefined, 
          imgData, imgMime, objective, useRealTime,
          isCampaignMode,
          appMode === 'remix',
          remixFormats
      );
      
      if (!generatedPosts || !Array.isArray(generatedPosts) || generatedPosts.length === 0) {
          throw new Error("AI returned an empty response. Please try again.");
      }

      // Determinare Tip
      let genType: GenerationType = 'single';
      if (appMode === 'remix') genType = 'remix';
      else if (isCampaignMode) genType = 'campaign';

      // --- LOGICA CRITICĂ DE SINCRONIZARE ID ---
      const newPostsData = generatedPosts.map(p => ({ 
          ...p, 
          id: crypto.randomUUID(), 
          adaptedContent: {}, 
          imageUrl: attachedImage || null, 
          isGeneratingImage: false, 
          isLocked: false,
          generationType: genType,
          type: p.type || 'post'
      }));

      // Actualizăm UI
      setPosts(prev => [...newPostsData, ...prev].slice(0, 10));
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      showVibe();

      // --- AUTO-SAVE ---
      if (user) {
          const limit = userProfile?.subscriptionTier === 'agency' ? 50 : 20;

          for (const postData of newPostsData) {
              try {
                  const savedId = await savePostToHistory(user.uid, postData, topic, limit);
                  if (savedId) {
                      setPosts(currentPosts => 
                          currentPosts.map(p => p.id === postData.id ? { ...p, id: savedId } : p)
                      );
                  }
              } catch (saveErr) { console.error("Save Failed:", saveErr); }
          }
      }

    } catch (err: any) { 
        console.error("Generate Error:", err);
        setError(err.message || 'Failed to generate content.'); 
    } finally { 
        setIsLoading(false); 
    }
  };

  const handleDeletePost = (id: string) => setPosts(prev => prev.filter(p => p.id !== id));
  const handleToggleLock = (id: string) => setPosts(prev => prev.map(p => p.id === id ? { ...p, isLocked: !p.isLocked } : p));
  const handleAdaptPost = async (id: string, platform: Platform, content: string) => { if (!checkCredits(1)) return; const adapted = await adaptPostForPlatform(content, platform); setPosts(prev => prev.map(p => p.id === id ? { ...p, adaptedContent: { ...p.adaptedContent, [platform]: adapted } } : p)); updatePostInHistory(id, { adaptedContent: { ...posts.find(pp=>pp.id===id)?.adaptedContent, [platform]: adapted } }); };
  const handleRefinePost = async (id: string, type: RefinementType, content: string) => { if (!checkCredits(1)) return; setRefiningPostId(id); const refined = await refinePostContent(content, type); setPosts(prev => prev.map(p => p.id === id ? { ...p, content: refined } : p)); updatePostInHistory(id, { content: refined }); setRefiningPostId(null); };

  const activePost = posts[0];
  const previewContent = activePost ? (activePost.adaptedContent[selectedPlatform] || activePost.content) : '';
  const isPremiumUser = userProfile?.subscriptionTier === 'pro' || userProfile?.subscriptionTier === 'agency';

  return (
    <MainLayout 
        onOpenBrandProfile={() => setIsBrandProfileModalOpen(true)}
        currentView={currentView}
        onViewChange={setCurrentView}
    >
        {vibeMessage && <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 animate-in fade-in bg-[#161b22] border border-blue-500/30 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3"><span className="text-xl">✨</span><span className="font-bold text-sm">{vibeMessage}</span></div>}
        {notification && <div className="fixed top-20 right-6 z-50 animate-in fade-in bg-blue-600 text-white px-6 py-4 rounded-xl shadow-2xl flex gap-3 cursor-pointer" onClick={() => setCurrentView('history')}><div><p className="font-bold text-sm">Reminder</p><p className="text-xs opacity-90">{notification}</p></div></div>}
        {isTrialExpired && <div className="absolute inset-0 z-50 bg-black/80 flex items-center justify-center rounded-xl"><div className="bg-[#161b22] border border-red-500 p-8 rounded-2xl text-center"><Lock size={32} className="mx-auto mb-4 text-red-500"/><h2 className="text-2xl font-bold text-white">Trial Expired</h2><div className="mt-4 text-xs bg-gray-900 p-2 rounded">Click UPGRADE PLAN</div></div></div>}

        {currentView === 'history' ? <HistoryView /> : currentView === 'calendar' ? <CalendarView onNavigateToVault={() => setCurrentView('history')} /> : (
            <div className="flex h-full gap-6 relative">
                <div className="flex-1 min-w-0">
                    <div className="max-w-2xl mx-auto pb-20">
                        <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <h2 className="text-3xl font-bold text-white tracking-tight">{appMode === 'remix' ? 'Content Remix ♻️' : isCampaignMode ? 'Campaign Mode 🚀' : 'Creator Studio ✨'}</h2>
                                <p className="text-gray-500 text-sm mt-1">{appMode === 'remix' ? 'Turn one piece of content into multiple formats.' : isCampaignMode ? 'Generate a full content calendar.' : 'Craft one perfect viral post.'}</p>
                            </div>
                            <div className="flex bg-[#161b22] p-1 rounded-xl border border-gray-700 overflow-x-auto">
                                <button onClick={() => handleSwitchMode('single')} className={`px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition ${appMode === 'creator' && !isCampaignMode ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}>Single</button>
                                <button onClick={() => handleSwitchMode('campaign')} className={`px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition ${appMode === 'creator' && isCampaignMode ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}>Campaign</button>
                                <button onClick={() => handleSwitchMode('remix')} className={`px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition ${appMode === 'remix' ? 'bg-green-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}>Remix</button>
                            </div>
                        </header>
                        <div className="space-y-8">
                            <section className="space-y-3">
                                <div className="flex items-center justify-between"><label className="text-sm font-bold text-gray-300 uppercase tracking-wider flex items-center gap-2"><span className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center text-[10px] text-white">1</span> {appMode === 'remix' ? 'Source Content' : "What's on your mind?"}</label>{attachedImage && <span className="text-xs text-green-400 flex items-center gap-1"><ImageIcon size={12}/> Image Attached</span>}</div>
                                <div className="relative group">
                                    <textarea value={topic} onChange={(e) => setTopic(e.target.value)} rows={appMode === 'remix' ? 6 : 3} placeholder={appMode === 'remix' ? "Paste content to remix..." : "E.g. 3 tips for crypto..."} className="w-full bg-[#161b22] border border-gray-700 rounded-xl p-4 pr-14 focus:ring-2 focus:ring-blue-500 outline-none resize-none text-white placeholder-gray-600 text-lg transition-all" />
                                    <div className="absolute bottom-3 right-3 flex gap-2">
                                        {attachedImage ? <button onClick={() => setAttachedImage(null)} className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover/img:opacity-100"><X size={14} className="text-white"/></button> : <button onClick={openImageModalGlobal} className="p-2.5 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white rounded-lg transition-all border border-transparent hover:border-gray-600"><ImageIcon size={20} /></button>}
                                    </div>
                                </div>

                                {appMode === 'remix' && (
                                    <section className="bg-green-900/10 border border-green-500/30 p-4 rounded-xl animate-in fade-in">
                                        <div className="flex justify-between items-center mb-3"><label className="text-xs font-bold text-green-400 uppercase flex items-center gap-2"><Repeat size={14} /> Remix Formats</label><span className="text-[10px] text-green-300 bg-green-900/30 px-2 py-0.5 rounded">{remixFormats.length} Selected</span></div>
                                        <div className="flex flex-wrap gap-2">
                                            {['LinkedIn Post', 'Twitter Thread', 'TikTok Script', 'Instagram Carousel', 'Newsletter Email', 'Facebook Story'].map(fmt => (
                                                <button key={fmt} onClick={() => toggleRemixFormat(fmt)} className={`px-3 py-2 rounded-lg text-xs border transition ${remixFormats.includes(fmt) ? 'bg-green-600 border-green-500 text-white shadow-lg' : 'bg-[#0f1115] border-gray-700 text-gray-400 hover:border-gray-500'}`}>{fmt}</button>
                                            ))}
                                        </div>
                                    </section>
                                )}
                                {isCampaignMode && appMode === 'creator' && (
                                    <section className="bg-purple-900/10 border border-purple-500/30 p-4 rounded-xl animate-in fade-in slide-in-from-top-2 mt-4">
                                        <div className="flex justify-between items-center mb-2"><label className="text-xs font-bold text-purple-300 uppercase flex items-center gap-2"><BriefcaseIcon size={14} /> Campaign Length</label><span className="text-xs font-bold text-white bg-purple-600 px-2 py-1 rounded">{campaignCount} Posts</span></div>
                                        <input type="range" min="3" max={userProfile?.subscriptionTier === 'agency' ? 30 : (userProfile?.subscriptionTier === 'pro' ? 7 : 3)} value={campaignCount} onChange={(e) => setCampaignCount(parseInt(e.target.value))} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500" />
                                    </section>
                                )}
                                <div className="flex items-center justify-between mt-2 px-1">
                                    {isPremiumUser ? <label className="flex items-center gap-2 cursor-pointer group"><div className="relative"><input type="checkbox" checked={useRealTime} onChange={e => setUseRealTime(e.target.checked)} className="sr-only peer" /><div className="w-9 h-5 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-500"></div></div><span className={`text-xs font-bold flex items-center gap-1 ${useRealTime ? 'text-blue-400' : 'text-gray-500'}`}><Globe size={12} /> Real-Time Data <span className="opacity-60 font-normal ml-1 text-[10px]">(10 Cr)</span></span></label> : <div className="flex items-center gap-2 opacity-50 cursor-not-allowed"><Globe size={12} /><span className="text-xs text-gray-500">Real-Time Data (PRO)</span></div>}
                                </div>
                            </section>

                            <section className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase">Tone of Voice</label>
                                    <select 
                                        value={tone} 
                                        onChange={(e) => setTone(e.target.value as Tone)} 
                                        className="w-full bg-[#161b22] border border-gray-700 text-white rounded-lg px-3 py-3 outline-none text-sm"
                                    >
                                        {TONES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase">Preview Platform</label>
                                    <select 
                                        value={selectedPlatform} 
                                        onChange={(e) => setSelectedPlatform(e.target.value as Platform)} 
                                        className="w-full bg-[#161b22] border border-gray-700 text-white rounded-lg px-3 py-3 outline-none text-sm"
                                    >
                                        {PLATFORMS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                                    </select>
                                </div>
                            </section>
                            
                            <button onClick={handleGenerate} disabled={isLoading || isTrialExpired} className="w-full py-4 rounded-xl font-bold text-lg bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-[length:200%_auto] animate-gradient text-white flex items-center justify-center gap-3 hover:scale-[1.01] transition-all shadow-xl shadow-blue-900/30 disabled:opacity-70 disabled:cursor-not-allowed">
                                {isLoading ? <Loader /> : <SparklesIcon className="w-6 h-6" />} {isLoading ? (appMode === 'remix' ? 'Remixing...' : isCampaignMode ? 'Launching Campaign...' : 'Creating Magic...') : (appMode === 'remix' ? 'Remix Content ♻️' : isCampaignMode ? 'Generate Campaign 🚀' : 'Craft my Post ✨')}
                            </button>

                            {error && <div className="p-3 bg-red-900/20 border border-red-800/50 rounded-lg text-red-400 text-sm text-center flex items-center justify-center gap-2"><BriefcaseIcon size={16} /> {error}</div>}

                            <div ref={resultsRef} className="scroll-mt-24">
                                {posts.length > 0 && (
                                    <div className="space-y-6 mt-10 pt-10 border-t border-gray-800 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                        <div className="flex items-center justify-between"><h3 className="font-bold text-xl text-white">Generated Results</h3><span className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded">{posts.length} variations</span></div>
                                        {posts.map(post => <PostCard key={post.id} post={post} isRefining={refiningPostId === post.id} onGenerateImage={(id, content) => openImageModalForPost(id, content)} onAdaptPost={handleAdaptPost} onRefinePost={handleRefinePost} onDelete={handleDeletePost} onToggleLock={handleToggleLock} onManualEdit={(id, newContent) => { setPosts(prev => prev.map(p => p.id === id ? { ...p, content: newContent } : p)); updatePostInHistory(id, { content: newContent }); }} onSchedule={async (id, date) => { await schedulePost(id, date); setPosts(prev => prev.map(p => p.id === id ? { ...p, scheduledDate: date } : p)); }} onMarkPublished={async (id) => { await markPostAsPublished(id); setPosts(prev => prev.map(p => p.id === id ? { ...p, isPublished: true } : p)); }} />)}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="hidden xl:block w-[400px] shrink-0">
                    <div className="sticky top-6"><PhonePreview platform={selectedPlatform} content={previewContent} imageUrl={activePost?.imageUrl || attachedImage || null} isGenerating={isLoading} isImageGenerating={activePost?.isGeneratingImage || false} topic={topic} userName={user?.displayName || user?.email?.split('@')[0]} userImage={user?.photoURL} /></div>
                </div>
            </div>
        )}

        {isImageModalOpen && <ImageCreationModal onClose={() => setIsImageModalOpen(false)} onSelectImage={handleImageSelected} initialPrompt={currentPromptForImage} />}
        {isBrandProfileModalOpen && <BrandProfileModal currentProfile={brandProfile} onSave={saveBrandProfile} onClose={() => setIsBrandProfileModalOpen(false)} />}
    </MainLayout>
  );
};

const AppContent: React.FC = () => {
    const { user, loading, signIn } = useAuth();
    if (loading) return <div className="min-h-screen bg-[#0f1115] flex items-center justify-center"><div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>;
    if (user) return <SocialSparkApp />;
    return <LandingPage onLogin={signIn} />;
};

const App: React.FC = () => (<AuthProvider><AppContent /></AuthProvider>);
export default App;
