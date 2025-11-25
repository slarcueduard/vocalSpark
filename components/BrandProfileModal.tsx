import React, { useState } from 'react';
import { X, Briefcase, Mic, Target, Globe, Save } from 'lucide-react';
import { BrandProfile } from '../types';

interface Props {
  currentProfile: BrandProfile | null;
  onSave: (profile: BrandProfile) => void;
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
    language: 'English', // Default
    websiteUrl: '',
    socialUrl: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Saving Profile:", formData); // Debug
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-2xl bg-[#0f1115] border border-gray-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-[#161b22]">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Briefcase className="text-blue-500" /> Brand Identity
            </h2>
            <p className="text-xs text-gray-400 mt-1">Teach the AI about your business.</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 custom-scrollbar">
          
          {/* Language Selection */}
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
          </div>

          {/* Industry */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-300 mb-2">
              <Briefcase size={16} /> Industry / Niche
            </label>
            <input 
              type="text" required
              className="w-full bg-[#1c1c2e] border border-gray-700 rounded-xl p-3 text-white focus:border-blue-500 outline-none"
              placeholder="e.g. Sustainable Fashion, Crypto, Coffee Shop"
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
              placeholder="How do you talk? (e.g. Professional but friendly, lots of emojis, short sentences...)"
              value={formData.voiceDNA}
              onChange={e => setFormData({...formData, voiceDNA: e.target.value})}
            />
          </div>

          {/* Audience */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-300 mb-2">
              <Target size={16} /> Target Audience
            </label>
            <textarea 
              required
              className="w-full h-20 bg-[#1c1c2e] border border-gray-700 rounded-xl p-3 text-white focus:border-blue-500 outline-none resize-none"
              placeholder="Who are you talking to? (e.g. Busy moms, Tech enthusiasts)"
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
            />
          </div>

        </form>

        <div className="p-4 border-t border-gray-800 bg-[#161b22] flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2 text-gray-400 hover:text-white text-sm font-medium">Cancel</button>
          <button onClick={handleSubmit} className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold shadow-lg flex items-center gap-2">
            <Save size={16} /> Save Profile
          </button>
        </div>

      </div>
    </div>
  );
}
