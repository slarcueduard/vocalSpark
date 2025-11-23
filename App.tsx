import React, { useState, useEffect, useCallback } from 'react';
import { 
    generateSocialMediaPosts, 
    generateImageForPost, 
    adaptPostForPlatform, 
    refinePostContent 
} from './services/geminiService';
import { Post, Tone, Platform, AppMode, ViralHook, RefinementType } from './types';
import { TONES, PLATFORMS } from './constants';
import { Loader } from './components/Loader';
import { 
    SparklesIcon, 
    MagicWandIcon,
    BriefcaseIcon,
    ImageIcon,
    TrashIcon,
    PaletteIcon,
    CheckCircleIcon
} from './components/Icons';
import { ImageCreationModal } from './components/ImageCreationModal';
import { BrandProfileModal } from './components/BrandProfileModal';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AuthWrapper } from './components/AuthWrapper';
import { MainLayout } from './layouts/MainLayout';
import { PhonePreview } from './components/PhonePreview';
import { PostCard } from './components/PostCard';
import { PricingModal } from './components/PricingModal';

const TOPIC_HISTORY_KEY = 'socialSparkTopicHistory';
const HOOKS: ViralHook[] = [
    'Straight to the Point',
    'Storytime', 
    'Controversial', 
    'Behind the Scenes', 
    'Myth vs Fact', 
    'Transformation',
    'Unpopular Opinion',
    'Day in the Life',
    'Hack / Trick'
];

// ... importurile rămân la fel ...

