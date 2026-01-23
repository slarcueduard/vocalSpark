
import React, { useState, useEffect, useRef } from 'react';
import {
    generateSocialMediaPosts, generateImageForPost, analyzeViralStructure, generateUrlRemix, generateGroundedRemix, adaptPostForPlatform, refinePostContent, autoGenerateBrandProfile, generatePostIdeas, findTrendingContent, generateImageToTextPosts // Import analyzer
} from './services/geminiService';
import { savePostToHistory, updatePostInHistory, schedulePost, markPostAsPublished, checkDuePosts } from './services/postService';
import { initGA, logEvent } from './services/analytics';
import { Post, Tone, Platform, AppMode, ViralHook, RefinementType, PostObjective, GenerationType } from './types';
import { TONES, PLATFORMS, OBJECTIVES, getRandomVibe, VAULT_LIMITS, IMAGE_UPLOAD_LIMITS } from './constants';
import { db, auth } from './services/firebase';

import { Loader } from './components/Loader';
import { SparklesIcon, ImageIcon, BriefcaseIcon } from './components/Icons';
import { Lock, X, HelpCircle, Globe, Bell, Repeat, CheckCircle, Fingerprint, Dices, Target, Youtube, Smile, AlertTriangle, Sparkles, MessageCircle, Mic, Lightbulb, MonitorPlay, Upload, Trash2, Plus, Image as LucideImage } from 'lucide-react';
import { ImageCreationModal } from './components/ImageCreationModal';
import { BrandProfileModal } from './components/BrandProfileModal';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { MainLayout } from './layouts/MainLayout';
import { PhonePreview } from './components/PhonePreview';
import { PostCard } from './components/PostCard';
import { LandingPage } from './components/LandingPage';
import { HistoryView } from './components/HistoryView';
import { CalendarView } from './components/CalendarView';
import { NotificationManager } from './components/NotificationManager';
import { DocumentationView } from './components/DocumentationView';
import { SourceFinderModal } from './components/SourceFinderModal';

// FIX: Separate links for different upgrade paths
const STRIPE_PRO_LINK = "https://buy.stripe.com/8x2cN51DI9ZZ3BTczkaAw06";
const STRIPE_FOUNDER_LINK = "https://buy.stripe.com/5kQ3cvbei0pp1tL1UGaAw05";


const HOOKS: ViralHook[] = ['Straight to the Point', 'Storytime', 'Controversial', 'Behind the Scenes', 'Myth vs Fact', 'Transformation', 'Unpopular Opinion', 'Day in the Life', 'Hack / Trick'];

