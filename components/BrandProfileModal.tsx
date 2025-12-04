import React, { useState } from 'react';
import { 
  X, Sparkles, Link as LinkIcon, 
  Upload, Hash, Palette, Check, RefreshCw 
} from 'lucide-react';

interface BrandProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Tab = 'core' | 'visuals' | 'strategy';

// AM REDENUMIT FUNCTIA AICI DIN BrandIdentityModal IN BrandProfileModal
export function BrandProfileModal({ isOpen, onClose }: BrandProfileModalProps) {
  const [activeTab, setActiveTab] = useState<Tab>('core');
  
  // State pentru Magic Analyzer
  const [urlInput, setUrlInput] = useState('');
  const [textInput, setTextInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // State pentru Sliders (Voice DNA)
  const [sliders, setSliders] = useState({
    tone: 50,   // 0 = Casual, 100 = Formal
    emoji: 50,  // 0 = Minimal, 100 = Heavy
    length: 50  // 0 = Short/Punchy, 100 = Storytelling
  });

  // State pentru Visuals & Strategy (Mock Data)
  const [brandColors, setBrandColors] = useState(['#3B82F6', '#8B5CF6', '#FFFFFF']);
  const [hashtags, setHashtags] = useState('#MyBrand #MyNiche');

  if (!isOpen) return null;

  // Simulare Analiză AI (Magic Brand Analyzer)
  const handleAnalyze = () => {
    setIsAnalyzing(true);
    
    // Simulam un request la backend care dureaza 1.5 secunde
    setTimeout(() => {
      setIsAnalyzing(false);
      
      // LOGICA MOCK: Setam sliderele bazat pe ce a "gasit" AI-ul
      setSliders({
        tone: 75,   // A detectat un ton destul de formal
        emoji: 30,  // Foloseste putine emoji-uri
        length: 65  // Scrie postari medii spre lungi
      });

      // Feedback vizual ca a citit ceva
      if (!textInput && urlInput) {
        setTextInput("Analysis complete based on content from: " + urlInput);
      }
    }, 1500);
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
          
          {/* === TAB 1: CORE IDENTITY (UPDATED WITH WIZARD) === */}
          {activeTab === 'core' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              
              {/* MAGIC ANALYZER SECTION */}
              <div className="bg-[#161b22] border border-blue-900/30 rounded-xl p-5 relative overflow-hidden">
                 <div className="absolute top-0 left-0 w-1 h-full bg-blue-600"></div>
                 <div className="mb-4">
                    <h3 className="text-blue-400 font-bold text-sm flex items-center gap-2">
                        <Sparkles size={14} /> MAGIC BRAND ANALYZER
                    </h3>
                    <p className="text-xs text-gray-400 mt-1">
                        Paste your URL or sample text. The AI will extract your Tone, Audience, and Style automatically.
                    </p>
                 </div>

                 {/* INPUTS: URL + TEXT */}
                 <div className="space-y-3">
                    {/* URL Input */}
                    <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                            <LinkIcon size={14} />
                        </div>
                        <input 
                            type="text" 
                            placeholder="Paste your LinkedIn, Blog, or Website URL..."
                            className="w-full bg-[#0f1115] border border-gray-700 rounded-lg py-2.5 pl-9 pr-4 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition"
                            value={urlInput}
                            onChange={(e) => setUrlInput(e.target.value)}
                        />
                    </div>

                    <div className="text-center text-[10px] text-gray-600 font-bold uppercase tracking-wider">OR</div>

                    {/* Text Area */}
                    <textarea 
                        placeholder="Paste bio, best performing captions, or mission statement here..."
                        className="w-full bg-[#0f1115] border border-gray-700 rounded-lg p-3 text-sm text-white placeholder-gray-500 min-h-[80px] focus:outline-none focus:border-blue-500 transition resize-none"
                        value={textInput}
                        onChange={(e) => setTextInput(e.target.value)}
                    />
                 </div>

                 {/* ANALYZE BUTTON */}
                 <button 
                    onClick={handleAnalyze}
                    disabled={isAnalyzing}
                    className="w-full mt-4 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 rounded-lg transition shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2"
                 >
                    {isAnalyzing ? (
                        <>
                           <RefreshCw size={16} className="animate-spin" /> Analyzing DNA...
                        </>
                    ) : (
                        <>
                           <Sparkles size={16} /> Analyze & Auto-Fill Everything
                        </>
                    )}
                 </button>
              </div>

              {/* VOICE DNA SLIDERS (NEW FEATURE) */}
              <div>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Voice DNA Profile</h3>
                  
                  <div className="bg-[#161b22] border border-gray-800 rounded-xl p-6 space-y-6">
                      
                      {/* Slider 1: Tone */}
                      <SliderControl 
                        label="Tone" 
                        leftLabel="Casual / Witty" 
                        rightLabel="Formal / Professional" 
                        value={sliders.tone}
                        onChange={(val: number) => setSliders({...sliders, tone: val})}
                      />

                      {/* Slider 2: Emojis */}
                      <SliderControl 
                        label="Emoji Usage" 
                        leftLabel="Minimal 📄" 
                        rightLabel="Heavy 🚀🔥" 
                        value={sliders.emoji}
                        onChange={(val: number) => setSliders({...sliders, emoji: val})}
                      />

                      {/* Slider 3: Length */}
                      <SliderControl 
                        label="Content Structure" 
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
                      <select className="w-full bg-[#1c1c2e] border border-gray-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-blue-500">
                          <option>English (US)</option>
                          <option>Romanian</option>
                          <option>Spanish</option>
                      </select>
                  </div>
                  <div>
                      <label className="text-xs text-gray-400 block mb-1.5">Niche / Industry</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Crypto, Fashion"
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
                                {/* Edit overlay */}
                                <div className="absolute inset-0 bg-black/40 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                                    <Palette size={16} className="text-white" />
                                </div>
                            </div>
                        ))}
                        
                        {/* Add Color Button */}
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
          <button onClick={onClose} className="px-5 py-2.5 text-sm text-gray-400 hover:text-white font-medium transition">
            Cancel
          </button>
          <button onClick={onClose} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-lg shadow-lg shadow-blue-900/20 flex items-center gap-2 transition">
            <Check size={16} /> Save Brand
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
