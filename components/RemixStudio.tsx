import React, { useState } from 'react';
import {
    Sparkles, Globe, Youtube, Lock, Repeat, ArrowRight, Share2,
    Copy, Trash2, Save, FileText, Check, AlertCircle, X, Search,
    Linkedin, Twitter, Instagram, Video, Facebook, Layers, ChevronDown, ChevronUp, Mic2, Target
} from 'lucide-react';
import { UserProfile, BrandProfile, Tone, PostObjective } from '../types';
import { Loader } from './Loader';
import { findTrendingContent, analyzeViralStructure } from '../services/geminiService';
import { TONES, OBJECTIVES } from '../constants'; // Ensure these are exported from constants

interface RemixStudioProps {
    userProfile: UserProfile | null;
    brandProfile: BrandProfile | null;
    onGenerate: (topic: string, isRemix?: boolean, remixData?: any) => Promise<void>;
    checkCredits: (amount: number) => boolean;
    onUpdateProfile: (updatedProfile: Partial<BrandProfile>) => void;
    // New Props for State Hoisting
    remixFormats: string[];
    setRemixFormats: (formats: string[]) => void;
    tone: Tone;
    setTone: (tone: Tone) => void;
    detailLevel: 'min' | 'medium' | 'long' | 'detailed';
    setDetailLevel: (level: 'min' | 'medium' | 'long' | 'detailed') => void;
    objective: PostObjective;
    setObjective: (obj: PostObjective) => void;
    isLoading: boolean;
    savedTemplates: any[];
    useBrandVoice?: boolean;
}

const DESTINATIONS = [
    { id: 'linkedin', label: 'LinkedIn Post', icon: Linkedin, desc: 'Professional' },
    { id: 'twitter', label: 'X Thread', icon: Twitter, desc: 'Engaging' },
    { id: 'instagram_caption', label: 'IG Caption', icon: Instagram, desc: 'Short' },
    { id: 'instagram_carousel', label: 'IG Carousel', icon: Layers, desc: 'Visual' },
    { id: 'tiktok_script', label: 'TikTok Script', icon: Video, desc: 'Viral Video' },
    { id: 'facebook', label: 'Facebook', icon: Facebook, desc: 'Community' },
];

