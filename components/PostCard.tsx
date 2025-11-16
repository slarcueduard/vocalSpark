import React, { useState } from 'react';
import { Post, Platform, RefinementType } from '../types';
import { PLATFORMS } from '../constants';
import { 
  SparklesIcon, 
  ClipboardIcon, 
  CheckIcon, 
  ImageIcon, 
  FacebookIcon,
  InstagramIcon,
  TikTokIcon,
  XIcon,
  MagicWandIcon
} from './Icons';
import { Loader } from './Loader';

interface PostCardProps {
  post: Post;
  isRefining: boolean;
  onGenerateImage: (postId: string, postContent: string) => void;
  onAdaptPost: (postId: string, platform: Platform, originalContent: string) => Promise<void>;
  onRefinePost: (postId: string, type: RefinementType, content: string) => Promise<void>;
}

const platformIcons: Record<Platform, React.FC<React.SVGProps<SVGSVGElement>>> = {
  [Platform.Instagram]: InstagramIcon,
  [Platform.TikTok]: TikTokIcon,
  [Platform.Facebook]: FacebookIcon,
  [Platform.X]: XIcon,
};

const refinementOptions: { type: RefinementType, label: string }[] = [
    { type: 'makeShorter', label: 'Make it Shorter' },
    { type: 'addEmojis', label: 'Add Emojis' },
    { type: 'askQuestion', label: 'Ask a Question' },
];

