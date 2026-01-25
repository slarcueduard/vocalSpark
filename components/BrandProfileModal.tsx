import React, { useState, useEffect, useRef } from 'react';
import {
    X, Sparkles, Link as LinkIcon, Globe,
    Upload, Hash, Palette, Check, RefreshCw,
    User, UserCheck, Copy, Ban, MessageSquare, Plus, Trash2,
    Lock, Target, Mic, Search
} from 'lucide-react';
import { BrandProfile } from '../types';
import { analyzeBrandVoice, generateNicheHooks, analyzeAudioVoice } from '../services/geminiService';
import { useAuth } from '../contexts/AuthContext';
import { VoiceRadarChart } from './VoiceRadarChart';

interface BrandProfileModalProps {
    currentProfile: BrandProfile | null;
    onSave: (profile: BrandProfile) => Promise<void>;
    onClose: () => void;
}

type Tab = 'core' | 'strategy' | 'visuals' | 'rules' | 'hooks';
type AnalysisMode = 'personal' | 'influencer';

export function BrandProfileModal({ currentProfile, onSave, onClose }: BrandProfileModalProps) {
    const { allProfiles, activeProfileIndex, switchProfile, addNewProfile, deleteProfile, userProfile } = useAuth();

    const [activeTab, setActiveTab] = useState<Tab>('core');
    // Wizard State: 'dashboard' is the classic view
    const [wizardStep, setWizardStep] = useState<'selection' | 'audio' | 'text' | 'dashboard'>('dashboard');

    // Removed viewMode - always show all features
    const [isSaving, setIsSaving] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    // Voice DNA Analysis
    const [urlInput, setUrlInput] = useState('');
    const [textInput, setTextInput] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [suggestedHashtags, setSuggestedHashtags] = useState<string[]>([]);

    // State Brand
    const [profileName, setProfileName] = useState('My Brand');
    const [voiceDNA, setVoiceDNA] = useState('');
    const [industry, setIndustry] = useState('');
    const [language, setLanguage] = useState('English');
    const [targetAudience, setTargetAudience] = useState('');

    // Logo
    const [logoPreview, setLogoPreview] = useState<string | null>(null);

    // Rules
    const [hashtags, setHashtags] = useState(''); // Removed default #MyBrand #MyNiche from state initialization
    const [bannedWords, setBannedWords] = useState('delve, landscape, testament, unlock, tapestry');
    const [ctaStyle, setCtaStyle] = useState('Ask a question to provoke comments');

    // Founder Mode - Strategy Fields
    const [enemy, setEnemy] = useState('');
    const [offer, setOffer] = useState('');
    const [archetype, setArchetype] = useState<'Rebel' | 'Consultant' | 'Expert' | 'Builder'>('Expert');

    // Proficiency
    // 'basic' | 'intermediate' | 'advanced' | 'native'
    const [englishProficiency, setEnglishProficiency] = useState<'basic' | 'intermediate' | 'advanced' | 'native'>('native');

    const [sliders, setSliders] = useState({ tone: 50, emoji: 50, length: 50 });
    const [links, setLinks] = useState<string[]>(['', '']); // Up to 2 links

    // Granular Preferences
    const [postLength, setPostLength] = useState<'short' | 'medium' | 'long'>('medium');
    const [detailLevel, setDetailLevel] = useState<'minimal' | 'balanced' | 'deep'>('balanced');
    const [innovationFactor, setInnovationFactor] = useState<'safe' | 'balanced' | 'unique'>('balanced');

    // Custom Hooks Tab
    const [savedHooks, setSavedHooks] = useState<string[]>([]);
    const [nicheHooks, setNicheHooks] = useState<string[]>([]); // New state: Auto-Generated
    const [isGeneratingHooks, setIsGeneratingHooks] = useState(false);

    // Populare Data
    useEffect(() => {
        if (currentProfile) {
            setProfileName(currentProfile.name || `Brand #${activeProfileIndex + 1}`);
            setVoiceDNA(currentProfile.voiceDNA || '');

            // WIZARD INITIALIZATION
            // If we have Voice DNA, go to Dashboard. If not, start Wizard.
            if (currentProfile.voiceDNA && currentProfile.voiceDNA.length > 20) {
                setWizardStep('dashboard');
            } else {
                setWizardStep('selection');
            }

            setIndustry(currentProfile.industry || '');
            setLanguage(currentProfile.language || 'English');
            setTargetAudience(currentProfile.targetAudience || '');

            // Fix: Use profile hashtags OR generate from name/industry if valid, else empty. 
            // Don't use generic defaults.
            if (currentProfile.fixedHashtags && currentProfile.fixedHashtags !== '#MyBrand #MyNiche') {
                setHashtags(currentProfile.fixedHashtags);
            } else if (currentProfile.industry || currentProfile.name) {
                // Auto-suggest if empty and we have info
                const nicheTag = currentProfile.industry ? `#${currentProfile.industry.replace(/\s+/g, '')}` : '';
                const brandTag = currentProfile.name && !currentProfile.name.includes('#') ? `#${currentProfile.name.replace(/\s+/g, '')}` : '';
                setHashtags(`${brandTag} ${nicheTag}`.trim());
            } else {
                setHashtags('');
            }



            setLogoPreview(currentProfile.logoUrl || null);

            const safeNumber = (val: any) => {
                const num = Number(val);
                return isNaN(num) ? 50 : num;
            };

            setSliders({
                tone: safeNumber(currentProfile.toneScore),
                emoji: safeNumber(currentProfile.emojiScore),
                length: safeNumber(currentProfile.lengthScore)
            });

            // Load links
            if (currentProfile.links && currentProfile.links.length > 0) {
                setLinks([...currentProfile.links, '', ''].slice(0, 2)); // Ensure 2 elements
            } else {
                setLinks(['', '']);
            }

            // Load Preferences
            setPostLength(currentProfile.postLength || 'medium');
            setDetailLevel(currentProfile.detailLevel || 'balanced');
            setInnovationFactor(currentProfile.innovationFactor || 'balanced');
            setInnovationFactor(currentProfile.innovationFactor || 'balanced');
            setEnglishProficiency(currentProfile.englishProficiency || 'native');

            // Load Hooks (Defensive Filtering: ensure only strings are loaded)
            const validCustomHooks = (currentProfile.customHooks || []).filter(h => typeof h === 'string');
            setSavedHooks(validCustomHooks);
            setNicheHooks(currentProfile.nicheHooks || []);

            // Founder Mode Load
            setEnemy(currentProfile.enemy || '');
            setOffer(currentProfile.offer || '');
            setArchetype(currentProfile.archetype || 'Expert');
        }
    }, [currentProfile, activeProfileIndex]); // Added activeProfileIndex dependency to ensure refresh

    // Resetare la schimbare profil
    // Resetare la schimbare profil
    // Audio Recording
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // Reset state on profile switch
    useEffect(() => {
        setUrlInput('');
        setTextInput('');
        setActiveTab('core');
        setEnemy('');
        setOffer('');
        setArchetype('Expert');
        setAudioBlob(null);
        setAudioUrl(null);
    }, [activeProfileIndex]);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
            const chunks: BlobPart[] = [];

            recorder.ondataavailable = (e) => chunks.push(e.data);
            recorder.onstop = () => {
                const blob = new Blob(chunks, { type: 'audio/webm' });
                setAudioBlob(blob);
                setAudioUrl(URL.createObjectURL(blob));
                stream.getTracks().forEach(track => track.stop()); // Stop mic
            };

            recorder.start();
            setMediaRecorder(recorder);
            setIsRecording(true);
            setRecordingTime(0);

            timerRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);

        } catch (err) {
            console.error("Mic Error:", err);
            alert("Could not access microphone.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorder && isRecording) {
            mediaRecorder.stop();
            setIsRecording(false);
            if (timerRef.current) clearInterval(timerRef.current);
        }
    };

    const deleteRecording = () => {
        setAudioBlob(null);
        setAudioUrl(null);
        setRecordingTime(0);
    };

    // New formatTime helper
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Removed lock logic - sliders always editable

    // Generate live preview post based on slider values
    const generatePreviewPost = () => {
        const { tone, emoji, length } = sliders;

        // Base content variations
        const toneVariants = {
            casual: "Hey! Want to grow your business? I've been testing this strategy for months.",
            balanced: "Looking to grow your business? I have been testing this strategy for months.",
            formal: "Are you seeking to expand your business operations? I have conducted extensive testing of this strategic approach over several months."
        };

        const lengthContent = {
            short: "The results are impressive.",
            medium: "The results have been impressive. I have seen significant improvements in engagement and conversion rates.",
            long: "The results have been truly impressive and exceeded my initial expectations. I have seen significant improvements across multiple key performance indicators, including engagement rates, conversion metrics, and overall audience growth. The data clearly demonstrates the effectiveness of this strategic approach."
        };

        // Determine tone variant
        let toneText = tone < 40 ? toneVariants.casual : tone < 70 ? toneVariants.balanced : toneVariants.formal;

        // Determine length variant
        let lengthText = length < 40 ? lengthContent.short : length < 70 ? lengthContent.medium : lengthContent.long;

        // Add emojis based on emoji slider
        let emojiString = '';
        if (emoji > 20 && emoji < 50) emojiString = '✨';
        else if (emoji >= 50 && emoji < 80) emojiString = '✨💡';
        else if (emoji >= 80) emojiString = '🚀✨💡🔥';

        // Combine main content
        let preview = `${toneText} ${lengthText} ${emojiString}`.trim();

        // Add hashtags from Rules tab if available
        if (hashtags && hashtags.trim()) {
            preview += `\n\n${hashtags}`;
        }

        return preview;
    };

    const handleAnalyzeAudio = async () => {
        if (!audioBlob) return;

        setIsAnalyzing(true);
        try {
            console.log("🎙️ Sending Audio for Analysis...", audioBlob.size);
            const result = await analyzeAudioVoice(audioBlob);

            console.log("📊 Audio Analysis Result:", result.analysis);
            const analysis = result.analysis;

            // Reuse the save logic
            const safeNumber = (val: any) => Number(val) || 50;

            setSliders({
                tone: safeNumber(analysis.tone_score),
                emoji: safeNumber(analysis.emoji_score),
                length: safeNumber(analysis.length_score)
            });
            setIndustry(analysis.niche);
            setTargetAudience(analysis.audience);
            setVoiceDNA(`Voice DNA (Audio Extracted): ${analysis.voice_description}\n\nTranscript Sample: "${result.transcript.substring(0, 100)}..."`);

            if (analysis.suggested_hashtags && analysis.suggested_hashtags.length > 0) {
                setSuggestedHashtags(analysis.suggested_hashtags);
                if (!hashtags) setHashtags(analysis.suggested_hashtags.join(' '));
            }

            alert("Voice DNA Extracted Successfully! 🧬");

        } catch (error: any) {
            console.error("Audio Analysis Failed:", error);
            alert(`Analysis Failed: ${error.message}`);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleAnalyze = async () => {
        if (!textInput && !urlInput) {
            alert("Please paste text or enter a URL to analyze.");
            return;
        }

        setIsAnalyzing(true);
        try {
            let contentToAnalyze = textInput;

            // If URL is provided, scrape it first
            if (urlInput && !textInput) {
                console.log("🔗 Scraping URL:", urlInput);
                try {
                    const scrapeResponse = await fetch('/api/remix-url', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ url: urlInput, action: 'scrape' })
                    });

                    console.log("📊 Scrape response status:", scrapeResponse.status);

                    if (!scrapeResponse.ok) {
                        const errorData = await scrapeResponse.json();
                        console.error("❌ Scrape failed:", errorData);
                        throw new Error(errorData.error || 'Failed to scrape URL');
                    }

                    const scrapeData = await scrapeResponse.json();
                    contentToAnalyze = scrapeData.content;

                    // Auto-fill textarea so user can see/edit the scraped content
                    setTextInput(contentToAnalyze);

                    console.log("✅ Scraped content length:", contentToAnalyze?.length);
                    console.log("📝 Scraped content preview:", contentToAnalyze?.substring(0, 200));

                    if (!contentToAnalyze || contentToAnalyze.length < 50) {
                        throw new Error(`Not enough content found (${contentToAnalyze?.length || 0} characters). Try copying the text manually.`);
                    }
                } catch (scrapeError: any) {
                    console.error("❌ Scrape error:", scrapeError);
                    alert(`URL Scraping Failed: ${scrapeError.message}\n\nPlease copy the content manually and paste it in the text area below.`);
                    setIsAnalyzing(false);
                    return;
                }
            }

            // Now analyze the content (either from text input or scraped)
            if (!contentToAnalyze || contentToAnalyze.length < 10) {
                alert("Content is too short to analyze.");
                setIsAnalyzing(false);
                return;
            }

            console.log("🧬 Analyzing content of length:", contentToAnalyze.length);
            const analysis = await analyzeBrandVoice(contentToAnalyze, 'personal');

            console.log("📊 Raw Analysis Result:", analysis); // Debug log

            // Validate numbers to prevent NaN errors
            const safeNumber = (val: any) => {
                const num = Number(val);
                return isNaN(num) ? 50 : num;
            };

            // Save to profile
            setSliders({
                tone: safeNumber(analysis.tone_score),
                emoji: safeNumber(analysis.emoji_score),
                length: safeNumber(analysis.length_score)
            });
            setIndustry(analysis.niche);
            setTargetAudience(analysis.audience);
            setVoiceDNA(`Voice DNA: ${analysis.voice_description}`);

            // Auto-update hashtags from analysis
            if (analysis.suggested_hashtags && analysis.suggested_hashtags.length > 0) {
                const hashtagString = analysis.suggested_hashtags.join(' ');
                setSuggestedHashtags(analysis.suggested_hashtags);
                // Auto-fill if hashtags field is empty
                if (!hashtags) {
                    setHashtags(hashtagString);
                }
                if (!hashtags) {
                    setHashtags(hashtagString);
                }
            }

            // AUTO-GENERATE NICHE HOOKS
            if (analysis.niche) {
                console.log("Generating Niche Hooks for:", analysis.niche);
                try {
                    const generatedHooks = await generateNicheHooks(analysis.niche, 5, language);
                    if (generatedHooks && generatedHooks.length > 0) {
                        setNicheHooks(generatedHooks);
                    }
                } catch (hookError) {
                    console.error("Failed to auto-generate hooks:", hookError);
                }
            }


        } catch (error) {
            console.error("Analysis failed", error);
            alert("Could not analyze content. Please try again.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleGenerateNicheHooks = async () => {
        setIsGeneratingHooks(true);
        try {
            // Construct temporary profile object for the AI
            const tempProfile = {
                industry,
                targetAudience,
                voiceDNA,
                language,
                toneScore: sliders.tone
            };



            // Fix: Pass industry string, not entire profile object
            const newHooks = await generateNicheHooks(industry, 5, language);
            // Add only the text to our list (though service now ensures strings)
            setSavedHooks(prev => [...prev, ...newHooks]);
        } catch (error) {
            console.error("Failed to generate niche hooks", error);
        } finally {
            setIsGeneratingHooks(false);
        }
    };

    const handleDeleteHook = (index: number) => {
        setSavedHooks(prev => prev.filter((_, i) => i !== index));
    };



    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) { alert("File too large (max 5MB)"); return; } // Increased raw limit, we resize anyway

            try {
                const resized = await resizeImage(file, 200, 200); // Resize to max 200x200
                setLogoPreview(resized);
            } catch (err) {
                console.error("Resize error:", err);
                alert("Could not process image.");
            }
        }
    };

    // Helper: Clinet-side Resize
    const resizeImage = (file: File, maxWidth: number, maxHeight: number): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target?.result as string;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > maxWidth) {
                            height *= maxWidth / width;
                            width = maxWidth;
                        }
                    } else {
                        if (height > maxHeight) {
                            width *= maxHeight / height;
                            height = maxHeight;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx?.drawImage(img, 0, 0, width, height);
                    resolve(canvas.toDataURL('image/png', 0.8)); // Reduce quality/size
                };
                img.onerror = (err) => reject(err);
            };
            reader.onerror = (err) => reject(err);
        });
    };

    const triggerFileInput = () => fileInputRef.current?.click();

    const handleSave = async () => {
        setIsSaving(true);
        // Ensure hashtags are clean
        const finalHashtags = hashtags.trim() || (industry ? `#${industry.replace(/\s+/g, '')}` : '');

        const finalVoiceDNA = `${voiceDNA}\n---\nWRITING RULES:\n1. NEVER use these words: ${bannedWords}.\n2. Call to Action style: ${ctaStyle}.\n3. Mandatory Hashtags: ${finalHashtags}.`;

        const updatedProfile: BrandProfile = {
            name: profileName,
            industry,
            targetAudience,
            voiceDNA: finalVoiceDNA,
            language,
            fixedHashtags: finalHashtags,
            brandColors: ['#3B82F6', '#8B5CF6', '#FFFFFF'], // Default colors (not user-editable)
            logoUrl: logoPreview,
            description: targetAudience,
            toneScore: sliders.tone,
            emojiScore: sliders.emoji,
            lengthScore: sliders.length,
            links: links.filter(link => link.trim().length > 0),

            // New Fields
            postLength,
            detailLevel,
            innovationFactor,
            englishProficiency,

            // Hooks
            customHooks: savedHooks,
            nicheHooks: nicheHooks,

            // Founder Mode
            enemy,
            offer,
            archetype
        };

        try {
            await onSave(updatedProfile);
            alert("Profile Saved Successfully! ✅");
        } catch (error) {
            console.error("Failed to save brand:", error);
        } finally {
            setIsSaving(false);
        }
    };

    // Limite Plan
    const plan = userProfile?.subscriptionTier || 'pro'; // Updated default
    const limit = plan === 'agency' ? 6 : (plan === 'pro' ? 2 : 1);
    const canAddMore = allProfiles.length < limit;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-0 md:p-4">
            <div className="bg-[#0f1115] w-full h-[100dvh] md:h-auto md:max-h-[90vh] md:max-w-6xl md:rounded-2xl border border-gray-800 shadow-2xl flex flex-col md:flex-row overflow-hidden">

                {/* === 1. MOBILE PROFILE SELECTOR (BARA ORIZONTALA DOAR PE MOBIL) === */}
                <div className="md:hidden bg-[#0a0c10] border-b border-gray-800 p-3 shrink-0 flex items-center gap-3 overflow-x-auto custom-scrollbar">
                    {allProfiles.map((p, idx) => (
                        <button
                            key={idx}
                            onClick={() => switchProfile(idx)}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition border ${idx === activeProfileIndex
                                ? 'bg-blue-600 border-blue-500 text-white'
                                : 'bg-[#1c1c2e] border-gray-700 text-gray-400'
                                }`}
                        >
                            {p.name}
                        </button>
                    ))}
                    <button onClick={addNewProfile} disabled={!canAddMore} className={`w-8 h-8 rounded-full border border-dashed flex items-center justify-center shrink-0 ${canAddMore ? 'border-gray-500 text-gray-400' : 'opacity-30'}`}>
                        <Plus size={14} />
                    </button>
                </div>

                {/* === 2. DESKTOP PROFILE SELECTOR (SIDEBAR STANGA) === */}
                <div className="hidden md:flex w-64 border-r border-gray-800 bg-[#0a0c10] flex-col shrink-0">
                    <div className="p-6 border-b border-gray-800">
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">PROFILES</h3>
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500">{allProfiles.length} / {limit} Used</span>
                            {plan === 'creator' && <span className="text-[10px] text-yellow-500 border border-yellow-500/30 px-1.5 rounded">UPGRADE</span>}
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
                        {allProfiles.map((p, idx) => (
                            <button
                                key={idx}
                                onClick={() => switchProfile(idx)}
                                className={`w-full text-left px-4 py-3 rounded-xl transition-all flex items-center gap-3 group relative ${idx === activeProfileIndex
                                    ? 'bg-blue-600 text-white shadow-lg border border-blue-500/50'
                                    : 'text-gray-400 hover:bg-[#1c1c2e] hover:text-white border border-transparent'
                                    }`}
                            >
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${idx === activeProfileIndex ? 'bg-white/20' : 'bg-[#1c1c2e] border border-gray-700'}`}>
                                    {p.name?.[0]?.toUpperCase() || '#'}
                                </div>
                                <div className="overflow-hidden w-full">
                                    <p className="text-sm font-bold truncate">{p.name}</p>
                                    <p className={`text-[10px] truncate ${idx === activeProfileIndex ? 'text-blue-200' : 'opacity-50'}`}>{p.industry || 'No niche'}</p>
                                </div>
                                {allProfiles.length > 1 && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            deleteProfile(idx);
                                        }}
                                        className={`absolute right-2 opacity-0 group-hover:opacity-100 p-2 rounded-lg transition-all ${idx === activeProfileIndex
                                            ? 'text-blue-200 hover:bg-blue-700 hover:text-white'
                                            : 'text-gray-500 hover:bg-red-900/30 hover:text-red-400'
                                            }`}
                                        title="Delete Profile"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                )}
                            </button>
                        ))}

                        <button onClick={addNewProfile} disabled={!canAddMore} className={`w-full border-2 border-dashed rounded-xl py-3 flex items-center justify-center gap-2 text-xs font-bold transition mt-2 ${canAddMore ? 'border-gray-700 text-gray-400 hover:border-gray-500 hover:text-white' : 'border-gray-800 text-gray-600 cursor-not-allowed opacity-50'}`}>
                            {canAddMore ? <Plus size={14} /> : <Lock size={14} />} {canAddMore ? 'New Brand Profile' : `Limit Reached (${limit})`}
                        </button>
                    </div>
                </div>

                {/* === 3. MAIN FORM AREA (RIGHT) === */}
                <div className="flex-1 flex flex-col min-w-0 min-h-0 bg-[#0f1115]">

                    {/* Header */}
                    <div className="p-3 md:p-4 border-b border-gray-800 flex justify-between items-start shrink-0">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <input
                                    type="text"
                                    value={profileName}
                                    onChange={(e) => setProfileName(e.target.value)}
                                    className="bg-transparent text-lg font-bold text-white outline-none border-b border-transparent hover:border-gray-700 focus:border-blue-500 transition w-full placeholder-gray-600"
                                    placeholder="Profile Name"
                                />
                                <div className="bg-blue-600/20 p-1 rounded-md shrink-0"><Sparkles size={14} className="text-blue-500" /></div>
                            </div>
                            <p className="text-xs text-gray-500">Writing as: <span className="text-blue-400 font-mono">{profileName}</span></p>
                        </div>

                        <button onClick={onClose} className="text-gray-500 hover:text-white transition p-1"><X size={20} /></button>
                    </div>

                    {/* Tabs - Only visible in Dashboard mode */}
                    {wizardStep === 'dashboard' && (
                        <div className="flex border-b border-gray-800 bg-[#0f1115]">
                            <TabButton label="Voice DNA" isActive={activeTab === 'core'} onClick={() => setActiveTab('core')} />
                            <TabButton
                                label="Strategy (Founder)"
                                isActive={activeTab === 'strategy'}
                                onClick={() => {
                                    if (userProfile?.subscriptionTier === 'pro') {
                                        alert("🔒 Founder Strategy is available on the Agency Plan (or Free Trial).");
                                        return;
                                    }
                                    setActiveTab('strategy');
                                }}
                                isLocked={userProfile?.subscriptionTier === 'pro'}
                            />
                            <TabButton
                                label="Custom Hooks"
                                isActive={activeTab === 'hooks'}
                                onClick={() => {
                                    if (userProfile?.subscriptionTier === 'pro') {
                                        alert("🔒 Viral Hooks are available on the Agency Plan (or Free Trial).\n\nSave your winning hooks and auto-generate new ones based on your niche.");
                                        return;
                                    }
                                    setActiveTab('hooks');
                                }}
                                isLocked={userProfile?.subscriptionTier === 'pro'}
                            />
                            <TabButton label="Rules" isActive={activeTab === 'rules'} onClick={() => setActiveTab('rules')} />
                        </div>
                    )}

                    {/* Scrollable Form */}
                    <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 custom-scrollbar">

                        {/* TAB: CORE */}
                        {/* TAB: CORE (WIZARD + DASHBOARD) */}
                        {activeTab === 'core' && (
                            <div className="space-y-6 animate-in fade-in">

                                {/* --- STEP 1: SELECTION --- */}
                                {wizardStep === 'selection' && (
                                    <div className="text-center py-10">
                                        <h2 className="text-2xl font-bold text-white mb-2">How should we learn your voice?</h2>
                                        <p className="text-gray-400 mb-8 max-w-md mx-auto">Choose the method that best represents how you want your brand to sound.</p>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
                                            {/* Card A: Audio */}
                                            <button
                                                onClick={() => setWizardStep('audio')}
                                                className="group relative bg-[#161b22] hover:bg-[#1c2128] border border-gray-800 hover:border-blue-500 rounded-2xl p-8 text-left transition-all hover:-translate-y-1 shadow-xl"
                                            >
                                                <div className="w-14 h-14 rounded-full bg-blue-900/20 flex items-center justify-center mb-4 group-hover:scale-110 transition">
                                                    <Mic size={28} className="text-blue-400" />
                                                </div>
                                                <h3 className="text-lg font-bold text-white mb-2">Analyze My Speech</h3>
                                                <p className="text-sm text-gray-400 leading-relaxed">Perfect for podcasters, speakers, or personal brands. We'll extract your natural tone, cadence, and vibe.</p>
                                            </button>

                                            {/* Card B: Text */}
                                            <button
                                                onClick={() => setWizardStep('text')}
                                                className="group relative bg-[#161b22] hover:bg-[#1c2128] border border-gray-800 hover:border-purple-500 rounded-2xl p-8 text-left transition-all hover:-translate-y-1 shadow-xl"
                                            >
                                                <div className="w-14 h-14 rounded-full bg-purple-900/20 flex items-center justify-center mb-4 group-hover:scale-110 transition">
                                                    <Hash size={28} className="text-purple-400" />
                                                </div>
                                                <h3 className="text-lg font-bold text-white mb-2">Analyze My Writing</h3>
                                                <p className="text-sm text-gray-400 leading-relaxed">Perfect for writers and copywriters. Paste a blog post or article to match your written style exactly.</p>
                                            </button>
                                        </div>

                                        <p className="mt-12 text-xs text-gray-500">I already have a profile? <button onClick={() => setWizardStep('dashboard')} className="text-gray-400 hover:text-white underline">Skip to Dashboard</button></p>
                                    </div>
                                )}

                                {/* --- STEP 2: AUDIO INPUT --- */}
                                {wizardStep === 'audio' && (
                                    <div className="max-w-2xl mx-auto">
                                        <button onClick={() => setWizardStep('selection')} className="flex items-center gap-2 text-gray-500 hover:text-white mb-6 transition text-sm">
                                            <span className="text-lg">←</span> Back
                                        </button>

                                        <div className="bg-[#161b22] border border-gray-800 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
                                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-orange-500"></div>

                                            <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2"><Mic size={20} className="text-red-500" /> Record Your Voice</h3>
                                            <p className="text-sm text-gray-400 mb-8">Speak naturally for 30-60 seconds. Tell us about your business or read a recent post.</p>

                                            <div className="flex flex-col items-center justify-center py-8">
                                                {!audioBlob ? (
                                                    <>
                                                        {!isRecording && (
                                                            <div className="mb-8 bg-blue-900/10 border border-blue-500/20 p-4 rounded-xl max-w-md text-center">
                                                                <p className="text-[10px] text-blue-300 font-bold uppercase mb-2">💡 Script Suggestion</p>
                                                                <p className="text-sm text-gray-300 italic font-medium leading-relaxed">"Hi, I'm [Name]. My brand builds [Product] for [Audience]. We believe in [Values] and helping people achieve [Goal]."</p>
                                                            </div>
                                                        )}

                                                        <button
                                                            onClick={isRecording ? stopRecording : startRecording}
                                                            className={`w-24 h-24 rounded-full flex items-center justify-center transition-all ${isRecording
                                                                ? 'bg-red-600 animate-pulse shadow-[0_0_40px_rgba(220,38,38,0.6)]'
                                                                : 'bg-[#1c1c2e] hover:bg-red-900/20 border-2 border-red-500/30 hover:border-red-500 group shadow-[0_0_20px_rgba(220,38,38,0.1)] hover:shadow-[0_0_30px_rgba(220,38,38,0.2)]'
                                                                }`}
                                                        >
                                                            {isRecording ? <div className="w-8 h-8 bg-white rounded-md" /> : <Mic size={40} className="text-red-500 group-hover:scale-110 transition" />}
                                                        </button>

                                                        {isRecording && <p className="text-red-400 font-mono mt-4 animate-pulse">Recording {formatTime(recordingTime)}</p>}
                                                        {!isRecording && <p className="text-sm text-gray-500 mt-4">Tap to Start Recording</p>}
                                                    </>
                                                ) : (
                                                    <div className="w-full space-y-6">
                                                        <div className="bg-gray-800/50 p-4 rounded-xl flex items-center justify-between border border-gray-700">
                                                            <div className="flex items-center gap-4">
                                                                <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                                                                    <Check size={20} className="text-green-400" />
                                                                </div>
                                                                <div>
                                                                    <p className="text-sm font-bold text-white">Capture Complete</p>
                                                                    <p className="text-xs text-gray-500">{formatTime(recordingTime)} • WebM Audio</p>
                                                                </div>
                                                            </div>
                                                            <button onClick={deleteRecording} className="p-2 text-gray-400 hover:text-red-400 transition" title="Delete"><Trash2 size={18} /></button>
                                                        </div>

                                                        <button
                                                            onClick={async () => {
                                                                await handleAnalyzeAudio();
                                                                setWizardStep('dashboard'); // AUTO-TRANSITION
                                                            }}
                                                            disabled={isAnalyzing}
                                                            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl transition shadow-lg flex items-center justify-center gap-3 text-lg"
                                                        >
                                                            {isAnalyzing ? <RefreshCw size={20} className="animate-spin" /> : <Sparkles size={20} />}
                                                            {isAnalyzing ? 'Analyzing Tone & Cadence...' : 'Analyze & Create Profile'}
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* --- STEP 2: TEXT INPUT --- */}
                                {wizardStep === 'text' && (
                                    <div className="max-w-2xl mx-auto">
                                        <button onClick={() => setWizardStep('selection')} className="flex items-center gap-2 text-gray-500 hover:text-white mb-6 transition text-sm">
                                            <span className="text-lg">←</span> Back
                                        </button>

                                        <div className="bg-[#161b22] border border-gray-800 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
                                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-pink-500"></div>

                                            <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2"><Hash size={20} className="text-purple-400" /> Paste Your Content</h3>
                                            <p className="text-sm text-gray-400 mb-6">Paste a URL or text from your best-performing content (blog, LinkedIn post, newsletter).</p>

                                            <div className="space-y-4">
                                                <div className="relative group">
                                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-purple-400 transition"><LinkIcon size={16} /></div>
                                                    <input type="text" placeholder="https://..." className="w-full bg-[#0f1115] border border-gray-700 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-purple-500 transition shadow-inner" value={urlInput} onChange={(e) => setUrlInput(e.target.value)} />
                                                </div>

                                                <div className="relative">
                                                    <div className="absolute top-3 left-4 text-xs font-bold text-gray-600 uppercase">OR PASTE TEXT</div>
                                                    <textarea
                                                        placeholder="Paste your content here..."
                                                        className="w-full bg-[#0f1115] border border-gray-700 rounded-xl pt-8 pb-4 px-4 text-sm text-white placeholder-gray-600 min-h-[150px] focus:outline-none focus:border-purple-500 transition resize-none font-mono shadow-inner"
                                                        value={textInput}
                                                        onChange={(e) => setTextInput(e.target.value)}
                                                    />
                                                </div>

                                                <button
                                                    onClick={async () => {
                                                        await handleAnalyze();
                                                        setWizardStep('dashboard'); // AUTO-TRANSITION
                                                    }}
                                                    disabled={isAnalyzing}
                                                    className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-4 rounded-xl transition shadow-lg flex items-center justify-center gap-3 text-lg mt-4"
                                                >
                                                    {isAnalyzing ? <RefreshCw size={20} className="animate-spin" /> : <Search size={20} />}
                                                    {isAnalyzing ? 'Analyzing Writing Style...' : 'Analyze & Create Profile'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* --- STEP 3: DASHBOARD (ORIGINAL UI) --- */}
                                {wizardStep === 'dashboard' && (
                                    <div className="space-y-6">
                                        <div className="border rounded-xl p-4 md:p-5 relative overflow-hidden bg-[#161b22] border-blue-900/30">

                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                                        <Sparkles size={14} className="text-blue-400" />
                                                        Your Voice DNA
                                                    </h3>
                                                    <p className="text-[10px] text-gray-400">AI-calibrated Analysis</p>
                                                </div>
                                                <button onClick={() => setWizardStep('selection')} className="text-[10px] bg-gray-800 hover:bg-gray-700 text-gray-300 px-2 py-1 rounded border border-gray-700 transition flex items-center gap-1">
                                                    <RefreshCw size={10} /> Retake Analysis
                                                </button>
                                            </div>

                                            {/* Suggested Hashtags Display */}
                                            {suggestedHashtags.length > 0 && (
                                                <div className="mt-4 p-3 bg-green-900/10 border border-green-500/30 rounded-lg">
                                                    <p className="text-xs font-bold text-green-400 mb-2">✓ Suggested Hashtags (auto-filled):</p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {suggestedHashtags.map((tag, idx) => (
                                                            <span key={idx} className="text-xs px-2 py-1 bg-green-600/20 text-green-300 rounded border border-green-500/30">
                                                                {tag}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div> {/* End of Dashboard Top Card */}

                                        <div className="flex items-center justify-between mb-6">
                                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Voice Analysis</h3>
                                            <span className="text-[10px] text-blue-400 bg-blue-900/20 px-2 py-1 rounded border border-blue-500/30">AI Calibrated</span>
                                        </div>

                                        <div className="flex flex-col md:flex-row items-center gap-8">
                                            {/* Visualization */}
                                            <div className="w-full md:w-1/2 flex justify-center bg-[#0a0c10] rounded-xl border border-gray-800 py-4 shadow-inner">
                                                <VoiceRadarChart tone={sliders.tone} emoji={sliders.emoji} length={sliders.length} />
                                            </div>

                                            {/* Controls */}
                                            <div className="w-full md:w-1/2 space-y-6">
                                                <SliderControl label="Tone" leftLabel="Casual / Friendly" rightLabel="Formal / Professional" value={sliders.tone} onChange={(val: number) => setSliders({ ...sliders, tone: val })} color="blue" />
                                                <SliderControl label="Emoji Usage" leftLabel="Minimal" rightLabel="Heavy" value={sliders.emoji} onChange={(val: number) => setSliders({ ...sliders, emoji: val })} color="purple" />
                                                <SliderControl label="Sentence Length" leftLabel="Short / Punchy" rightLabel="Long / Detailed" value={sliders.length} onChange={(val: number) => setSliders({ ...sliders, length: val })} color="indigo" />

                                                {/* English Proficiency - Integrated Style */}
                                                <div>
                                                    <div className="flex justify-between mb-2">
                                                        <span className="text-sm font-medium text-white flex items-center gap-2">English Proficiency</span>
                                                        <span className="text-xs font-bold text-green-400 uppercase">{englishProficiency}</span>
                                                    </div>
                                                    <div className="relative h-2 bg-gray-700 rounded-lg">
                                                        <div className="absolute left-0 top-0 h-full rounded-lg bg-green-600 transition-all duration-300" style={{ width: englishProficiency === 'basic' ? '0%' : englishProficiency === 'intermediate' ? '33%' : englishProficiency === 'advanced' ? '66%' : '100%' }}></div>
                                                        <input
                                                            type="range"
                                                            min="0"
                                                            max="100"
                                                            step="33"
                                                            value={englishProficiency === 'basic' ? 0 : englishProficiency === 'intermediate' ? 33 : englishProficiency === 'advanced' ? 66 : 100}
                                                            onChange={(e) => {
                                                                const val = Number(e.target.value);
                                                                if (val < 16) setEnglishProficiency('basic');
                                                                else if (val < 50) setEnglishProficiency('intermediate');
                                                                else if (val < 84) setEnglishProficiency('advanced');
                                                                else setEnglishProficiency('native');
                                                            }}
                                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                        />
                                                        <div className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg border-2 border-green-600 pointer-events-none transition-all duration-300" style={{ left: englishProficiency === 'basic' ? '0%' : englishProficiency === 'intermediate' ? '33%' : englishProficiency === 'advanced' ? '66%' : '100%' }}></div>
                                                    </div>
                                                    <div className="flex justify-between mt-2">
                                                        <span className="text-[10px] text-gray-500 uppercase font-medium">Basic (A1)</span>
                                                        <span className="text-[10px] text-gray-500 uppercase font-medium">Native (C2)</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Live Preview Section */}
                                        <div className="mt-6 p-4 bg-gradient-to-br from-blue-900/10 to-purple-900/10 border border-blue-500/20 rounded-xl">
                                            <div className="flex items-center justify-between mb-3">
                                                <h4 className="text-xs font-bold text-blue-200 uppercase tracking-wider flex items-center gap-2">
                                                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                                    Live Preview
                                                </h4>
                                                <span className="text-[10px] text-gray-400">Updates as you adjust sliders</span>
                                            </div>
                                            <div className="bg-black/40 rounded-lg p-4 border border-gray-700">
                                                <p className="text-sm text-white leading-relaxed whitespace-pre-wrap">
                                                    {generatePreviewPost()}
                                                </p>
                                            </div>
                                            <p className="text-[10px] text-gray-400 mt-2 italic">
                                                ↑ This is how your posts will sound with current settings
                                            </p>
                                        </div>


                                        {/* DNA, Audience, Niche */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-xs text-gray-400 block mb-1.5">Language</label>
                                                <select value={language} onChange={(e) => setLanguage(e.target.value)} className="w-full bg-[#1c1c2e] border border-gray-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-blue-500">
                                                    <option value="English">English (US)</option>
                                                    <option value="Romanian">Romanian</option>
                                                    <option value="Spanish">Spanish</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="text-xs text-gray-400 block mb-1.5">Niche</label>
                                                <input type="text" value={industry} onChange={(e) => setIndustry(e.target.value)} className="w-full bg-[#1c1c2e] border border-gray-700 rounded-lg p-2.5 text-sm text-white" />
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="text-xs text-gray-400 block mb-1.5">Target Audience</label>
                                                <input type="text" value={targetAudience} onChange={(e) => setTargetAudience(e.target.value)} className="w-full bg-[#1c1c2e] border border-gray-700 rounded-lg p-2.5 text-sm text-white" />
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="text-xs text-gray-400 block mb-1.5">Generated Voice DNA (Editable)</label>
                                                <textarea value={voiceDNA} onChange={(e) => setVoiceDNA(e.target.value)} className="w-full bg-[#1c1c2e] border border-gray-700 rounded-lg p-2.5 text-sm text-white h-24" />
                                            </div>



                                            {/* NEW: URL Links Section */}
                                            <div className="md:col-span-2">
                                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2 flex items-center gap-2">
                                                    <LinkIcon size={14} /> Your URL Links (Optional)
                                                </label>
                                                <p className="text-[10px] text-gray-500 mb-3">Add up to 2 URLs (website, portfolio, LinkedIn, etc.)</p>
                                                <div className="space-y-2">
                                                    {links.map((link, idx) => (
                                                        <div key={idx} className="flex items-center gap-2">
                                                            <div className="flex-1 relative">
                                                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                                                                    <LinkIcon size={14} />
                                                                </div>
                                                                <input
                                                                    type="url"
                                                                    value={link}
                                                                    onChange={(e) => {
                                                                        const newLinks = [...links];
                                                                        newLinks[idx] = e.target.value;
                                                                        setLinks(newLinks);
                                                                    }}
                                                                    placeholder={`Link #${idx + 1} (e.g., https://yourwebsite.com)`}
                                                                    className="w-full bg-[#1c1c2e] border border-gray-700 rounded-lg pl-9 pr-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition"
                                                                />
                                                            </div>
                                                            {link && (
                                                                <button
                                                                    onClick={() => {
                                                                        const newLinks = [...links];
                                                                        newLinks[idx] = '';
                                                                        setLinks(newLinks);
                                                                    }}
                                                                    className="p-2 text-gray-500 hover:text-red-400 transition"
                                                                >
                                                                    <X size={16} />
                                                                </button>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}




                        {/* TAB: STRATEGY (Founder Mode) */}
                        {activeTab === 'strategy' && (
                            <div className="space-y-6 animate-in fade-in">
                                <div className="bg-blue-900/10 border border-blue-900/30 p-5 rounded-2xl">
                                    <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                                        <Target size={18} className="text-blue-400" />
                                        Brand Strategy
                                    </h3>
                                    <p className="text-sm text-gray-400 mb-6">Define who you are, who you fight, and what you sell. This powers Founder Mode.</p>

                                    <div className="space-y-6">
                                        {/* 1. ARCHETYPE */}
                                        <div>
                                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-3">Brand Archetype</label>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                                {[
                                                    { id: 'Rebel', icon: '⚡', desc: 'Contrarian, Bold' },
                                                    { id: 'Consultant', icon: '🤝', desc: 'Helpful, Strategic' },
                                                    { id: 'Expert', icon: '🧠', desc: 'Deep, Authoritative' },
                                                    { id: 'Builder', icon: '🛠️', desc: 'Transparent, Raw' }
                                                ].map((type) => (
                                                    <button
                                                        key={type.id}
                                                        onClick={() => setArchetype(type.id as any)}
                                                        className={`p-3 rounded-xl border text-left transition-all ${archetype === type.id
                                                            ? 'bg-blue-600 border-blue-500 text-white shadow-lg ring-1 ring-blue-400'
                                                            : 'bg-[#1c1c2e] border-gray-700 text-gray-400 hover:bg-[#252538]'
                                                            }`}
                                                    >
                                                        <div className="text-xl mb-1">{type.icon}</div>
                                                        <div className="font-bold text-sm">{type.id}</div>
                                                        <div className="text-[10px] opacity-70">{type.desc}</div>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* 2. THE ENEMY */}
                                        <div>
                                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">The Enemy</label>
                                            <p className="text-[10px] text-gray-500 mb-2">What status quo, problem, or misconception are you fighting against?</p>
                                            <textarea
                                                value={enemy}
                                                onChange={(e) => setEnemy(e.target.value)}
                                                placeholder="e.g. 'Complicated enterprise software', 'Gurus selling get-rich-quick schemes', 'Manual data entry'"
                                                className="w-full bg-[#0f1115] border border-gray-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-blue-500 transition resize-none h-24"
                                            />
                                        </div>

                                        {/* 3. THE OFFER */}
                                        <div>
                                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">The Offer</label>
                                            <p className="text-[10px] text-gray-500 mb-2">What is your core value proposition? (Keep it simple)</p>
                                            <textarea
                                                value={offer}
                                                onChange={(e) => setOffer(e.target.value)}
                                                placeholder="e.g. 'One-click AI social media scheduling for busy founders'"
                                                className="w-full bg-[#0f1115] border border-gray-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-blue-500 transition resize-none h-24"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* TAB: RULES */}
                        {activeTab === 'rules' && (
                            <div className="space-y-6 animate-in fade-in">
                                <div className="bg-red-900/10 border border-red-900/30 p-4 rounded-xl">
                                    <label className="text-xs font-bold text-red-400 uppercase tracking-wider block mb-2 flex items-center gap-2"><Ban size={14} /> Anti-Robot Filter (Banned Words)</label>
                                    <textarea value={bannedWords} onChange={(e) => setBannedWords(e.target.value)} className="w-full bg-[#0f1115] border border-red-900/30 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-red-500 transition resize-none h-20" placeholder="e.g. delve, landscape, testament, tapestry, unlock" />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2 flex items-center gap-2"><Hash size={14} /> Mandatory Hashtags</label>
                                    <input type="text" value={hashtags} onChange={(e) => setHashtags(e.target.value)} className="w-full bg-[#161b22] border border-gray-700 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-blue-500" />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2 flex items-center gap-2"><MessageSquare size={14} /> Call to Action Style</label>
                                    <select value={ctaStyle} onChange={(e) => setCtaStyle(e.target.value)} className="w-full bg-[#161b22] border border-gray-700 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-blue-500">
                                        <option>Ask a question to provoke comments</option>
                                        <option>Direct Link in Bio / Comments</option>
                                        <option>Soft Sell ("DM me for info")</option>
                                        <option>No CTA (Pure Value)</option>
                                    </select>
                                </div>

                                {/* GRANULAR PREFERENCES SECTION */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-gray-800 pt-6">
                                    <div>
                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">Post Length</label>
                                        <select value={postLength} onChange={(e: any) => setPostLength(e.target.value)} className="w-full bg-[#161b22] border border-gray-700 rounded-lg py-2.5 px-3 text-sm text-white focus:outline-none focus:border-blue-500">
                                            <option value="short">Short (Punchy)</option>
                                            <option value="medium">Medium (Standard)</option>
                                            <option value="long">Long (Deep Dive)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">Detail Level</label>
                                        <select value={detailLevel} onChange={(e: any) => setDetailLevel(e.target.value)} className="w-full bg-[#161b22] border border-gray-700 rounded-lg py-2.5 px-3 text-sm text-white focus:outline-none focus:border-blue-500">
                                            <option value="minimal">Minimalist</option>
                                            <option value="balanced">Balanced</option>
                                            <option value="deep">Deep / Education</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">Creativity</label>
                                        <select value={innovationFactor} onChange={(e: any) => setInnovationFactor(e.target.value)} className="w-full bg-[#161b22] border border-gray-700 rounded-lg py-2.5 px-3 text-sm text-white focus:outline-none focus:border-blue-500">
                                            <option value="safe">Safe (Corporate)</option>
                                            <option value="balanced">Balanced</option>
                                            <option value="unique">Unique / Risky</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* --- TAB: CUSTOM HOOKS & CTA --- */}
                        {activeTab === 'hooks' && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

                                {/* SECTION 1: AUTO-GENERATED NICHE HOOKS */}
                                <div className="bg-[#161b22] border border-gray-800 rounded-2xl p-6 relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-purple-600"></div>
                                    <div className="flex items-center justify-between mb-4">
                                        <div>
                                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                                <Sparkles size={18} className="text-purple-500" />
                                                Auto-Generated Hooks
                                            </h3>
                                            <p className="text-xs text-gray-400 mt-1">
                                                Based on your Voice DNA analysis for niche: <span className="text-purple-400">{industry || 'General'}</span>
                                            </p>
                                        </div>
                                        <button
                                            onClick={async () => {
                                                if (!industry) return;
                                                setIsGeneratingHooks(true);
                                                try {
                                                    const hooks = await generateNicheHooks(industry, 5, language);
                                                    setNicheHooks(hooks);
                                                } catch (e) { console.error(e); }
                                                setIsGeneratingHooks(false);
                                            }}
                                            disabled={isGeneratingHooks || !industry}
                                            className="text-xs text-gray-500 hover:text-white flex items-center gap-1 transition"
                                        >
                                            <RefreshCw size={12} className={isGeneratingHooks ? "animate-spin" : ""} /> Regenerate
                                        </button>
                                    </div>

                                    {nicheHooks.length === 0 ? (
                                        <div className="p-4 bg-gray-900/50 rounded-lg text-center text-gray-500 text-xs italic">
                                            Run "Analyze & Save DNA" to generate these automatically.
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {nicheHooks.map((hook, idx) => (
                                                <div key={idx} className="flex items-start gap-3 p-3 bg-[#0d1117] border border-gray-800 rounded-xl hover:border-purple-500/30 transition group">
                                                    <div className="bg-purple-500/10 p-2 rounded-lg text-purple-400 font-bold text-xs mt-0.5">#{idx + 1}</div>
                                                    <p className="flex-1 text-sm text-gray-300 font-medium italic">"{hook}"</p>
                                                    <button onClick={() => {
                                                        // Copy to custom hooks
                                                        if (!savedHooks.includes(hook)) setSavedHooks([...savedHooks, hook]);
                                                    }} className="p-2 text-gray-600 hover:text-green-400 opacity-0 group-hover:opacity-100 transition" title="Save to My Custom Hooks"><Plus size={14} /></button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* SECTION 2: CUSTOM HOOKS GENERATOR */}
                                <div className="bg-[#161b22] border border-gray-800 rounded-2xl p-6 relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-pink-600"></div>
                                    <div className="flex items-center justify-between mb-4">
                                        <div>
                                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                                <Plus size={18} className="text-pink-500" />
                                                My Custom Hooks
                                            </h3>
                                            <p className="text-xs text-gray-400 mt-1">
                                                Manually generate or add specific hooks for different topics.
                                            </p>
                                        </div>
                                        <button
                                            onClick={handleGenerateNicheHooks}
                                            disabled={isGeneratingHooks}
                                            className="bg-pink-600 hover:bg-pink-500 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition shadow-lg shadow-pink-900/20"
                                        >
                                            {isGeneratingHooks ? <RefreshCw size={14} className="animate-spin" /> : <Sparkles size={14} />}
                                            {isGeneratingHooks ? 'Generating...' : 'Generate Custom'}
                                        </button>
                                    </div>

                                    {savedHooks.length === 0 ? (
                                        <div className="text-center py-8 border border-dashed border-gray-800 rounded-xl bg-gray-900/50">
                                            <p className="text-gray-500 text-sm">No custom hooks saved.</p>
                                            <p className="text-gray-600 text-xs mt-1">Generate some or add manually (implied).</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {savedHooks.map((hook, idx) => (
                                                <div key={idx} className="group flex items-start gap-3 p-3 bg-[#0d1117] border border-gray-800 rounded-xl hover:border-pink-500/30 transition">
                                                    <div className="bg-pink-500/10 p-2 rounded-lg text-pink-500 font-bold text-xs mt-0.5">#{idx + 1}</div>
                                                    <p className="flex-1 text-sm text-gray-300 leading-relaxed font-medium">{hook}</p>
                                                    <button
                                                        onClick={() => handleDeleteHook(idx)}
                                                        className="p-2 text-gray-600 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition opacity-0 group-hover:opacity-100"
                                                        title="Delete Hook"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* SECTION 3: CALL TO ACTIONS */}
                                <div className="bg-[#161b22] border border-gray-800 rounded-2xl p-6 relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-blue-600"></div>
                                    <div className="mb-4">
                                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                            <MessageSquare size={18} className="text-blue-500" />
                                            Call To Actions (CTA)
                                        </h3>
                                        <p className="text-xs text-gray-400 mt-1">Set your default closing strategy.</p>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">Primary CTA Strategy</label>
                                            <select value={ctaStyle} onChange={(e) => setCtaStyle(e.target.value)} className="w-full bg-[#0d1117] border border-gray-700 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-blue-500 hover:border-gray-600 transition">
                                                <option>Ask a question to provoke comments</option>
                                                <option>Direct Link in Bio / Comments</option>
                                                <option>Soft Sell ("DM me for info")</option>
                                                <option>No CTA (Pure Value)</option>
                                                <option>Custom (Write your own below)</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-4 md:p-6 border-t border-gray-800 flex justify-end gap-3 bg-[#0f1115] shrink-0">
                        <button onClick={onClose} disabled={isSaving} className="px-5 py-2.5 text-sm text-gray-400 hover:text-white font-medium transition">Cancel</button>
                        <button onClick={handleSave} disabled={isSaving} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-lg shadow-lg flex items-center gap-2 transition">
                            {isSaving ? <RefreshCw className="animate-spin" size={16} /> : <Check size={16} />} {isSaving ? 'Saving...' : 'Save Profile'}
                        </button>
                    </div>

                </div>
            </div>
        </div >
    );
}

function TabButton({ label, isActive, onClick, isLocked }: { label: string, isActive: boolean, onClick: () => void, isLocked?: boolean }) {
    return (
        <button
            onClick={onClick}
            className={`flex-1 py-3 text-xs md:text-sm font-bold border-b-2 transition flex items-center justify-center gap-2 ${isActive
                ? 'border-blue-500 text-white'
                : 'border-transparent text-gray-500 hover:text-gray-300'
                }`}
        >
            {label}
            {isLocked && <Lock size={12} className="text-yellow-500" />}
        </button>
    );
}


function SliderControl({ label, leftLabel, rightLabel, value, onChange, color = 'blue', disabled = false }: any) {
    const colorClass = color === 'purple' ? 'accent-purple-500 text-purple-400' : (color === 'indigo' ? 'accent-indigo-500 text-indigo-400' : 'accent-blue-600 text-blue-400');

    // Ensure value is a valid number 0-100
    const safeValue = isNaN(Number(value)) ? 50 : Math.max(0, Math.min(100, Number(value)));

    return (
        <div className={disabled ? 'opacity-50 pointer-events-none grayscale' : ''}>
            <div className="flex justify-between mb-2">
                <span className="text-sm font-medium text-white flex items-center gap-2">
                    {label}
                </span>
                <span className={`text-xs font-bold ${color === 'purple' ? 'text-purple-400' : (color === 'indigo' ? 'text-indigo-400' : 'text-blue-400')}`}>{safeValue}%</span>
            </div>
            <div className="relative h-2 bg-gray-700 rounded-lg">
                <div className={`absolute left-0 top-0 h-full rounded-lg transition-all duration-300 ${color === 'purple' ? 'bg-purple-600' : (color === 'indigo' ? 'bg-indigo-600' : 'bg-blue-600')}`} style={{ width: `${safeValue}%` }}></div>
                <input
                    type="range"
                    min="0"
                    max="100"
                    value={safeValue}
                    onChange={(e) => {
                        const val = parseInt(e.target.value);
                        onChange(isNaN(val) ? 50 : val);
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    disabled={disabled}
                />
                <div className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg border-2 pointer-events-none transition-all duration-100 ${color === 'purple' ? 'border-purple-600' : (color === 'indigo' ? 'border-indigo-600' : 'border-blue-600')}`} style={{ left: `calc(${safeValue}% - 8px)` }}></div>
            </div>
            <div className="flex justify-between mt-2"><span className="text-[10px] text-gray-500 uppercase font-medium">{leftLabel}</span><span className="text-[10px] text-gray-500 uppercase font-medium">{rightLabel}</span></div>
        </div>
    )
}
