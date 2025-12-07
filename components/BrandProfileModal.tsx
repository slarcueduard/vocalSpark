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

interface BrandProfileModalProps {
  currentProfile: BrandProfile | null;
  onSave: (profile: BrandProfile) => Promise<void>;
  onClose: () => void;
}

type Tab = 'core' | 'visuals' | 'rules';
type AnalysisMode = 'personal' | 'influencer';

export function BrandProfileModal({ currentProfile, onSave, onClose }: BrandProfileModalProps) {
  const { allProfiles, activeProfileIndex, switchProfile, addNewProfile, userProfile } = useAuth();
  
  const [activeTab, setActiveTab] = useState<Tab>('core');
  const [isSaving, setIsSaving] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [analysisMode, setAnalysisMode] = useState<AnalysisMode>('personal');
  const [urlInput, setUrlInput] = useState('');
  const [textInput, setTextInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // -- STATE-URILE BRANDULUI --
  const [profileName, setProfileName] = useState('My Brand');
  const [voiceDNA, setVoiceDNA] = useState('');
  const [industry, setIndustry] = useState('');
  const [language, setLanguage] = useState('English');
  const [targetAudience, setTargetAudience] = useState('');
  
  // Visuals
  const [brandColors, setBrandColors] = useState<string[]>(['#3B82F6', '#8B5CF6', '#FFFFFF']);
  const [hexInput, setHexInput] = useState('#');
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  // Rules
  const [hashtags, setHashtags] = useState('#MyBrand #MyNiche');
  const [bannedWords, setBannedWords] = useState('delve, landscape, testament, unlock, tapestry');
  const [ctaStyle, setCtaStyle] = useState('Ask a question to provoke comments');

  const [sliders, setSliders] = useState({ tone: 50, emoji: 50, length: 50 });

  // --- FIX: POPULARE DATE (RESET COMPLET LA SCHIMBARE) ---
  useEffect(() => {
    if (currentProfile) {
        // Date salvate
        setProfileName(currentProfile.name || `Brand #${activeProfileIndex + 1}`);
        setVoiceDNA(currentProfile.voiceDNA || '');
        setIndustry(currentProfile.industry || '');
        setLanguage(currentProfile.language || 'English');
        setTargetAudience(currentProfile.targetAudience || '');
        
        // Hashtags
        setHashtags(currentProfile.fixedHashtags || '#MyBrand #MyNiche');
        
        // Culori (cu reset)
        if (currentProfile.brandColors && currentProfile.brandColors.length > 0) {
            setBrandColors(currentProfile.brandColors);
        } else {
            setBrandColors(['#3B82F6', '#8B5CF6', '#FFFFFF']);
        }

        // Logo (cu reset)
        setLogoPreview(currentProfile.logoUrl || null);

        // Date Temporare (Analiza) -> TREBUIE RESETATE
        setUrlInput('');
        setTextInput('');
        setAnalysisMode('personal');
        setSliders({ tone: 50, emoji: 50, length: 50 });
    }
  }, [currentProfile, activeProfileIndex]); // Se activeaza cand se schimba profilul

  // --- HANDLERS ---
  
  const handleAnalyze = async () => {
    const contentToAnalyze = textInput || urlInput;
    if (!contentToAnalyze || contentToAnalyze.length < 10) {
        alert("Please paste text from a post, article, or bio to analyze.");
        return;
    }
    setIsAnalyzing(true);
    try {
        const analysis = await analyzeBrandVoice(contentToAnalyze, analysisMode);
        setSliders({
            tone: analysis.tone_score,
            emoji: analysis.emoji_score,
            length: analysis.length_score
        });
        setIndustry(analysis.niche);
        setTargetAudience(analysis.audience);
        const prefix = analysisMode === 'influencer' ? "Style Cloned: " : "Brand Voice: ";
        setVoiceDNA(`${prefix}${analysis.voice_description}`);
    } catch (error) {
        console.error("Analysis failed", error);
        alert("Could not analyze text.");
    } finally {
        setIsAnalyzing(false);
    }
  };

  const handleAddColor = () => {
      if (/^#[0-9A-F]{6}$/i.test(hexInput)) {
          setBrandColors([...brandColors, hexInput]);
          setHexInput('#');
      } else {
          alert("Please enter a valid Hex code (e.g. #124444)");
      }
  };

  const removeColor = (colorToRemove: string) => {
      setBrandColors(brandColors.filter(c => c !== colorToRemove));
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
        if (file.size > 2 * 1024 * 1024) { alert("File too large (max 2MB)"); return; }
        const reader = new FileReader();
        reader.onloadend = () => setLogoPreview(reader.result as string);
        reader.readAsDataURL(file);
    }
  };

  const triggerFileInput = () => fileInputRef.current?.click();

  const handleSave = async () => {
      setIsSaving(true);
      
      const finalVoiceDNA = `
        ${voiceDNA}
        ---
        WRITING RULES:
        1. NEVER use these words: ${bannedWords}.
        2. Call to Action style: ${ctaStyle}.
        3. Mandatory Hashtags: ${hashtags}.
      `;

      const updatedProfile: BrandProfile = {
          name: profileName,
          industry,
          targetAudience,
          voiceDNA: finalVoiceDNA,
          language,
          fixedHashtags: hashtags, 
          brandColors: brandColors,
          logoUrl: logoPreview,
          description: targetAudience
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
  const plan = userProfile?.subscriptionTier || 'creator';
  const limit = plan === 'agency' ? 5 : (plan === 'pro' ? 2 : 1);
  const canAddMore = allProfiles.length < limit;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#0f1115] w-full max-w-4xl rounded-2xl border border-gray-800 shadow-2xl flex max-h-[90vh] overflow-hidden">
        
        {/* --- LEFT SIDEBAR: PROFILE SELECTOR --- */}
        <div className="w-64 border-r border-gray-800 bg-[#0a0c10] flex flex-col">
            <div className="p-6 border-b border-gray-800">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">Profiles</h3>
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
                        className={`w-full text-left px-4 py-3 rounded-xl transition-all flex items-center gap-3 ${
                            idx === activeProfileIndex 
                            ? 'bg-blue-600 text-white shadow-lg' 
                            : 'text-gray-400 hover:bg-[#1c1c2e] hover:text-white'
                        }`}
                    >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${idx === activeProfileIndex ? 'bg-white/20' : 'bg-[#1c1c2e] border border-gray-700'}`}>
                            {p.name?.[0]?.toUpperCase() || '#'}
                        </div>
                        <div className="overflow-hidden w-full">
                            <p className="text-sm font-bold truncate">{p.name}</p>
                            <p className="text-[10px] opacity-70 truncate">{p.industry || 'No niche'}</p>
                        </div>
                    </button>
                ))}

                {/* Buton Add New */}
                <button 
                    onClick={addNewProfile}
                    disabled={!canAddMore}
                    className={`w-full border-2 border-dashed rounded-xl py-3 flex items-center justify-center gap-2 text-xs font-bold transition ${
                        canAddMore 
                        ? 'border-gray-700 text-gray-400 hover:border-gray-500 hover:text-white' 
                        : 'border-gray-800 text-gray-600 cursor-not-allowed'
                    }`}
                >
                    {canAddMore ? <Plus size={14} /> : <Lock size={14} />}
                    {canAddMore ? 'New Brand Profile' : `Limit Reached (${limit})`}
                </button>
            </div>
        </div>

        {/* --- RIGHT MAIN CONTENT --- */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#0f1115]">
            
            {/* Header */}
            <div className="p-6 border-b border-gray-800 flex justify-between items-start">
            <div>
                <div className="flex items-center gap-2 mb-2">
                    <input 
                        type="text" 
                        value={profileName}
                        onChange={(e) => setProfileName(e.target.value)}
                        className="bg-transparent text-xl font-bold text-white outline-none border-b border-transparent hover:border-gray-700 focus:border-blue-500 transition w-full"
                        placeholder="Profile Name (e.g. Personal)"
                    />
                    <div className="bg-blue-600/20 p-1.5 rounded-lg"><Sparkles size={16} className="text-blue-500" /></div>
                </div>
                <p className="text-sm text-gray-400">This name will appear in Creator Studio as: <span className="text-blue-400 font-mono">"Writing as: {profileName}"</span></p>
            </div>
            <button onClick={onClose} className="text-gray-500 hover:text-white transition"><X size={20} /></button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-800 bg-[#0f1115]">
                <TabButton label="Core Identity" isActive={activeTab === 'core'} onClick={() => setActiveTab('core')} />
                <TabButton label="Visuals & Logo" isActive={activeTab === 'visuals'} onClick={() => setActiveTab('visuals')} />
                <TabButton label="Writing Rules" isActive={activeTab === 'rules'} onClick={() => setActiveTab('rules')} />
            </div>

            {/* Scrollable Form */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
            
            {/* ... Restul codului pentru taburi (Core, Visuals, Rules) ramane identic ... */}
            {/* Copiaza continutul tab-urilor din mesajul anterior daca e nevoie, sau lasa ce ai deja daca e functional */}
            {/* Am inclus doar logica de resetare sus */}
            
            {activeTab === 'core' && (
                <div className="space-y-6 animate-in fade-in">
                <div className={`border rounded-xl p-5 relative overflow-hidden transition-colors duration-300 ${analysisMode === 'influencer' ? 'bg-[#1a1625] border-purple-500/30' : 'bg-[#161b22] border-blue-900/30'}`}>
                    <div className={`absolute top-0 left-0 w-1 h-full ${analysisMode === 'influencer' ? 'bg-purple-600' : 'bg-blue-600'}`}></div>
                    <div className="flex bg-black/20 p-1 rounded-lg w-max mb-4">
                        <button onClick={() => setAnalysisMode('personal')} className={`px-3 py-1.5 rounded text-xs font-bold flex items-center gap-2 transition ${analysisMode === 'personal' ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}><User size={12} /> Analyze Me</button>
                        <button onClick={() => setAnalysisMode('influencer')} className={`px-3 py-1.5 rounded text-xs font-bold flex items-center gap-2 transition ${analysisMode === 'influencer' ? 'bg-purple-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}><UserCheck size={12} /> Clone Influencer</button>
                    </div>
                    <div className="space-y-3">
                        <div className="relative">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"><LinkIcon size={14} /></div>
                            <input type="text" placeholder={analysisMode === 'influencer' ? "Influencer's Blog / Article URL" : "Your Blog / Personal Website URL (No Social Media)"} className="w-full bg-[#0f1115] border border-gray-700 rounded-lg py-2.5 pl-9 pr-4 text-sm text-white focus:outline-none focus:border-blue-500 transition" value={urlInput} onChange={(e) => setUrlInput(e.target.value)} />
                        </div>
                        <p className="text-[10px] text-gray-500 px-1">*Social Media links (LinkedIn, IG) are blocked. Please copy & paste text below.</p>
                        <div className="text-center text-[10px] text-gray-600 font-bold uppercase tracking-wider">AND / OR</div>
                        <textarea placeholder={analysisMode === 'influencer' ? "Paste 2-3 examples of their best posts here..." : "Paste your bio, mission, or past captions..."} className="w-full bg-[#0f1115] border border-gray-700 rounded-lg p-3 text-sm text-white placeholder-gray-500 min-h-[100px] focus:outline-none focus:border-blue-500 transition resize-none font-mono" value={textInput} onChange={(e) => setTextInput(e.target.value)} />
                    </div>
                    <button onClick={handleAnalyze} disabled={isAnalyzing} className={`w-full mt-4 text-white font-bold py-2.5 rounded-lg transition shadow-lg flex items-center justify-center gap-2 ${analysisMode === 'influencer' ? 'bg-purple-600 hover:bg-purple-500' : 'bg-blue-600 hover:bg-blue-500'}`}>
                        {isAnalyzing ? <RefreshCw size={16} className="animate-spin" /> : (analysisMode === 'influencer' ? <Copy size={16} /> : <Sparkles size={16} />)}
                        {isAnalyzing ? 'Analyzing...' : (analysisMode === 'influencer' ? 'Extract Style' : 'Analyze DNA')}
                    </button>
                </div>

                <div className="bg-[#161b22] border border-gray-800 rounded-xl p-6 space-y-6">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Voice Profile</h3>
                    <SliderControl label="Tone" leftLabel="Casual" rightLabel="Formal" value={sliders.tone} onChange={(val:number) => setSliders({...sliders, tone: val})} />
                    <SliderControl label="Emoji" leftLabel="None" rightLabel="Heavy" value={sliders.emoji} onChange={(val:number) => setSliders({...sliders, emoji: val})} />
                    <SliderControl label="Length" leftLabel="Short" rightLabel="Long" value={sliders.length} onChange={(val:number) => setSliders({...sliders, length: val})} />
                </div>

                <div className="grid grid-cols-2 gap-4">
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
                    <div className="col-span-2">
                        <label className="text-xs text-gray-400 block mb-1.5">Target Audience</label>
                        <input type="text" value={targetAudience} onChange={(e) => setTargetAudience(e.target.value)} className="w-full bg-[#1c1c2e] border border-gray-700 rounded-lg p-2.5 text-sm text-white" />
                    </div>
                    <div className="col-span-2">
                        <label className="text-xs text-gray-400 block mb-1.5">Generated Voice DNA (Editable)</label>
                        <textarea value={voiceDNA} onChange={(e) => setVoiceDNA(e.target.value)} className="w-full bg-[#1c1c2e] border border-gray-700 rounded-lg p-2.5 text-sm text-white h-24" />
                    </div>
                </div>
                </div>
            )}

            {activeTab === 'visuals' && (
                <div className="space-y-6 animate-in fade-in">
                <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-3">Brand Logo</label>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/png, image/jpeg, image/jpg"/>
                    <div className="flex items-center gap-4">
                        <div onClick={triggerFileInput} className="w-24 h-24 bg-[#1c1c2e] border-2 border-dashed border-gray-700 rounded-xl flex flex-col items-center justify-center text-gray-500 hover:border-blue-500 hover:text-blue-500 transition cursor-pointer group overflow-hidden relative">
                            {logoPreview ? <img src={logoPreview} alt="Logo Preview" className="w-full h-full object-contain p-2" /> : <><Upload size={24} className="mb-2" /><span className="text-[10px]">Upload PNG</span></>}
                        </div>
                        <div className="flex-1">
                            <h4 className="text-sm font-bold text-white">Upload PNG (Transparent)</h4>
                            <p className="text-xs text-gray-500 mt-1">Max 2MB. The AI will try to place this logo on generated images.</p>
                            <button onClick={triggerFileInput} className="mt-3 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-xs text-white rounded border border-gray-600 transition">Choose File</button>
                        </div>
                    </div>
                </div>
                <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-3">Brand Colors</label>
                    <div className="flex flex-wrap gap-3 mb-4">
                            {brandColors.map((color, idx) => (
                                <div key={idx} className="group relative w-16 h-16 rounded-xl shadow-lg border border-gray-700" style={{ backgroundColor: color }}>
                                    <button onClick={() => removeColor(color)} className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition shadow-sm z-10"><X size={10} /></button>
                                    <div className="absolute inset-0 flex items-end justify-center pb-1"><span className="text-[9px] font-bold px-1 py-0.5 bg-black/50 rounded text-white">{color}</span></div>
                                </div>
                            ))}
                    </div>
                    <div className="flex gap-2">
                        <input type="text" value={hexInput} onChange={(e) => setHexInput(e.target.value)} className="bg-[#1c1c2e] border border-gray-700 text-white rounded-lg px-3 py-2 text-sm w-32 focus:border-blue-500 outline-none" placeholder="#124444"/>
                        <button onClick={handleAddColor} className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm transition"><Plus size={16} /> Add Color</button>
                    </div>
                </div>
                </div>
            )}

            {activeTab === 'rules' && (
                <div className="space-y-6 animate-in fade-in">
                    <div className="bg-red-900/10 border border-red-900/30 p-4 rounded-xl">
                    <label className="text-xs font-bold text-red-400 uppercase tracking-wider block mb-2 flex items-center gap-2"><Ban size={14} /> Anti-Robot Filter (Banned Words)</label>
                    <textarea value={bannedWords} onChange={(e) => setBannedWords(e.target.value)} className="w-full bg-[#0f1115] border border-red-900/30 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-red-500 transition resize-none h-20" placeholder="e.g. delve, landscape, testament, tapestry, unlock" />
                    </div>
                    <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2 flex items-center gap-2"><Hash size={14}/> Mandatory Hashtags</label>
                    <input type="text" value={hashtags} onChange={(e) => setHashtags(e.target.value)} className="w-full bg-[#161b22] border border-gray-700 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-blue-500" />
                    </div>
                    <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2 flex items-center gap-2"><MessageSquare size={14}/> Call to Action Style</label>
                    <select value={ctaStyle} onChange={(e) => setCtaStyle(e.target.value)} className="w-full bg-[#161b22] border border-gray-700 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-blue-500">
                        <option>Ask a question to provoke comments</option>
                        <option>Direct Link in Bio / Comments</option>
                        <option>Soft Sell ("DM me for info")</option>
                        <option>No CTA (Pure Value)</option>
                    </select>
                    </div>
                </div>
            )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-800 flex justify-end gap-3 bg-[#0f1115]">
                <button onClick={onClose} disabled={isSaving} className="px-5 py-2.5 text-sm text-gray-400 hover:text-white font-medium transition">Cancel</button>
                <button onClick={handleSave} disabled={isSaving} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-lg shadow-lg flex items-center gap-2 transition">
                    {isSaving ? <RefreshCw className="animate-spin" size={16}/> : <Check size={16} />} {isSaving ? 'Saving...' : 'Save Profile'}
                </button>
            </div>

        </div>
      </div>
    </div>
  );
}

function TabButton({ label, isActive, onClick }: { label: string, isActive: boolean, onClick: () => void }) {
    return <button onClick={onClick} className={`flex-1 py-4 text-sm font-medium border-b-2 transition duration-200 ${isActive ? 'border-blue-500 text-white' : 'border-transparent text-gray-500 hover:text-gray-300'}`}>{label}</button>
}

function SliderControl({ label, leftLabel, rightLabel, value, onChange }: any) {
    return (
        <div>
            <div className="flex justify-between mb-2"><span className="text-sm font-medium text-white">{label}</span><span className="text-xs font-bold text-blue-400">{value}%</span></div>
            <input type="range" min="0" max="100" value={value} onChange={(e) => onChange(parseInt(e.target.value))} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600" />
            <div className="flex justify-between mt-1.5"><span className="text-[10px] text-gray-500 uppercase">{leftLabel}</span><span className="text-[10px] text-gray-500 uppercase">{rightLabel}</span></div>
        </div>
    )
}
