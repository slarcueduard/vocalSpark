import React, { useState } from 'react';
import { X, Briefcase, Mic, Target, Globe, Save, Info, Sparkles } from 'lucide-react';
import { BrandProfile } from '../types';

interface Props {
  currentProfile: BrandProfile | null;
  onSave: (profile: BrandProfile) => Promise<void>; // Acum e Promise
  onClose: () => void;
}

const LANGUAGES = [
  'English', 'Romanian', 'Spanish', 'French', 'German', 'Italian', 'Portuguese', 'Russian', 'Japanese'
];

export function BrandProfileModal({ currentProfile, onSave, onClose }: Props) {
  const [formData, setFormData] = useState<BrandProfile>(currentProfile || {
    industry: '',
    description: '',
    voiceDNA: '',
    language: 'English',
    websiteUrl: '',
    socialUrl: ''
  });
  
  const [isSaving, setIsSaving] = useState(false); // State pt loading la salvare

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
      <div className="w-full max-w-2xl bg-[#0f1115] border border-gray-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header cu mesaj Onboarding */}
        <div className="p-6 border-b border-gray-800 bg-[#161b22]">
          <div className="flex justify-between items-start">
            <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Briefcase className="text-blue-500" /> Brand DNA
                </h2>
                <p className="text-xs text-gray-400 mt-1">This is the "Brain" of your AI. The more details, the better the results.</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={20} /></button>
          </div>
          
          {/* Info Box */}
          {!currentProfile && (
              <div className="mt-4 bg-blue-900/20 border border-blue-800/50 p-3 rounded-lg flex gap-3 items-start">
                  <Sparkles className="text-blue-400 shrink-0 mt-0.5" size={16} />
                  <p className="text-xs text-blue-200">
                      <strong>Welcome!</strong> Please fill this out first. Our AI uses this information to write posts that sound exactly like you and target your specific audience.
                  </p>
              </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 custom-scrollbar">
          
          {/* Language */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-300 mb-2">
              <Globe size={16} /> Content Language
            </label>
            <select 
                className="w-full bg-[#1c1c2e] border border-gray-700 rounded-xl p-3 text-white focus:border-blue-500 outline-none appearance-none"
                value={formData.language}
                onChange={e => setFormData({...formData, language: e.target.value})}
            >
                {LANGUAGES.map(lang => (
                    <option key={lang} value={lang}>{lang}</option>
                ))}
            </select>
            <p className="text-[10px] text-gray-500 mt-1">All posts will be generated in this language.</p>
          </div>

          {/* Industry */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-300 mb-2">
              <Briefcase size={16} /> Industry / Niche
            </label>
            <input 
              type="text" required
              className="w-full bg-[#1c1c2e] border border-gray-700 rounded-xl p-3 text-white focus:border-blue-500 outline-none"
              placeholder="e.g. Real Estate, Crypto Investments, Beauty Salon"
              value={formData.industry}
              onChange={e => setFormData({...formData, industry: e.target.value})}
            />
          </div>

          {/* Voice DNA */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-300 mb-2">
              <Mic size={16} /> Voice DNA (Tone & Style)
            </label>
            <textarea 
              required
              className="w-full h-24 bg-[#1c1c2e] border border-gray-700 rounded-xl p-3 text-white focus:border-blue-500 outline-none resize-none"
              placeholder="How do you talk? (e.g. 'Short & punchy like Harvey Specter', 'Friendly with lots of emojis', 'Professional & Analytical')"
              value={formData.voiceDNA}
              onChange={e => setFormData({...formData, voiceDNA: e.target.value})}
            />
            <p className="text-[10px] text-gray-500 mt-1">Tip: Mention a famous person or style you admire.</p>
          </div>

          {/* Audience */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-300 mb-2">
              <Target size={16} /> Target Audience
            </label>
            <textarea 
              required
              className="w-full h-20 bg-[#1c1c2e] border border-gray-700 rounded-xl p-3 text-white focus:border-blue-500 outline-none resize-none"
              placeholder="Who are you talking to? (e.g. First-time home buyers in London, Crypto beginners)"
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
            />
          </div>

        </form>

        <div className="p-4 border-t border-gray-800 bg-[#161b22] flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2 text-gray-400 hover:text-white text-sm font-medium">Cancel</button>
          <button 
            onClick={handleSubmit} 
            disabled={isSaving}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold shadow-lg flex items-center gap-2 disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : <><Save size={16} /> Save Profile</>}
          </button>
        </div>

      </div>
    </div>
  );
}
