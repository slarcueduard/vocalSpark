import React, { useState, useEffect, useRef } from 'react';
import { generateSocialMediaPosts, adaptPostForPlatform, refinePostContent } from './services/geminiService';
import { Post, Tone, Platform, AppMode, ViralHook, RefinementType, PostObjective } from './types';
import { TONES, PLATFORMS, OBJECTIVES } from './constants';
import { Loader } from './components/Loader';
import { SparklesIcon, ImageIcon, BriefcaseIcon } from './components/Icons';
import { Lock, X, HelpCircle } from 'lucide-react'; 
import { ImageCreationModal } from './components/ImageCreationModal';
import { BrandProfileModal } from './components/BrandProfileModal';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { MainLayout } from './layouts/MainLayout';
import { PhonePreview } from './components/PhonePreview';
import { PostCard } from './components/PostCard';
import { LandingPage } from './components/LandingPage';

const SocialSparkApp: React.FC = () => {
  const { user, brandProfile, saveBrandProfile, checkCredits, isTrialExpired, loading } = useAuth();
  const [appMode, setAppMode] = useState<AppMode>('creator');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Modale
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isBrandProfileModalOpen, setIsBrandProfileModalOpen] = useState(false);
  
  // Imagine Logic
  const [activePostIdForImage, setActivePostIdForImage] = useState<string | null>(null); 
  const [currentPromptForImage, setCurrentPromptForImage] = useState('');

  const [refiningPostId, setRefiningPostId] = useState<string | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Form State
  const [topic, setTopic] = useState('');
  const [tone, setTone] = useState<Tone>(Tone.Inspirational);
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>(Platform.Instagram);
  const [objective, setObjective] = useState<PostObjective>('engagement');
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  
  // Auto-Sugestie
  useEffect(() => {
    if (!loading && brandProfile?.industry && topic === '') {
        const lang = brandProfile.language || 'English';
        const niche = brandProfile.industry;
        
        let templates: string[] = [];

        if (lang === 'Romanian') {
            templates = [
                `3 mituri despre ${niche} care trebuie demontate`,
                `Cum să începi cu ${niche} în 2024`,
                `În culisele unei afaceri de ${niche}`,
                `Viitorul în ${niche}: La ce să ne așteptăm`,
                `O greșeală comună în ${niche} și cum să o eviți`
            ];
        } else if (lang === 'Spanish') {
            templates = [
                `3 mitos sobre ${niche} que debes conocer`,
                `Cómo empezar con ${niche} en 2024`,
                `Detrás de escena en el mundo de ${niche}`
            ];
        } else {
            // Default English
            templates = [
                `3 myths about ${niche} needed to be debunked`,
                `How to start with ${niche} in 2024`,
                `Behind the scenes of a ${niche} business`,
                `The future of ${niche}: What to expect`
            ];
        }

        const randomIdea = templates[Math.floor(Math.random() * templates.length)];
        setTopic(randomIdea);
    }
  }, [loading, brandProfile]); // Scos topic din deps pentru a evita loop

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

  // --- IMAGE MODAL LOGIC ---
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
          setPosts(prev => prev.map(p => p.id === activePostIdForImage ? { ...p, imageUrl: url } : p));
      } else {
          setAttachedImage(url);
      }
      setIsImageModalOpen(false);
      setActivePostIdForImage(null);
  };

  // --- GENERATE TEXT ---
  const handleGenerate = async () => {
    if (!topic.trim() && !attachedImage) { setError("Please write a topic or attach an image first."); return; }
    
    if (!checkCredits(1)) { 
        if (isTrialExpired) return; 
        alert("Insufficient credits!"); 
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
          topic, 
          tone, 
          1, 
          brandProfile?.language || 'English',
          brandProfile?.voiceDNA || '',
          brandProfile || undefined, 
          imgData, 
          imgMime,
          objective
      );
      
      const newPosts: Post[] = generatedPosts.map(p => ({ 
          ...p, 
          id: crypto.randomUUID(), 
          adaptedContent: {}, 
          imageUrl: attachedImage || null, 
          isGeneratingImage: false, 
          isLocked: false 
      }));

      setPosts(prev => [...newPosts, ...prev].slice(0, 6));
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);

    } catch (err) { setError('Failed to generate content.'); } 
    finally { setIsLoading(false); }
  };

  const handleDeletePost = (id: string) => setPosts(prev => prev.filter(p => p.id !== id));
  const handleToggleLock = (id: string) => setPosts(prev => prev.map(p => p.id === id ? { ...p, isLocked: !p.isLocked } : p));
  
  const handleAdaptPost = async (id: string, platform: Platform, content: string) => {
      if (!checkCredits(1)) return;
      const adapted = await adaptPostForPlatform(content, platform);
      setPosts(prev => prev.map(p => p.id === id ? { ...p, adaptedContent: { ...p.adaptedContent, [platform]: adapted } } : p));
  };
  
  const handleRefinePost = async (id: string, type: RefinementType, content: string) => {
      if (!checkCredits(1)) return;
      setRefiningPostId(id);
      const refined = await refinePostContent(content, type);
      setPosts(prev => prev.map(p => p.id === id ? { ...p, content: refined } : p));
      setRefiningPostId(null);
  };

  const activePost = posts[0];
  const previewContent = activePost ? (activePost.adaptedContent[selectedPlatform] || activePost.content) : '';

  return (
    <MainLayout onOpenBrandProfile={() => setIsBrandProfileModalOpen(true)}>
        
        {/* Paywall Overlay */}
        {isTrialExpired && (
            <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center rounded-xl overflow-hidden pointer-events-auto">
                <div className="bg-[#161b22] border border-red-500/50 p-8 rounded-2xl max-w-md text-center shadow-2xl mx-4">
                    <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Lock size={32} className="text-red-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Free Trial Expired</h2>
                    <p className="text-gray-400 mb-6 text-sm">Upgrade to continue creating viral content.</p>
                </div>
            </div>
        )}

        <div className="flex h-full gap-6 relative">
            
            {/* --- LEFT COLUMN: THE CREATION WIZARD --- */}
            <div className="flex-1 min-w-0">
                <div className="max-w-2xl mx-auto pb-20">
                    <header className="mb-8">
                        <h2 className="text-3xl font-bold text-white tracking-tight">New Post</h2>
                        <p className="text-gray-500 text-sm mt-1">From idea to viral content in seconds.</p>
                    </header>
                    
                    <div className="space-y-8">
                        
                        {/* SECTION 1: TOPIC */}
                        <section className="space-y-3">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-bold text-gray-300 uppercase tracking-wider flex items-center gap-2">
                                    <span className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center text-[10px] text-white">1</span>
                                    What's on your mind?
                                </label>
                                {attachedImage && <span className="text-xs text-green-400 flex items-center gap-1"><ImageIcon size={12}/> Image Attached</span>}
                            </div>
                            
                            <div className="relative group">
                                <textarea 
                                    value={topic} 
                                    onChange={(e) => setTopic(e.target.value)} 
                                    rows={3} 
                                    placeholder="E.g. 3 tips for crypto beginners..." 
                                    className="w-full bg-[#161b22] border border-gray-700 rounded-xl p-4 pr-14 focus:ring-2 focus:ring-blue-500 outline-none resize-none text-white placeholder-gray-600 text-lg transition-all" 
                                />
                                
                                {/* Attachment Button */}
                                <div className="absolute bottom-3 right-3 flex gap-2">
                                    {attachedImage ? (
                                        <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-blue-500 group/img">
                                            <img src={attachedImage} alt="Preview" className="w-full h-full object-cover" />
                                            <button onClick={() => setAttachedImage(null)} className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover/img:opacity-100">
                                                <X size={14} className="text-white"/>
                                            </button>
                                        </div>
                                    ) : (
                                        <button 
                                            onClick={openImageModalGlobal}
                                            className="p-2.5 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white rounded-lg transition-all border border-transparent hover:border-gray-600"
                                            title="Add Visual context"
                                        >
                                            <ImageIcon size={20} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </section>

                        {/* SECTION 2: OBJECTIVE */}
                        <section className="space-y-3">
                            <label className="text-sm font-bold text-gray-300 uppercase tracking-wider flex items-center gap-2">
                                <span className="w-5 h-5 bg-purple-600 rounded-full flex items-center justify-center text-[10px] text-white">2</span>
                                What is your Goal?
                            </label>
                            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                                {OBJECTIVES.map((obj) => {
                                    const Icon = obj.icon;
                                    const isActive = objective === obj.id;
                                    return (
                                        <button 
                                            key={obj.id} 
                                            onClick={() => setObjective(obj.id)} 
                                            className={`
                                                relative flex flex-col items-center justify-center p-3 rounded-xl border transition-all duration-200 h-24
                                                ${isActive 
                                                    ? 'bg-purple-500/10 border-purple-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.15)]' 
                                                    : 'bg-[#161b22] border-gray-700 text-gray-400 hover:border-gray-600 hover:bg-gray-800'
                                                }
                                            `}
                                        >
                                            <Icon size={20} className={`mb-2 ${isActive ? 'text-purple-400' : 'text-gray-500'}`} />
                                            <span className="text-[10px] font-bold uppercase tracking-wide text-center leading-tight mb-1">
                                                {obj.label}
                                            </span>
                                            <span className="text-[8px] leading-none text-center text-gray-500 opacity-80 hidden sm:block">
                                                {obj.description.split(' ')[0]}...
                                            </span>
                                        </button>
                                    )
                                })}
                            </div>
                        </section>

                        {/* SECTION 3: FINE TUNING */}
                        <section className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase">Tone of Voice</label>
                                <select 
                                    value={tone} 
                                    onChange={(e) => setTone(e.target.value as Tone)} 
                                    className="w-full bg-[#161b22] border border-gray-700 text-white rounded-lg px-3 py-3 outline-none text-sm focus:border-blue-500 transition"
                                >
                                    {TONES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase">Preview Platform</label>
                                <select 
                                    value={selectedPlatform} 
                                    onChange={(e) => setSelectedPlatform(e.target.value as Platform)} 
                                    className="w-full bg-[#161b22] border border-gray-700 text-white rounded-lg px-3 py-3 outline-none text-sm focus:border-blue-500 transition"
                                >
                                    {PLATFORMS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                                </select>
                            </div>
                        </section>
                        
                        {/* GENERATE BUTTON */}
                        <button 
                            onClick={handleGenerate} 
                            disabled={isLoading || isTrialExpired} 
                            className="w-full py-4 rounded-xl font-bold text-lg bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-[length:200%_auto] animate-gradient text-white flex items-center justify-center gap-3 hover:scale-[1.01] transition-all shadow-xl shadow-blue-900/30 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isLoading ? <Loader /> : <SparklesIcon className="w-6 h-6" />} 
                            {isLoading ? 'Creating Magic...' : 'Craft my Post'}
                        </button>

                        {error && (
                            <div className="p-3 bg-red-900/20 border border-red-800/50 rounded-lg text-red-400 text-sm text-center flex items-center justify-center gap-2">
                                <BriefcaseIcon size={16} /> {error}
                            </div>
                        )}

                        {/* RESULTS AREA */}
                        <div ref={resultsRef} className="scroll-mt-24">
                            {posts.length > 0 && (
                                <div className="space-y-6 mt-10 pt-10 border-t border-gray-800 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-bold text-xl text-white">Generated Results</h3>
                                        <span className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded">
                                            {posts.length} variations
                                        </span>
                                    </div>
                                    {posts.map(post => (
                                        <PostCard 
                                            key={post.id} 
                                            post={post} 
                                            isRefining={refiningPostId === post.id} 
                                            onGenerateImage={(id, content) => openImageModalForPost(id, content)} 
                                            onAdaptPost={handleAdaptPost} 
                                            onRefinePost={handleRefinePost} 
                                            onDelete={handleDeletePost} 
                                            onToggleLock={handleToggleLock} 
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Right: Phone Preview (Sticky) */}
            <div className="hidden xl:block w-[400px] shrink-0">
                <div className="sticky top-6">
                    <PhonePreview 
                        platform={selectedPlatform} 
                        content={previewContent} 
                        imageUrl={activePost?.imageUrl || attachedImage || null} 
                        isGenerating={isLoading} 
                        isImageGenerating={activePost?.isGeneratingImage || false} 
                        topic={topic} 
                        userName={user?.displayName || user?.email?.split('@')[0]} 
                        userImage={user?.photoURL} 
                    />
                    <div className="mt-4 text-center">
                        <p className="text-xs text-gray-500 flex items-center justify-center gap-1">
                            <HelpCircle size={12} />
                            Preview updates automatically as you type or generate.
                        </p>
                    </div>
                </div>
            </div>
        </div>

        {/* MODALE */}
        {isImageModalOpen && (
            <ImageCreationModal 
                onClose={() => setIsImageModalOpen(false)} 
                onSelectImage={handleImageSelected} 
                initialPrompt={currentPromptForImage} 
            />
        )}
        
        {isBrandProfileModalOpen && (
            <BrandProfileModal 
                currentProfile={brandProfile} 
                onSave={saveBrandProfile} 
                onClose={() => setIsBrandProfileModalOpen(false)} 
            />
        )}
    </MainLayout>
  );
};

// --- APP CONTENT WITH AUTH LOGIC ---
const AppContent: React.FC = () => {
    const { user, loading, signIn } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0f1115] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-gray-500 text-sm font-mono">Initializing Velocity Engine...</p>
                </div>
            </div>
        );
    }

    if (user) {
        return <SocialSparkApp />;
    }

    return <LandingPage onLogin={signIn} />;
};

const App: React.FC = () => (
    <AuthProvider>
        <AppContent />
    </AuthProvider>
);

export default App;
