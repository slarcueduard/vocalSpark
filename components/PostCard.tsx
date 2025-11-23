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
  LinkedInIcon,
  MagicWandIcon,
  BriefcaseIcon,
  TrashIcon,
  BookmarkIcon
} from './Icons';
import { Loader } from './Loader';
import { useAuth } from '../contexts/AuthContext';
import { overlayLogoOnImage, LogoPosition } from '../services/geminiService';

interface PostCardProps {
  post: Post;
  isRefining: boolean;
  onGenerateImage: (postId: string, postContent: string) => void;
  onAdaptPost: (postId: string, platform: Platform, originalContent: string) => Promise<void>;
  onRefinePost: (postId: string, type: RefinementType, content: string) => Promise<void>;
  onDelete: (postId: string) => void;
  onToggleLock: (postId: string) => void;
}

const platformIcons: Record<Platform, React.FC<React.SVGProps<SVGSVGElement>>> = {
  [Platform.Instagram]: InstagramIcon,
  [Platform.TikTok]: TikTokIcon,
  [Platform.Facebook]: FacebookIcon,
  [Platform.X]: XIcon,
  [Platform.LinkedIn]: LinkedInIcon,
};

const refinementOptions: { type: RefinementType, label: string }[] = [
    { type: 'makeShorter', label: 'Make it Shorter' },
    { type: 'addEmojis', label: 'Add Emojis' },
    { type: 'askQuestion', label: 'Ask a Question' },
];

export const PostCard: React.FC<PostCardProps> = ({ 
  post, 
  isRefining, 
  onGenerateImage, 
  onAdaptPost, 
  onRefinePost, 
  onDelete,
  onToggleLock
}) => {
  const { brandProfile } = useAuth();
  const [copied, setCopied] = useState(false);
  const [activePlatform, setActivePlatform] = useState<Platform | null>(null);
  const [isAdapting, setIsAdapting] = useState(false);
  const [isRefineMenuOpen, setIsRefineMenuOpen] = useState(false);
  
  // Branding State
  const [showBrandingOptions, setShowBrandingOptions] = useState(false);
  const [isApplyingLogo, setIsApplyingLogo] = useState(false);
  const [brandedImageUrl, setBrandedImageUrl] = useState<string | null>(null);
  const [logoPosition, setLogoPosition] = useState<LogoPosition>('top-left');
  const [removeLogoBg, setRemoveLogoBg] = useState(false);

  const displayedContent = activePlatform ? post.adaptedContent[activePlatform] || post.content : post.content;
  const displayImage = brandedImageUrl || post.imageUrl;

  const handleCopy = () => {
    navigator.clipboard.writeText(displayedContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadImage = () => {
    if (!displayImage) return;
    const link = document.createElement('a');
    link.href = displayImage;
    const suggestedName = post.content.substring(0, 30).replace(/\s+/g, '_').toLowerCase();
    link.download = `social-spark-${suggestedName || 'image'}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleApplyBranding = async () => {
      if (!post.imageUrl || !brandProfile?.logoUrl) return;
      setIsApplyingLogo(true);
      try {
          const result = await overlayLogoOnImage(post.imageUrl, brandProfile.logoUrl, logoPosition, removeLogoBg);
          setBrandedImageUrl(result);
          setShowBrandingOptions(false);
      } catch (e) {
          console.error("Failed to apply branding", e);
          alert("Could not apply logo. Please check the image format.");
      } finally {
          setIsApplyingLogo(false);
      }
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
    <div className={`bg-brand-bg-light rounded-2xl shadow-lg border flex flex-col overflow-hidden transition-all duration-300 ${post.isLocked ? 'border-brand-primary/60 shadow-brand-primary/10' : 'border-gray-700 hover:shadow-brand-primary/20 hover:border-brand-primary/50'}`}>
      
      {/* HEADER Actions */}
      <div className="flex justify-between items-center p-3 border-b border-gray-700/50 bg-black/20">
         <button 
             onClick={() => onToggleLock(post.id)}
             className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded transition ${post.isLocked ? 'text-brand-primary bg-brand-primary/10' : 'text-gray-500 hover:text-brand-text'}`}
             title={post.isLocked ? "Unlock Post" : "Keep Post"}
         >
             <BookmarkIcon className={`w-4 h-4 ${post.isLocked ? 'fill-current' : ''}`} />
             {post.isLocked ? 'Kept' : 'Keep'}
         </button>
         <button 
             onClick={() => onDelete(post.id)}
             className="text-gray-500 hover:text-red-400 p-1 rounded hover:bg-red-500/10 transition"
             title="Delete Post"
         >
             <TrashIcon className="w-4 h-4" />
         </button>
      </div>

      <div className={`aspect-square w-full flex items-center justify-center relative group ${displayImage ? '' : 'bg-brand-bg-dark'}`}>
        {displayImage ? (
          <>
            <img src={displayImage} alt="AI generated for post" className="w-full h-full object-cover" />
            
            {/* Branding Overlay Controls */}
             {brandProfile?.logoUrl && (
                <div className="absolute top-2 right-2 flex flex-col items-end gap-2">
                    {!showBrandingOptions && !brandedImageUrl && (
                        <button
                            onClick={() => setShowBrandingOptions(true)}
                            className="bg-black/60 hover:bg-black/80 text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-2 backdrop-blur-sm transition opacity-0 group-hover:opacity-100"
                        >
                            <BriefcaseIcon className="w-4 h-4" />
                            <span>Add Logo</span>
                        </button>
                    )}
                    
                    {showBrandingOptions && (
                        <div className="bg-brand-bg-dark border border-gray-600 rounded-lg p-3 shadow-xl w-48 animate-fadeIn z-20">
                            <h4 className="text-xs font-bold text-gray-400 mb-2">Logo Settings</h4>
                            
                            {/* Position Grid */}
                            <div className="grid grid-cols-2 gap-1 mb-3">
                                {(['top-left', 'top-right', 'bottom-left', 'bottom-right'] as LogoPosition[]).map(pos => (
                                    <button
                                        key={pos}
                                        onClick={() => setLogoPosition(pos)}
                                        className={`h-8 rounded border flex items-center justify-center ${logoPosition === pos ? 'bg-brand-secondary/20 border-brand-secondary text-brand-secondary' : 'bg-gray-800 border-gray-600 text-gray-500 hover:bg-gray-700'}`}
                                    >
                                        <div className={`w-2 h-2 bg-current rounded-sm ${pos.includes('top') ? 'mb-auto' : 'mt-auto'} ${pos.includes('left') ? 'mr-auto' : 'ml-auto'}`}></div>
                                    </button>
                                ))}
                            </div>
                            
                            <label className="flex items-center gap-2 text-xs text-gray-300 mb-3 cursor-pointer select-none">
                                <input 
                                    type="checkbox" 
                                    checked={removeLogoBg}
                                    onChange={(e) => setRemoveLogoBg(e.target.checked)}
                                    className="rounded bg-gray-700 border-gray-500 text-brand-secondary focus:ring-brand-secondary"
                                />
                                Remove White BG
                            </label>

                            <div className="flex gap-2">
                                <button 
                                    onClick={() => setShowBrandingOptions(false)}
                                    className="flex-1 py-1 text-xs text-gray-400 hover:text-white"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={handleApplyBranding}
                                    disabled={isApplyingLogo}
                                    className="flex-1 bg-brand-secondary text-white text-xs py-1.5 rounded font-bold hover:bg-opacity-90 flex justify-center"
                                >
                                    {isApplyingLogo ? <Loader size="sm" /> : 'Apply'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
          </>
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
                  {displayImage && (
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
