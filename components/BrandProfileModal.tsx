import React, { useState, useEffect, useRef } from 'react';
import {
    X, Sparkles, Link as LinkIcon,
    Upload, Hash, Palette, Check, RefreshCw,
    User, UserCheck, Copy, Ban, MessageSquare, Plus, Trash2,
    Lock
} from 'lucide-react';
import { BrandProfile } from '../types';
import { analyzeBrandVoice } from '../services/geminiService';
import { useAuth } from '../contexts/AuthContext';
import { VoiceRadarChart } from './VoiceRadarChart';

interface BrandProfileModalProps {
    currentProfile: BrandProfile | null;
    onSave: (profile: BrandProfile) => Promise<void>;
    onClose: () => void;
}

type Tab = 'core' | 'visuals' | 'rules';
type AnalysisMode = 'personal' | 'influencer';

export function BrandProfileModal({ currentProfile, onSave, onClose }: BrandProfileModalProps) {
    const { allProfiles, activeProfileIndex, switchProfile, addNewProfile, deleteProfile, userProfile } = useAuth();

    const [activeTab, setActiveTab] = useState<Tab>('core');
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

    const [sliders, setSliders] = useState({ tone: 50, emoji: 50, length: 50 });
    const [links, setLinks] = useState<string[]>(['', '']); // Up to 2 links

    // Granular Preferences
    const [postLength, setPostLength] = useState<'short' | 'medium' | 'long'>('medium');
    const [detailLevel, setDetailLevel] = useState<'minimal' | 'balanced' | 'deep'>('balanced');
    const [innovationFactor, setInnovationFactor] = useState<'safe' | 'balanced' | 'unique'>('balanced');

    // Populare Data
    useEffect(() => {
        if (currentProfile) {
            setProfileName(currentProfile.name || `Brand #${activeProfileIndex + 1}`);
            setVoiceDNA(currentProfile.voiceDNA || '');
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

            setSliders({
                tone: currentProfile.toneScore ?? 50,
                emoji: currentProfile.emojiScore ?? 50,
                length: currentProfile.lengthScore ?? 50
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
        }
    }, [currentProfile, activeProfileIndex]); // Added activeProfileIndex dependency to ensure refresh

    // Resetare la schimbare profil
    // Resetare la schimbare profil
    useEffect(() => {
        setUrlInput('');
        setTextInput('');
        setActiveTab('core');
    }, [activeProfileIndex]);

    // Removed lock logic - sliders always editable

    const handleAnalyze = async () => {
        const contentToAnalyze = textInput || urlInput;
        if (!contentToAnalyze || contentToAnalyze.length < 10) {
            alert("Please paste text from a post, article, or bio to analyze.");
            return;
        }
        setIsAnalyzing(true);
        try {
            const analysis = await analyzeBrandVoice(contentToAnalyze, 'personal');

            // Save to profile
            setSliders({
                tone: analysis.tone_score,
                emoji: analysis.emoji_score,
                length: analysis.length_score
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
            }

        } catch (error) {
            console.error("Analysis failed", error);
            alert("Could not analyze text.");
        } finally {
            setIsAnalyzing(false);
        }
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
            innovationFactor
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
                    <div className="p-4 md:p-6 border-b border-gray-800 flex justify-between items-start">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <input
                                    type="text"
                                    value={profileName}
                                    onChange={(e) => setProfileName(e.target.value)}
                                    className="bg-transparent text-lg md:text-xl font-bold text-white outline-none border-b border-transparent hover:border-gray-700 focus:border-blue-500 transition w-full placeholder-gray-600"
                                    placeholder="Profile Name (e.g. Personal)"
                                />
                                <div className="bg-blue-600/20 p-1.5 rounded-lg shrink-0"><Sparkles size={16} className="text-blue-500" /></div>
                            </div>
                            <p className="text-xs md:text-sm text-gray-400">Writing as: <span className="text-blue-400 font-mono">{profileName}</span></p>
                        </div>

                        <button onClick={onClose} className="text-gray-500 hover:text-white transition p-1"><X size={24} /></button>
                    </div>

                    {/* Tabs */}
                    <div className="flex border-b border-gray-800 bg-[#0f1115]">
                        <TabButton label="Voice DNA" isActive={activeTab === 'core'} onClick={() => setActiveTab('core')} />
                        <TabButton label="Visuals" isActive={activeTab === 'visuals'} onClick={() => setActiveTab('visuals')} />
                        <TabButton label="Rules" isActive={activeTab === 'rules'} onClick={() => setActiveTab('rules')} />
                    </div>

                    {/* Scrollable Form */}
                    <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 custom-scrollbar">

                        {/* TAB: CORE */}
                        {activeTab === 'core' && (
                            <div className="space-y-6 animate-in fade-in">
                                <div className="border rounded-xl p-4 md:p-5 relative overflow-hidden bg-[#161b22] border-blue-900/30">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-blue-600"></div>
                                    <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
                                        <Sparkles size={14} className="text-blue-400" />
                                        Voice DNA Analysis
                                    </h3>
                                    <p className="text-[10px] text-gray-400 mb-4">
                                        Clone your own voice or copy an influencer's style
                                    </p>
                                    <div className="space-y-3">
                                        <div className="relative">
                                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"><LinkIcon size={14} /></div>
                                            <input type="text" placeholder="Blog or Article URL (optional)" className="w-full bg-[#0f1115] border border-gray-700 rounded-lg py-2.5 pl-9 pr-4 text-sm text-white focus:outline-none focus:border-blue-500 transition" value={urlInput} onChange={(e) => setUrlInput(e.target.value)} />
                                        </div>
                                        <p className="text-[10px] text-gray-500 px-1">*Social Media links are blocked. Use Copy-Paste below.</p>
                                        <div className="text-center text-[10px] text-gray-600 font-bold uppercase tracking-wider">AND / OR</div>
                                        <textarea placeholder="Paste content here (your posts or influencer content)..." className="w-full bg-[#0f1115] border border-gray-700 rounded-lg p-3 text-sm text-white placeholder-gray-500 min-h-[100px] focus:outline-none focus:border-blue-500 transition resize-none font-mono" value={textInput} onChange={(e) => setTextInput(e.target.value)} />
                                    </div>
                                    <button onClick={handleAnalyze} disabled={isAnalyzing} className="w-full mt-4 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 rounded-lg transition shadow-lg flex items-center justify-center gap-2">
                                        {isAnalyzing ? <RefreshCw size={16} className="animate-spin" /> : <Sparkles size={16} />}
                                        {isAnalyzing ? 'Analyzing...' : 'Analyze & Save DNA'}
                                    </button>

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
                                </div>

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
                                    </div>
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

                        {/* TAB: VISUALS */}
                        {activeTab === 'visuals' && (
                            <div className="space-y-6 animate-in fade-in">
                                <div>
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-3">Brand Logo (Watermark)</label>
                                    <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/png, image/jpeg, image/jpg" />
                                    <div className="flex items-center gap-4">
                                        <div onClick={triggerFileInput} className="w-24 h-24 bg-[#1c1c2e] border-2 border-dashed border-gray-700 rounded-xl flex flex-col items-center justify-center text-gray-500 hover:border-blue-500 hover:text-blue-500 transition cursor-pointer group overflow-hidden relative">
                                            {logoPreview ? <img src={logoPreview} alt="Logo Preview" className="w-full h-full object-contain p-2" /> : <><Upload size={24} className="mb-2" /><span className="text-[10px]">Upload PNG</span></>}
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="text-sm font-bold text-white">Upload Brand Logo</h4>
                                            <p className="text-xs text-gray-500 mt-1">Your logo will be added as a watermark when generating images.</p>
                                            <p className="text-[10px] text-blue-400 mt-2">✓ Applied to all generated images (can be toggled off)</p>
                                            <button onClick={triggerFileInput} className="mt-3 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-xs text-white rounded border border-gray-600 transition">Choose File</button>
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

function TabButton({ label, isActive, onClick }: { label: string, isActive: boolean, onClick: () => void }) {
    return <button onClick={onClick} className={`flex-1 py-4 text-sm font-medium border-b-2 transition duration-200 ${isActive ? 'border-blue-500 text-white' : 'border-transparent text-gray-500 hover:text-gray-300'}`}>{label}</button>
}



function SliderControl({ label, leftLabel, rightLabel, value, onChange, color = 'blue', disabled = false }: any) {
    const colorClass = color === 'purple' ? 'accent-purple-500 text-purple-400' : (color === 'indigo' ? 'accent-indigo-500 text-indigo-400' : 'accent-blue-600 text-blue-400');

    return (
        <div className={disabled ? 'opacity-50 pointer-events-none grayscale' : ''}>
            <div className="flex justify-between mb-2">
                <span className="text-sm font-medium text-white flex items-center gap-2">
                    {label}
                </span>
                <span className={`text-xs font-bold ${color === 'purple' ? 'text-purple-400' : (color === 'indigo' ? 'text-indigo-400' : 'text-blue-400')}`}>{value}%</span>
            </div>
            <div className="relative h-2 bg-gray-700 rounded-lg">
                <div className={`absolute left-0 top-0 h-full rounded-lg transition-all duration-300 ${color === 'purple' ? 'bg-purple-600' : (color === 'indigo' ? 'bg-indigo-600' : 'bg-blue-600')}`} style={{ width: `${value}%` }}></div>
                <input type="range" min="0" max="100" value={value} onChange={(e) => onChange(parseInt(e.target.value))} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" disabled={disabled} />
                <div className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg border-2 pointer-events-none transition-all duration-100 ${color === 'purple' ? 'border-purple-600' : (color === 'indigo' ? 'border-indigo-600' : 'border-blue-600')}`} style={{ left: `calc(${value}% - 8px)` }}></div>
            </div>
            <div className="flex justify-between mt-2"><span className="text-[10px] text-gray-500 uppercase font-medium">{leftLabel}</span><span className="text-[10px] text-gray-500 uppercase font-medium">{rightLabel}</span></div>
        </div>
    )
}
