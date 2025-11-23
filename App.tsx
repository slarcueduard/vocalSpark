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
      if (appMode === 'creator' && viralHook) finalTopic = `${viralHook}: ${topic}`;
      const count = isCampaignMode && appMode === 'business' ? 3 : 1;
      
      const generatedPosts = await generateSocialMediaPosts(finalTopic, tone, count, 'English', '', (appMode === 'business' && brandProfile) ? brandProfile : undefined);
      
      const newPosts: Post[] = generatedPosts.map(p => ({ ...p, id: crypto.randomUUID(), adaptedContent: {}, imageUrl: attachedImage || null, isGeneratingImage: !attachedImage, isLocked: false }));
      setPosts(prev => [...newPosts, ...prev].slice(0, 6));
      
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

  // Helper functions reduse pentru claritate
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

  return (
    <MainLayout 
        user={user} onSignOut={logout} 
        onOpenImageStudio={() => checkImageLimit() ? setIsImageModalOpen(true) : setShowPricing(true)}
        onOpenBrandProfile={() => setIsBrandProfileModalOpen(true)}
        currentMode={appMode} onSwitchMode={setAppMode}
    >
        {/* --- HEADER OBLIGATORIU --- */}
        <div className="bg-gray-900 border-b border-gray-700 px-6 py-3 flex justify-between items-center shadow-md sticky top-0 z-50">
           <div className="flex items-center gap-3 text-sm">
               <span className="text-red-500 font-bold text-xs border border-red-500 px-1 rounded">v1.1</span>
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
                    </header>
                    
                    {/* INPUTS */}
                    <div className="space-y-6">
                        <textarea value={topic} onChange={(e) => setTopic(e.target.value)} rows={3} placeholder="What to post?" className="w-full bg-brand-bg-dark border border-gray-700 rounded-xl p-4 focus:ring-2 focus:ring-brand-primary outline-none" />
                        
                        <button onClick={handleGenerate} disabled={isLoading} className="w-full py-4 rounded-xl font-bold text-lg bg-gradient-to-r from-brand-primary to-blue-600 text-white flex items-center justify-center gap-3 hover:scale-[1.02] transition">
                            {isLoading ? <Loader /> : <SparklesIcon className="w-6 h-6" />} {isLoading ? 'Generating...' : 'Generate Content'}
                        </button>

                        {/* RESULTS */}
                        {posts.length > 0 && (
                            <div className="space-y-6 mt-8">
                                {posts.map(post => (
                                    <PostCard key={post.id} post={post} isRefining={refiningPostId === post.id} onGenerateImage={handleGenerateImageForPost} onAdaptPost={handleAdaptPost} onRefinePost={handleRefinePost} onDelete={handleDeletePost} onToggleLock={handleToggleLock} />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
            
            {/* PREVIEW */}
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