export const PostCard: React.FC<PostCardProps> = ({ post, isRefining, onGenerateImage, onAdaptPost, onRefinePost }) => {
  const [copied, setCopied] = useState(false);
  const [activePlatform, setActivePlatform] = useState<Platform | null>(null);
  const [isAdapting, setIsAdapting] = useState(false);
  const [isRefineMenuOpen, setIsRefineMenuOpen] = useState(false);

  const displayedContent = activePlatform ? post.adaptedContent[activePlatform] || post.content : post.content;

  const handleCopy = () => {
    navigator.clipboard.writeText(displayedContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadImage = () => {
    if (!post.imageUrl) return;
    const link = document.createElement('a');
    link.href = post.imageUrl;
    const suggestedName = post.content.substring(0, 30).replace(/\s+/g, '_').toLowerCase();
    link.download = `social-spark-${suggestedName || 'image'}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleAdaptClick = async (platform: Platform) => {
    if (activePlatform === platform) {
      setActivePlatform(null); // Toggle off if clicked again
      return;
    }
    setActivePlatform(platform);
    if (post.adaptedContent[platform]) {
      return; // Already adapted, just switch view
    }
    setIsAdapting(true);
    await onAdaptPost(post.id, platform, post.content);
    setIsAdapting(false);
  };

  const handleRefineClick = async (type: RefinementType) => {
    setIsRefineMenuOpen(false);
    await onRefinePost(post.id, type, post.content);
  };

  return (
    <div className="bg-brand-bg-light rounded-2xl shadow-lg border border-gray-700 flex flex-col overflow-hidden transition-all duration-300 hover:shadow-brand-primary/20 hover:border-brand-primary/50">
      <div className={`aspect-square w-full flex items-center justify-center ${post.imageUrl ? '' : 'bg-brand-bg-dark'}`}>
        {post.imageUrl ? (
          <img src={post.imageUrl} alt="AI generated for post" className="w-full h-full object-cover" />
        ) : post.isGeneratingImage ? (
          <div className="flex flex-col items-center gap-2 text-brand-text-secondary">
            <Loader />
            <p className="text-sm">Conjuring pixels...</p>
          </div>
        ) : (
          <div className="text-center p-4">
            <button
              onClick={() => onGenerateImage(post.id, post.content)}
              className="bg-brand-secondary/20 text-brand-secondary font-semibold py-2 px-4 rounded-full hover:bg-brand-secondary/30 transition flex items-center gap-2"
            >
              <ImageIcon className="w-5 h-5" />
              <span>Generate Image</span>
              <SparklesIcon className="w-4 h-4 text-yellow-400" />
            </button>
             <p className="text-xs text-brand-text-secondary mt-2">✨ Pro Feature</p>
          </div>
        )}
      </div>
      <div className="p-5 flex-grow flex flex-col">
        <div className="relative flex-grow mb-4">
          {(isAdapting || isRefining) && (
            <div className="absolute inset-0 bg-brand-bg-light/80 flex flex-col items-center justify-center rounded-md z-10">
              <Loader />
              <p className="text-sm mt-2 text-brand-text-secondary">{isRefining ? 'Refining content...' : 'Adapting content...'}</p>
            </div>
          )}
          <p className="text-brand-text whitespace-pre-wrap text-sm leading-relaxed">{displayedContent}</p>
        </div>

        <div className="mt-auto pt-4 border-t border-gray-700 space-y-4">
            <div className="space-y-2">
                <label className="block text-xs font-semibold text-brand-text-secondary text-center tracking-wider">ADAPT FOR</label>
                <div className="flex justify-center gap-4">
                    {PLATFORMS.map(({ value, label }) => {
                        const Icon = platformIcons[value];
                        const isActive = activePlatform === value;
                        return (
                            <button
                                key={value}
                                onClick={() => handleAdaptClick(value)}
                                aria-label={`Adapt for ${label}`}
                                title={`Adapt for ${label}`}
                                className={`p-2.5 rounded-full transition-all duration-200 border-2 ${
                                    isActive 
                                        ? 'bg-brand-secondary/20 border-brand-secondary scale-110' 
                                        : 'bg-brand-bg-dark border-gray-600 hover:border-brand-text-secondary'
                                }`}
                            >
                                <Icon className={`w-5 h-5 ${isActive ? 'text-brand-secondary' : 'text-brand-text-secondary'}`} />
                            </button>
                        );
                    })}
                </div>
            </div>
            
            <div className="relative">
                <label className="block text-xs font-semibold text-brand-text-secondary text-center tracking-wider mb-2">ACTIONS</label>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={handleCopy} 
                    className="w-full flex items-center justify-center gap-2 text-sm bg-brand-bg-dark text-brand-text-secondary font-semibold py-2 px-3 rounded-lg hover:bg-gray-700/80 transition"
                  >
                    {copied ? <CheckIcon className="w-5 h-5 text-brand-primary" /> : <ClipboardIcon className="w-5 h-5" />}
                    <span>{copied ? 'Copied!' : 'Copy'}</span>
                  </button>
                  {post.imageUrl && (
                    <button
                      onClick={handleDownloadImage}
                      className="w-full flex items-center justify-center gap-2 text-sm bg-brand-bg-dark text-brand-text-secondary font-semibold py-2 px-3 rounded-lg hover:bg-gray-700/80 transition"
                    >
                      <ImageIcon className="w-5 h-5" />
                      <span>Download</span>
                    </button>
                  )}
                  <button
                      onClick={() => setIsRefineMenuOpen(prev => !prev)}
                      disabled={isRefining}
                      className="flex items-center justify-center p-2 text-sm bg-brand-bg-dark text-brand-text-secondary font-semibold rounded-lg hover:bg-gray-700/80 transition"
                      title="Refine Content"
                   >
                       <MagicWandIcon className="w-5 h-5" />
                   </button>
                </div>
                {isRefineMenuOpen && (
                    <div className="absolute bottom-full right-0 mb-2 w-48 bg-brand-bg-dark border border-gray-600 rounded-lg shadow-xl z-20">
                        {refinementOptions.map(({type, label}) => (
                             <button
                                key={type}
                                onClick={() => handleRefineClick(type)}
                                className="w-full text-left px-4 py-2 text-sm text-brand-text hover:bg-brand-secondary/20"
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};
