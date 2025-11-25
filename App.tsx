import React, { useState, useEffect, useRef } from 'react';
import { generateSocialMediaPosts, adaptPostForPlatform, refinePostContent } from './services/geminiService';
import { Post, Tone, Platform, AppMode, ViralHook, RefinementType } from './types';
import { TONES, PLATFORMS } from './constants';
import { Loader } from './components/Loader';
import { SparklesIcon, ImageIcon, BriefcaseIcon, XIcon } from './components/Icons'; // Asigură-te că ai XIcon sau importă X din lucide-react
import { Lock, X, Image as LucideImage } from 'lucide-react'; 
import { ImageCreationModal } from './components/ImageCreationModal';
import { BrandProfileModal } from './components/BrandProfileModal';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AuthWrapper } from './components/AuthWrapper';
import { MainLayout } from './layouts/MainLayout';
import { PhonePreview } from './components/PhonePreview';
import { PostCard } from './components/PostCard';

const HOOKS: ViralHook[] = ['Straight to the Point','Storytime', 'Controversial', 'Behind the Scenes', 'Myth vs Fact', 'Transformation','Unpopular Opinion','Day in the Life','Hack / Trick'];

const SocialSparkApp: React.FC = () => {
  const { user, brandProfile, saveBrandProfile, checkCredits, isTrialExpired, loading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isBrandProfileModalOpen, setIsBrandProfileModalOpen] = useState(false);
  
  const [activePostIdForImage, setActivePostIdForImage] = useState<string | null>(null); 
  const [currentPromptForImage, setCurrentPromptForImage] = useState('');

  const [refiningPostId, setRefiningPostId] = useState<string | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const [topic, setTopic] = useState('');
  const [tone, setTone] = useState<Tone>(Tone.Inspirational);
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>(Platform.Instagram);
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [viralHook, setViralHook] = useState<ViralHook | ''>('');
  const [posts, setPosts] = useState<Post[]>([]);
  
  // --- SUGESTIE AUTOMATĂ BAZATĂ PE BRAND ---
  // --- SUGESTIE AUTOMATĂ BAZATĂ PE BRAND & LIMBĂ ---
  useEffect(() => {
    if (!loading && brandProfile?.industry && !topic && posts.length === 0) {
        const lang = brandProfile.language || 'English';
        const niche = brandProfile.industry;
        
        let templates: string[] = [];

        // Definim șabloane în funcție de limbă
        if (lang === 'Romanian') {
            templates = [
                `3 mituri despre ${niche} care trebuie demontate`,
                `Cum să începi cu ${niche} în 2024`,
                `În culisele unei afaceri de ${niche}`,
                `Viitorul în ${niche}: La ce să ne așteptăm`,
                `O greșeală comună în ${niche} și cum să o eviți`,
                `Top sfaturi pentru cei interesați de ${niche}`
            ];
        } else if (lang === 'Spanish') {
            templates = [
                `3 mitos sobre ${niche} que debes conocer`,
                `Cómo empezar con ${niche} en 2024`,
                `Detrás de escena en el mundo de ${niche}`,
                `El futuro de ${niche}: Qué esperar`
            ];
        } else if (lang === 'French') {
            templates = [
                `3 mythes sur ${niche} à démystifier`,
                `Comment débuter avec ${niche} en 2024`,
                `Les coulisses de ${niche}`,
                `L'avenir de ${niche}: À quoi s'attendre`
            ];
        } else {
            // Default English
            templates = [
                `3 myths about ${niche} needed to be debunked`,
                `How to start with ${niche} in 2024`,
                `Behind the scenes of a ${niche} business`,
                `The future of ${niche}: What to expect`,
                `One common mistake in ${niche} and how to fix it`
            ];
        }

        const randomIdea = templates[Math.floor(Math.random() * templates.length)];
        setTopic(randomIdea);
    }
  }, [loading, brandProfile]);

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

  const handleGenerate = async () => {
    if (!topic.trim() && !attachedImage) { setError("Enter a topic."); return; }
    
    if (!checkCredits(1)) { 
        if (isTrialExpired) return; 
        alert("Insufficient credits!"); 
        return; 
    }

    setIsLoading(true); setError(null);
    try {
      let finalTopic = topic;
      if (viralHook) finalTopic = `${viralHook}: ${topic}`;
      
      let imgData = undefined, imgMime = undefined;
      if (attachedImage) {
          // Verificăm dacă e imagine uploadată (Base64) sau URL extern
          if (attachedImage.startsWith('data:')) {
              const parts = attachedImage.split(',');
              imgData = parts[1];
              imgMime = parts[0].split(':')[1].split(';')[0];
          } else {
              // E URL (Standard Image), îl convertim
              const converted = await urlToBase64(attachedImage);
              if(converted) { imgData = converted.data; imgMime = converted.mimeType; }
          }
      }

      const generatedPosts = await generateSocialMediaPosts(
          finalTopic, 
          tone, 
          1, 
          'English', // Sau limba din profil
          brandProfile?.voiceDNA || '',
          brandProfile || undefined, 
          imgData, 
          imgMime
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
        
        {isTrialExpired && (
            <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center rounded-xl overflow-hidden pointer-events-auto">
                <div className="bg-[#161b22] border border-red-500/50 p-8 rounded-2xl max-w-md text-center shadow-2xl shadow-red-900/20 mx-4">
                    <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Lock size={32} className="text-red-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Free Trial Expired</h2>
                    <p className="text-gray-400 mb-6 text-sm">
                        To keep generating viral content and visuals, please verify your account by choosing a plan.
                    </p>
                    <div className="text-xs text-gray-500 bg-gray-900 p-3 rounded-lg">
                        Click the <b>UPGRADE PLAN</b> button in the top right corner.
                    </div>
                </div>
            </div>
        )}

        <div className="flex h-full gap-6 relative">
            <div className="flex-1 min-w-0">
                <div className="max-w-2xl mx-auto pb-20">
                    <header className="mb-8">
                        <h2 className="text-2xl font-bold text-white">Creator Studio</h2>
                        <p className="text-gray-500 text-sm mt-1">Create content that converts.</p>
                    </header>
                    
                    <div className="space-y-6">
                        <div className="relative">
                            <label className="block text-sm font-medium mb-2 text-gray-300">What to post?</label>
                            <textarea 
                                value={topic} 
                                onChange={(e) => setTopic(e.target.value)} 
                                rows={4} 
                                placeholder="e.g. Launching a new coffee shop in downtown..." 
                                className="w-full bg-[#161b22] border border-gray-700 rounded-xl p-4 pr-12 focus:ring-2 focus:ring-blue-500 outline-none resize-none text-white placeholder-gray-600" 
                            />
                            
                            {/* MINIATURA IMAGINE ATAȘATĂ */}
                            {attachedImage && (
                                <div className="absolute bottom-4 left-4 group">
                                    <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-blue-500 shadow-lg">
                                        <img src={attachedImage} alt="Attached" className="w-full h-full object-cover" />
                                        <button 
                                            onClick={() => setAttachedImage(null)}
                                            className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer"
                                        >
                                            <X size={14} className="text-white" />
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* BUTON ATTACH */}
                            <button 
                                onClick={openImageModalGlobal}
                                className={`absolute bottom-3 right-3 p-2 rounded-lg transition ${attachedImage ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}
                                title={attachedImage ? "Change Image" : "Attach AI Image"}
                            >
                                <ImageIcon className="w-5 h-5" />
                            </button>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2 text-gray-300">Viral Strategy</label>
                            <div className="grid grid-cols-3 gap-2">
                                {HOOKS.map(hook => (
                                    <button 
                                        key={hook} 
                                        onClick={() => setViralHook(hook === viralHook ? '' : hook)} 
                                        className={`py-2 px-2 rounded-lg text-[10px] font-medium border transition-all ${viralHook === hook ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-700 text-gray-400 hover:border-gray-500'}`}
                                    >
                                        {hook}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-2 text-gray-300">Tone</label>
                                <select value={tone} onChange={(e) => setTone(e.target.value as Tone)} className="w-full bg-[#161b22] border border-gray-700 text-white rounded-lg px-3 py-3 outline-none text-sm">
                                    {TONES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2 text-gray-300">Preview Platform</label>
                                <select value={selectedPlatform} onChange={(e) => setSelectedPlatform(e.target.value as Platform)} className="w-full bg-[#161b22] border border-gray-700 text-white rounded-lg px-3 py-3 outline-none text-sm">
                                    {PLATFORMS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                                </select>
                            </div>
                        </div>
                        
                        <button 
                            onClick={handleGenerate} 
                            disabled={isLoading || isTrialExpired} 
                            className="w-full py-4 rounded-xl font-bold text-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white flex items-center justify-center gap-3 hover:scale-[1.01] transition shadow-lg shadow-blue-900/30 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isLoading ? <Loader /> : <SparklesIcon className="w-6 h-6" />} 
                            {isLoading ? 'Creating Magic...' : 'Generate Content'}
                        </button>

                        {error && <div className="text-red-400 text-sm text-center">{error}</div>}

                        <div ref={resultsRef} className="scroll-mt-24">
                            {posts.length > 0 && (
                                <div className="space-y-6 mt-8 pt-8 border-t border-gray-800 animate-in fade-in">
                                    <h3 className="font-bold text-lg text-white">Your Results</h3>
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
            
            {/* Right: Phone Preview */}
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
                </div>
            </div>
        </div>

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

const App: React.FC = () => (
    <AuthProvider>
        <AuthWrapper>
            <SocialSparkApp />
        </AuthWrapper>
    </AuthProvider>
);

export default App;