// În interiorul SocialSparkApp:

  return (
    <MainLayout 
        user={user} 
        onSignOut={logout} 
        onOpenImageStudio={() => {
            // Deschide Image Studio doar dacă are credite
            if(checkImageLimit()) {
                setIsImageModalOpen(true);
            } else {
                setShowPricing(true);
            }
        }}
        onOpenBrandProfile={() => setIsBrandProfileModalOpen(true)}
        currentMode={appMode}
        onSwitchMode={setAppMode}
    >
        {/* --- START NEW HEADER --- */}
        <div className="bg-gray-900 border-b border-gray-700 px-6 py-3 flex justify-between items-center shadow-md relative z-10">
           
           {/* Stânga: Credite */}
           <div className="flex items-center gap-3 text-sm">
               <div className="bg-gray-800 rounded-full px-3 py-1 border border-gray-600 flex items-center gap-2">
                   <SparklesIcon className={`w-4 h-4 ${userProfile?.imageCount >= userProfile?.imageLimit ? 'text-red-500' : 'text-green-400'}`} />
                   <span className="text-gray-300 font-medium">
                       AI Images: 
                       <span className="text-white ml-1 font-bold">
                           {Math.max(0, (userProfile?.imageLimit || 5) - (userProfile?.imageCount || 0))}
                       </span>
                       <span className="text-gray-500 mx-1">/</span>
                       <span className="text-gray-500">{userProfile?.imageLimit || 5}</span>
                   </span>
               </div>
               
               {/* Arată Trial Badge dacă e cazul */}
               {userProfile?.subscriptionTier === 'trial' && (
                   <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded border border-yellow-500/30">
                       Free Trial
                   </span>
               )}
           </div>

           {/* Dreapta: Buton Upgrade */}
           <button 
                onClick={() => setShowPricing(true)} 
                className="bg-gradient-to-r from-brand-primary to-blue-600 hover:opacity-90 text-white text-xs font-bold uppercase tracking-wide py-2 px-4 rounded-lg shadow-lg transition-transform transform hover:scale-105 flex items-center gap-2"
           >
               <BriefcaseIcon className="w-4 h-4" />
               View Plans & Upgrade
           </button>
        </div>
        {/* --- END NEW HEADER --- */}

        <div className="flex h-full w-full relative">
            {/* ... Restul codului (A. CENTER, B. RIGHT) rămâne exact la fel ... */}
            {/* Asigură-te că închizi corect div-urile */}

// Internal Component containing your main app logic
const SocialSparkApp: React.FC = () => {
  const { user, logout, brandProfile, saveBrandProfile } = useAuth();
  
  // -- NEW: CREDIT SYSTEM --
  const { userProfile, checkImageLimit, incrementImageCount } = useAuth();
  const [showPricing, setShowPricing] = useState(false);

  // -- GLOBAL STATE --
  const [appMode, setAppMode] = useState<AppMode>('creator');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [topicHistory, setTopicHistory] = useState<string[]>([]);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isBrandProfileModalOpen, setIsBrandProfileModalOpen] = useState(false);

  // -- UI STATE --
  const [showHookInfo, setShowHookInfo] = useState(false);
  const [refiningPostId, setRefiningPostId] = useState<string | null>(null);

  // -- EDITOR STATE --
  const [topic, setTopic] = useState('');
  const [tone, setTone] = useState<Tone>(Tone.Inspirational);
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>(Platform.Instagram);
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  
  // Creator Mode Specifics
  const [viralHook, setViralHook] = useState<ViralHook | ''>('');
  
  // Business Mode Specifics
  const [isCampaignMode, setIsCampaignMode] = useState(false);

  // -- GENERATED CONTENT STATE --
  const [posts, setPosts] = useState<Post[]>([]);
  
  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem(TOPIC_HISTORY_KEY);
      if (savedHistory) {
        setTopicHistory(JSON.parse(savedHistory));
      }
    } catch (e) {
      console.error("Failed to parse topic history from localStorage", e);
    }
  }, []);

  useEffect(() => {
    if (brandProfile && appMode === 'creator') {
        setAppMode('business');
    }
  }, [brandProfile]);

  const handleGenerate = async () => {
    if (!topic.trim()) {
        setError("Please enter a topic.");
        return;
    }

    setIsLoading(true);
    setError(null);

    try {
      let finalTopic = topic;
      if (appMode === 'creator' && viralHook) {
          if (viralHook === 'Straight to the Point') {
              finalTopic = `Write a social media post about: ${topic}. The style should be "Straight to the Point" - concise, direct, and impactful with no unnecessary fluff or lengthy intros.`;
          } else {
              finalTopic = `Create a "${viralHook}" style social media post about: ${topic}. Structure it specifically for this hook format.`;
          }
      }

      const count = isCampaignMode && appMode === 'business' ? 3 : 1;
      
      const generatedPosts = await generateSocialMediaPosts(
          finalTopic, 
          tone, 
          count, 
          'English', 
          '', 
          (appMode === 'business' && brandProfile) ? brandProfile : undefined
      );
      
      const newPosts: Post[] = generatedPosts.map(p => ({
        ...p,
        id: crypto.randomUUID(),
        adaptedContent: {},
        imageUrl: attachedImage || null, 
        isGeneratingImage: !attachedImage,
        isLocked: false
      }));

      setPosts(currentPosts => {
          let combined = [...newPosts, ...currentPosts];
          const maxPosts = 6;
          while (combined.length > maxPosts) {
              let indexToRemove = -1;
              for (let i = combined.length - 1; i >= 0; i--) {
                  if (!combined[i].isLocked) {
                      indexToRemove = i;
                      break;
                  }
              }
              if (indexToRemove !== -1) {
                  combined.splice(indexToRemove, 1);
              } else {
                  combined.pop();
              }
          }
          return combined;
      });
      
      if (!topicHistory.includes(topic)) {
        const newHistory = [topic, ...topicHistory].slice(0, 10);
        setTopicHistory(newHistory);
        localStorage.setItem(TOPIC_HISTORY_KEY, JSON.stringify(newHistory));
      }

      // -- NEW: AUTO IMAGE GENERATION WITH LIMIT CHECK --
      if (!attachedImage) {
          // Check limits BEFORE generating auto-images
          if (checkImageLimit()) {
            newPosts.forEach(async (post) => {
                try {
                    // Double check inside loop (optional but safer)
                    if(!checkImageLimit()) throw new Error("Limit Reached");

                    const generatedUrl = await generateImageForPost(
                        post.content, 
                        (appMode === 'business' && brandProfile) ? brandProfile : undefined
                    );
                    
                    // DECREMENT CREDIT
                    await incrementImageCount();

                    setPosts(currentPosts => 
                        currentPosts.map(p => p.id === post.id 
                            ? { ...p, imageUrl: generatedUrl, isGeneratingImage: false } 
                            : p
                        )
                    );
                } catch (err) {
                    console.error("Auto-image generation failed or limit reached", err);
                    setPosts(currentPosts => 
                        currentPosts.map(p => p.id === post.id 
                            ? { ...p, isGeneratingImage: false } 
                            : p
                        )
                    );
                }
            });
          } else {
             // If limit reached, just stop loading spinner for images
             setPosts(current => current.map(p => ({...p, isGeneratingImage: false})));
          }
      }

    } catch (err) {
      setError('Failed to generate content. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeletePost = (postId: string) => {
      setPosts(prev => prev.filter(p => p.id !== postId));
  };

  const handleToggleLock = (postId: string) => {
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, isLocked: !p.isLocked } : p));
  };

  // -- NEW: MANUAL IMAGE GENERATION WITH LIMIT CHECK --
  const handleGenerateImageForPost = async (postId: string, postContent: string) => {
    // 1. Check Limits
    if (!checkImageLimit()) {
        setShowPricing(true);
        return;
    }

    setPosts(prev => prev.map(p => p.id === postId ? { ...p, isGeneratingImage: true } : p));
    try {
        const imageUrl = await generateImageForPost(postContent, brandProfile || undefined);
        
        // 2. Decrement Credit
        await incrementImageCount();

        setPosts(prev => prev.map(p => p.id === postId ? { ...p, imageUrl, isGeneratingImage: false } : p));
    } catch (error) {
        console.error(error);
        setPosts(prev => prev.map(p => p.id === postId ? { ...p, isGeneratingImage: false } : p));
        alert("Failed to generate image. Please try again.");
    }
  };

  const handleAdaptPost = async (postId: string, platform: Platform, originalContent: string) => {
      try {
          const adapted = await adaptPostForPlatform(originalContent, platform);
          setPosts(prev => prev.map(p => {
              if (p.id === postId) {
                  return {
                      ...p,
                      adaptedContent: { ...p.adaptedContent, [platform]: adapted }
                  };
              }
              return p;
          }));
      } catch (error) {
          console.error(error);
          alert(`Failed to adapt post for ${platform}`);
      }
  };

  const handleRefinePost = async (postId: string, type: RefinementType, content: string) => {
      setRefiningPostId(postId);
      try {
          const refined = await refinePostContent(content, type);
          setPosts(prev => prev.map(p => p.id === postId ? { ...p, content: refined } : p));
      } catch (error) {
          console.error(error);
          alert("Failed to refine post.");
      } finally {
          setRefiningPostId(null);
      }
  };

  const getActivePost = () => posts.length > 0 ? posts[0] : null;
  const activePost = getActivePost();
  
  const previewContent = activePost 
    ? (activePost.adaptedContent[selectedPlatform] || activePost.content)
    : '';

  const renderBrandVoiceCard = () => {
      if (appMode !== 'business') return null;

      const hasProfile = !!brandProfile;
      const hasVoiceDNA = !!brandProfile?.voiceDNA;

      return (
          <div className="bg-brand-bg-light border border-gray-700 rounded-xl p-4 mb-6">
              <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2 mb-2">
                      <BriefcaseIcon className="w-5 h-5 text-brand-secondary" />
                      <h3 className="font-semibold text-brand-text">Brand Voice Memory</h3>
                  </div>
                  <button 
                    onClick={() => setIsBrandProfileModalOpen(true)}
                    className="text-xs text-brand-text-secondary hover:text-white underline"
                  >
                      {hasProfile ? 'Edit Settings' : 'Setup'}
                  </button>
              </div>
              
              {hasProfile ? (
                  <div className="text-sm text-brand-text-secondary">
                      <div className="flex items-center gap-2 text-green-400 mb-2">
                          <CheckCircleIcon className="w-4 h-4" />
                          <span className="text-xs font-semibold">Active</span>
                      </div>
                      <p className="line-clamp-2 italic mb-2">"{brandProfile.description}"</p>
                      
                      {hasVoiceDNA && (
                          <div className="bg-green-500/10 border border-green-500/20 rounded p-2 flex items-start gap-2">
                              <SparklesIcon className="w-3 h-3 text-green-400 mt-0.5" />
                              <div className="text-xs">
                                  <span className="text-green-400 font-bold block mb-0.5">Voice DNA Trained</span>
                                  <span className="text-gray-400 line-clamp-2">"{brandProfile.voiceDNA}"</span>
                              </div>
                          </div>
                      )}
                  </div>
              ) : (
                  <div className="text-sm text-brand-text-secondary">
                      <p>No brand profile detected.</p>
                      <button 
                        onClick={() => setIsBrandProfileModalOpen(true)}
                        className="mt-3 w-full py-2 border border-dashed border-gray-600 rounded-lg hover:border-brand-secondary hover:text-brand-secondary transition text-xs"
                      >
                          + Setup Brand Voice
                      </button>
                  </div>
              )}
          </div>
      );
  };

  if (!user) return <Loader />;

  return (
    <MainLayout 
        user={user} 
        onSignOut={logout} 
        onOpenImageStudio={() => {
            if(checkImageLimit()) {
                setIsImageModalOpen(true);
            } else {
                setShowPricing(true);
            }
        }}
        onOpenBrandProfile={() => setIsBrandProfileModalOpen(true)}
        currentMode={appMode}
        onSwitchMode={setAppMode}
    >
        {/* NEW: CREDIT BANNER */}
        <div className="bg-brand-bg-dark border-b border-gray-800 p-1 flex justify-center items-center gap-4 text-xs">
           {userProfile?.subscriptionTier === 'trial' ? (
             <span className="text-yellow-400 font-bold">
               Trial Active: {Math.max(0, (userProfile?.imageLimit || 5) - (userProfile?.imageCount || 0))} images left
             </span>
           ) : (
             <span className="text-brand-primary font-bold">
               Credits: {Math.max(0, (userProfile?.imageLimit || 50) - (userProfile?.imageCount || 0))} left
             </span>
           )}
           <button onClick={() => setShowPricing(true)} className="underline text-gray-500 hover:text-white">Upgrade Plan</button>
        </div>

        <div className="flex h-full w-full">
            
            {/* A. CENTER: EDITOR */}
            <div className="flex-1 p-6 lg:p-10 overflow-y-auto border-r border-gray-800 custom-scrollbar">
                <div className="max-w-2xl mx-auto pb-20">
                    <header className="mb-8">
                        <div className="flex items-center gap-3 mb-1">
                            {appMode === 'creator' ? (
                                <PaletteIcon className="w-6 h-6 text-brand-primary" />
                            ) : (
                                <BriefcaseIcon className="w-6 h-6 text-brand-secondary" />
                            )}
                            <h2 className="text-2xl font-bold">
                                {appMode === 'creator' ? 'Creator Studio' : 'Business Hub'}
                            </h2>
                        </div>
                        <p className="text-brand-text-secondary">
                            {appMode === 'creator' 
                                ? 'Design viral content with hooks and visuals.' 
                                : 'Strategize campaigns aligned with your brand voice.'}
                        </p>
                    </header>

                    {renderBrandVoiceCard()}

                    {/* INPUTS */}
                    <div className="space-y-6">
                        {/* Topic */}
                        <div>
                            <label className="block text-sm font-medium mb-2 text-gray-300">
                                {appMode === 'creator' ? 'What do you want to post about?' : 'Campaign Topic / Focus'}
                            </label>
                            <textarea 
                                value={topic}
                                onChange={(e) => setTopic(e.target.value)}
                                rows={appMode === 'business' ? 2 : 3}
                                placeholder={appMode === 'creator' ? "e.g., My morning routine..." : "e.g., Launching our new summer collection..."}
                                className="w-full bg-brand-bg-dark border border-gray-700 rounded-xl p-4 focus:ring-2 focus:ring-brand-primary focus:border-transparent outline-none transition text-lg"
                            />
                        </div>

                        {/* Visuals Section */}
                        <div>
                             <label className="block text-sm font-medium mb-2 text-gray-300">Visuals (Optional)</label>
                             {!attachedImage ? (
                                 <button 
                                    onClick={() => {
                                        if(checkImageLimit()) {
                                            setIsImageModalOpen(true);
                                        } else {
                                            setShowPricing(true);
                                        }
                                    }}
                                    className="w-full border-2 border-dashed border-gray-700 rounded-xl p-4 flex flex-col items-center justify-center text-brand-text-secondary hover:border-brand-secondary hover:bg-brand-secondary/5 transition group"
                                 >
                                     <ImageIcon className="w-8 h-8 mb-2 group-hover:scale-110 transition" />
                                     <span className="font-semibold">Add Image Manually</span>
                                     <span className="text-xs mt-1">Upload & Remix or Generate with AI</span>
                                     <span className="text-[10px] text-brand-primary mt-2 bg-brand-primary/10 px-2 py-0.5 rounded">
                                         Leave empty to auto-generate an image
                                     </span>
                                 </button>
                             ) : (
                                 <div className="relative rounded-xl overflow-hidden border border-gray-700 group">
                                     <img src={attachedImage} alt="Selected" className="w-full h-48 object-cover" />
                                     <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-3">
                                         <button 
                                            onClick={() => setIsImageModalOpen(true)}
                                            className="bg-white text-black px-3 py-1.5 rounded-lg text-sm font-bold hover:bg-gray-200"
                                         >
                                             Replace
                                         </button>
                                         <button 
                                            onClick={() => setAttachedImage(null)}
                                            className="bg-red-500 text-white p-1.5 rounded-lg hover:bg-red-600"
                                         >
                                             <TrashIcon className="w-5 h-5" />
                                         </button>
                                     </div>
                                 </div>
                             )}
                        </div>

                        {/* Creator Mode: Hooks */}
                        {appMode === 'creator' && (
                            <div className="relative">
                                <div className="flex items-center gap-2 mb-2">
                                    <label className="block text-sm font-medium text-gray-300">Viral Hook Strategy</label>
                                    <button 
                                        onClick={() => setShowHookInfo(!showHookInfo)}
                                        className="text-gray-500 hover:text-white"
                                    >
                                        <div className="w-4 h-4 border border-current rounded-full flex items-center justify-center text-[10px] font-serif">i</div>
                                    </button>
                                </div>
                                
                                {showHookInfo && (
                                    <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg text-xs text-blue-200 leading-relaxed">
                                        <strong className="block mb-1 text-blue-100">What is a Viral Hook?</strong>
                                        A "Hook" is the specific angle or opening line designed to stop people from scrolling.
                                    </div>
                                )}

                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                    {HOOKS.map(hook => (
                                        <button
                                            key={hook}
                                            onClick={() => setViralHook(hook === viralHook ? '' : hook)}
                                            className={`py-2 px-3 rounded-lg text-xs font-medium border transition-all ${
                                                viralHook === hook 
                                                ? 'bg-brand-primary text-white border-brand-primary' 
                                                : 'bg-transparent border-gray-700 text-gray-400 hover:border-gray-500'
                                            }`}
                                        >
                                            {hook}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Controls Row */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-2 text-gray-300">Tone</label>
                                <select 
                                    value={tone}
                                    onChange={(e) => setTone(e.target.value as Tone)}
                                    className="w-full bg-brand-bg-dark border border-gray-700 rounded-lg px-3 py-3 focus:ring-2 focus:ring-brand-primary outline-none"
                                >
                                    {TONES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2 text-gray-300">Preview Platform</label>
                                <select 
                                    value={selectedPlatform}
                                    onChange={(e) => setSelectedPlatform(e.target.value as Platform)}
                                    className="w-full bg-brand-bg-dark border border-gray-700 rounded-lg px-3 py-3 focus:ring-2 focus:ring-brand-secondary outline-none"
                                >
                                    {PLATFORMS.map(p => (
                                        <option key={p.value} value={p.value}>{p.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {appMode === 'business' && (
                             <div className="flex items-center gap-3 p-4 bg-brand-bg-dark rounded-xl border border-gray-700/50">
                                <input 
                                    type="checkbox" 
                                    id="campaignMode"
                                    checked={isCampaignMode}
                                    onChange={(e) => setIsCampaignMode(e.target.checked)}
                                    className="w-5 h-5 rounded text-brand-secondary focus:ring-brand-secondary bg-gray-800 border-gray-600"
                                />
                                <label htmlFor="campaignMode" className="cursor-pointer select-none">
                                    <span className="block font-medium">Enable Campaign Mode</span>
                                    <span className="text-xs text-gray-500">Generates a 3-post series instead of a single post.</span>
                                </label>
                            </div>
                        )}

                        {error && (
                            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm text-center">
                                {error}
                            </div>
                        )}

                        <button 
                            onClick={handleGenerate}
                            disabled={isLoading}
                            className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg transform transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3 ${
                                appMode === 'creator' 
                                ? 'bg-gradient-to-r from-brand-primary to-blue-600 text-white' 
                                : 'bg-gradient-to-r from-brand-secondary to-cyan-600 text-white'
                            } ${isLoading ? 'opacity-75 cursor-not-allowed' : ''}`}
                        >
                            {isLoading ? <Loader /> : <SparklesIcon className="w-6 h-6" />}
                            {isLoading ? 'Creating Magic...' : 'Generate Content'}
                        </button>

                        {/* GENERATED RESULTS */}
                        {posts.length > 0 && (
                            <div className="mt-8 animate-fadeIn">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-bold text-lg flex items-center gap-2">
                                        <MagicWandIcon className="w-5 h-5 text-brand-secondary" />
                                        Your Posts ({posts.length}/6)
                                    </h3>
                                    {posts.length >= 6 && <span className="text-xs text-orange-400">Max limit reached</span>}
                                </div>
                                <div className="space-y-6">
                                    {posts.map((post, idx) => (
                                        <div key={post.id} className="animate-fadeIn">
                                            <PostCard
                                                post={post}
                                                isRefining={refiningPostId === post.id}
                                                onGenerateImage={handleGenerateImageForPost}
                                                onAdaptPost={handleAdaptPost}
                                                onRefinePost={handleRefinePost}
                                                onDelete={handleDeletePost}
                                                onToggleLock={handleToggleLock}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                    </div>
                </div>
            </div>

            {/* B. RIGHT: LIVE PREVIEW */}
            <div className="hidden xl:flex w-[400px] bg-gray-900 flex-col items-center justify-center border-l border-gray-800 relative">
                <div className="absolute top-4 left-0 w-full text-center">
                    <h3 className="text-xs font-bold tracking-widest text-gray-500 uppercase">Live Preview</h3>
                </div>
                
                <div className="scale-90 origin-center mt-8">
                    <PhonePreview 
                        platform={selectedPlatform}
                        content={previewContent}
                        imageUrl={activePost?.imageUrl || attachedImage || null}
                        isGenerating={isLoading}
                        isImageGenerating={activePost?.isGeneratingImage || false}
                        topic={topic}
                        userName={user.displayName}
                        userImage={user.photoURL}
                    />
                </div>

                <div className="absolute bottom-4 text-center px-6">
                    <p className="text-xs text-gray-500">
                        Previewing {selectedPlatform}. Layouts are simulated.
                    </p>
                </div>
            </div>
        </div>

        {/* Modals */}
        {isImageModalOpen && (
            <ImageCreationModal 
                onClose={() => setIsImageModalOpen(false)} 
                onSelectImage={(url) => setAttachedImage(url)}
                initialPrompt={topic}
            />
        )}
        {isBrandProfileModalOpen && (
            <BrandProfileModal
                currentProfile={brandProfile}
                onSave={saveBrandProfile}
                onClose={() => setIsBrandProfileModalOpen(false)}
            />
        )}
        {/* NEW: Pricing Modal */}
        {showPricing && <PricingModal onClose={() => setShowPricing(false)} />}
    </MainLayout>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AuthWrapper>
        <SocialSparkApp />
      </AuthWrapper>
    </AuthProvider>
  );
};

export default App;