export function RemixStudio({
    userProfile,
    brandProfile,
    onGenerate,
    checkCredits,
    onUpdateProfile,
    remixFormats,
    setRemixFormats,
    tone,
    setTone,
    detailLevel,
    setDetailLevel,
    objective,
    setObjective,
    isLoading,
    savedTemplates,
    useBrandVoice
}: RemixStudioProps) {
    const [topic, setTopic] = useState('');
    const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);
    const [templateName, setTemplateName] = useState('');

    const handleSaveTemplate = async () => {
        if (!templateName.trim() || !xRayData) return;
        const newHook = {
            id: crypto.randomUUID(),
            name: templateName,
            ...xRayData, // includes hook, tone, structure
            createdAt: new Date().toISOString()
        };
        // Use savedTemplates for structured objects, NOT customHooks
        const currentTemplates = brandProfile?.savedTemplates || [];
        const updatedTemplates = [...currentTemplates, newHook];

        await onUpdateProfile({ savedTemplates: updatedTemplates });
        setShowSaveTemplateModal(false);
        setTemplateName('');
    };

    const [isFindingSource, setIsFindingSource] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false); // Local loading state for analyze
    const [xRayData, setXRayData] = useState<{ hook: string; tone: string; structure: string } | null>(null);
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [activeTab, setActiveTab] = useState<'input' | 'results'>('input'); // Track if we are showing results/analysis

    // Format Toggles
    const toggleFormat = (id: string) => {
        if (remixFormats.includes(id)) {
            setRemixFormats(remixFormats.filter(f => f !== id));
        } else {
            setRemixFormats([...remixFormats, id]);
        }
    };

    // Auto-Source Action
    const handleAutoSource = async () => {
        if (!checkCredits(2)) return alert("2 Credits required for Auto-Source");
        let searchTerm = brandProfile?.industry || "";
        if (!searchTerm) searchTerm = prompt("What topic/niche should we search for?") || "";
        if (!searchTerm) return;

        setIsFindingSource(true);
        try {
            const url = await findTrendingContent(searchTerm);
            if (url) setTopic(url);
            else alert("No URL found.");
        } catch (error) {
            alert("Could not find a trending URL.");
        } finally {
            setIsFindingSource(false);
        }
    };

    // Primary Action: Analyze & Generate (Simulated "One Decision")
    const handlePrimaryGenerate = async () => {
        if (!topic.trim()) return alert("Please paste some content first!");
        if (remixFormats.length === 0) return alert("Please select at least one destination!");

        // If we haven't analyzed yet, maybe we should? 
        // For the "One Decision" flow, we just call generate. 
        // The parent App.tsx handles the heavy lifting.
        // But if user wants "Why this works", we need X-Ray.

        // Let's fire the analysis in parallel if it's not done, just for the UI feedback?
        // Actually, let's keep it simple: Trigger Generate.
        // If the user is on Agency, we can try to do a hidden X-Ray too.

        if (!xRayData && userProfile?.subscriptionTier === 'agency' && topic.length > 50) {
            // Silent Analysis for "Why this works" reveal
            analyzeViralStructure(topic).then(data => setXRayData(data)).catch(e => console.log("Silent analysis failed", e));
        }

        await onGenerate(topic, true, xRayData); // Pass xRayData if we have it
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">

            {/* --- PHASE 1: INPUT & DESTINATION --- */}
            <div className="bg-[#161b22] border border-gray-800 rounded-2xl p-6 relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-green-500 to-emerald-700"></div>

                {/* 1. Header & Source */}
                <div className="mb-6">
                    <div className="flex justify-between items-center mb-2">
                        <label className="text-lg font-bold text-white flex items-center gap-2">
                            <Repeat className="text-green-500" size={20} />
                            Source Content
                        </label>
                        <button
                            onClick={handleAutoSource}
                            disabled={isFindingSource}
                            className="text-xs text-blue-400 hover:text-white bg-blue-900/20 hover:bg-blue-600 px-3 py-1.5 rounded-full transition flex items-center gap-1.5 border border-blue-800/50 hover:border-transparent"
                        >
                            {isFindingSource ? <Loader size="sm" /> : <Globe size={12} />}
                            {isFindingSource ? "Scouring Web..." : "Auto-Find Viral Post"}
                        </button>
                    </div>

                    <div className="relative group">
                        <textarea
                            value={topic}
                            onChange={(e) => { setTopic(e.target.value); setXRayData(null); }}
                            rows={4}
                            placeholder="Paste a link (Article/YouTube) or text here. We'll find the viral pattern."
                            className="w-full bg-[#0d1117] border border-gray-700 rounded-xl p-4 text-white placeholder-gray-600 focus:ring-2 focus:ring-green-500/50 focus:border-green-500 outline-none resize-none transition-all text-sm leading-relaxed shadow-inner"
                        />
                        {/* Optional Analyze Button */}
                        {!xRayData && topic.length > 20 && (
                            <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => {
                                        if (userProfile?.subscriptionTier !== 'agency') {
                                            alert("🔒 Competitor X-Ray Analysis is available only on the Agency Plan.\n\nUnlock deep insights into why viral posts perform.");
                                            return;
                                        }
                                        setIsAnalyzing(true);
                                        analyzeViralStructure(topic)
                                            .then(d => { setXRayData(d); setIsAnalyzing(false); })
                                            .catch(() => setIsAnalyzing(false));
                                    }}
                                    className="text-[10px] bg-gray-800 text-gray-400 px-2 py-1 rounded hover:text-white border border-gray-700 hover:border-gray-500 flex items-center gap-1"
                                >
                                    {userProfile?.subscriptionTier !== 'agency' && <Lock size={10} className="text-yellow-500" />}
                                    {isAnalyzing ? "Analyzing..." : "Just Analyze DNA"}
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* 2. Destination Grid */}
                <div className="mb-8">
                    <label className="text-xs md:text-sm font-bold text-gray-400 uppercase tracking-wider mb-2 md:mb-3 block">
                        Choose output format
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3">
                        {DESTINATIONS.map((dest) => {
                            const isSelected = remixFormats.includes(dest.id);
                            return (
                                <button
                                    key={dest.id}
                                    onClick={() => toggleFormat(dest.id)}
                                    className={`relative p-2 md:p-3 rounded-xl border text-left transition-all duration-200 flex items-start gap-2 md:gap-3 group ${isSelected
                                        ? 'bg-gradient-to-br from-green-900/40 to-emerald-900/20 border-green-500/50 shadow-lg shadow-green-900/20'
                                        : 'bg-[#0f1115] border-gray-800 hover:border-gray-600 hover:bg-[#1c1c2e]'
                                        }`}
                                >
                                    <div className={`p-1.5 md:p-2 rounded-lg shrink-0 ${isSelected ? 'bg-green-500 text-white shadow-md' : 'bg-gray-800 text-gray-400 group-hover:bg-gray-700 group-hover:text-white transition-colors'}`}>
                                        <dest.icon size={16} />
                                    </div>
                                    <div className="min-w-0">
                                        <div className={`text-xs md:text-sm font-bold truncate ${isSelected ? 'text-white' : 'text-gray-400 group-hover:text-white'}`}>{dest.label}</div>
                                        <div className="text-[9px] md:text-[10px] text-gray-500 mt-0.5 truncate">{dest.desc}</div>
                                    </div>
                                    {isSelected && <div className="absolute top-1 right-1 md:top-2 md:right-2 text-green-500"><Check size={12} strokeWidth={3} /></div>}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* 3. Primary CTA */}
                <div className="space-y-3">
                    <button
                        onClick={handlePrimaryGenerate}
                        disabled={isLoading}
                        className="w-full py-4 bg-gradient-to-r from-green-600 via-emerald-600 to-green-600 bg-[length:200%_auto] animate-gradient hover:scale-[1.01] transition-all rounded-xl shadow-xl shadow-green-900/30 flex items-center justify-center gap-3 group disabled:opacity-75 disabled:cursor-not-allowed"
                    >
                        {isLoading ? <Loader size="sm" /> : <Sparkles className="text-white group-hover:rotate-12 transition-transform" />}
                        <span className="text-lg font-bold text-white tracking-wide">
                            {isLoading ? "Remixing Magic..." : "Generate Remix"}
                        </span>
                        {!isLoading && <ArrowRight className="text-white/70 group-hover:translate-x-1 transition-transform" size={18} />}
                    </button>

                    <div className="flex items-center justify-between px-2 text-[10px] text-gray-500 font-medium">
                        <span className="flex items-center gap-1.5"><Mic2 size={10} className="text-green-500" /> Your voice stays intact. No generic AI tone.</span>
                        <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div> Generates in ~5 seconds.</span>
                    </div>
                </div>

                {/* 4. Advanced Controls (Collapsed) */}
                <div className="mt-6 pt-4 border-t border-gray-800/50">
                    <button
                        onClick={() => setShowAdvanced(!showAdvanced)}
                        className="flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-white transition uppercase tracking-wider mx-auto"
                    >
                        {showAdvanced ? "Hide Advanced" : "Advanced Controls"}
                        {showAdvanced ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    </button>

                    {showAdvanced && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 animate-in fade-in slide-in-from-top-2">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-1.5"><Target size={12} /> Goal</label>
                                <div className="relative"><select value={objective} onChange={(e) => setObjective(e.target.value as PostObjective)} className="w-full bg-[#0d1117] border border-gray-700 text-white rounded-lg px-3 py-2 text-xs appearance-none focus:border-green-500 outline-none">{OBJECTIVES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select></div>
                            </div>
                            <div className="space-y-1.5">
                                <label className={`text-[10px] font-bold text-gray-500 uppercase flex items-center gap-1.5 ${useBrandVoice ? 'opacity-50' : ''}`}><Mic2 size={12} /> Tone</label>
                                <div className="relative">
                                    <select
                                        value={tone}
                                        onChange={(e) => setTone(e.target.value as Tone)}
                                        disabled={useBrandVoice}
                                        className={`w-full bg-[#0d1117] border border-gray-700 text-white rounded-lg px-3 py-2 text-xs appearance-none focus:border-green-500 outline-none ${useBrandVoice ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        title={useBrandVoice ? "Tone is determined by Profile Voice DNA" : "Select tone"}
                                    >
                                        {TONES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                    </select>
                                </div>
                            </div>



                            {/* Detail Level Selector */}
                            <div className="space-y-1.5 col-span-full md:col-span-1">
                                <label className={`text-[10px] font-bold text-gray-500 uppercase flex items-center gap-1.5 ${useBrandVoice ? 'opacity-50' : ''}`}><Layers size={12} /> Detail Level</label>
                                <div className="relative">
                                    <select
                                        value={detailLevel}
                                        onChange={(e) => setDetailLevel(e.target.value as any)}
                                        disabled={useBrandVoice}
                                        className={`w-full bg-[#0d1117] border border-gray-700 text-white rounded-lg px-3 py-2 text-xs appearance-none focus:border-green-500 outline-none ${useBrandVoice ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        title={useBrandVoice ? "Length is determined by Profile Voice DNA" : "Select Detail Level"}
                                    >
                                        <option value="min">Min (Short/Brief)</option>
                                        <option value="medium">Medium (Standard)</option>
                                        <option value="long">Long (Expanded)</option>
                                        <option value="detailed">Max Detail (Deep Dive)</option>
                                    </select>
                                </div>
                            </div>

                            {/* Load Saved Structure */}
                            {savedTemplates && savedTemplates.length > 0 && (
                                <div className="space-y-1.5 col-span-full border-t border-gray-800 pt-3">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-1.5"><Lock size={12} /> Load Saved Structure</label>
                                    <select
                                        onChange={(e) => {
                                            const hook = savedTemplates.find(h => h.id === e.target.value);
                                            if (hook) {
                                                setXRayData({ hook: hook.hook, tone: hook.tone, structure: hook.structure });
                                            }
                                        }}
                                        className="w-full bg-[#0d1117] border border-gray-700 text-white rounded-lg px-3 py-2 text-xs appearance-none focus:border-green-500 outline-none"
                                    >
                                        <option value="">Select a winning pattern...</option>
                                        {savedTemplates.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                                    </select>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>


            {/* --- PHASE 2: PROGRESSIVE DISCLOSURE (Analysis) --- */}
            {xRayData && (
                <div className="animate-in fade-in slide-in-from-bottom-6 duration-700">
                    <div className="bg-[#1c1c2e]/50 border border-indigo-500/20 rounded-2xl overflow-hidden backdrop-blur-sm group">
                        <button
                            onClick={() => setActiveTab(activeTab === 'results' ? 'input' : 'results')}
                            className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition text-left"
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-lg"><Search size={16} /></div>
                                <div>
                                    <h3 className="font-bold text-white text-sm flex items-center gap-2">
                                        Why this post performs
                                        <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded-full border border-indigo-500/20 font-medium tracking-wide">
                                            X-Ray Analysis
                                        </span>
                                    </h3>
                                    <p className="text-[10px] text-gray-400">Winning Pattern Detected</p>
                                </div>
                            </div>
                            <ChevronDown size={16} className={`text-gray-500 transition-transform ${activeTab === 'results' ? 'rotate-180' : ''}`} />
                        </button>

                        {activeTab === 'results' && (
                            <div className="p-4 pt-0 animate-in slide-in-from-top-2">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                                    <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                                        <div className="text-[10px] font-bold text-gray-500 uppercase mb-1">Hook Type</div>
                                        <div className="text-sm font-semibold text-white">{xRayData.hook}</div>
                                    </div>
                                    <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                                        <div className="text-[10px] font-bold text-gray-500 uppercase mb-1">Emotional Vibe</div>
                                        <div className="text-sm font-semibold text-white">{xRayData.tone}</div>
                                    </div>
                                    <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                                        <div className="text-[10px] font-bold text-gray-500 uppercase mb-1">Structure Summary</div>
                                        <div className="text-sm font-semibold text-white truncate" title={xRayData.structure}>{xRayData.structure}</div>
                                    </div>
                                </div>

                                <div className="flex flex-col md:flex-row gap-3">
                                    <button
                                        onClick={() => setShowSaveTemplateModal(true)}
                                        className="flex-1 py-3 bg-[#0f1115] hover:bg-indigo-900/30 border border-dashed border-gray-700 hover:border-indigo-500 text-gray-400 hover:text-indigo-400 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 group/btn"
                                    >
                                        <Save size={14} className="group-hover/btn:scale-110 transition" /> Save this winning structure (reuse anytime)
                                    </button>
                                    <button
                                        onClick={() => {
                                            const newTopic = prompt("What topic should we write about using this structure?");
                                            if (newTopic) onGenerate(topic, true, { ...xRayData, mode: 'variant', remixTargetTopic: newTopic });
                                        }}
                                        className="flex-1 py-3 bg-[#0f1115] hover:bg-green-900/30 border border-dashed border-gray-700 hover:border-green-500 text-gray-400 hover:text-green-400 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 group/btn"
                                    >
                                        <Sparkles size={14} className="group-hover/btn:scale-110 transition" /> Create another post using this format
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Save Template Modal */}
            {showSaveTemplateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-[#161b22] border border-gray-800 rounded-2xl w-full max-w-md p-6 shadow-2xl scale-100 animate-in zoom-in-95">
                        <h3 className="text-lg font-bold text-white mb-2">Save Winning Structure</h3>
                        <p className="text-sm text-gray-400 mb-4">Give this pattern a name so you can reuse it later.</p>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Structure Name</label>
                                <input
                                    autoFocus
                                    type="text"
                                    value={templateName}
                                    onChange={(e) => setTemplateName(e.target.value)}
                                    placeholder="e.g. Viral Contrarian Hook..."
                                    className="w-full bg-[#0d1117] border border-gray-700 text-white rounded-xl px-4 py-3 focus:border-indigo-500 focus:outline-none"
                                />
                            </div>

                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    onClick={() => setShowSaveTemplateModal(false)}
                                    className="px-4 py-2 text-gray-400 hover:text-white font-bold text-sm transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSaveTemplate}
                                    disabled={!templateName.trim()}
                                    className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-sm transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    <Save size={14} /> Save to Vault
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
