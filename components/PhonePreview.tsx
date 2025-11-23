import React from 'react';
import { Platform } from '../types';
import { 
    HeartIcon, 
    MessageCircleIcon, 
    SendIcon, 
    BookmarkIcon, 
    RepeatIcon,
    CheckCircleIcon,
    XIcon,
    FacebookIcon,
    TikTokIcon,
    LinkedInIcon
} from './Icons';
import { Loader } from './Loader';

interface PhonePreviewProps {
    content: string;
    imageUrl: string | null;
    platform: Platform;
    isGenerating: boolean;
    isImageGenerating: boolean;
    topic: string;
    userName?: string | null;
    userImage?: string | null;
}

export const PhonePreview: React.FC<PhonePreviewProps> = ({ 
    content, 
    imageUrl, 
    platform, 
    isGenerating,
    isImageGenerating,
    topic,
    userName,
    userImage
}) => {
    
    const displayContent = isGenerating ? "✨ AI is drafting your masterpiece..." : (content || `Your ${platform} post about "${topic}" will appear here.`);
    const displayUser = userName || "Social Spark User";
    const displayHandle = userName ? `@${userName.replace(/\s+/g, '').toLowerCase()}` : "@socialspark";

    // --- PLATFORM RENDERERS ---

    const renderInstagram = () => (
        <div className="flex flex-col h-full bg-white text-black font-sans overflow-hidden">
             {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden border border-gray-300">
                       {userImage && <img src={userImage} alt="user" className="w-full h-full object-cover" />}
                    </div>
                    <span className="text-sm font-semibold">{displayHandle.substring(1)}</span>
                </div>
                <div className="text-xl tracking-widest">...</div>
            </div>

            {/* Image Area */}
            <div className="w-full aspect-square bg-gray-100 flex items-center justify-center overflow-hidden relative">
                {imageUrl ? (
                    <img src={imageUrl} alt="Post" className="w-full h-full object-cover" />
                ) : isImageGenerating ? (
                    <div className="flex flex-col items-center gap-2">
                         <Loader size="md" />
                         <span className="text-xs text-gray-500">Generating Image...</span>
                    </div>
                ) : (
                    <div className="text-gray-300 text-6xl">📷</div>
                )}
            </div>

            {/* Actions */}
            <div className="flex justify-between items-center px-4 py-3">
                <div className="flex gap-4">
                    <HeartIcon className="w-6 h-6" />
                    <MessageCircleIcon className="w-6 h-6" />
                    <SendIcon className="w-6 h-6" />
                </div>
                <BookmarkIcon className="w-6 h-6" />
            </div>

            {/* Caption */}
            <div className="px-4 pb-4 text-sm overflow-y-auto custom-scrollbar">
                <p className="font-semibold mb-1">1,234 likes</p>
                <div className="text-sm">
                    <span className="font-semibold mr-2">{displayHandle.substring(1)}</span>
                    <span className="line-clamp-2 inline">{displayContent}</span>
                    <span className="text-gray-500 text-xs ml-1 cursor-pointer"> more</span>
                </div>
                <p className="text-gray-400 text-xs mt-2 uppercase">2 HOURS AGO</p>
            </div>
        </div>
    );

    const renderLinkedin = () => (
        <div className="flex flex-col h-full bg-[#F3F2EF] text-black font-sans overflow-hidden">
            {/* Post Container */}
            <div className="bg-white mt-4 p-4 shadow-sm h-full flex flex-col">
                {/* Header */}
                <div className="flex gap-3 mb-3 flex-shrink-0">
                     <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden border border-gray-300">
                       {userImage && <img src={userImage} alt="user" className="w-full h-full object-cover" />}
                    </div>
                    <div>
                        <h4 className="font-bold text-sm leading-tight">{displayUser}</h4>
                        <p className="text-xs text-gray-500">Visionary • 3d • Edited</p>
                    </div>
                    <div className="ml-auto text-gray-500">•••</div>
                </div>

                {/* Content */}
                <div className="text-sm mb-3 flex-shrink-0">
                    <span className="line-clamp-3 whitespace-pre-wrap leading-relaxed">{displayContent}</span>
                    <span className="text-gray-500 text-xs cursor-pointer font-semibold">...see more</span>
                </div>

                {/* Image */}
                 <div className="w-full aspect-video bg-gray-100 flex items-center justify-center overflow-hidden rounded mb-3 border border-gray-200 relative flex-shrink-0">
                    {imageUrl ? (
                        <img src={imageUrl} alt="Post" className="w-full h-full object-cover" />
                    ) : isImageGenerating ? (
                        <div className="flex flex-col items-center gap-2">
                             <Loader size="md" />
                             <span className="text-xs text-gray-500">Generating...</span>
                        </div>
                    ) : (
                        <div className="text-gray-300 text-4xl">🖼️</div>
                    )}
                </div>

                {/* Actions */}
                <div className="border-t border-gray-200 pt-2 flex justify-between px-2 mt-auto pb-4">
                     <button className="flex flex-col items-center gap-1 text-gray-500 hover:text-blue-600">
                         <div className="flex items-center gap-1"><span className="text-lg">👍</span> <span className="text-xs font-semibold">Like</span></div>
                     </button>
                     <button className="flex flex-col items-center gap-1 text-gray-500 hover:text-blue-600">
                         <div className="flex items-center gap-1"><span className="text-lg">💬</span> <span className="text-xs font-semibold">Comment</span></div>
                     </button>
                      <button className="flex flex-col items-center gap-1 text-gray-500 hover:text-blue-600">
                         <div className="flex items-center gap-1"><span className="text-lg">🔁</span> <span className="text-xs font-semibold">Repost</span></div>
                     </button>
                      <button className="flex flex-col items-center gap-1 text-gray-500 hover:text-blue-600">
                         <div className="flex items-center gap-1"><span className="text-lg">🚀</span> <span className="text-xs font-semibold">Send</span></div>
                     </button>
                </div>
            </div>
        </div>
    );

    const renderX = () => (
         <div className="flex flex-col h-full bg-black text-white font-sans overflow-hidden p-4">
            {/* Header */}
            <div className="flex gap-3 mb-2">
                 <div className="w-10 h-10 rounded-full bg-gray-800 overflow-hidden border border-gray-700 flex-shrink-0">
                    {userImage && <img src={userImage} alt="user" className="w-full h-full object-cover" />}
                </div>
                <div className="flex-grow">
                    <div className="flex items-center gap-1 mb-1">
                        <span className="font-bold text-sm">{displayUser}</span>
                        <CheckCircleIcon className="w-3 h-3 text-blue-400" />
                        <span className="text-gray-500 text-sm">{displayHandle} · 2h</span>
                    </div>
                    
                    {/* Text */}
                    <div className="text-[15px] leading-normal mb-3 whitespace-pre-wrap">
                        {displayContent}
                    </div>

                     {/* Image */}
                    <div className="w-full aspect-video bg-gray-900 flex items-center justify-center overflow-hidden rounded-2xl border border-gray-800 relative mb-3">
                        {imageUrl ? (
                            <img src={imageUrl} alt="Post" className="w-full h-full object-cover" />
                        ) : isImageGenerating ? (
                             <div className="flex flex-col items-center gap-2">
                                 <Loader size="sm" />
                            </div>
                        ) : null}
                    </div>

                    {/* Actions */}
                     <div className="flex justify-between text-gray-500 max-w-md">
                         <MessageCircleIcon className="w-4 h-4" />
                         <RepeatIcon className="w-4 h-4" />
                         <HeartIcon className="w-4 h-4" />
                         <div className="flex gap-3">
                             <BookmarkIcon className="w-4 h-4" />
                             <div className="w-4 h-4" /> 
                         </div>
                     </div>
                </div>
            </div>
         </div>
    );

    const renderFacebook = () => (
        <div className="flex flex-col h-full bg-[#F0F2F5] text-black font-sans overflow-hidden">
             {/* Header Bar */}
             <div className="bg-white px-4 py-3 flex justify-between items-center shadow-sm">
                <span className="font-bold text-blue-600">facebook</span>
                <div className="flex gap-3">
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">🔍</div>
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">💬</div>
                </div>
             </div>

             {/* Post Card */}
             <div className="bg-white mt-3 pb-2 h-full flex flex-col">
                <div className="flex items-center gap-2 p-3">
                     <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden border border-gray-300">
                       {userImage && <img src={userImage} alt="user" className="w-full h-full object-cover" />}
                    </div>
                    <div>
                        <h4 className="font-bold text-sm text-gray-900">{displayUser}</h4>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                            <span>2h</span>
                            <span>•</span>
                            <span>🌎</span>
                        </div>
                    </div>
                    <div className="ml-auto text-gray-500 text-xl font-bold mb-4">...</div>
                </div>

                <div className="px-3 pb-3 text-sm text-gray-900 leading-normal whitespace-pre-wrap line-clamp-4">
                    {displayContent}
                    <span className="text-gray-500 font-semibold cursor-pointer"> See more</span>
                </div>

                <div className="w-full bg-gray-100 relative overflow-hidden flex-grow max-h-[300px] flex items-center justify-center">
                    {imageUrl ? (
                        <img src={imageUrl} alt="Post" className="w-full h-full object-cover" />
                    ) : isImageGenerating ? (
                         <div className="flex flex-col items-center gap-2">
                             <Loader size="md" />
                             <span className="text-xs text-gray-500">Generating...</span>
                        </div>
                    ) : (
                         <div className="text-gray-300 text-6xl">📷</div>
                    )}
                </div>
                
                {/* Engagement Stats */}
                <div className="px-3 py-2 flex justify-between text-xs text-gray-500 border-b border-gray-200">
                    <div className="flex items-center gap-1">
                         <div className="bg-blue-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[8px]">👍</div>
                         <span>124</span>
                    </div>
                    <div className="flex gap-2">
                        <span>32 comments</span>
                        <span>5 shares</span>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-between px-4 py-2">
                    <button className="flex items-center gap-2 text-gray-600 font-semibold text-sm">
                        <span>👍</span> Like
                    </button>
                    <button className="flex items-center gap-2 text-gray-600 font-semibold text-sm">
                         <span>💬</span> Comment
                    </button>
                     <button className="flex items-center gap-2 text-gray-600 font-semibold text-sm">
                         <span>↗️</span> Share
                    </button>
                </div>
             </div>
        </div>
    );

    const renderTikTok = () => (
        <div className="flex flex-col h-full bg-black text-white font-sans overflow-hidden relative">
            {/* Background Image (The Content) */}
            <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
                {imageUrl ? (
                    <img src={imageUrl} alt="TikTok Background" className="w-full h-full object-cover opacity-90" />
                ) : isImageGenerating ? (
                     <div className="flex flex-col items-center gap-2">
                         <Loader size="lg" />
                    </div>
                ) : (
                     <div className="text-gray-700 text-6xl">🎵</div>
                )}
            </div>

            {/* Overlay UI */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60 flex flex-col justify-between p-4">
                {/* Top Bar */}
                <div className="flex justify-center pt-2 text-sm font-bold text-gray-300 gap-4">
                    <span>Following</span>
                    <span className="text-white border-b-2 border-white pb-1">For You</span>
                </div>

                {/* Right Sidebar */}
                <div className="absolute right-2 bottom-20 flex flex-col gap-6 items-center">
                    <div className="w-10 h-10 rounded-full border-2 border-white bg-gray-500 overflow-hidden relative">
                        {userImage && <img src={userImage} alt="User" className="w-full h-full object-cover" />}
                        <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 bg-red-500 text-white w-4 h-4 rounded-full flex items-center justify-center text-xs">+</div>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                        <HeartIcon className="w-8 h-8 fill-white text-white" />
                        <span className="text-xs font-bold">12.5K</span>
                    </div>
                     <div className="flex flex-col items-center gap-1">
                        <MessageCircleIcon className="w-8 h-8 text-white fill-white" />
                        <span className="text-xs font-bold">482</span>
                    </div>
                     <div className="flex flex-col items-center gap-1">
                        <BookmarkIcon className="w-8 h-8 text-white fill-white" />
                        <span className="text-xs font-bold">1.2K</span>
                    </div>
                     <div className="flex flex-col items-center gap-1">
                        <div className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center animate-spin-slow">
                            <span>💿</span>
                        </div>
                    </div>
                </div>

                {/* Bottom Info */}
                <div className="mb-2 pr-12">
                    <h4 className="font-bold text-base mb-1">@{displayHandle.substring(1)}</h4>
                    <div className="text-sm leading-tight mb-2">
                        <span className="line-clamp-2">{displayContent}</span>
                        <span className="font-bold text-gray-300">...more</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-bold">
                        <span>🎵</span>
                        <div className="overflow-hidden w-32">
                            <span className="whitespace-nowrap">Original Sound - {displayUser}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="w-[320px] h-[640px] bg-black rounded-[3rem] p-3 shadow-2xl border-[6px] border-gray-800 relative mx-auto transition-transform hover:scale-[1.01]">
            {/* Notch */}
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 h-6 w-32 bg-black rounded-b-xl z-20"></div>
            
            {/* Screen */}
            <div className="w-full h-full bg-white rounded-[2.25rem] overflow-hidden relative z-10">
                {platform === Platform.Instagram && renderInstagram()}
                {platform === Platform.LinkedIn && renderLinkedin()}
                {platform === Platform.X && renderX()}
                {platform === Platform.Facebook && renderFacebook()}
                {platform === Platform.TikTok && renderTikTok()}
            </div>
        </div>
    );
};