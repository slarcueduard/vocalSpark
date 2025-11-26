import React, { useState, useRef } from 'react';
import { 
  X, Briefcase, Mic, Target, Globe, Save, 
  Hash, Palette, Image as ImageIcon, Wand2, Upload, Trash 
} from 'lucide-react';
import { BrandProfile } from '../types';
import { analyzeBrandStyleFromPosts } from '../services/geminiService';

interface Props {
  currentProfile: BrandProfile | null;
  onSave: (profile: BrandProfile) => Promise<void>;
  onClose: () => void;
}

const LANGUAGES = ['English', 'Romanian', 'Spanish', 'French', 'German', 'Italian'];

export function BrandProfileModal({ currentProfile, onSave, onClose }: Props) {
  const [activeTab, setActiveTab] = useState<'identity' | 'visuals' | 'strategy'>('identity');
  const [isSaving, setIsSaving] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState<BrandProfile>(currentProfile || {
    industry: '',
    description: '',
    voiceDNA: '',
    language: 'English',
    examplePosts: '',
    fixedHashtags: '',
    brandColors: ['#3B82F6', '#8B5CF6', '#FFFFFF'], // Default Blue/Purple/White
    logoUrl: null
  });

  const logoInputRef = useRef<HTMLInputElement>(null);

  // --- LOGICĂ ANALIZĂ STIL ---
  const handleAnalyzeStyle = async () => {
    if (!formData.examplePosts.trim()) {
        alert("Please paste some example posts first!");
        return;
    }
    setIsAnalyzing(true);
    try {
        const analysis = await analyzeBrandStyleFromPosts(formData.examplePosts);
        setFormData(prev => ({ ...prev, voiceDNA: analysis }));
    } catch (e) {
        console.error(e);
    } finally {
        setIsAnalyzing(false);
    }
  };

  // --- LOGICĂ LOGO ---
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
            setFormData(prev => ({ ...prev, logoUrl: reader.result as string }));
        };
        reader.readAsDataURL(file);
    }
  };

  // --- SAVE ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
        await onSave(formData);
        onClose();
    } catch (error) {
        console.error("Failed to save:", error);
    } finally {
        setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-3xl bg-[#0f1115] border border-gray-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-800 bg-[#161b22] flex justify-between items-start">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Briefcase className="text-blue-500" /> Brand Identity
            </h2>
            <p className="text-xs text-gray-400 mt-1">Customize your AI to sound and look exactly like you.</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={20} /></button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-800 bg-[#0f1115]">
            <button onClick={() => setActiveTab('identity')} className={`flex-1 py-3 text-sm font-medium border-b-2 transition ${activeTab === 'identity' ? 'border-blue-500 text-white' : 'border-transparent text-gray-500 hover:text-gray-300'}`}>Core Identity</button>
            <button onClick={() => setActiveTab('visuals')} className={`flex-1 py-3 text-sm font-medium border-b-2 transition ${activeTab === 'visuals' ? 'border-purple-500 text-white' : 'border-transparent text-gray-500 hover:text-gray-300'}`}>Visuals & Logo</button>
            <button onClick={() => setActiveTab('strategy')} className={`flex-1 py-3 text-sm font-medium border-b-2 transition ${activeTab === 'strategy' ? 'border-green-500 text-white' : 'border-transparent text-gray-500 hover:text-gray-300'}`}>Strategy & Tags</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto custom-scrollbar flex-1">
          
          {/* --- TAB 1: IDENTITY --- */}
          {activeTab === 'identity' && (
            <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Language</label>
                        <select 
                            className="w-full bg-[#1c1c2e] border border-gray-700 rounded-xl p-3 text-white focus:border-blue-500 outline-none"
                            value={formData.language}
                            onChange={e => setFormData({...formData, language: e.target.value})}
                        >
                            {LANGUAGES.map(lang => <option key={lang} value={lang}>{lang}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Niche / Industry</label>
                        <input 
                            type="text" 
                            className="w-full bg-[#1c1c2e] border border-gray-700 rounded-xl p-3 text-white focus:border-blue-500 outline-none"
                            value={formData.industry}
                            onChange={e => setFormData({...formData, industry: e.target.value})}
                            placeholder="e.g. Crypto, Fashion"
                        />
                    </div>
                </div>

                <div>
                    <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Target Audience</label>
                    <textarea 
                        className="w-full h-20 bg-[#1c1c2e] border border-gray-700 rounded-xl p-3 text-white focus:border-blue-500 outline-none resize-none text-sm"
                        placeholder="Who are you talking to?"
                        value={formData.description}
                        onChange={e => setFormData({...formData, description: e.target.value})}
                    />
                </div>

                <div className="bg-blue-900/10 border border-blue-800/30 p-4 rounded-xl">
                    <label className="text-xs font-bold text-blue-400 uppercase mb-2 flex items-center gap-2">
                        <Wand2 size={14} /> Magic Style Analyzer
                    </label>
                    <p className="text-[10px] text-gray-400 mb-3">Paste 2-3 of your best previous posts here. The AI will analyze them to learn your style.</p>
                    
                    <textarea 
                        className="w-full h-24 bg-[#0f1115] border border-gray-700 rounded-xl p-3 text-white focus:border-blue-500 outline-none resize-none text-sm mb-3"
                        placeholder="Paste your content here..."
                        value={formData.examplePosts}
                        onChange={e => setFormData({...formData, examplePosts: e.target.value})}
                    />
                    
                    <button 
                        type="button"
                        onClick={handleAnalyzeStyle}
                        disabled={isAnalyzing || !formData.examplePosts}
                        className="w-full py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 text-xs font-bold rounded-lg transition disabled:opacity-50"
                    >
                        {isAnalyzing ? 'Analyzing DNA...' : '✨ Analyze & Extract Voice DNA'}
                    </button>
                </div>

                <div>
                    <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Voice DNA (Tone & Style)</label>
                    <textarea 
                        className="w-full h-20 bg-[#1c1c2e] border border-gray-700 rounded-xl p-3 text-white focus:border-blue-500 outline-none resize-none text-sm"
                        placeholder="This will be auto-filled by the Magic Analyzer, or type manually."
                        value={formData.voiceDNA}
                        onChange={e => setFormData({...formData, voiceDNA: e.target.value})}
                    />
                </div>
            </div>
          )}

          {/* --- TAB 2: VISUALS --- */}
          {activeTab === 'visuals' && (
            <div className="space-y-6">
                
                {/* Logo Upload */}
                <div>
                    <label className="text-xs font-bold text-gray-500 uppercase mb-3 block">Brand Logo</label>
                    <div className="flex items-center gap-4">
                        <div 
                            onClick={() => logoInputRef.current?.click()}
                            className="w-24 h-24 rounded-xl border-2 border-dashed border-gray-700 bg-[#1c1c2e] flex items-center justify-center cursor-pointer hover:border-gray-500 transition relative overflow-hidden group"
                        >
                            {formData.logoUrl ? (
                                <>
                                    <img src={formData.logoUrl} alt="Logo" className="w-full h-full object-contain p-2" />
                                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                                        <Upload size={16} className="text-white" />
                                    </div>
                                </>
                            ) : (
                                <ImageIcon className="text-gray-500" />
                            )}
                        </div>
                        <div className="flex-1">
                            <p className="text-sm text-white font-medium">Upload PNG (Transparent)</p>
                            <p className="text-xs text-gray-500 mb-3">The AI will try to place this logo on generated images.</p>
                            <div className="flex gap-2">
                                <button type="button" onClick={() => logoInputRef.current?.click()} className="px-3 py-1.5 bg-gray-800 text-white text-xs rounded hover:bg-gray-700">Upload</button>
                                {formData.logoUrl && (
                                    <button type="button" onClick={() => setFormData({...formData, logoUrl: null})} className="px-3 py-1.5 bg-red-900/30 text-red-400 text-xs rounded hover:bg-red-900/50">Remove</button>
                                )}
                            </div>
                            <input type="file" ref={logoInputRef} onChange={handleLogoUpload} accept="image/png,image/jpeg" hidden />
                        </div>
                    </div>
                </div>

                {/* Color Palette */}
                <div>
                    <label className="text-xs font-bold text-gray-500 uppercase mb-3 block">Brand Colors</label>
                    <div className="flex gap-4">
                        {formData.brandColors.map((color, idx) => (
                            <div key={idx} className="flex flex-col gap-2">
                                <div className="w-16 h-16 rounded-xl border border-gray-700 overflow-hidden relative">
                                    <input 
                                        type="color" 
                                        value={color}
                                        onChange={(e) => {
                                            const newColors = [...formData.brandColors];
                                            newColors[idx] = e.target.value;
                                            setFormData({...formData, brandColors: newColors});
                                        }}
                                        className="absolute -top-2 -left-2 w-24 h-24 p-0 border-0 cursor-pointer"
                                    />
                                </div>
                                <span className="text-[10px] text-gray-400 font-mono text-center">{color}</span>
                            </div>
                        ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-3">AI images will prefer these colors in lighting and background.</p>
                </div>
            </div>
          )}

          {/* --- TAB 3: STRATEGY --- */}
          {activeTab === 'strategy' && (
            <div className="space-y-6">
                <div>
                    <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Fixed Hashtags</label>
                    <input 
                        type="text" 
                        className="w-full bg-[#1c1c2e] border border-gray-700 rounded-xl p-3 text-white focus:border-blue-500 outline-none"
                        value={formData.fixedHashtags}
                        onChange={e => setFormData({...formData, fixedHashtags: e.target.value})}
                        placeholder="#MyBrand #MyNiche"
                    />
                    <p className="text-[10px] text-gray-500 mt-1">These will be added to EVERY post.</p>
                </div>

                <div className="p-4 bg-green-900/10 border border-green-800/30 rounded-xl">
                    <h4 className="text-sm font-bold text-green-400 mb-1">Pro Tip</h4>
                    <p className="text-xs text-gray-400">
                        AI will automatically generate 3-5 additional <strong>dynamic hashtags</strong> based on the specific topic of each post, alongside your fixed ones.
                    </p>
                </div>
            </div>
          )}

        </form>

        <div className="p-4 border-t border-gray-800 bg-[#161b22] flex justify-between items-center">
          <p className="text-xs text-gray-500 hidden sm:block">Changes apply to future posts only.</p>
          <div className="flex gap-3 w-full sm:w-auto">
            <button type="button" onClick={onClose} className="flex-1 sm:flex-none px-4 py-2 text-gray-400 hover:text-white text-sm font-medium">Cancel</button>
            <button 
                onClick={handleSubmit} 
                disabled={isSaving}
                className="flex-1 sm:flex-none px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
            >
                {isSaving ? 'Saving...' : <><Save size={16} /> Save Brand</>}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
