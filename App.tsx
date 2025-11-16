import React, { useState, useCallback, useEffect } from 'react';
import { generateSocialMediaPosts, generateImageForPost, adaptPostForPlatform, refinePostContent } from './services/geminiService';
import { Post, Tone, Platform, RefinementType } from './types';
import { TONES } from './constants';
import { PostCard } from './components/PostCard';
import { Loader } from './components/Loader';
import { GithubIcon, SparklesIcon, UserPlusIcon, TrashIcon } from './components/Icons';
import { ConnectAccountsModal } from './components/ConnectAccountsModal';

type CreationMode = 'ai' | 'manual';
const TOPIC_HISTORY_KEY = 'socialSparkTopicHistory';

const App: React.FC = () => {
  const [topic, setTopic] = useState('The future of renewable energy');
  const [tone, setTone] = useState<Tone>(Tone.Inspirational);
  const [postCount, setPostCount] = useState(3);
  const [language, setLanguage] = useState('English');
  const [brandVoice, setBrandVoice] = useState('');
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [topicHistory, setTopicHistory] = useState<string[]>([]);
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [refiningPostId, setRefiningPostId] = useState<string | null>(null);

  const [creationMode, setCreationMode] = useState<CreationMode>('ai');
  const [manualContent, setManualContent] = useState('');
  const [manualImage, setManualImage] = useState<File | null>(null);
  const [manualImagePreview, setManualImagePreview] = useState<string | null>(null);

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
    try {
      localStorage.setItem(TOPIC_HISTORY_KEY, JSON.stringify(topicHistory));
    } catch (e) {
      console.error("Failed to save topic history to localStorage", e);
    }
  }, [topicHistory]);

  const handleGeneratePosts = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) {
      setError('Please enter a topic for your posts.');
      return;
    }
    if (postCount < 1 || postCount > 10) {
      setError('Please enter a number of posts between 1 and 10.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setPosts([]);

    try {
      const generatedPosts = await generateSocialMediaPosts(topic, tone, postCount, language, brandVoice);
      setPosts(generatedPosts.map(p => ({
        ...p,
        id: crypto.randomUUID(),
        adaptedContent: {},
        imageUrl: null,
        isGeneratingImage: false,
      })));
       // Add to history
       if (!topicHistory.includes(topic)) {
        setTopicHistory(prev => [topic, ...prev].slice(0, 10)); // Keep last 10
      }
    } catch (err) {
      setError('Failed to generate posts. The AI might be busy. Please try again later.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [topic, tone, postCount, language, brandVoice, topicHistory]);

  const handleManualImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        setManualImage(file);
        setManualImagePreview(URL.createObjectURL(file));
    } else {
        setManualImage(null);
        setManualImagePreview(null);
    }
  };

  const handleCreateManualPost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualContent.trim() && !manualImage) {
        setError('Please provide content or an image for your post.');
        return;
    }
    setError(null);

    const newPost: Post = {
        id: crypto.randomUUID(),
        content: manualContent,
        adaptedContent: {},
        imageUrl: manualImagePreview,
        isGeneratingImage: false,
    };

    setPosts(prevPosts => [newPost, ...prevPosts]);
    // Reset manual form
    setManualContent('');
    setManualImage(null);
    setManualImagePreview(null);
    const fileInput = document.getElementById('manual-image-upload') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };
  
  const handleGenerateImage = useCallback(async (postId: string, postContent: string) => {
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, isGeneratingImage: true } : p));
    try {
        const imageUrl = await generateImageForPost(postContent);
        setPosts(prev => prev.map(p => p.id === postId ? { ...p, imageUrl, isGeneratingImage: false } : p));
    } catch (err) {
        console.error(err);
        setPosts(prev => prev.map(p => p.id === postId ? { ...p, isGeneratingImage: false } : p));
    }
  }, []);

  const handleAdaptPost = useCallback(async (postId: string, platform: Platform, originalContent: string) => {
    try {
      const adaptedText = await adaptPostForPlatform(originalContent, platform);
      setPosts(prev => prev.map(p => 
        p.id === postId 
          ? { ...p, adaptedContent: { ...p.adaptedContent, [platform]: adaptedText } }
          : p
      ));
    } catch (err) {
      console.error(`Failed to adapt post for ${platform}`, err);
      // Optionally show an error to the user
    }
  }, []);

  const handleRefinePost = useCallback(async (postId: string, type: RefinementType, content: string) => {
    setRefiningPostId(postId);
    try {
        const refinedContent = await refinePostContent(content, type);
        setPosts(prev => prev.map(p => 
            p.id === postId 
            ? { ...p, content: refinedContent, adaptedContent: {} } // Reset adaptations as content has changed
            : p
        ));
    } catch (err) {
        console.error(`Failed to refine post with type ${type}`, err);
    } finally {
        setRefiningPostId(null);
    }
  }, []);

  const handleCreatePostsFromImages = useCallback((imageUrls: string[]) => {
    const newPosts: Post[] = imageUrls.map(url => ({
      id: crypto.randomUUID(),
      content: '', // Start with empty content
      adaptedContent: {},
      imageUrl: url,
      isGeneratingImage: false,
    }));
    setPosts(prevPosts => [...newPosts, ...prevPosts]);
    setIsConnectModalOpen(false);
  }, []);

  const handleResetCampaign = () => {
    setPosts([]);
  };

  return (
    <>
      <div className="min-h-screen bg-brand-bg-dark text-brand-text font-sans flex flex-col items-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-6xl mx-auto">
          <header className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-3">
              <SparklesIcon className="w-8 h-8 text-brand-primary" />
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight bg-gradient-to-r from-brand-primary to-brand-secondary text-transparent bg-clip-text">
                Social Spark AI
              </h1>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
               <button 
                onClick={() => setIsConnectModalOpen(true)}
                className="flex items-center gap-2 bg-brand-secondary text-white font-semibold py-2 px-4 rounded-lg hover:bg-opacity-90 transition-transform transform hover:scale-105"
                title="AI Image Studio"
              >
                <UserPlusIcon className="w-5 h-5" />
                <span className="hidden sm:inline">AI Image Studio</span>
              </button>
              <a href="https://github.com/google/generative-ai-docs/tree/main/gemini-api/cookbook/social-spark-ai" target="_blank" rel="noopener noreferrer" className="text-brand-text-secondary hover:text-brand-primary transition-colors">
                <GithubIcon className="w-6 h-6" />
              </a>
            </div>
          </header>

          <main>
            <div className="bg-brand-bg-light p-6 sm:p-8 rounded-2xl shadow-lg border border-gray-700 mb-10">
              <div className="flex justify-center border border-gray-700 rounded-lg p-1 mb-6 max-w-xs mx-auto bg-brand-bg-dark">
                  {(['ai', 'manual'] as CreationMode[]).map(mode => (
                      <button
                          key={mode}
                          onClick={() => setCreationMode(mode)}
                          className={`w-1/2 py-2 px-4 rounded-md text-sm font-semibold transition-colors ${creationMode === mode ? 'bg-brand-primary text-brand-bg-dark' : 'text-brand-text-secondary hover:bg-gray-700'}`}
                      >
                          {mode === 'ai' ? 'AI Generator' : 'Manual Creation'}
                      </button>
                  ))}
              </div>

              {creationMode === 'ai' ? (
                <>
                  <h2 className="text-xl font-semibold mb-1 text-center">Create your next viral campaign with AI</h2>
                  <p className="text-brand-text-secondary mb-6 text-center">Enter a topic, and let our AI craft a series of posts for you!</p>
                  <form onSubmit={handleGeneratePosts} className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 items-start">
                    <div className="md:col-span-2">
                      <label htmlFor="topic" className="block text-sm font-medium mb-2">Campaign Topic</label>
                      <input
                        id="topic"
                        type="text"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        placeholder="e.g., The future of renewable energy"
                        className="w-full bg-brand-bg-dark border border-gray-600 rounded-md px-3 py-2 focus:ring-2 focus:ring-brand-primary focus:outline-none transition"
                        list="topic-history"
                      />
                      <datalist id="topic-history">
                        {topicHistory.map((item, index) => <option key={index} value={item} />)}
                      </datalist>
                    </div>
                    <div>
                      <label htmlFor="tone" className="block text-sm font-medium mb-2">Tone</label>
                      <select
                        id="tone"
                        value={tone}
                        onChange={(e) => setTone(e.target.value as Tone)}
                        className="w-full bg-brand-bg-dark border border-gray-600 rounded-md px-3 py-2 focus:ring-2 focus:ring-brand-primary focus:outline-none transition appearance-none"
                      >
                        {TONES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                      </select>
                    </div>
                     <div>
                      <label htmlFor="post-count" className="block text-sm font-medium mb-2">Number of Posts</label>
                      <input
                        id="post-count"
                        type="number"
                        value={postCount}
                        onChange={(e) => setPostCount(Number(e.target.value))}
                        min="1"
                        max="10"
                        className="w-full bg-brand-bg-dark border border-gray-600 rounded-md px-3 py-2 focus:ring-2 focus:ring-brand-primary focus:outline-none transition"
                      />
                    </div>
                     <div>
                      <label htmlFor="language" className="block text-sm font-medium mb-2">Language</label>
                      <input
                        id="language"
                        type="text"
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                        placeholder="e.g., English, Spanish"
                        className="w-full bg-brand-bg-dark border border-gray-600 rounded-md px-3 py-2 focus:ring-2 focus:ring-brand-primary focus:outline-none transition"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label htmlFor="brand-voice" className="block text-sm font-medium mb-2">Brand Voice (Optional)</label>
                       <textarea
                        id="brand-voice"
                        value={brandVoice}
                        onChange={(e) => setBrandVoice(e.target.value)}
                        rows={4}
                        placeholder="Paste an example post or describe your brand's voice (e.g., 'Friendly and casual, use emojis!')"
                        className="w-full bg-brand-bg-dark border border-gray-600 rounded-md px-3 py-2 focus:ring-2 focus:ring-brand-primary focus:outline-none transition"
                      ></textarea>
                    </div>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="md:col-span-2 w-full bg-brand-primary text-brand-bg-dark font-bold py-3 px-4 rounded-md hover:bg-opacity-90 transition-transform transform hover:scale-105 disabled:bg-gray-500 disabled:scale-100 flex items-center justify-center gap-2 mt-2"
                    >
                      {isLoading ? <Loader size="sm" /> : <SparklesIcon className="w-5 h-5" />}
                      <span>{isLoading ? 'Generating...' : 'Generate Campaign'}</span>
                    </button>
                  </form>
                </>
              ) : (
                <>
                  <h2 className="text-xl font-semibold mb-1 text-center">Create your post manually</h2>
                  <p className="text-brand-text-secondary mb-6 text-center">Write your content and upload your own media.</p>
                  <form onSubmit={handleCreateManualPost} className="space-y-4">
                    <div>
                      <label htmlFor="manual-content" className="block text-sm font-medium mb-2">Post Content</label>
                      <textarea
                        id="manual-content"
                        value={manualContent}
                        onChange={(e) => setManualContent(e.target.value)}
                        rows={5}
                        placeholder="What's on your mind?"
                        className="w-full bg-brand-bg-dark border border-gray-600 rounded-md px-3 py-2 focus:ring-2 focus:ring-brand-primary focus:outline-none transition"
                      ></textarea>
                    </div>
                    <div>
                      <label htmlFor="manual-image-upload" className="block text-sm font-medium mb-2">Upload Image (Optional)</label>
                      <div className="flex items-center gap-4">
                        <input
                          id="manual-image-upload"
                          type="file"
                          accept="image/*"
                          onChange={handleManualImageChange}
                          className="block w-full text-sm text-brand-text-secondary file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand-secondary file:text-brand-bg-dark hover:file:bg-brand-secondary/80"
                        />
                         {manualImagePreview && <img src={manualImagePreview} alt="Preview" className="w-16 h-16 rounded-md object-cover"/>}
                      </div>
                    </div>
                     <button
                      type="submit"
                      className="w-full bg-brand-secondary text-white font-bold py-2 px-4 rounded-md hover:bg-opacity-90 transition-transform transform hover:scale-105"
                    >
                      Create Post
                    </button>
                  </form>
                </>
              )}
               {error && <p className="text-red-400 mt-4 text-sm text-center">{error}</p>}
            </div>

            {isLoading && (
              <div className="flex justify-center items-center h-64">
                <Loader size="lg" />
              </div>
            )}

            {posts.length > 0 && (
              <>
                <div className="flex justify-center items-center gap-4 mb-6 mt-12">
                  <h2 className="text-2xl font-bold text-center">Your Generated Campaign</h2>
                   <button
                    onClick={handleResetCampaign}
                    className="flex items-center gap-2 bg-red-500/10 text-red-400 font-semibold py-1.5 px-3 rounded-lg hover:bg-red-500/20 hover:text-red-300 transition-colors"
                    title="Delete all posts and start over"
                  >
                    <TrashIcon className="w-5 h-5" />
                    <span className="hidden sm:inline">Reset</span>
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {posts.map(post => (
                    <PostCard 
                      key={post.id} 
                      post={post} 
                      isRefining={refiningPostId === post.id}
                      onGenerateImage={handleGenerateImage}
                      onAdaptPost={handleAdaptPost}
                      onRefinePost={handleRefinePost}
                    />
                  ))}
                </div>
              </>
            )}
          </main>
        </div>
      </div>
      {isConnectModalOpen && <ConnectAccountsModal onClose={() => setIsConnectModalOpen(false)} onCreatePostsFromImages={handleCreatePostsFromImages} />}
    </>
  );
};

export default App;