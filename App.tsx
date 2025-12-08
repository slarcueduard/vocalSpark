import React, { useState, useEffect, useRef } from 'react';
import { generateSocialMediaPosts, adaptPostForPlatform, refinePostContent } from './services/geminiService';
import { savePostToHistory, updatePostInHistory, schedulePost, markPostAsPublished, checkDuePosts } from './services/postService';
import { Post, Tone, Platform, AppMode, ViralHook, RefinementType, PostObjective, GenerationType } from './types';
import { TONES, PLATFORMS, OBJECTIVES, getRandomVibe } from './constants';
import { Loader } from './components/Loader';
import { SparklesIcon, ImageIcon, BriefcaseIcon } from './components/Icons';
import { Lock, X, HelpCircle, Globe, Bell, Repeat, CheckCircle, Fingerprint, Dices, Target } from 'lucide-react'; 
import { ImageCreationModal } from './components/ImageCreationModal';
import { BrandProfileModal } from './components/BrandProfileModal';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { MainLayout } from './layouts/MainLayout';
import { PhonePreview } from './components/PhonePreview';
import { PostCard } from './components/PostCard';
import { LandingPage } from './components/LandingPage';
import { HistoryView } from './components/HistoryView';
import { CalendarView } from './components/CalendarView';

const STRIPE_PAYMENT_LINK = "https://buy.stripe.com/test_..."; 

const HOOKS: ViralHook[] = ['Straight to the Point','Storytime', 'Controversial', 'Behind the Scenes', 'Myth vs Fact', 'Transformation','Unpopular Opinion','Day in the Life','Hack / Trick'];