const SocialSparkApp: React.FC = () => {
    const { user, brandProfile, saveBrandProfile, checkCredits, refundCredits, isTrialExpired, loading, userProfile, logout } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // FIX: Check for "Become a Founder" redirect after login
    useEffect(() => {
        const shouldRedirect = localStorage.getItem('redirect_to_founder');
        if (shouldRedirect === 'true') {
            localStorage.removeItem('redirect_to_founder');
            window.location.href = STRIPE_FOUNDER_LINK;
        }
    }, []);



    const [currentView, setCurrentView] = useState<'create' | 'history' | 'calendar' | 'docs'>('create');

    // Starea pentru Moduri
    // UPDATED: Default to 'multi' (Creator Studio) instead of 'creator' (Single)
    const [appMode, setAppMode] = useState<AppMode>('multi');

    // Niche input state for General Profile
    const [manualNiche, setManualNiche] = useState('');

    // UI Toggles
    const [isGeneratingIdea, setIsGeneratingIdea] = useState(false);
    const [showSourceFinder, setShowSourceFinder] = useState(false); // Modal Toggle
    const [isListening, setIsListening] = useState(false); // Voice Input State
    useEffect(() => {
        initGA();
    }, []);

    useEffect(() => {
        // Track "Virtual" Page Views based on App Mode and Current View
        const page = currentView === 'create' ? `/${appMode}` : `/${currentView}`;
        logEvent('Navigation', 'View Change', page);
    }, [appMode, currentView]);
    const [replyOptions, setReplyOptions] = useState({ useEmojis: true, question: '', link: '' });
    const [isCampaignMode, setIsCampaignMode] = useState(false);

    const [planningContext, setPlanningContext] = useState<{ date: Date, title: string, eventId?: string } | null>(null);

    // ... (rest of the file until CalendarView render)

    const [topic, setTopic] = useState('');
    const [remixTargetTopic, setRemixTargetTopic] = useState(''); // NEW: Target topic for Remix
    const [remixSubMode, setRemixSubMode] = useState<'repurpose' | 'xray'>('repurpose'); // NEW: Split Remix Modes
    const [xRayData, setXRayData] = useState<{ hook: string, tone: string, structure: string } | null>(null); // NEW: X-Ray Results
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [tone, setTone] = useState<Tone>(Tone.Professional);
    const [selectedPlatform, setSelectedPlatform] = useState<Platform>(Platform.Instagram);
    const [objective, setObjective] = useState<PostObjective>('engagement');
    const [campaignCount, setCampaignCount] = useState(3);
    const [remixFormats, setRemixFormats] = useState<string[]>(['LinkedIn Post', 'Twitter Thread']);
    const [useGreenScreen, setUseGreenScreen] = useState(false); // NEW: TikTok Green Screen Mode
    const [multiPlatformTargets, setMultiPlatformTargets] = useState<Platform[]>([Platform.Instagram, Platform.Facebook, Platform.LinkedIn, Platform.X]);
    const [remixSource, setRemixSource] = useState<'text' | 'youtube'>('text');
    const [showManualTranscriptInput, setShowManualTranscriptInput] = useState(false);
    const [transcriptError, setTranscriptError] = useState<string | null>(null);
    const [manualTranscript, setManualTranscript] = useState('');

    const [attachedImage, setAttachedImage] = useState<string | null>(null);
    const [posts, setPosts] = useState<Post[]>([]);

    const [useRealTime, setUseRealTime] = useState(false);
    const [vibeMessage, setVibeMessage] = useState<string | null>(null);
    const [notification, setNotification] = useState<string | null>(null);

    // Image to Text State
    const [sourceImages, setSourceImages] = useState<string[]>([]);
    const [isUploading, setIsUploading] = useState(false);

    const [isImageModalOpen, setIsImageModalOpen] = useState(false);
    const [isBrandProfileModalOpen, setIsBrandProfileModalOpen] = useState(false);

    const [activePostIdForImage, setActivePostIdForImage] = useState<string | null>(null);
    const [currentPromptForImage, setCurrentPromptForImage] = useState('');
    const [useBrandVoice, setUseBrandVoice] = useState(true);

    const [refiningPostId, setRefiningPostId] = useState<string | null>(null);
    const resultsRef = useRef<HTMLDivElement>(null);
    const recognitionRef = useRef<any>(null); // For Audio Rant Mode

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

    const handleSwitchMode = (mode: 'single' | 'campaign' | 'remix' | 'multi' | 'reply' | 'img2text') => {
        setError(null);

        // --- GATING LOGIC ---
        const userTier = userProfile?.subscriptionTier || 'pro'; // Default to pro if undefined
        if (userTier !== 'agency') {
            if (mode === 'campaign' || mode === 'reply') {
                // Show Upgrade Modal or Alert
                alert("🔒 This feature is available only for Agency Plan users.\n\nUpgrade to unlock Campaign Mode, Smart Reply, and Advanced Analytics.");
                return;
            }
        }

        if (mode === 'single') { setAppMode('creator'); setIsCampaignMode(false); }
        else if (mode === 'campaign') { setAppMode('creator'); setIsCampaignMode(true); }
        else if (mode === 'remix') {
            setAppMode('remix');
            setIsCampaignMode(false);
            setTopic(''); // Clear topic when entering Remix mode
        }
        else if (mode === 'multi') { setAppMode('multi'); setIsCampaignMode(false); } // This is now "Creator Studio"
        else if (mode === 'reply') {
            setAppMode('reply');
            setIsCampaignMode(false);
            // Auto-populate link if brand profile has one
            if (brandProfile?.links && brandProfile.links.length > 0) {
                setReplyOptions(prev => ({ ...prev, link: brandProfile.links![0] }));
            }
        }
        else if (mode === 'img2text') {
            setAppMode('img2text');
            setIsCampaignMode(false);
            setTopic("Visual Storytelling");
        }
    };

    const toggleMultiPlatform = (p: Platform) => {
        if (multiPlatformTargets.includes(p)) {
            if (multiPlatformTargets.length > 1) setMultiPlatformTargets(prev => prev.filter(t => t !== p));
        } else {
            setMultiPlatformTargets(prev => [...prev, p]);
        }
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
        // Daily Inspiration is now triggered manually via "Need Ideas?" button, 
        // but we can still pre-fill if empty on load if desired. 
        // For now, removing auto-fill to respect "Simple by Default" and let user choose.
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

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        const tier = userProfile?.subscriptionTier || 'trial';
        const limit = IMAGE_UPLOAD_LIMITS[tier] || 1;

        if (sourceImages.length + files.length > limit) {
            alert(`🔒 Limit Reached.\n\nYour plan (${tier}) allows max ${limit} images.\nUpgrade for more!`);
            return;
        }

        setIsUploading(true);
        const newImages: string[] = [];

        try {
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const reader = new FileReader();
                const dataUrl = await new Promise<string>((resolve) => {
                    reader.onload = (e) => resolve(e.target?.result as string);
                    reader.readAsDataURL(file);
                });
                const compressed = await compressImage(dataUrl);
                newImages.push(compressed);
            }
            setSourceImages(prev => [...prev, ...newImages]);
        } catch (err) {
            console.error("Upload failed", err);
            setError("Failed to process images.");
        } finally {
            setIsUploading(false);
            // Reset input
            e.target.value = '';
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
                // Use centralized limit logic
                const tier = userProfile?.subscriptionTier || 'trial';
                const limit = VAULT_LIMITS[tier] || VAULT_LIMITS['trial'];

                for (const postData of newPostsData) {
                    await savePostToHistory(user.uid, postData, "I'm Feeling Lucky 🎲", limit);
                }
            }
        } catch (err: any) { setError(err.message || 'Failed to generate lucky post.'); refundCredits(1); }
        finally { setIsLoading(false); }
    };

    const handleGenerate = async () => {
        if (appMode === 'img2text') {
            if (sourceImages.length === 0) { setError("Please upload at least one photo."); return; }
        } else if (!topic.trim() && !attachedImage) {
            setError(appMode === 'remix' ? "Paste content to remix." : "Please write a topic."); return;
        }

        // --- NEW: IMAGE TO TEXT LOGIC ---
        if (appMode === 'img2text') {
            setIsLoading(true); setError(null);
            setNotification("Analyzing visuals & crafting story... 📸");
            try {
                const generatedPosts = await generateImageToTextPosts(
                    sourceImages,
                    tone,
                    brandProfile?.language || 'English',
                    brandProfile || undefined
                );

                if (!generatedPosts || generatedPosts.length === 0) throw new Error("No posts generated.");

                const newPostsData = generatedPosts.map(p => ({
                    ...p,
                    id: crypto.randomUUID(),
                    adaptedContent: {},
                    isGeneratingImage: false,
                    isLocked: false
                }));

                setPosts(prev => [...newPostsData, ...prev]);
                setVibeMessage("✨ Story Crafted!");

                // Save to Vault
                if (user) {
                    const tier = userProfile?.subscriptionTier || 'trial';
                    const limit = VAULT_LIMITS[tier] || VAULT_LIMITS['trial'];
                    for (const p of newPostsData) {
                        await savePostToHistory(user.uid, p, `Image Story (${sourceImages.length} pics)`, limit);
                    }
                }

                // Scroll
                setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth' }), 500);

            } catch (e: any) {
                console.error(e);
                setError(e.message || "Failed to generate story.");
            } finally {
                setIsLoading(false);
                setNotification(null);
            }
            return;
        }

        // --- NEW: GENERIC URL REMIX (Twitter, Blog, etc.) ---
        // If we are in Remix Mode AND 'text' is selected, check if input is a URL.
        const cleanTopic = topic.trim();
        const isUrl = cleanTopic.match(/^https?:\/\//);

        if (appMode === 'remix' && remixSource === 'text' && isUrl) {
            // It's a URL but NOT YouTube (since user didn't switch to YouTube toggle, or we can auto-detect)
            // If it IS YouTube, we might want to guide them to use the YouTube toggle OR just handle it here too.
            // But our specific YouTube pipeline is better. Let's redirect logic internally if needed, or just let them use the toggle.
            // Let's assume Text Tab + URL = Generic Scrape intended.

            try {
                setIsLoading(true);
                setNotification("Analyzing Link Content... 🔗");

                console.log("Starting Generic URL Remix...");
                const remixData = await generateUrlRemix(
                    cleanTopic,
                    remixFormats,
                    tone,
                    brandProfile?.language || 'English'
                );

                if (!remixData || !remixData.posts || !Array.isArray(remixData.posts)) {
                    throw new Error("Failed to analyze the link. Please try pasting the text instead.");
                }

                // Transform response to App format
                const newPostsData = remixData.posts.map((p: any) => ({
                    ...p, // content, platform
                    id: crypto.randomUUID(),
                    adaptedContent: {},
                    imageUrl: null,
                    isLocked: false,
                    type: 'remix',
                    generationType: 'remix',
                    createdAt: new Date(),
                    topic: remixData.analysis?.main_idea || "Remix from Link"
                }));

                // Save and Update State
                setPosts(prev => [...newPostsData, ...prev]);

                // Persist to DB
                const tier = userProfile?.subscriptionTier || 'trial';
                const limit = VAULT_LIMITS[tier] || VAULT_LIMITS['trial'];

                for (const p of newPostsData) {
                    await savePostToHistory(user?.uid || 'anon', p, `Remix: ${remixData.url} `, limit);
                }

                setVibeMessage("Link Remixed Successfully! 🚀");
                setTopic(""); // Clear input
                setRemixTargetTopic(""); // Clear remix target topic

                // Scroll to results
                setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth' }), 500);

                return; // STOP HERE, don't run normal text generation

            } catch (e: any) {
                console.error("URL Remix Error:", e);
                // Fallback: If scraping fails, maybe just run it as text? 
                // No, better to tell user scraping failed so they know why.
                setError(`Link analysis failed: ${e.message}. Try pasting the text manually.`);
                return;
            } finally {
                setIsLoading(false);
                setNotification(null);
            }
        }

        // --- YOUTUBE REMIX LOGIC (GROUNDED PIPELINE) ---
        if (appMode === 'remix' && remixSource === 'youtube') {
            try {
                // Determine if valid URL
                const cleanTopic = topic.trim();
                const isYouTube = cleanTopic.match(/^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/);
                if (!isYouTube) { setError("Please paste a valid YouTube URL."); return; }

                setNotification("Running Grounded Analysis Pipeline... 🚀");
                setIsLoading(true);

                // Use the new Grounded Pipeline directly
                console.log("Starting Grounded Remix Generation...");
                const remixData = await generateGroundedRemix(
                    cleanTopic,
                    remixFormats,
                    tone,
                    brandProfile?.language || 'English'
                );

                if (!remixData || !remixData.posts || !Array.isArray(remixData.posts)) {
                    console.error("Invalid Remix Data:", remixData);
                    throw new Error("Pipeline returned invalid data structure.");
                }

                // Map the structured response to the UI's Post format
                const newPostsData = remixData.posts.map((p: any) => ({
                    id: Date.now().toString() + Math.random().toString(36).substring(2),
                    content: p.content || "Error: No content generated.",
                    platform: p.platform || "unknown",
                    type: 'remix',
                    imagePrompt: null,
                    imageUrl: null,
                    isGeneratingImage: false,
                    isLocked: false,
                    generationType: 'single',
                    topic: remixData.analysis?.main_idea || cleanTopic // Defensive check
                }));

                setPosts(prev => [...newPostsData, ...prev]);
                setNotification(null);
                setVibeMessage("✨ Analysis Complete! Grounded posts generated.");
                setIsLoading(false);
                setTopic(""); // Clear input
                setRemixTargetTopic(""); // Clear remix target topic


            } catch (err: any) {
                console.error("Remix Error:", err);
                setError(err.message || "Failed to analyze video.");
                setNotification(null);
            } finally {
                setIsLoading(false);
            }
            return; // Stop standard generation
        }

        let count = 1;
        if (isCampaignMode) count = campaignCount;
        if (appMode === 'remix') count = remixFormats.length;
        if (appMode === 'multi') count = multiPlatformTargets.length;

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
                topic, tone, count, brandProfile?.language || 'English',
                useBrandVoice ? (brandProfile?.voiceDNA || '') : '',
                useBrandVoice ? (brandProfile || undefined) : undefined,
                imgData, imgMime, objective, useRealTime, isCampaignMode, appMode === 'remix', remixFormats, false, "", appMode === 'multi', multiPlatformTargets, remixTargetTopic,
                xRayData || undefined, // Pass X-Ray constraints if they exist
                appMode === 'reply',
                appMode === 'reply' ? replyOptions : undefined,
                useGreenScreen // NEW: Green Screen Flag
            );

            if (!generatedPosts || !Array.isArray(generatedPosts) || generatedPosts.length === 0) throw new Error("AI returned an empty response.");

            let genType: GenerationType = 'single';
            if (appMode === 'remix') genType = 'remix';
            else if (appMode === 'multi') genType = 'single'; // Treat as single posts visually, or maybe 'multi'? Let's use 'single' so they show up normally.
            else if (isCampaignMode) genType = 'campaign';

            const newPostsData = generatedPosts.map(p => ({
                ...p, id: crypto.randomUUID(), adaptedContent: {},
                content: p.content, // Fallback if content missing
                imageUrl: attachedImage || null,
                isGeneratingImage: false, isLocked: false, generationType: genType, type: p.type || 'post',
                linkedEventId: planningContext?.eventId || null,
                linkedEventTitle: planningContext?.title || null,
                scheduledDate: planningContext?.date || null, // Auto-schedule if coming from calendar
                xRayAnalysis: p.xRayAnalysis // Map X-Ray Data
            }));

            setPosts(prev => [...newPostsData, ...prev].slice(0, 10));
            setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
            showVibe();

            if (user) {
                // Use centralized limit logic
                const tier = userProfile?.subscriptionTier || 'trial';
                const limit = VAULT_LIMITS[tier] || VAULT_LIMITS['trial'];
                if (appMode !== 'reply') {
                    for (const postData of newPostsData) {
                        await savePostToHistory(user.uid, postData, topic, limit);
                    }
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
    const handleAdaptPost = async (id: string, platform: Platform, content: string) => {
        if (!checkCredits(1)) {
            alert("Insufficient credits! Platform adaptation costs 1 credit.");
            return;
        }

        try {
            const adapted = await adaptPostForPlatform(content, platform);

            // Update the main content field so it shows everywhere
            setPosts(prev => prev.map(p => p.id === id ? { ...p, content: adapted } : p));

            // Also update in history if user is logged in
            if (user) {
                await updatePostInHistory(id, { content: adapted });
            }
        } catch (error) {
            console.error("Adaptation error:", error);
            refundCredits(1);
            alert("Failed to adapt post. Please try again.");
        }
    };
    const handleRefinePost = async (id: string, type: RefinementType, content: string) => { if (!checkCredits(1)) return; setRefiningPostId(id); const refined = await refinePostContent(content, type); setPosts(prev => prev.map(p => p.id === id ? { ...p, content: refined } : p)); updatePostInHistory(id, { content: refined }); setRefiningPostId(null); };

    const handleFollowUp = async (parentId: string, parentContent: string) => {
        if (!user) return;
        if (!checkCredits(1)) { alert("Insufficient credits! Follow-up costs 1 credit."); return; }

        setIsLoading(true);
        setNotification("Drafting Follow-up Post... 🧵");

        try {
            const generated = await generateSocialMediaPosts(
                "Follow-up", // Original topic for follow-up
                Tone.Professional,
                1,
                brandProfile?.language || 'English',
                brandProfile?.voiceDNA || '',
                undefined, undefined, undefined, 'engagement',
                false, false, false, [], true, parentContent
            );

            if (generated && generated.length > 0) {
                const newPost = generated[0];
                const postToSave: any = {
                    ...newPost,
                    id: crypto.randomUUID(),
                    adaptedContent: {},
                    imageUrl: null,
                    isGeneratingImage: false,
                    isLocked: false,
                    postCount: isCampaignMode ? campaignCount : undefined,
                    remixFormats: appMode === 'remix' ? remixFormats : undefined,
                    isReply: appMode === 'reply',
                    replyOptions: appMode === 'reply' ? replyOptions : undefined,
                    generationType: appMode === 'remix' ? 'remix' : (isCampaignMode ? 'campaign' : 'single'),
                    type: 'post',
                    parentId: parentId, // LINKING HAPPENS HERE
                    platform: newPost.platform || 'Generic'
                };

                // Add to local state (at top)
                setPosts(prev => [postToSave, ...prev]);

                // Save to DB
                const tier = userProfile?.subscriptionTier || 'trial';
                const limit = VAULT_LIMITS[tier] || VAULT_LIMITS['trial'];
                await savePostToHistory(user.uid, postToSave, "Follow-up Post", limit);

                setVibeMessage("🧵 Follow-up Drafted!");
            }
        } catch (e: any) {
            console.error("Follow-up Error:", e);
            setError(e.message || "Failed to create follow-up.");
            refundCredits(1);
        } finally {
            setIsLoading(false);
            setNotification(null);
        }
    };

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
            <NotificationManager />

            {isTrialExpired && (
                <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-[#161b22] border border-red-500/50 p-8 rounded-2xl text-center max-w-md w-full shadow-2xl shadow-red-900/20 animate-in fade-in zoom-in duration-300">
                        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6"><Lock size={32} className="text-red-500" /></div>
                        <h2 className="text-2xl font-bold text-white mb-2">Trial Expired</h2>
                        <p className="text-gray-400 mb-8">You've used all your free credits. Upgrade to Pro to continue creating viral content.</p>
                        <div className="space-y-3">
                            <button onClick={() => { window.location.href = STRIPE_PRO_LINK; }} className="w-full py-3 bg-gradient-to-r from-red-600 to-orange-600 text-white font-bold rounded-lg hover:scale-[1.02] transition shadow-lg shadow-red-900/30">Upgrade to PRO ($12.99)</button>
                            <button onClick={() => logout()} className="w-full py-3 bg-gray-800 text-gray-300 font-medium rounded-lg hover:bg-gray-700 hover:text-white transition border border-gray-700">Sign Out</button>
                        </div>
                        <button onClick={() => { if (confirm("Dev: Reset Credits?")) { window.location.reload(); } }} className="mt-8 text-[10px] text-gray-600 hover:text-gray-400 cursor-pointer transition">[Dev Mode: How to Reset?]</button>
                    </div>
                </div>
            )}

            {currentView === 'history' ? <HistoryView onNavigateToCalendar={() => setCurrentView('calendar')} /> : currentView === 'calendar' ? (
                <CalendarView
                    onNavigateToVault={() => setCurrentView('history')}
                    onNavigateToCreate={(data) => {
                        setTopic(data.title);
                        setPlanningContext({ date: data.date, title: data.title, eventId: data.id });
                        setCurrentView('create');
                    }}
                />
            ) : currentView === 'docs' ? (
                <DocumentationView onClose={() => setCurrentView('create')} />
            ) : (
                <div className="flex h-full gap-6 relative">
                    <div className="flex-1 min-w-0">
                        <div className="max-w-2xl mx-auto pb-20">
                            <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div>
                                    {/* Brand Badge Removed to dedup "Writing as" */}

                                    <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">{appMode === 'img2text' ? 'Image to Text 📸' : appMode === 'remix' ? 'Content Remix ♻️' : appMode === 'reply' ? 'Smart Reply 💬' : isCampaignMode ? 'Campaign Mode 🚀' : 'Creator Studio ✨'}</h2>
                                    <p className="text-gray-500 text-sm mt-1">{appMode === 'img2text' ? 'Turn photos into viral posts.' : appMode === 'remix' ? 'Repurpose content instantly.' : appMode === 'reply' ? 'Generate engaging replies in your voice.' : isCampaignMode ? 'Generate a content calendar.' : 'Create content for multiple platforms.'}</p>
                                </div>
                                <div className="flex w-full md:w-auto bg-[#161b22] p-1 rounded-xl border border-gray-700 overflow-x-auto no-scrollbar">
                                    {/* Removed 'Single' Tab. Renamed 'Multiple' to 'Creator Studio' behavior (which is 'multi' mode) */}
                                    <button onClick={() => handleSwitchMode('multi')} className={`flex-1 px-3 md:px-4 py-2 rounded-lg text-[10px] md:text-xs font-bold whitespace-nowrap transition ${appMode === 'multi' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}>Creator Studio</button>

                                    <button onClick={() => handleSwitchMode('campaign')} className={`flex-1 px-3 md:px-4 py-2 rounded-lg text-[10px] md:text-xs font-bold whitespace-nowrap transition flex items-center gap-1 ${appMode === 'creator' && isCampaignMode ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}>
                                        Campaign {(userProfile?.subscriptionTier !== 'agency') && <Lock size={10} />}
                                    </button>

                                    <button onClick={() => handleSwitchMode('remix')} className={`flex-1 px-3 md:px-4 py-2 rounded-lg text-[10px] md:text-xs font-bold whitespace-nowrap transition ${appMode === 'remix' ? 'bg-green-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}>Remix</button>

                                    <button onClick={() => handleSwitchMode('reply')} className={`flex-1 px-3 md:px-4 py-2 rounded-lg text-[10px] md:text-xs font-bold whitespace-nowrap transition flex items-center gap-1 ${appMode === 'reply' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}>
                                        Reply {(userProfile?.subscriptionTier !== 'agency') && <Lock size={10} />}
                                    </button>

                                    <button onClick={() => handleSwitchMode('img2text')} className={`flex-1 px-3 md:px-4 py-2 rounded-lg text-[10px] md:text-xs font-bold whitespace-nowrap transition flex items-center gap-1 ${appMode === 'img2text' ? 'bg-pink-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}>
                                        Image to Text 📸
                                    </button>
                                </div>
                            </header>
                            <div className="space-y-8">
                                <section className="space-y-3">
                                    <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
                                        <label className="text-sm font-bold text-gray-300 tracking-wide flex items-center gap-2">
                                            <span className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center text-[10px] text-white">1</span>
                                            {appMode === 'img2text' ? 'Upload Photos' : appMode === 'remix' ? 'Source Content' : appMode === 'reply' ? 'Original Comment / Message' : "Post Topic"}
                                        </label>

                                        {/* REMIX: SMART SOURCE BUTTON */}
                                        {appMode === 'remix' && (
                                            <button
                                                onClick={() => setShowSourceFinder(true)}
                                                className="text-xs bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 px-3 py-1 rounded-full flex items-center gap-1 transition animate-pulse"
                                                title="Find fresh content in your niche"
                                            >
                                                <Globe size={12} />
                                                Find Content
                                            </button>

                                        )}

                                        {/* DAILY INSPIRATION & NICHE INPUT */}
                                        {appMode !== 'remix' && appMode !== 'reply' && (
                                            <div className="flex flex-wrap items-center gap-2 mb-2 sm:mb-0">
                                                {/* Show Niche Input if in General Mode (!useBrandVoice) */}
                                                {!useBrandVoice && (
                                                    <input
                                                        type="text"
                                                        className="bg-[#161b22] border border-gray-700 rounded-lg px-2 py-1 text-xs text-white focus:border-blue-500 outline-none w-24 md:w-32 placeholder-gray-500"
                                                        placeholder="Your Niche..."
                                                        value={manualNiche}
                                                        onChange={(e) => setManualNiche(e.target.value)}
                                                    />
                                                )}

                                                <button
                                                    disabled={isGeneratingIdea}
                                                    onClick={async () => {
                                                        const activeNiche = useBrandVoice
                                                            ? (brandProfile?.industry || "Marketing")
                                                            : (manualNiche || "Marketing");

                                                        setIsGeneratingIdea(true);
                                                        try {
                                                            const newIdea = await generatePostIdeas(activeNiche);
                                                            setTopic(newIdea);
                                                        } catch (e) {
                                                            console.error("Failed to get idea", e);
                                                        } finally {
                                                            setIsGeneratingIdea(false);
                                                        }
                                                    }}
                                                    className={`flex items-center gap-1.5 px-3 py-1 bg-yellow-500/10 text-yellow-500 text-[10px] font-bold rounded-full hover:bg-yellow-500/20 transition whitespace-nowrap ${isGeneratingIdea ? 'opacity-50 cursor-wait' : ''}`}
                                                >
                                                    {isGeneratingIdea ? <Loader size={12} className="animate-spin" /> : <Lightbulb size={12} />}
                                                    {isGeneratingIdea ? 'Thinking...' : 'Need Ideas?'}
                                                </button>
                                            </div>
                                        )}


                                        <div className="flex flex-col items-start gap-2 w-full sm:w-auto sm:flex-row sm:items-center sm:gap-3">
                                            {/* REMIX SOURCE TOGGLE */}
                                            {appMode === 'remix' && (
                                                <div className="flex bg-[#0f1115] p-1 rounded-lg border border-gray-700">
                                                    <button
                                                        onClick={() => setRemixSource('text')}
                                                        className={`px-3 py-1 rounded text-[10px] font-bold transition flex items-center gap-1 ${remixSource === 'text' ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                                                    >
                                                        Text
                                                    </button>
                                                    <button
                                                        disabled
                                                        className="px-3 py-1 rounded text-[10px] font-bold transition flex items-center gap-1 opacity-50 cursor-not-allowed text-gray-500 border border-transparent"
                                                        title="Coming Soon in next update"
                                                    >
                                                        <Youtube size={10} /> YouTube <span className="text-[8px] bg-gray-800 px-1 py-0.5 rounded text-gray-400 ml-1">SOON</span>
                                                    </button>
                                                </div>
                                            )}

                                            {brandProfile && (
                                                <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-2">
                                                    <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider hidden sm:block">Writing as:</span>

                                                    {/* NEW SEGMENTED CONTROL FOR VOICE */}
                                                    <div className="flex bg-[#0f1115] p-1 rounded-lg border border-gray-700">
                                                        <button
                                                            onClick={() => setUseBrandVoice(true)}
                                                            className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-bold transition-all ${useBrandVoice ? 'bg-blue-600 text-white shadow-lg ring-1 ring-blue-500' : 'bg-gray-800 text-gray-500 hover:text-gray-300'}`}
                                                            title="Use your calibrated Brand Voice"
                                                        >
                                                            <Fingerprint size={10} />
                                                            {brandProfile.name || "My Brand"}
                                                        </button>
                                                        <button
                                                            onClick={() => setUseBrandVoice(false)}
                                                            className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-bold transition-all ${!useBrandVoice ? 'bg-gray-700 text-white shadow-lg' : 'bg-transparent text-gray-600 hover:text-gray-400'}`}
                                                            title="Switch to General Mode (No Niche Bias)"
                                                        >
                                                            <Globe size={10} />
                                                            General
                                                        </button>
                                                    </div>

                                                </div>
                                            )}
                                            {attachedImage && (
                                                <div className="flex items-center gap-2 bg-green-900/20 px-2 py-1 rounded-full border border-green-500/30 animate-in fade-in">
                                                    <span className="text-xs text-green-400 flex items-center gap-1"><ImageIcon size={12} /> Image Attached</span>
                                                    <button onClick={() => setAttachedImage(null)} className="text-green-500 hover:text-white transition rounded-full p-0.5 hover:bg-green-800"><X size={10} /></button>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {appMode === 'img2text' ? (
                                        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                                            <div className="bg-[#161b22] border-2 border-dashed border-gray-700 hover:border-blue-500 rounded-2xl p-6 transition-all text-center group cursor-pointer relative overflow-hidden">
                                                <input
                                                    type="file"
                                                    multiple
                                                    accept="image/*"
                                                    onChange={handleFileUpload}
                                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                                                />
                                                <div className="flex flex-col items-center gap-3 relative z-10">
                                                    <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                                                        {isUploading ? <Loader size={24} className="text-blue-500 animate-spin" /> : <Upload size={24} className="text-blue-500" />}
                                                    </div>
                                                    <div>
                                                        <h3 className="text-white font-bold">Upload Photos</h3>
                                                        <p className="text-gray-500 text-xs mt-1">
                                                            {userProfile?.subscriptionTier === 'agency' ? 'Up to 5 images' : '1 image limit (Upgrade for more)'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            {sourceImages.length > 0 && (
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                    {sourceImages.map((img, idx) => (
                                                        <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-gray-700 bg-black group">
                                                            <img src={img} alt={`Upload ${idx}`} className="w-full h-full object-cover" />
                                                            <button
                                                                onClick={() => setSourceImages(prev => prev.filter((_, i) => i !== idx))}
                                                                className="absolute top-2 right-2 bg-black/80 p-1.5 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                                                            >
                                                                <X size={12} />
                                                            </button>
                                                        </div>
                                                    ))}
                                                    {sourceImages.length < (IMAGE_UPLOAD_LIMITS[userProfile?.subscriptionTier || 'trial'] || 1) && (
                                                        <div className="relative aspect-square rounded-xl border border-gray-800 bg-[#0f1115] flex flex-col items-center justify-center text-gray-600 hover:text-gray-400 hover:border-gray-600 transition-all cursor-pointer">
                                                            <input
                                                                type="file"
                                                                multiple
                                                                accept="image/*"
                                                                onChange={handleFileUpload}
                                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                            />
                                                            <Plus size={24} />
                                                            <span className="text-[10px] font-bold mt-1">Add More</span>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="relative group">
                                            {appMode === 'remix' && remixSource === 'youtube' ? (
                                                <div className="relative">
                                                    <div className="absolute top-3 left-3 flex items-center gap-2 z-10 pointer-events-none">
                                                        <span className="bg-red-600 text-white p-1.5 rounded-lg shadow-lg shadow-red-600/20"><Youtube size={16} /></span>
                                                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Paste Video URL</span>
                                                    </div>
                                                    <textarea
                                                        value={topic}
                                                        onChange={(e) => setTopic(e.target.value)}
                                                        placeholder="https://www.youtube.com/watch?v=..."
                                                        className="w-full h-32 bg-[#161b22] border border-gray-700 rounded-xl p-4 pt-12 text-white placeholder-gray-600 focus:border-red-500 focus:ring-1 focus:ring-red-500/50 outline-none resize-none transition-all shadow-inner"
                                                    />
                                                </div>
                                            ) : (
                                                <div className="relative space-y-4">
                                                    {/* REMIX MODE TABS */}
                                                    {appMode === 'remix' && (
                                                        <div className="flex bg-[#0f1115] p-1 rounded-xl mb-4 border border-gray-800">
                                                            <button
                                                                onClick={() => setRemixSubMode('repurpose')}
                                                                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${remixSubMode === 'repurpose' ? 'bg-[#1c1c2e] text-purple-400 shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
                                                            >
                                                                Repurpose Content
                                                            </button>
                                                            <button
                                                                onClick={() => setRemixSubMode('xray')}
                                                                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${remixSubMode === 'xray' ? 'bg-[#1c1c2e] text-green-400 shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
                                                            >
                                                                Analyze Post (DNA)
                                                            </button>
                                                        </div>
                                                    )}

                                                    {/* X-RAY REMIX INPUTS */}
                                                    {appMode === 'remix' && remixSubMode === 'xray' ? (
                                                        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">

                                                            {/* Step 1: Input to Analyze */}
                                                            <div className="space-y-2">
                                                                <div className="flex items-center justify-between">
                                                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Source Post</label>
                                                                    {!xRayData && <span className="text-[10px] text-green-400 bg-green-900/20 px-2 py-0.5 rounded border border-green-500/30">Step 1: Paste & Analyze</span>}
                                                                </div>
                                                                <div className="relative">
                                                                    <textarea
                                                                        value={topic}
                                                                        onChange={(e) => setTopic(e.target.value)}
                                                                        rows={xRayData ? 2 : 4}
                                                                        placeholder={appMode === 'remix' ? "Paste a URL (Blog/News) or raw text below. We will restructure it into native social posts instantly." : "Post topic for today?"}
                                                                        className="w-full bg-[#161b22] border border-gray-700 rounded-xl p-3 focus:ring-2 focus:ring-green-500 outline-none resize-none text-white placeholder-gray-600 text-sm transition-all"
                                                                    />

                                                                    {/* RANT BUTTON (Audio Input) */}


                                                                    {topic.length > 5 && !xRayData && appMode === 'remix' && remixSubMode === 'xray' && (
                                                                        <button
                                                                            onClick={async () => {
                                                                                if ((userProfile?.subscriptionTier || 'pro') !== 'agency') {
                                                                                    alert("🔒 Advanced DNA Analysis is available only on the Agency Plan.");
                                                                                    return;
                                                                                }
                                                                                setIsAnalyzing(true);
                                                                                try {
                                                                                    const result = await analyzeViralStructure(topic);
                                                                                    setXRayData(result);
                                                                                } catch (e) {
                                                                                    console.error(e);
                                                                                }
                                                                                setIsAnalyzing(false);
                                                                            }}
                                                                            disabled={isAnalyzing}
                                                                            className="absolute bottom-3 right-3 bg-green-600 hover:bg-green-500 text-white px-3 py-1 rounded-lg text-xs font-bold shadow-lg flex items-center gap-2"
                                                                        >
                                                                            {(userProfile?.subscriptionTier !== 'agency') && <Lock size={10} />}
                                                                            {isAnalyzing ? "Scanning..." : <><Sparkles size={12} /> Analyze DNA</>}
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            {/* Step 2: Analysis Results & Choices */}
                                                            {xRayData && (
                                                                <div className="space-y-4">
                                                                    {/* Results Display */}
                                                                    <div className="bg-[#1c1c2e]/50 border border-green-500/30 rounded-xl p-4 animate-in zoom-in-95 duration-300">
                                                                        <div className="flex justify-between items-center mb-3">
                                                                            <h4 className="text-xs font-bold text-green-400 uppercase tracking-wider flex items-center gap-2">
                                                                                <Sparkles size={12} /> Post DNA Decoded
                                                                            </h4>
                                                                            <button onClick={() => { setXRayData(null); setTopic(''); }} className="text-xs text-gray-500 hover:text-white">Reset</button>
                                                                        </div>
                                                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2">
                                                                            <div className="space-y-1">
                                                                                <label className="text-[9px] text-gray-500 uppercase font-bold">Hook Type</label>
                                                                                <div className="bg-[#0f1115] border border-gray-700 rounded-md p-1.5 text-[10px] text-gray-300">{xRayData.hook}</div>
                                                                            </div>
                                                                            <div className="space-y-1">
                                                                                <label className="text-[9px] text-gray-500 uppercase font-bold">Tone</label>
                                                                                <div className="bg-[#0f1115] border border-gray-700 rounded-md p-1.5 text-[10px] text-gray-300">{xRayData.tone}</div>
                                                                            </div>
                                                                            <div className="space-y-1">
                                                                                <label className="text-[9px] text-gray-500 uppercase font-bold">Structure</label>
                                                                                <div className="bg-[#0f1115] border border-gray-700 rounded-md p-1.5 text-[10px] text-gray-300 truncate" title={xRayData.structure}>{xRayData.structure}</div>
                                                                            </div>
                                                                        </div>
                                                                    </div>

                                                                    {/* Actions */}
                                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 animate-in fade-in slide-in-from-bottom-2 duration-500 delay-100">
                                                                        {/* Option A: Similar Variant */}
                                                                        <div className="bg-[#0f1115] border border-gray-800 p-4 rounded-xl hover:border-blue-500/30 transition-all group">
                                                                            <h5 className="font-bold text-sm text-gray-200 mb-1 group-hover:text-blue-400 transition">Similar Variant</h5>
                                                                            <p className="text-[10px] text-gray-500 mb-3">Generate a new post about the <span className="text-gray-300">same topic</span> using this exact DNA.</p>
                                                                            <button
                                                                                onClick={() => handleGenerate()} // Uses topic as is
                                                                                className="w-full py-2 bg-gray-800 hover:bg-blue-600 text-gray-300 hover:text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-2"
                                                                            >
                                                                                <Repeat size={12} /> Generate Variant
                                                                            </button>
                                                                        </div>

                                                                        {/* Option B: New Topic */}
                                                                        <div className="bg-[#0f1115] border border-gray-800 p-4 rounded-xl hover:border-green-500/30 transition-all group">
                                                                            <h5 className="font-bold text-sm text-gray-200 mb-1 group-hover:text-green-400 transition">New Topic</h5>
                                                                            <p className="text-[10px] text-gray-500 mb-3">Apply this DNA structure to a <span className="text-gray-300">completely different subject</span>.</p>

                                                                            <div className="relative">
                                                                                <input
                                                                                    value={remixTargetTopic}
                                                                                    onChange={(e) => setRemixTargetTopic(e.target.value)}
                                                                                    placeholder="E.g. Launching a SaaS..."
                                                                                    className="w-full bg-[#161b22] border border-gray-700 rounded-lg p-2 pr-10 text-xs text-white placeholder-gray-600 focus:border-green-500 outline-none mb-2"
                                                                                />
                                                                                <button
                                                                                    onClick={() => handleGenerate()}
                                                                                    disabled={!remixTargetTopic}
                                                                                    className="w-full py-2 bg-green-600 hover:bg-green-500 disabled:bg-gray-800 disabled:text-gray-600 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-2"
                                                                                >
                                                                                    <Sparkles size={12} /> Generate
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        // STANDARD / REPURPOSE INPUT
                                                        <div className="relative">
                                                            <textarea
                                                                value={topic}
                                                                onChange={(e) => setTopic(e.target.value)}
                                                                rows={3}
                                                                placeholder={appMode === 'remix' ? "Paste content from a blog, article, or news to repurpose into social posts (YouTube support coming soon)..." : appMode === 'reply' ? "Paste the comment, post, or message you want to reply to..." : "What do you want to post about today?"}
                                                                className="w-full bg-[#161b22] border border-gray-700 rounded-xl p-3 md:p-4 pr-24 md:pr-32 focus:ring-2 focus:ring-blue-500 outline-none resize-none text-white placeholder-gray-600 text-sm md:text-lg transition-all"
                                                            />
                                                            {appMode !== 'remix' && appMode !== 'reply' && (
                                                                <div className="absolute bottom-2 right-2 md:bottom-3 md:right-3 flex items-center gap-1.5 md:gap-2 z-20">
                                                                    {/* --- MODALS --- */}
                                                                    {showImageModal && (
                                                                        <ImageCreationModal
                                                                            isOpen={showImageModal}
                                                                            onClose={() => setShowImageModal(false)}
                                                                            onSelectImage={(url) => {
                                                                                setResultImage(url);
                                                                                setShowImageModal(false);
                                                                            }}
                                                                            generatedText={generatedPosts[0]?.content || ""}
                                                                        />
                                                                    )}

                                                                    {showSourceFinder && (
                                                                        <SourceFinderModal
                                                                            onClose={() => setShowSourceFinder(false)}
                                                                            initialTopic={manualNiche || brandProfile?.voiceDNA?.split(' ')[0] || brandProfile?.niche || ""}
                                                                            onSelectUrl={(url) => {
                                                                                setTopic(url);
                                                                                setRemixSource('text');
                                                                                setShowSourceFinder(false);
                                                                            }}
                                                                        />
                                                                    )}                                                                {/* Image Button */}
                                                                    {!attachedImage && (
                                                                        <button
                                                                            onClick={openImageModalGlobal}
                                                                            className="p-2 md:p-3 bg-gray-800/80 hover:bg-gray-700 text-gray-400 hover:text-white rounded-full transition-all shadow-lg backdrop-blur-sm border border-transparent hover:border-gray-600 group"
                                                                            title="Add Image"
                                                                        >
                                                                            <ImageIcon className="w-4 h-4 md:w-5 md:h-5 transition-transform group-hover:scale-110" />
                                                                        </button>
                                                                    )}

                                                                    {/* Mic Button */}
                                                                    <button
                                                                        onClick={() => {
                                                                            if (!('webkitSpeechRecognition' in window)) {
                                                                                alert("Voice dictation is not supported in this browser. Please use Chrome/Safari.");
                                                                                return;
                                                                            }

                                                                            // STOP if already listening
                                                                            if (isListening) {
                                                                                recognitionRef.current?.stop();
                                                                                setIsListening(false);
                                                                                return;
                                                                            }

                                                                            const recognition = new (window as any).webkitSpeechRecognition();
                                                                            recognitionRef.current = recognition;

                                                                            recognition.continuous = false;
                                                                            recognition.interimResults = true;
                                                                            recognition.lang = 'en-US';

                                                                            recognition.onstart = () => {
                                                                                setIsListening(true);
                                                                                setTopic('');
                                                                            };

                                                                            recognition.onresult = (event: any) => {
                                                                                const transcript = event.results[0][0].transcript;
                                                                                setTopic(transcript);
                                                                            };

                                                                            recognition.onerror = (event: any) => {
                                                                                console.error("Speech error", event);
                                                                                if (event.error === 'not-allowed') {
                                                                                    alert("Microphone blocked. Please allow access in browser settings.");
                                                                                }
                                                                                setIsListening(false);
                                                                            };

                                                                            recognition.onend = () => {
                                                                                setIsListening(false);
                                                                            };

                                                                            recognition.start();
                                                                        }}
                                                                        className={`transition-all p-2 md:p-3 rounded-full shadow-lg flex items-center justify-center ${isListening ? 'bg-red-600 text-white animate-pulse scale-110' : 'bg-gray-800/80 text-gray-400 hover:text-white hover:bg-red-600/20 backdrop-blur-sm border border-transparent hover:border-red-500/30'}`}
                                                                        title={isListening ? "Tap to Stop" : "Rant Mode: Tap to Record"}
                                                                    >
                                                                        {isListening ? <div className="w-4 h-4 md:w-5 md:h-5 bg-white rounded-sm animate-spin" /> : <Mic className="w-4 h-4 md:w-[22px] md:h-[22px]" />}
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}

                                                    {appMode === 'reply' && (
                                                        <div className="bg-[#1c1c2e]/50 border border-indigo-500/20 rounded-xl p-4 animate-in fade-in slide-in-from-top-2 space-y-3">
                                                            <label className="text-xs font-bold text-indigo-400 uppercase flex items-center gap-2">
                                                                <MessageCircle size={14} /> Reply Filters
                                                            </label>
                                                            <div className="flex flex-col sm:flex-row sm:items-end gap-4">
                                                                {/* Checkbox: Emojis */}
                                                                <label className="flex items-center gap-2 cursor-pointer group bg-[#0f1115] border border-gray-700 px-3 py-2 rounded-lg hover:border-indigo-500/50 transition-all h-[42px]">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={replyOptions.useEmojis}
                                                                        onChange={(e) => setReplyOptions({ ...replyOptions, useEmojis: e.target.checked })}
                                                                        className="w-4 h-4 rounded border-gray-600 text-indigo-500 focus:ring-indigo-500 bg-gray-800"
                                                                    />
                                                                    <span className="text-xs text-gray-300 group-hover:text-white font-medium">Use Emojis 🎨</span>
                                                                </label>

                                                                {/* Input: Question */}
                                                                <label className={`flex items-center gap-2 cursor-pointer group px-3 py-2 rounded-lg border transition-all h-[42px] ${replyOptions.question ? 'bg-indigo-900/30 border-indigo-500' : 'bg-[#0f1115] border-gray-700 hover:border-indigo-500/50'}`}>
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={!!replyOptions.question}
                                                                        onChange={(e) => setReplyOptions({ ...replyOptions, question: e.target.checked })}
                                                                        className="w-4 h-4 rounded border-gray-600 text-indigo-500 focus:ring-indigo-500 bg-gray-800"
                                                                    />
                                                                    <span className={`text-xs font-medium ${replyOptions.question ? 'text-indigo-300' : 'text-gray-300 group-hover:text-white'}`}>Ask a Question? ❓</span>
                                                                </label>

                                                                {/* Input: Link */}
                                                                <div className="flex-1">
                                                                    <label className="block text-[10px] font-bold text-gray-400 mb-1.5 ml-1 uppercase tracking-wider">Add Link</label>
                                                                    <input
                                                                        type="text"
                                                                        placeholder="https://..."
                                                                        value={replyOptions.link}
                                                                        onChange={(e) => setReplyOptions({ ...replyOptions, link: e.target.value })}
                                                                        className="w-full bg-[#0f1115] border border-gray-700 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-600 focus:border-indigo-500 outline-none h-[42px]"
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}


                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {appMode === 'multi' && (
                                        <section className="bg-orange-900/10 border border-orange-500/30 p-4 rounded-xl animate-in fade-in">
                                            <div className="flex justify-between items-center mb-3"><label className="text-xs font-bold text-orange-400 uppercase flex items-center gap-2"><Target size={14} /> Target Platforms</label><span className="text-[10px] text-orange-300 bg-orange-900/30 px-2 py-0.5 rounded">{multiPlatformTargets.length} Selected</span></div>
                                            <div className="flex flex-wrap gap-2 pb-1">
                                                {[Platform.Facebook, Platform.Instagram, Platform.LinkedIn, Platform.X].map(p => (
                                                    <button key={p} onClick={() => toggleMultiPlatform(p)} className={`px-2 py-1.5 rounded-lg text-[10px] font-bold uppercase border transition ${multiPlatformTargets.includes(p) ? 'bg-orange-600 border-orange-500 text-white shadow-lg' : 'bg-[#0f1115] border-gray-700 text-gray-400 hover:border-gray-500'}`}>{p}</button>
                                                ))}
                                            </div>
                                        </section>
                                    )}

                                    {appMode === 'remix' && (
                                        <section className="bg-green-900/10 border border-green-500/30 p-4 rounded-xl animate-in fade-in">
                                            <div className="flex justify-between items-center mb-3"><label className="text-xs font-bold text-green-400 uppercase flex items-center gap-2"><Repeat size={14} /> Remix Formats</label><span className="text-[10px] text-green-300 bg-green-900/30 px-2 py-0.5 rounded">{remixFormats.length} Selected</span></div>
                                            <div className="flex flex-wrap gap-2 pb-1">
                                                {['LinkedIn Post', 'Twitter Thread', 'TikTok Script', 'Instagram Carousel', 'Newsletter Email', 'Facebook Story'].map(fmt => (
                                                    <button key={fmt} onClick={() => toggleRemixFormat(fmt)} className={`px-2 py-1.5 rounded-lg text-xs border transition ${remixFormats.includes(fmt) ? 'bg-green-600 border-green-500 text-white shadow-lg' : 'bg-[#0f1115] border-gray-700 text-gray-400 hover:border-gray-500'}`}>{fmt}</button>
                                                ))}
                                            </div>

                                            {/* Green Screen Toggle for TikTok */}
                                            {remixFormats.includes('TikTok Script') && (
                                                <div className="mt-3 pt-3 border-t border-green-500/20 animate-in fade-in slide-in-from-top-1">
                                                    <label className={`flex items-center justify-between p-2 rounded-lg border transition ${userProfile?.subscriptionTier === 'agency' || userProfile?.subscriptionTier === 'pro' ? 'bg-[#0f1115] border-green-500/30 cursor-pointer hover:border-green-500' : 'bg-gray-900/50 border-gray-800 opacity-60 cursor-not-allowed'}`}>
                                                        <div className="flex items-center gap-2">
                                                            <div className={`p-1.5 rounded-md ${useGreenScreen ? 'bg-green-500 text-white' : 'bg-gray-800 text-gray-400'}`}>
                                                                <MonitorPlay size={14} />
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="text-xs font-bold text-gray-200">Green Screen Mode</span>
                                                                <span className="text-[10px] text-gray-500">Auto-selects screenshot segments</span>
                                                            </div>
                                                        </div>

                                                        {userProfile?.subscriptionTier === 'agency' || userProfile?.subscriptionTier === 'pro' ? (
                                                            <div className="relative">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={useGreenScreen}
                                                                    onChange={(e) => setUseGreenScreen(e.target.checked)}
                                                                    className="sr-only peer"
                                                                />
                                                                <div className="w-8 h-4 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-green-500"></div>
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center gap-1 text-[10px] text-yellow-500 font-bold bg-yellow-900/20 px-2 py-0.5 rounded border border-yellow-700/30">
                                                                <Lock size={10} /> PRO
                                                            </div>
                                                        )}
                                                    </label>
                                                </div>
                                            )}
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
                                        <label className="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-1.5 h-4"><Target size={12} /> Goal</label>
                                        <div className="relative"><select value={objective} onChange={(e) => setObjective(e.target.value as PostObjective)} className="w-full bg-[#161b22] border border-gray-700 text-white rounded-xl px-4 py-3 text-sm appearance-none focus:border-blue-500 focus:outline-none transition hover:border-gray-600">{OBJECTIVES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select></div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-1.5 h-4"><SparklesIcon className="w-3 h-3" /> Tone</label>
                                        <div className="relative"><select value={tone} onChange={(e) => setTone(e.target.value as Tone)} className="w-full bg-[#161b22] border border-gray-700 text-white rounded-xl px-4 py-3 text-sm appearance-none focus:border-blue-500 focus:outline-none transition hover:border-gray-600">{TONES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}</select></div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-1.5 h-4"><Globe size={12} /> Platform</label>
                                        <div className="relative"><select value={selectedPlatform} onChange={(e) => setSelectedPlatform(e.target.value as Platform)} className="w-full bg-[#161b22] border border-gray-700 text-white rounded-xl px-4 py-3 text-sm appearance-none focus:border-blue-500 focus:outline-none transition hover:border-gray-600">{PLATFORMS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}</select></div>
                                    </div>
                                </section>

                                {!(appMode === 'remix' && remixSubMode === 'xray') && (
                                    <div className="flex flex-col sm:flex-row gap-3">
                                        <button onClick={() => handleGenerate()} disabled={isLoading || (isTrialExpired && !checkCredits(1))} className="flex-1 py-4 rounded-xl font-bold text-lg bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-[length:200%_auto] animate-gradient text-white flex items-center justify-center gap-3 hover:scale-[1.01] transition-all shadow-xl shadow-blue-900/30 disabled:opacity-70 disabled:cursor-not-allowed">
                                            {isLoading ? <Loader /> : <SparklesIcon className="w-6 h-6" />}
                                            {isLoading
                                                ? (appMode === 'remix' ? 'Remixing...' : appMode === 'reply' ? 'Drafting Reply...' : isCampaignMode ? 'Launching Campaign...' : appMode === 'multi' ? 'Generating Multi-Post...' : 'Creating Magic...')
                                                : (appMode === 'remix' ? `Remix Content(${useRealTime ? 10 : remixFormats.length} Cr) ♻️`
                                                    : appMode === 'reply' ? `Generate Reply(${useRealTime ? 10 : 1} Cr) 💬`
                                                        : isCampaignMode ? `Generate Campaign(${useRealTime ? 10 : campaignCount} Cr) 🚀`
                                                            : appMode === 'multi' ? `Generate All Posts(${useRealTime ? 10 : multiPlatformTargets.length} Cr) ⚡`
                                                                : `Craft my Post(${useRealTime ? 10 : 1} Cr) ✨`)}
                                        </button>
                                    </div>
                                )}

                                {error && <div className="p-3 bg-red-900/20 border border-red-800/50 rounded-lg text-red-400 text-sm text-center flex items-center justify-center gap-2"><BriefcaseIcon size={16} /> {error}</div>}

                                <div ref={resultsRef} className="scroll-mt-24">
                                    {visiblePosts.length > 0 && (
                                        <div className="space-y-6 mt-10 pt-10 border-t border-gray-800 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                            <div className="flex items-center justify-between"><h3 className="font-bold text-xl text-white">Generated Results</h3><span className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded">{visiblePosts.length} results</span></div>
                                            {visiblePosts.filter(p => !p.parentId || !visiblePosts.some(parent => parent.id === p.parentId)).map(post => (
                                                <div key={post.id} className="space-y-4">
                                                    {/* Parent Post */}
                                                    <div>
                                                        <PostCard
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
                                                                if (userProfile?.subscriptionTier !== 'pro' && userProfile?.subscriptionTier !== 'agency') {
                                                                    alert("Scheduling is a Pro feature! Upgrade to plan your campaign.");
                                                                    return;
                                                                }
                                                                await schedulePost(id, date);
                                                                setPosts(prev => prev.map(p => p.id === id ? { ...p, scheduledDate: date } : p));
                                                            }}
                                                            onMarkPublished={async (id) => {
                                                                await markPostAsPublished(id);
                                                                setPosts(prev => prev.map(p => p.id === id ? { ...p, isPublished: true } : p));
                                                            }}
                                                            onNavigateToCalendar={() => setCurrentView('calendar')}
                                                            onFollowUp={handleFollowUp}
                                                            brandProfile={brandProfile}
                                                        />
                                                    </div>

                                                    {/* Child Posts (Follow-ups) */}
                                                    {visiblePosts.filter(child => child.parentId === post.id).map(childPost => (
                                                        <div key={childPost.id} className="ml-8 pl-6 border-l-2 border-gray-800 relative">
                                                            {/* Visual Connector */}
                                                            <div className="absolute -left-0.5 top-8 w-6 h-0.5 bg-gray-800"></div>

                                                            <PostCard
                                                                post={childPost}
                                                                isRefining={refiningPostId === childPost.id}
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
                                                                    if (userProfile?.subscriptionTier !== 'pro' && userProfile?.subscriptionTier !== 'agency') {
                                                                        alert("Scheduling is a Pro feature! Upgrade to plan your campaign.");
                                                                        return;
                                                                    }
                                                                    await schedulePost(id, date);
                                                                    setPosts(prev => prev.map(p => p.id === id ? { ...p, scheduledDate: date } : p));
                                                                }}
                                                                onMarkPublished={async (id) => {
                                                                    await markPostAsPublished(id);
                                                                    setPosts(prev => prev.map(p => p.id === id ? { ...p, isPublished: true } : p));
                                                                }}
                                                                onNavigateToCalendar={() => setCurrentView('calendar')}
                                                                onFollowUp={handleFollowUp}
                                                                brandProfile={brandProfile}
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="hidden xl:block w-[400px] shrink-0">
                        <div className="sticky top-6">
                            <PhonePreview
                                platform={selectedPlatform}
                                content={activePost ? (activePost.adaptedContent[selectedPlatform] || activePost.content) : topic}
                                imageUrl={attachedImage || activePost?.imageUrl || null}
                                isGenerating={isLoading}
                                isImageGenerating={activePost?.isGeneratingImage || false}
                                topic={topic}
                                userName={user?.displayName || user?.email?.split('@')[0]}
                                userImage={user?.photoURL}
                            />
                        </div>
                    </div>
                </div >
            )
            }

            {isImageModalOpen && <ImageCreationModal onClose={() => setIsImageModalOpen(false)} onSelectImage={handleImageSelected} initialPrompt={currentPromptForImage} />}
            {isBrandProfileModalOpen && <BrandProfileModal currentProfile={brandProfile} onSave={saveBrandProfile} onClose={() => setIsBrandProfileModalOpen(false)} />}
        </MainLayout >
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
