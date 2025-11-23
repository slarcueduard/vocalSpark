import React, { useState, useEffect } from 'react';
import { generateSocialMediaPosts, generateImageForPost, adaptPostForPlatform, refinePostContent } from './services/geminiService';
import { Post, Tone, Platform, AppMode, ViralHook, RefinementType } from './types';
import { TONES, PLATFORMS } from './constants';
import { Loader } from './components/Loader';
import { SparklesIcon, MagicWandIcon, BriefcaseIcon, ImageIcon, TrashIcon, PaletteIcon, CheckCircleIcon } from './components/Icons';
import { ImageCreationModal } from './components/ImageCreationModal';
import { BrandProfileModal } from './components/BrandProfileModal';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AuthWrapper } from './components/AuthWrapper';
import { MainLayout } from './layouts/MainLayout';
import { PhonePreview } from './components/PhonePreview';
import { PostCard } from './components/PostCard';
import { PricingModal } from './components/PricingModal';

const TOPIC_HISTORY_KEY = 'socialSparkTopicHistory';
const HOOKS: ViralHook[] = ['Straight to the Point','Storytime', 'Controversial', 'Behind the Scenes', 'Myth vs Fact', 'Transformation','Unpopular Opinion','Day in the Life','Hack / Trick'];

const SocialSparkApp: React.FC = () => {
  const { user, logout, brandProfile, saveBrandProfile, userProfile, checkImageLimit, incrementImageCount } = useAuth();
  const [showPricing, setShowPricing] = useState(false);
  const [appMode, setAppMode] = useState<AppMode>('creator');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [topicHistory, setTopicHistory] = useState<string[]>([]);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isBrandProfileModalOpen, setIsBrandProfileModalOpen] = useState(false);
  const [showHookInfo, setShowHookInfo] = useState(false);
  const [refiningPostId, setRefiningPostId] = useState<string | null>(null);
  
  // Inputs
  const [topic, setTopic] = useState('');
  const [tone, setTone] = useState<Tone>(Tone.Inspirational);
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>(Platform.Instagram);
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [viralHook, setViralHook] = useState<ViralHook | ''>('');
  const [isCampaignMode, setIsCampaignMode] = useState(false);
  
  const [posts, setPosts] = useState<Post[]>([]);
  
  useEffect(() => {
    const saved = localStorage.getItem(TOPIC_HISTORY_KEY);
    if (saved) setTopicHistory(JSON.parse(saved));
  }, []);

  useEffect(() => {
    if (brandProfile && appMode === 'creator') setAppMode('business');
  }, [brandProfile]);

  const handleGenerate = async () => {
    if (!topic.trim()) { setError("Please enter a topic."); return; }
    setIsLoading(true); setError(null);
    try {
      let finalTopic = topic;
      if (appMode === 'creator' && viralHook) {
          if (viralHook === 'Straight to the Point') finalTopic = `Direct style: ${topic}`;
          else finalTopic = `${viralHook} style: ${topic}`;
      }
      const count = isCampaignMode && appMode === 'business' ? 3 : 1;
      
      const generatedPosts = await generateSocialMediaPosts(finalTopic, tone, count, 'English', '', (appMode === 'business' && brandProfile) ? brandProfile : undefined);
      
      const newPosts: Post[] = generatedPosts.map(p => ({ ...p, id: crypto.randomUUID(), adaptedContent: {}, imageUrl: attachedImage || null, isGeneratingImage: !attachedImage, isLocked: false }));
      setPosts(prev => [...newPosts, ...prev].slice(0, 6));
      
      // Auto-Generate Image Logic
      if (!attachedImage) {
          if (checkImageLimit()) {
            newPosts.forEach(async (post) => {
                try {
                    const url = await generateImageForPost(post.content);
                    await incrementImageCount();
                    setPosts(curr => curr.map(p => p.id === post.id ? { ...p, imageUrl: url, isGeneratingImage: false } : p));
                } catch (e) {
                    setPosts(curr => curr.map(p => p.id === post.id ? { ...p, isGeneratingImage: false } : p));
                }
            });
          } else {
             setPosts(curr => curr.map(p => ({...p, isGeneratingImage: false})));
          }
      }
    } catch (err) { setError('Generation failed.'); } 
    finally { setIsLoading(false); }
  };

  const handleGenerateImageForPost = async (postId: string, postContent: string) => {
    if (!checkImageLimit()) { setShowPricing(true); return; }
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, isGeneratingImage: true } : p));
    try {
        const url = await generateImageForPost(postContent);
        await incrementImageCount();
        setPosts(prev => prev.map(p => p.id === postId ? { ...p, imageUrl: url, isGeneratingImage: false } : p));
    } catch (error) {
        setPosts(prev => prev.map(p => p.id === postId ? { ...p, isGeneratingImage: false } : p));
    }
  };

  // Helper functions
  const handleDeletePost = (id: string) => setPosts(prev => prev.filter(p => p.id !== id));
  const handleToggleLock = (id: string) => setPosts(prev => prev.map(p => p.id === id ? { ...p, isLocked: !p.isLocked } : p));
  const handleAdaptPost = async (id: string, platform: Platform, content: string) => {
      const adapted = await adaptPostForPlatform(content, platform);
      setPosts(prev => prev.map(p => p.id === id ? { ...p, adaptedContent: { ...p.adaptedContent, [platform]: adapted } } : p));
  };
  const handleRefinePost = async (id: string, type: RefinementType, content: string) => {
      setRefiningPostId(id);
      const refined = await refinePostContent(content, type);
      setPosts(prev => prev.map(p => p.id === id ? { ...p, content: refined } : p));
      setRefiningPostId(null);
  };

  const activePost = posts[0];
  const previewContent = activePost ? (activePost.adaptedContent[selectedPlatform] || activePost.content) : '';

  const renderBrandVoiceCard = () => {
      if (appMode !== 'business') return null;
      return (
          <div className="bg-brand-bg-light border border-gray-700 rounded-xl p-4 mb-6 flex justify-between items-center">
              <div className="flex items-center gap-2">
                  <BriefcaseIcon className="w-5 h-5 text-brand-secondary" />
                  <div>
                      <h3 className="font-semibold text-brand-text text-sm">Brand Voice</h3>
                      <p className="text-xs text-gray-500">{brandProfile ? 'Active' : 'Not configured'}</p>
                  </div>
              </div>
              <button onClick={() => setIsBrandProfileModalOpen(true)} className="text-xs text-brand-secondary underline">Settings</button>
          </div>
      );
  };

  return (
    <MainLayout 
        user={user} onSignOut={logout} 
        onOpenImageStudio={() => checkImageLimit() ? setIsImageModalOpen(true) : setShowPricing(true)}
        onOpenBrandProfile={() => setIsBrandProfileModalOpen(true)}
        currentMode={appMode} onSwitchMode={setAppMode}
    >
        {/* HEADER v1.2 */}
        <div className="bg-gray-900 border-b border-gray-700 px-6 py-3 flex justify-between items-center shadow-md sticky top-0 z-50">
           <div className="flex items-center gap-3 text-sm">
               <span className="text-blue-400 font-bold text-xs border border-blue-400 px-1 rounded">v1.2</span>
               <div className="bg-gray-800 rounded-full px-3 py-1 border border-gray-600 flex items-center gap-2">
                   <SparklesIcon className="w-4 h-4 text-green-400" />
                   <span className="text-gray-300">Credits: <span className="text-white font-bold">{Math.max(0, (userProfile?.imageLimit || 5) - (userProfile?.imageCount || 0))}</span></span>
               </div>
           </div>
           <button onClick={() => setShowPricing(true)} className="bg-brand-primary text-black text-xs font-bold py-2 px-4 rounded hover:opacity-90 flex items-center gap-2">
               <BriefcaseIcon className="w-4 h-4" /> UPGRADE PLAN
           </button>
        </div>

        <div className="flex h-full w-full">
            <div className="flex-1 p-6 lg:p-10 overflow-y-auto border-r border-gray-800 custom-scrollbar">
                <div className="max-w-2xl mx-auto pb-20">
                    <header className="mb-8">
                        <h2 className="text-2xl font-bold">{appMode === 'creator' ? 'Creator Studio' : 'Business Hub'}</h2>
                        <p className="text-gray-500 text-sm mt-1">Create content that converts.</p>
                    </header>
                    
                    {renderBrandVoiceCard()}

                    {/* INPUTS */}
                    <div className="space-y-6">
                        
                        {/* 1. TOPIC */}
                        <div>
                            <label className="block text-sm font-medium mb-2 text-gray-300">What to post?</label>
                            <textarea value={topic} onChange={(e) => setTopic(e.target.value)} rows={3} placeholder="e.g. New coffee product launch..." className="w-full bg-brand-bg-dark border border-gray-700 rounded-xl p-4 focus:ring-2 focus:ring-brand-primary outline-none" />
                        </div>

                        {/* 2. VISUALS (BUTONUL RESTAURAT) */}
                        <div>
                             <label className="block text-sm font-medium mb-2 text-gray-300">Visuals</label>
                             {!attachedImage ? (
                                 <button 
                                    onClick={() => checkImageLimit() ? setIsImageModalOpen(true) : setShowPricing(true)}
                                    className="w-full border-2 border-dashed border-gray-700 rounded-xl p-4 flex flex-col items-center justify-center text-gray-400 hover:border-brand-primary hover:bg-brand-primary/5 transition"
                                 >
                                     <ImageIcon className="w-6 h-6 mb-2" />
                                     <span className="font-semibold text-sm">Add Image Manually</span>
                                     <span className="text-xs opacity-70">Upload or Generate with AI</span>
                                 </button>
                             ) : (
                                 <div className="relative rounded-xl overflow-hidden border border-gray-700 group h-48">
                                     <img src={attachedImage} alt="Selected" className="w-full h-full object-cover" />
                                     <button onClick={() => setAttachedImage(null)} className="absolute top-2 right-2 bg-red-500 p-1 rounded text-white"><TrashIcon className="w-4 h-4"/></button>
                                 </div>
                             )}
                        </div>

                        {/* 3. HOOKS & SETTINGS */}
                        {appMode === 'creator' && (
                            <div>
                                <label className="block text-sm font-medium mb-2 text-gray-300">Viral Strategy</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {HOOKS.map(hook => (
                                        <button key={hook} onClick={() => setViralHook(hook === viralHook ? '' : hook)} className={`py-2 px-2 rounded-lg text-[10px] font-medium border ${viralHook === hook ? 'bg-brand-primary text-white border-brand-primary' : 'border-gray-700 text-gray-400'}`}>
                                            {hook}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-2 text-gray-300">Tone</label>
                                <select value={tone} onChange={(e) => setTone(e.target.value as Tone)} className="w-full bg-brand-bg-dark border border-gray-700 rounded-lg px-3 py-3 outline-none text-sm">
                                    {TONES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2 text-gray-300">Preview</label>
                                <select value={selectedPlatform} onChange={(e) => setSelectedPlatform(e.target.value as Platform)} className="w-full bg-brand-bg-dark border border-gray-700 rounded-lg px-3 py-3 outline-none text-sm">
                                    {PLATFORMS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                                </select>
                            </div>
                        </div>
                        
                        {/* 4. ACTION */}
                        <button onClick={handleGenerate} disabled={isLoading} className="w-full py-4 rounded-xl font-bold text-lg bg-gradient-to-r from-brand-primary to-blue-600 text-white flex items-center justify-center gap-3 hover:scale-[1.02] transition shadow-lg shadow-brand-primary/20">
                            {isLoading ? <Loader /> : <SparklesIcon className="w-6 h-6" />} {isLoading ? 'Creating...' : 'Generate Content'}
                        </button>

                        {/* RESULTS */}
                        {posts.length > 0 && (
                            <div className="space-y-6 mt-8 pt-8 border-t border-gray-800">
                                <h3 className="font-bold text-lg">Your Results</h3>
                                {posts.map(post => (
                                    <PostCard key={post.id} post={post} isRefining={refiningPostId === post.id} onGenerateImage={handleGenerateImageForPost} onAdaptPost={handleAdaptPost} onRefinePost={handleRefinePost} onDelete={handleDeletePost} onToggleLock={handleToggleLock} />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
            
            {/* PREVIEW SIDEBAR */}
            <div className="hidden xl:flex w-[400px] bg-gray-900 flex-col items-center justify-center border-l border-gray-800">
                <div className="scale-90 origin-center">
                    <PhonePreview platform={selectedPlatform} content={previewContent} imageUrl={activePost?.imageUrl || attachedImage || null} isGenerating={isLoading} isImageGenerating={activePost?.isGeneratingImage || false} topic={topic} userName={user.displayName} userImage={user.photoURL} />
                </div>
            </div>
        </div>

        {isImageModalOpen && <ImageCreationModal onClose={() => setIsImageModalOpen(false)} onSelectImage={setAttachedImage} initialPrompt={topic} />}
        {isBrandProfileModalOpen && <BrandProfileModal currentProfile={brandProfile} onSave={saveBrandProfile} onClose={() => setIsBrandProfileModalOpen(false)} />}
        {showPricing && <PricingModal onClose={() => setShowPricing(false)} />}
    </MainLayout>
  );
};

const App: React.FC = () => (
    <AuthProvider><AuthWrapper><SocialSparkApp /></AuthWrapper></AuthProvider>
);
export default App;
