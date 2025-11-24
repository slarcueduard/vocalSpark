import React, { useState } from 'react';
import { XIcon, BriefcaseIcon, SparklesIcon, CheckCircleIcon, Loader } from './Icons';
import { analyzeBrandVoice } from '../services/geminiService';
import { BrandProfile } from '../types';

interface BrandProfileModalProps {
  currentProfile: BrandProfile | null;
  onSave: (profile: BrandProfile) => void;
  onClose: () => void;
}

const INDUSTRIES = [
  'E-commerce', 'SaaS / Tech', 'Health & Wellness', 'Fashion', 
  'Real Estate', 'Food & Beverage', 'Personal Brand', 'Other'
];

export const BrandProfileModal: React.FC<BrandProfileModalProps> = ({ currentProfile, onSave, onClose }) => {
  const [industry, setIndustry] = useState(currentProfile?.industry || 'E-commerce');
  const [customIndustry, setCustomIndustry] = useState(currentProfile?.customIndustry || '');
  const [description, setDescription] = useState(currentProfile?.description || '');
  const [samplePost, setSamplePost] = useState('');
  const [voiceDNA, setVoiceDNA] = useState(currentProfile?.voiceDNA || '');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleAnalyze = async () => {
    if (!samplePost.trim()) return;
    setIsAnalyzing(true);
    try {
      const result = await analyzeBrandVoice(samplePost);
      setVoiceDNA(result);
    } catch (error) {
      console.error(error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSave = () => {
    onSave({
      industry,
      customIndustry: industry === 'Other' ? customIndustry : undefined,
      description,
      voiceDNA,
      websiteUrl: '', // Optional
      socialUrl: ''   // Optional
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-gray-900 w-full max-w-2xl rounded-2xl border border-gray-700 overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-5 border-b border-gray-800 flex justify-between items-center bg-gray-900">
            <div className="flex items-center gap-3">
                <div className="bg-brand-secondary/10 p-2 rounded-lg">
                    <BriefcaseIcon className="w-6 h-6 text-brand-secondary" />
                </div>
                <div>
                    <h2 className="font-bold text-white text-lg">Brand Voice Settings</h2>
                    <p className="text-xs text-gray-400">Teach the AI how to sound like you.</p>
                </div>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-white transition">
                <XIcon className="w-6 h-6" />
            </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto custom-scrollbar space-y-6">
            
            {/* 1. Industry */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Industry</label>
                    <select 
                        value={industry}
                        onChange={(e) => setIndustry(e.target.value)}
                        className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-sm focus:ring-2 focus:ring-brand-secondary outline-none"
                    >
                        {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                    </select>
                </div>
                {industry === 'Other' && (
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Specific Industry</label>
                        <input 
                            type="text" 
                            value={customIndustry}
                            onChange={(e) => setCustomIndustry(e.target.value)}
                            className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-sm focus:ring-2 focus:ring-brand-secondary outline-none"
                            placeholder="e.g. Crypto Gaming"
                        />
                    </div>
                )}
            </div>

            {/* 2. Description */}
            <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">What does your brand do?</label>
                <textarea 
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-sm focus:ring-2 focus:ring-brand-secondary outline-none resize-none"
                    placeholder="e.g. We sell premium coffee beans sourced ethically from Brazil. Our target audience is hipsters and remote workers."
                />
            </div>

            {/* 3. AI Voice Analyzer */}
            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                    <SparklesIcon className="w-4 h-4 text-brand-primary" />
                    <h3 className="text-sm font-bold text-white">AI Voice Trainer</h3>
                </div>
                
                {!voiceDNA ? (
                    <div className="space-y-3">
                        <p className="text-xs text-gray-400">Paste a recent social media post you wrote. The AI will analyze your style.</p>
                        <textarea 
                            value={samplePost}
                            onChange={(e) => setSamplePost(e.target.value)}
                            rows={3}
                            className="w-full bg-black/30 border border-gray-600 rounded-lg p-3 text-xs focus:outline-none"
                            placeholder="Paste sample text here..."
                        />
                        <button 
                            onClick={handleAnalyze}
                            disabled={isAnalyzing || !samplePost.trim()}
                            className="w-full py-2 bg-gray-700 hover:bg-gray-600 text-white text-xs font-bold rounded-lg transition flex items-center justify-center gap-2"
                        >
                            {isAnalyzing ? <Loader size="sm"/> : 'Analyze My Style'}
                        </button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <div className="flex justify-between items-start">
                            <label className="text-xs font-bold text-green-400 uppercase">Voice DNA Detected</label>
                            <button onClick={() => setVoiceDNA('')} className="text-[10px] text-gray-500 underline hover:text-white">Reset</button>
                        </div>
                        <div className="bg-green-500/10 border border-green-500/20 p-3 rounded-lg text-xs text-gray-300 leading-relaxed">
                            {voiceDNA}
                        </div>
                    </div>
                )}
            </div>

        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t border-gray-800 bg-gray-900 flex justify-end gap-3">
            <button onClick={onClose} className="px-4 py-2 text-sm font-bold text-gray-400 hover:text-white transition">Cancel</button>
            <button 
                onClick={handleSave}
                className="px-6 py-2 bg-brand-secondary text-white text-sm font-bold rounded-xl hover:opacity-90 shadow-lg shadow-brand-secondary/20 flex items-center gap-2"
            >
                <CheckCircleIcon className="w-4 h-4" /> Save Profile
            </button>
        </div>

      </div>
    </div>
  );
};
