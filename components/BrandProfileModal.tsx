import React, { useState } from 'react';
import { 
  X, Sparkles, Link as LinkIcon, 
  Upload, Hash, Palette, Check, RefreshCw, 
  User, UserCheck, Copy
} from 'lucide-react';
import { BrandProfile } from '../types';
import { analyzeBrandVoice } from '../services/geminiService';

interface BrandProfileModalProps {
  currentProfile: BrandProfile | null;
  onSave: (profile: BrandProfile) => Promise<void>;
  onClose: () => void;
}

type Tab = 'core' | 'visuals' | 'strategy';
type AnalysisMode = 'personal' | 'influencer';

export function BrandProfileModal({ currentProfile, onSave, onClose }: BrandProfileModalProps) {
  const [activeTab, setActiveTab] = useState<Tab>('core');
  const [isSaving, setIsSaving] = useState(false);
  
  // State pentru Magic Analyzer
  const [analysisMode, setAnalysisMode] = useState<AnalysisMode>('personal');
  const [urlInput, setUrlInput] = useState('');
  const [textInput, setTextInput] = useState(''); // Aici userul da paste la postarile influencerului
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // -- STATE-URILE BRANDULUI --
  const [voiceDNA, setVoiceDNA] = useState(currentProfile?.voiceDNA || '');
  const [industry, setIndustry] = useState(currentProfile?.industry || '');
  const [language, setLanguage] = useState(currentProfile?.language || 'English');
  const [targetAudience, setTargetAudience] = useState(currentProfile?.targetAudience || '');
  
  // Mock Visuals & Strategy
  const [brandColors, setBrandColors] = useState(['#3B82F6', '#8B5CF6', '#FFFFFF']);
  const [hashtags, setHashtags] = useState('#MyBrand #MyNiche');

  // Sliders State
  const [sliders, setSliders] = useState({
    tone: 50,
    emoji: 50,
    length: 50
  });

  // --- LOGICA DE ANALIZA ---
  const handleAnalyze = async () => {
    // Pentru testul actual, ne bazam pe TEXT input (copy-paste)
    // URL-ul e doar vizual momentan, pana avem backend
    const contentToAnalyze = textInput || urlInput;

    if (!contentToAnalyze || contentToAnalyze.length < 10) {
        alert("Please paste some posts (text) from the influencer/brand you want to analyze.");
        return;
    }

    setIsAnalyzing(true);
    
    try {
        // Apelam serviciul Gemini cu modul selectat
        const analysis = await analyzeBrandVoice(contentToAnalyze, analysisMode);
        
        // Populăm UI-ul cu datele reale de la AI
        setSliders({
            tone: analysis.tone_score,
            emoji: analysis.emoji_score,
            length: analysis.length_score
        });

        setIndustry(analysis.niche);
        setTargetAudience(analysis.audience);
        
        // Construim descrierea Voice DNA
        const prefix = analysisMode === 'influencer' ? "Style Cloned: " : "Brand Voice: ";
        setVoiceDNA(`${prefix}${analysis.voice_description}`);

    } catch (error) {
        console.error("Analysis failed", error);
        alert("Could not analyze text. Please try pasting more content.");
    } finally {
        setIsAnalyzing(false);
    }
  };

  const handleSave = async () => {
      setIsSaving(true);
      const updatedProfile: BrandProfile = {
          name: currentProfile?.name || 'My Brand',
          industry,
          targetAudience,
          voiceDNA,
          language
      };

      try {
          await onSave(updatedProfile);
          onClose();
      } catch (error) {
          console.error("Failed to save brand:", error);
      } finally {
          setIsSaving(false);
      }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#0f1115] w-full max-w-2xl rounded-2xl border border-gray-800 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* --- HEADER --- */}
        <div className="p-6 border-b border-gray-800 flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2 mb-1">
                <div className="bg-blue-600/20 p-1.5 rounded-lg">
                    <Sparkles size={18} className="text-blue-500" />
                </div>
                <h2 className="text-xl font-bold text-white">Brand Identity</h2>
            </div>
            <p className="text-sm text-gray-400">Customize your AI to sound and look exactly like you.</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition">
            <X size={20} />
          </button>
        </div>

        {/* --- TABS --- */}
        <div className="flex border-b border-gray-800">
          <TabButton label="Core Identity" isActive={activeTab === 'core'} onClick={() => setActiveTab('core')} />
          <TabButton label="Visuals & Logo" isActive={activeTab === 'visuals'} onClick={() => setActiveTab('visuals')} />
          <TabButton label="Strategy & Tags" isActive={activeTab === 'strategy'} onClick={() => setActiveTab('strategy')} />
        </div>

        {/* --- CONTENT SCROLLABLE --- */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          
          {/* === TAB 1: CORE IDENTITY === */}
          {activeTab === 'core' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              
              {/* MAGIC ANALYZER SECTION */}
              <div className={`border rounded-xl p-5 relative overflow-hidden transition-colors duration-300 ${analysisMode === 'influencer' ? 'bg-[#1a1625] border-purple-500/30' : 'bg-[#161b22] border-blue-900/30'}`}>
                 <div className={`absolute top-0 left-0 w-1 h-full ${analysisMode === 'influencer' ? 'bg-purple-600' : 'bg-blue-600'}`}></div>
                 
                 {/* MODE TOGGLE */}
                 <div className="flex bg-black/20 p-1 rounded-lg w-max mb-4">
                    <button 
                        onClick={() => setAnalysisMode('personal')}
                        className={`px-3 py-1.5 rounded text-xs font-bold flex items-center gap-2 transition ${analysisMode === 'personal' ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}
                    >
                        <User size={12} /> Analyze Me
                    </button>
                    <button 
                        onClick={() => setAnalysisMode('influencer')}
                        className={`px-3 py-1.5 rounded text-xs font-bold flex items-center gap-2 transition ${analysisMode === 'influencer' ? 'bg-purple-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}
                    >
                        <UserCheck size={12} /> Clone Influencer
                    </button>
                 </div>

                 <div className="mb-4">
                    <h3 className={`font-bold text-sm flex items-center gap-2 ${analysisMode === 'influencer' ? 'text-purple-400' : 'text-blue-400'}`}>
                        <Sparkles size={14} /> {analysisMode === 'influencer' ? 'INFLUENCER CLONING TOOL' : 'MAGIC BRAND ANALYZER'}
                    </h3>
                    <p className="text-xs text-gray-400 mt-1">
                        {analysisMode === 'influencer' 
                            ? "Paste posts from LinkedIn/Twitter/Instagram. We'll extract their hook style, sentence length, and tone."
                            : "Paste your website text or bio. We'll extract your natural tone and audience."
                        }
                    </p>
                 </div>

                 {/* INPUTS */}
                 <div className="space-y-3">
                    <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                            <LinkIcon size={14} />
                        </div>
                        <input 
                            type="text" 
                            placeholder={analysisMode === 'influencer' ? "Paste Influencer's Social URL (Optional)" : "Paste your Website URL..."}
                            className="w-full bg-[#0f1115] border border-gray-700 rounded-lg py-2.5 pl-9 pr-4 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition"
                            value={urlInput}
                            onChange={(e) => setUrlInput(e.target.value)}
                        />
                    </div>

                    <div className="text-center text-[10px] text-gray-600 font-bold uppercase tracking-wider">AND / OR</div>

                    <textarea 
                        placeholder={analysisMode === 'influencer' 
                            ? "Paste 1-3 examples of their best posts here. The more text, the better the clone." 
                            : "Paste your bio, mission statement, or past captions..."
                        }
                        className="w-full bg-[#0f1115] border border-gray-700 rounded-lg p-3 text-sm text-white placeholder-gray-500 min-h-[100px] focus:outline-none focus:border-blue-500 transition resize-none font-mono"
                        value={textInput}
                        onChange={(e) => setTextInput(e.target.value)}
                    />
                 </div>

                 {/* ANALYZE BUTTON */}
                 <button 
                    onClick={handleAnalyze}
                    disabled={isAnalyzing}
                    className={`w-full mt-4 text-white font-bold py-2.5 rounded-lg transition shadow-lg flex items-center justify-center gap-2 ${
                        analysisMode === 'influencer' 
                        ? 'bg-purple-600 hover:bg-purple-500 shadow-purple-900/20' 
                        : 'bg-blue-600 hover:bg-blue-500 shadow-blue-900/20'
                    }`}
                 >
                    {isAnalyzing ? (
                        <>
                           <RefreshCw size={16} className="animate-spin" /> {analysisMode === 'influencer' ? 'Extracting Style...' : 'Analyzing DNA...'}
                        </>
                    ) : (
                        <>
                           {analysisMode === 'influencer' ? <Copy size={16} /> : <Sparkles size={16} />} 
                           {analysisMode === 'influencer' ? 'Extract & Clone Style' : 'Analyze & Auto-Fill'}
                        </>
                    )}
                 </button>
              </div>

              {/* VOICE DNA VISUALIZER */}
              <div>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">
                      {analysisMode === 'influencer' ? 'Extracted Style Profile' : 'Voice DNA Profile'}
                  </h3>
                  
                  <div className="bg-[#161b22] border border-gray-800 rounded-xl p-6 space-y-6">
                      <SliderControl 
                        label="Tone" 
                        leftLabel="Casual / Witty" 
                        rightLabel="Formal / Professional" 
                        value={sliders.tone}
                        onChange={(val: number) => setSliders({...sliders, tone: val})}
                      />
                      <SliderControl 
                        label="Emoji Usage" 
                        leftLabel="Minimal 📄" 
                        rightLabel="Heavy 🚀🔥" 
                        value={sliders.emoji}
                        onChange={(val: number) => setSliders({...sliders, emoji: val})}
                      />
                      <SliderControl 
                        label="Structure" 
                        leftLabel="Short & Punchy" 
                        rightLabel="Long Storytelling" 
                        value={sliders.length}
                        onChange={(val: number) => setSliders({...sliders, length: val})}
                      />
                  </div>
              </div>

              {/* MANUAL OVERRIDES */}
              <div className="grid grid-cols-2 gap-4">
                  <div>
                      <label className="text-xs text-gray-400 block mb-1.5">Language</label>
                      <select 
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                        className="w-full bg-[#1c1c2e] border border-gray-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                      >
                          <option value="English">English (US)</option>
                          <option value="Romanian">Romanian</option>
                          <option value="Spanish">Spanish</option>
                          <option value="French">French</option>
                      </select>
                  </div>
                  <div>
                      <label className="text-xs text-gray-400 block mb-1.5">Niche / Industry</label>
                      <input 
                        type="text" 
                        value={industry}
                        onChange={(e) => setIndustry(e.target.value)}
                        className="w-full bg-[#1c1c2e] border border-gray-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                      />
                  </div>
                  <div className="col-span-2">
                       <label className="text-xs text-gray-400 block mb-1.5">
                           {analysisMode === 'influencer' ? 'Detected Audience' : 'Target Audience'}
                       </label>
                       <input 
                        type="text"
                        value={targetAudience}
                        onChange={(e) => setTargetAudience(e.target.value)}
                        className="w-full bg-[#1c1c2e] border border-gray-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                       />
                  </div>
              </div>

            </div>
          )}

          {/* === TAB 2: VISUALS === */}
          {activeTab === 'visuals' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
               {/* Brand Logo */}
               <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-3">Brand Logo</label>
                  <div className="flex items-center gap-4">
                      <div className="w-24 h-24 bg-[#1c1c2e] border-2 border-dashed border-gray-700 rounded-xl flex flex-col items-center justify-center text-gray-500 hover:border-blue-500 hover:text-blue-500 transition cursor-pointer group">
                          <Upload size={24} className="mb-2 group-hover:-translate-y-1 transition-transform" />
                          <span className="text-[10px]">Upload PNG</span>
                      </div>
                      <div className="flex-1">
                          <h4 className="text-sm font-bold text-white">Upload PNG (Transparent)</h4>
                          <p className="text-xs text-gray-500 mt-1">The AI will try to place this logo on generated images (Watermark or Corner).</p>
                          <button className="mt-3 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-xs text-white rounded border border-gray-600 transition">
                              Choose File
                          </button>
                      </div>
                  </div>
               </div>

               {/* Brand Colors */}
               <div>
                   <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-3">Brand Colors</label>
                   <div className="flex gap-3">
                        {brandColors.map((color, idx) => (
                            <div key={idx} className="group relative cursor-pointer">
                                <div 
                                    className="w-16 h-16 rounded-xl shadow-lg border border-gray-700"
                                    style={{ backgroundColor: color }}
                                ></div>
                                <div className="mt-1.5 text-center">
                                    <span className="text-[10px] text-gray-400 bg-[#1c1c2e] px-1.5 py-0.5 rounded uppercase">{color}</span>
                                </div>
                                <div className="absolute inset-0 bg-black/40 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                                    <Palette size={16} className="text-white" />
                                </div>
                            </div>
                        ))}
                        <div className="w-16 h-16 rounded-xl border-2 border-dashed border-gray-700 flex items-center justify-center text-gray-500 hover:border-gray-500 hover:text-gray-300 transition cursor-pointer">
                            <span className="text-xl font-light">+</span>
                        </div>
                   </div>
               </div>
            </div>
          )}

          {/* === TAB 3: STRATEGY === */}
          {activeTab === 'strategy' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div>
                   <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-3">Fixed Hashtags</label>
                   <div className="relative">
                        <div className="absolute left-3 top-3 text-gray-500">
                            <Hash size={16} />
                        </div>
                        <input 
                            type="text"
                            value={hashtags}
                            onChange={(e) => setHashtags(e.target.value)}
                            className="w-full bg-[#161b22] border border-gray-700 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-blue-500"
                        />
                   </div>
                   <p className="text-xs text-gray-500 mt-2">These will be added to the end of EVERY post (plus dynamic ones).</p>
                </div>
            </div>
          )}

        </div>

        {/* --- FOOTER --- */}
        <div className="p-6 border-t border-gray-800 flex justify-end gap-3 bg-[#0f1115]">
          <button 
            onClick={onClose} 
            disabled={isSaving}
            className="px-5 py-2.5 text-sm text-gray-400 hover:text-white font-medium transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave} 
            disabled={isSaving}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-lg shadow-lg shadow-blue-900/20 flex items-center gap-2 transition disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isSaving ? <RefreshCw className="animate-spin" size={16}/> : <Check size={16} />} 
            {isSaving ? 'Save Brand' : 'Save Brand'}
          </button>
        </div>

      </div>
    </div>
  );
}

// --- SUB-COMPONENT: TAB BUTTON ---
function TabButton({ label, isActive, onClick }: { label: string, isActive: boolean, onClick: () => void }) {
    return (
        <button 
            onClick={onClick}
            className={`flex-1 py-4 text-sm font-medium border-b-2 transition duration-200 ${
                isActive 
                ? 'border-blue-500 text-white' 
                : 'border-transparent text-gray-500 hover:text-gray-300 hover:border-gray-800'
            }`}
        >
            {label}
        </button>
    )
}

// --- SUB-COMPONENT: SLIDER CONTROL ---
function SliderControl({ label, leftLabel, rightLabel, value, onChange }: any) {
    return (
        <div>
            <div className="flex justify-between mb-2">
                <span className="text-sm font-medium text-white">{label}</span>
                <span className="text-xs font-bold text-blue-400">{value}%</span>
            </div>
            <input 
                type="range" 
                min="0" 
                max="100" 
                value={value}
                onChange={(e) => onChange(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="flex justify-between mt-1.5">
                <span className="text-[10px] text-gray-500 uppercase tracking-wide">{leftLabel}</span>
                <span className="text-[10px] text-gray-500 uppercase tracking-wide">{rightLabel}</span>
            </div>
        </div>
    )
}