const SocialSparkApp: React.FC = () => {
  const { user, brandProfile, saveBrandProfile, checkCredits, refundCredits, isTrialExpired, loading, userProfile, logout } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [currentView, setCurrentView] = useState<'create' | 'history' | 'calendar'>('create');
  
  // Starea pentru Moduri
  const [appMode, setAppMode] = useState<'creator' | 'remix'>('creator');
  const [isCampaignMode, setIsCampaignMode] = useState(false);
  
  const [topic, setTopic] = useState('');
  const [tone, setTone] = useState<Tone>(Tone.Inspirational);
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>(Platform.Instagram);
  const [objective, setObjective] = useState<PostObjective>('engagement');
  const [campaignCount, setCampaignCount] = useState(3);
  const [remixFormats, setRemixFormats] = useState<string[]>(['LinkedIn Post', 'Twitter Thread']);
  
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [posts, setPosts] = useState<Post[]>([]); 
  
  const [useRealTime, setUseRealTime] = useState(false);
  const [vibeMessage, setVibeMessage] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isBrandProfileModalOpen, setIsBrandProfileModalOpen] = useState(false);
  
  const [activePostIdForImage, setActivePostIdForImage] = useState<string | null>(null); 
  const [currentPromptForImage, setCurrentPromptForImage] = useState('');

  const [refiningPostId, setRefiningPostId] = useState<string | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // --- LOGICA FILTRARE VIZUALA ---
  const visiblePosts = posts.filter(post => {
      if (appMode === 'remix') {
          return post.generationType === 'remix';
      }
      if (isCampaignMode) {
          return post.generationType === 'campaign' || post.generationType === 'campaign_post';
      }
      return post.generationType === 'single' || post.generationType === 'post' || !post.generationType;
  });

  const showVibe = () => {
      setVibeMessage(getRandomVibe());
      setTimeout(() => setVibeMessage(null), 4000);
  };

  const handleSwitchMode = (mode: 'single' | 'campaign' | 'remix') => {
      setError(null);
      if (mode === 'single') { setAppMode('creator'); setIsCampaignMode(false); }
      else if (mode === 'campaign') { setAppMode('creator'); setIsCampaignMode(true); }
      else if (mode === 'remix') { setAppMode('remix'); setIsCampaignMode(false); }
  };

  const toggleRemixFormat = (fmt: string) => {
      if (remixFormats.includes(fmt)) { if (remixFormats.length > 1) setRemixFormats(prev => prev.filter(f => f !== fmt)); } 
      else { setRemixFormats(prev => [...prev, fmt]); }
  };

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

  useEffect(() => {
    if (!loading && brandProfile?.industry && topic === '' && posts.length === 0 && appMode === 'creator') {
        const lang = brandProfile.language || 'English';
        const niche = brandProfile.industry;
        let templates: string[] = [`3 tips for ${niche}`, `How to start in ${niche}`];
        if (lang === 'Romanian') templates = [`3 mituri despre ${niche}`, `Cum să începi cu ${niche}`, `Secrete din ${niche}`];
        setTopic(templates[Math.floor(Math.random() * templates.length)] || "");
    }
  }, [loading, brandProfile, appMode]); 

  const compressImage = async (imageUrl: string): Promise<string> => {
      return new Promise((resolve, reject) => {
          const img = new Image();
          img.crossOrigin = "Anonymous"; 
          img.onload = () => {
              const canvas = document.createElement('canvas');
              const MAX_WIDTH = 800; 
              const scaleSize = MAX_WIDTH / img.width;
              canvas.width = MAX_WIDTH;
              canvas.height = img.height * scaleSize;
              const ctx = canvas.getContext('2d');
              if (!ctx) { reject("Canvas error"); return; }
              ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
              const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
              resolve(dataUrl);
          };
          img.onerror = (err) => { console.error("Image load error", err); resolve(imageUrl); };
          img.src = imageUrl;
      });
  };

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

  const handleImageSelected = async (url: string) => {
      setIsLoading(true);
      try {
          const persistentUrl = await compressImage(url);
          
          if (activePostIdForImage) {
              setPosts(prev => prev.map(p => p.id === activePostIdForImage ? { ...p, imageUrl: persistentUrl } : p));
              await updatePostInHistory(activePostIdForImage, { imageUrl: persistentUrl });
          } else {
              setAttachedImage(persistentUrl);
          }
      } catch (e) {
          console.error("Image Error:", e);
          setAttachedImage(url); 
      } finally {
          setIsLoading(false);
          setIsImageModalOpen(false);
          setActivePostIdForImage(null);
      }
  };

  const handleLuckyGenerate = async () => {
      if (!checkCredits(1)) { if (isTrialExpired) return; alert(`Insufficient credits! This requires 1 credit.`); return; }

      setIsLoading(true); setError(null);
      try {
          const luckyTopic = "Generate a viral post about a trending topic in my niche. Surprise me.";
          
          const generatedPosts = await generateSocialMediaPosts(
              luckyTopic, tone, 1, brandProfile?.language || 'English', brandProfile?.voiceDNA || '',
              brandProfile || undefined, undefined, undefined, 'engagement', false, false, false, []
          );
          
          if (!generatedPosts || !Array.isArray(generatedPosts) || generatedPosts.length === 0) throw new Error("AI returned an empty response.");

          const newPostsData = generatedPosts.map(p => ({ 
              ...p, id: crypto.randomUUID(), adaptedContent: {}, imageUrl: null, isGeneratingImage: false, 
              isLocked: false, generationType: 'single', type: 'post'
          }));

          setPosts(prev => [...newPostsData, ...prev].slice(0, 10));
          setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
          setVibeMessage("🎲 You got lucky! Check this out."); 

          if (user) {
              const limit = userProfile?.subscriptionTier === 'agency' ? 50 : 20;
              for (const postData of newPostsData) {
                  await savePostToHistory(user.uid, postData, "I'm Feeling Lucky 🎲", limit);
              }
          }
      } catch (err: any) { setError(err.message || 'Failed to generate lucky post.'); refundCredits(1); } 
      finally { setIsLoading(false); }
  };

  const handleGenerate = async () => {
    if (!topic.trim() && !attachedImage) { setError(appMode === 'remix' ? "Paste content to remix." : "Please write a topic."); return; }
    
    let count = 1;
    if (isCampaignMode) count = campaignCount;
    if (appMode === 'remix') count = remixFormats.length;
    
    const cost = useRealTime ? 10 : (1 * count);

    if (!checkCredits(cost)) { if (isTrialExpired) return; alert(`Insufficient credits! This action requires ${cost} credits.`); return; }

    setIsLoading(true); setError(null);
    try {
      let imgData = undefined, imgMime = undefined;
      
      if (attachedImage) {
          if (attachedImage.startsWith('data:')) {
              const parts = attachedImage.split(',');
              imgData = parts[1];
              imgMime = parts[0].split(':')[1].split(';')[0];
          }
      }

      const generatedPosts = await generateSocialMediaPosts(
          topic, tone, count, brandProfile?.language || 'English', brandProfile?.voiceDNA || '',
          brandProfile || undefined, imgData, imgMime, objective, useRealTime, isCampaignMode, appMode === 'remix', remixFormats
      );
      
      if (!generatedPosts || !Array.isArray(generatedPosts) || generatedPosts.length === 0) throw new Error("AI returned an empty response.");

      let genType: GenerationType = 'single';
      if (appMode === 'remix') genType = 'remix';
      else if (isCampaignMode) genType = 'campaign';

      const newPostsData = generatedPosts.map(p => ({ 
          ...p, id: crypto.randomUUID(), adaptedContent: {}, 
          imageUrl: attachedImage || null, 
          isGeneratingImage: false, isLocked: false, generationType: genType, type: p.type || 'post'
      }));

      setPosts(prev => [...newPostsData, ...prev].slice(0, 10));
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      showVibe();

      if (user) {
          const limit = userProfile?.subscriptionTier === 'agency' ? 50 : 20;
          for (const postData of newPostsData) {
              await savePostToHistory(user.uid, postData, topic, limit);
          }
      }
    } catch (err: any) { 
        setError(err.message || 'Failed to generate content.'); 
        refundCredits(cost);
    } 
    finally { setIsLoading(false); }
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
        
        {isTrialExpired && (
            <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-[#161b22] border border-red-500/50 p-8 rounded-2xl text-center max-w-md w-full shadow-2xl shadow-red-900/20 animate-in fade-in zoom-in duration-300">
                    <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6"><Lock size={32} className="text-red-500"/></div>
                    <h2 className="text-2xl font-bold text-white mb-2">Trial Expired</h2>
                    <p className="text-gray-400 mb-8">You've used all your free credits. Upgrade to Pro to continue creating viral content.</p>
                    <div className="space-y-3">
                        <button onClick={() => { if (STRIPE_PAYMENT_LINK.includes("buy.stripe.com")) { window.location.href = STRIPE_PAYMENT_LINK; } else { alert("Dev: Configureaza link-ul Stripe in App.tsx!"); }}} className="w-full py-3 bg-gradient-to-r from-red-600 to-orange-600 text-white font-bold rounded-lg hover:scale-[1.02] transition shadow-lg shadow-red-900/30">Upgrade to PRO ($12.99)</button>
                        <button onClick={() => logout()} className="w-full py-3 bg-gray-800 text-gray-300 font-medium rounded-lg hover:bg-gray-700 hover:text-white transition border border-gray-700">Sign Out</button>
                    </div>
                    <button onClick={() => { if(confirm("Dev: Reset Credits?")) { window.location.reload(); }}} className="mt-8 text-[10px] text-gray-600 hover:text-gray-400 cursor-pointer transition">[Dev Mode: How to Reset?]</button>
                </div>
            </div>
        )}

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
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-bold text-gray-300 uppercase tracking-wider flex items-center gap-2">
                                        <span className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center text-[10px] text-white">1</span> 
                                        {appMode === 'remix' ? 'Source Content' : "What's on your mind?"}
                                    </label>
                                    <div className="flex items-center gap-3">
                                        {brandProfile && (
                                            <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-2">
                                                <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider hidden sm:block">Writing as:</span>
                                                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-900/20 border border-blue-500/30 text-blue-300 text-xs font-medium shadow-sm">
                                                    <Fingerprint size={12} /><span>{brandProfile.name || "Default"}</span>
                                                </div>
                                            </div>
                                        )}
                                        {attachedImage && (
                                            <div className="flex items-center gap-2 bg-green-900/20 px-2 py-1 rounded-full border border-green-500/30 animate-in fade-in">
                                                <span className="text-xs text-green-400 flex items-center gap-1"><ImageIcon size={12}/> Image Attached</span>
                                                <button onClick={() => setAttachedImage(null)} className="text-green-500 hover:text-white transition rounded-full p-0.5 hover:bg-green-800"><X size={10} /></button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="relative group">
                                    <textarea value={topic} onChange={(e) => setTopic(e.target.value)} rows={appMode === 'remix' ? 6 : 3} placeholder={appMode === 'remix' ? "Paste content to remix..." : "E.g. 3 tips for crypto..."} className="w-full bg-[#161b22] border border-gray-700 rounded-xl p-4 pr-14 focus:ring-2 focus:ring-blue-500 outline-none resize-none text-white placeholder-gray-600 text-lg transition-all" />
                                    <div className="absolute bottom-3 right-3 flex gap-2">
                                        {attachedImage ? null : <button onClick={openImageModalGlobal} className="p-2.5 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white rounded-lg transition-all border border-transparent hover:border-gray-600"><ImageIcon size={20} /></button>}
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

                            <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-1.5 h-4"><Target size={12}/> Goal</label>
                                    <div className="relative"><select value={objective} onChange={(e) => setObjective(e.target.value as PostObjective)} className="w-full bg-[#161b22] border border-gray-700 text-white rounded-xl px-4 py-3 text-sm appearance-none focus:border-blue-500 focus:outline-none transition hover:border-gray-600">{OBJECTIVES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select></div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-1.5 h-4"><SparklesIcon className="w-3 h-3"/> Tone</label>
                                    <div className="relative"><select value={tone} onChange={(e) => setTone(e.target.value as Tone)} className="w-full bg-[#161b22] border border-gray-700 text-white rounded-xl px-4 py-3 text-sm appearance-none focus:border-blue-500 focus:outline-none transition hover:border-gray-600">{TONES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}</select></div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-1.5 h-4"><Globe size={12}/> Platform</label>
                                    <div className="relative"><select value={selectedPlatform} onChange={(e) => setSelectedPlatform(e.target.value as Platform)} className="w-full bg-[#161b22] border border-gray-700 text-white rounded-xl px-4 py-3 text-sm appearance-none focus:border-blue-500 focus:outline-none transition hover:border-gray-600">{PLATFORMS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}</select></div>
                                </div>
                            </section>
                            
                            <div className="flex gap-3">
                                <button onClick={handleLuckyGenerate} disabled={isLoading || isTrialExpired} className="px-4 py-4 rounded-xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 text-white flex items-center justify-center gap-2 hover:scale-105 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed group" title="I'm Feeling Lucky (Text Only)">
                                    <Dices className={`w-6 h-6 ${isLoading ? 'animate-spin' : 'group-hover:rotate-12 transition-transform'}`} />
                                </button>
                                <button onClick={handleGenerate} disabled={isLoading || isTrialExpired} className="flex-1 py-4 rounded-xl font-bold text-lg bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-[length:200%_auto] animate-gradient text-white flex items-center justify-center gap-3 hover:scale-[1.01] transition-all shadow-xl shadow-blue-900/30 disabled:opacity-70 disabled:cursor-not-allowed">
                                    {isLoading ? <Loader /> : <SparklesIcon className="w-6 h-6" />} 
                                    {isLoading ? (appMode === 'remix' ? 'Remixing...' : isCampaignMode ? 'Launching Campaign...' : 'Creating Magic...') : (appMode === 'remix' ? 'Remix Content ♻️' : isCampaignMode ? 'Generate Campaign 🚀' : 'Craft my Post ✨')}
                                </button>
                            </div>

                            {error && <div className="p-3 bg-red-900/20 border border-red-800/50 rounded-lg text-red-400 text-sm text-center flex items-center justify-center gap-2"><BriefcaseIcon size={16} /> {error}</div>}

                            <div ref={resultsRef} className="scroll-mt-24">
                                {visiblePosts.length > 0 && (
                                    <div className="space-y-6 mt-10 pt-10 border-t border-gray-800 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                        <div className="flex items-center justify-between"><h3 className="font-bold text-xl text-white">Generated Results</h3><span className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded">{visiblePosts.length} results</span></div>
                                        {visiblePosts.map(post => (
                                            <PostCard 
                                                key={post.id} 
                                                post={post} 
                                                isRefining={refiningPostId === post.id} 
                                                onGenerateImage={(id, content) => openImageModalForPost(id, content)} 
                                                onAdaptPost={handleAdaptPost} 
                                                onRefinePost={handleRefinePost} 
                                                onDelete={handleDeletePost} 
                                                onToggleLock={handleToggleLock} 
                                                onManualEdit={(id, newContent) => {
                                                    setPosts(prev => prev.map(p => p.id === id ? { ...p, content: newContent } : p));
                                                    updatePostInHistory(id, { content: newContent });
                                                }}
                                                onSchedule={async (id, date) => {
                                                    await schedulePost(id, date);
                                                    setPosts(prev => prev.map(p => p.id === id ? { ...p, scheduledDate: date } : p));
                                                }}
                                                onMarkPublished={async (id) => {
                                                    await markPostAsPublished(id);
                                                    setPosts(prev => prev.map(p => p.id === id ? { ...p, isPublished: true } : p));
                                                }}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="hidden xl:block w-[400px] shrink-0">
                    <div className="sticky top-6"><PhonePreview platform={selectedPlatform} content={attachedImage || activePost?.imageUrl || null} isGenerating={isLoading} isImageGenerating={activePost?.isGeneratingImage || false} topic={topic} userName={user?.displayName || user?.email?.split('@')[0]} userImage={user?.photoURL} /></div>
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
