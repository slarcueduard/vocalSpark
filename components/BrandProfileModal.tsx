import React, { useState, useEffect } from 'react';
import { BrandProfile } from '../types';
import { CloseIcon, SparklesIcon, UploadIcon, TrashIcon, MagicWandIcon } from './Icons';
import { Loader } from './Loader';
import { INDUSTRIES } from '../constants';
import { fileToBase64, analyzeBrandVoice } from '../services/geminiService';

interface BrandProfileModalProps {
  currentProfile: BrandProfile | null;
  onSave: (profile: BrandProfile) => Promise<void>;
  onClose: () => void;
}

type Tab = 'basics' | 'voice_trainer';

export const BrandProfileModal: React.FC<BrandProfileModalProps> = ({ currentProfile, onSave, onClose }) => {
  const [activeTab, setActiveTab] = useState<Tab>('basics');
  
  // Basics State
  const [industry, setIndustry] = useState(currentProfile?.industry || INDUSTRIES[0]);
  const [customIndustry, setCustomIndustry] = useState(currentProfile?.customIndustry || '');
  const [websiteUrl, setWebsiteUrl] = useState(currentProfile?.websiteUrl || '');
  const [socialUrl, setSocialUrl] = useState(currentProfile?.socialUrl || '');
  const [description, setDescription] = useState(currentProfile?.description || '');
  const [logoUrl, setLogoUrl] = useState<string | null>(currentProfile?.logoUrl || null);
  
  // Voice Trainer State
  const [examplePosts, setExamplePosts] = useState(currentProfile?.examplePosts || '');
  const [voiceDNA, setVoiceDNA] = useState(currentProfile?.voiceDNA || '');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Helper to fix URLs on blur
  const normalizeUrl = (value: string, setter: (val: string) => void) => {
    if (value && !/^https?:\/\//i.test(value)) {
        setter(`https://${value.trim()}`);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const { mimeType, data } = await fileToBase64(file);
        setLogoUrl(`data:${mimeType};base64,${data}`);
      } catch (err) {
        console.error("Logo upload failed", err);
        alert("Failed to process logo image");
      }
    }
  };

  const handleAnalyzeVoice = async () => {
      if (!examplePosts.trim()) return;
      setIsAnalyzing(true);
      try {
          const result = await analyzeBrandVoice(examplePosts);
          setVoiceDNA(result);
      } catch (e) {
          console.error(e);
          alert("Failed to analyze voice. Please try again.");
      } finally {
          setIsAnalyzing(false);
      }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    // Ensure URLs are valid before saving
    let finalWebsite = websiteUrl;
    if (finalWebsite && !/^https?:\/\//i.test(finalWebsite)) finalWebsite = `https://${finalWebsite.trim()}`;

    let finalSocial = socialUrl;
    if (finalSocial && !/^https?:\/\//i.test(finalSocial)) finalSocial = `https://${finalSocial.trim()}`;

    const profile: BrandProfile = {
      industry,
      customIndustry: industry === 'Other' ? customIndustry : undefined,
      websiteUrl: finalWebsite,
      socialUrl: finalSocial,
      description,
      logoUrl: logoUrl || undefined,
      voiceDNA: voiceDNA || undefined,
      examplePosts: examplePosts || undefined
    };

    await onSave(profile);
    setIsSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" aria-modal="true">
      <div className="bg-brand-bg-light rounded-2xl shadow-2xl border border-gray-700 w-full max-w-xl flex flex-col max-h-[90vh]">
        <header className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center gap-3">
             <div className="bg-brand-secondary/20 p-2 rounded-lg">
                <SparklesIcon className="w-6 h-6 text-brand-secondary" />
             </div>
             <div>
                <h2 className="text-xl font-bold text-brand-text">Brand Profile</h2>
                <p className="text-xs text-brand-text-secondary">Personalize the AI for your business</p>
             </div>
          </div>
          <button onClick={onClose} className="text-brand-text-secondary hover:text-white transition">
            <CloseIcon className="w-6 h-6" />
          </button>
        </header>

        {/* Navigation Tabs */}
        <div className="flex border-b border-gray-700">
            <button
                onClick={() => setActiveTab('basics')}
                className={`flex-1 py-3 text-sm font-semibold transition-colors ${activeTab === 'basics' ? 'bg-brand-bg-light text-brand-secondary border-b-2 border-brand-secondary' : 'bg-brand-bg-dark/50 text-brand-text-secondary hover:bg-brand-bg-light'}`}
            >
                Basic Details
            </button>
            <button
                onClick={() => setActiveTab('voice_trainer')}
                className={`flex-1 py-3 text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${activeTab === 'voice_trainer' ? 'bg-brand-bg-light text-brand-secondary border-b-2 border-brand-secondary' : 'bg-brand-bg-dark/50 text-brand-text-secondary hover:bg-brand-bg-light'}`}
            >
                <MagicWandIcon className="w-4 h-4" />
                Train Voice AI
            </button>
        </div>
        
        <div className="p-6 overflow-y-auto">
          <form id="brand-profile-form" onSubmit={handleSubmit} className="space-y-5">
            
            {activeTab === 'basics' && (
                <>
                    {/* Logo Upload Section */}
                    <div>
                        <label className="block text-sm font-semibold text-brand-text mb-2">Brand Logo (Asset Management)</label>
                        {logoUrl ? (
                            <div className="flex items-center gap-4 bg-brand-bg-dark border border-gray-600 rounded-lg p-3">
                                <img src={logoUrl} alt="Brand Logo" className="h-12 w-auto object-contain" />
                                <div className="flex-grow">
                                    <p className="text-xs text-green-400 font-semibold mb-1">Logo Uploaded</p>
                                    <p className="text-[10px] text-brand-text-secondary">We will automatically watermark your generated images.</p>
                                </div>
                                <button type="button" onClick={() => setLogoUrl(null)} className="p-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20">
                                    <TrashIcon className="w-4 h-4" />
                                </button>
                            </div>
                        ) : (
                            <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-600 rounded-lg cursor-pointer hover:border-brand-secondary hover:bg-brand-secondary/5 transition">
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <UploadIcon className="w-6 h-6 text-brand-text-secondary mb-2" />
                                    <p className="text-xs text-brand-text-secondary">Click to upload PNG/JPG logo</p>
                                </div>
                                <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                            </label>
                        )}
                    </div>

                    {/* Industry */}
                    <div>
                    <label htmlFor="industry" className="block text-sm font-semibold text-brand-text mb-2">Industry</label>
                    <select
                        id="industry"
                        value={industry}
                        onChange={(e) => setIndustry(e.target.value)}
                        className="w-full bg-brand-bg-dark border border-gray-600 rounded-lg px-4 py-3 focus:ring-2 focus:ring-brand-primary focus:outline-none transition appearance-none"
                    >
                        {INDUSTRIES.map(ind => <option key={ind} value={ind}>{ind}</option>)}
                    </select>
                    </div>

                    {industry === 'Other' && (
                    <div>
                        <label htmlFor="custom-industry" className="block text-sm font-semibold text-brand-text mb-2">Specific Industry</label>
                        <input
                        id="custom-industry"
                        type="text"
                        required
                        value={customIndustry}
                        onChange={(e) => setCustomIndustry(e.target.value)}
                        placeholder="e.g. Pet Grooming"
                        className="w-full bg-brand-bg-dark border border-gray-600 rounded-lg px-4 py-3 focus:ring-2 focus:ring-brand-primary focus:outline-none transition"
                        />
                    </div>
                    )}

                    {/* Website URL */}
                    <div>
                    <label htmlFor="website" className="block text-sm font-semibold text-brand-text mb-2">Website URL</label>
                    <input
                        id="website"
                        type="text"
                        value={websiteUrl}
                        onChange={(e) => setWebsiteUrl(e.target.value)}
                        onBlur={() => normalizeUrl(websiteUrl, setWebsiteUrl)}
                        placeholder="velocityautomationai.com"
                        className="w-full bg-brand-bg-dark border border-gray-600 rounded-lg px-4 py-3 focus:ring-2 focus:ring-brand-primary focus:outline-none transition"
                    />
                    <p className="text-xs text-brand-text-secondary mt-1">The AI will analyze your vibe from this URL.</p>
                    </div>

                    {/* Social URL */}
                    <div>
                    <label htmlFor="social" className="block text-sm font-semibold text-brand-text mb-2">Social Media Style Reference</label>
                    <input
                        id="social"
                        type="text"
                        value={socialUrl}
                        onChange={(e) => setSocialUrl(e.target.value)}
                        onBlur={() => normalizeUrl(socialUrl, setSocialUrl)}
                        placeholder="instagram.com/yourbrand"
                        className="w-full bg-brand-bg-dark border border-gray-600 rounded-lg px-4 py-3 focus:ring-2 focus:ring-brand-primary focus:outline-none transition"
                    />
                    <p className="text-xs text-brand-text-secondary mt-1">Link a profile/post to mimic the tone of voice.</p>
                    </div>

                    {/* Description */}
                    <div>
                    <label htmlFor="description" className="block text-sm font-semibold text-brand-text mb-2">Business Details & USP</label>
                    <textarea
                        id="description"
                        rows={4}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Describe your target audience, services, and what makes you unique."
                        className="w-full bg-brand-bg-dark border border-gray-600 rounded-lg px-4 py-3 focus:ring-2 focus:ring-brand-primary focus:outline-none transition"
                    ></textarea>
                    </div>
                </>
            )}

            {activeTab === 'voice_trainer' && (
                <div className="space-y-6">
                    <div className="bg-brand-secondary/10 p-4 rounded-lg border border-brand-secondary/30">
                        <h4 className="font-bold text-brand-secondary flex items-center gap-2 mb-2">
                            <SparklesIcon className="w-4 h-4" />
                            Personalization Engine
                        </h4>
                        <p className="text-sm text-brand-text-secondary">
                            Don't sound like a generic robot. Paste your best 3-5 posts below, and we will extract your unique "Voice DNA" to train the AI.
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-brand-text mb-2">Paste Sample Posts</label>
                        <textarea
                            rows={6}
                            value={examplePosts}
                            onChange={(e) => setExamplePosts(e.target.value)}
                            placeholder={`Example:
Post 1: Just crushed a 5k run! 🏃‍♂️ Feeling unstoppable. Who else is getting after it today? 🔥 #fitness #motivation

Post 2: Coffee first. Everything else second. ☕ Happy Monday everyone!
                            `}
                            className="w-full bg-brand-bg-dark border border-gray-600 rounded-lg px-4 py-3 focus:ring-2 focus:ring-brand-primary focus:outline-none transition font-mono text-sm"
                        ></textarea>
                    </div>

                    <button
                        type="button"
                        onClick={handleAnalyzeVoice}
                        disabled={isAnalyzing || !examplePosts.trim()}
                        className="w-full bg-brand-bg-dark border border-brand-secondary text-brand-secondary font-bold py-2 rounded-lg hover:bg-brand-secondary hover:text-white transition flex items-center justify-center gap-2"
                    >
                        {isAnalyzing ? <Loader size="sm" /> : <MagicWandIcon className="w-4 h-4" />}
                        <span>Analyze & Extract Voice DNA</span>
                    </button>

                    {voiceDNA && (
                        <div className="animate-fadeIn">
                             <label className="block text-sm font-semibold text-green-400 mb-2 flex items-center gap-2">
                                <SparklesIcon className="w-4 h-4" />
                                Your AI Voice DNA
                             </label>
                             <div className="bg-green-500/10 border border-green-500/30 p-4 rounded-lg">
                                 <p className="text-sm text-brand-text italic leading-relaxed">
                                     "{voiceDNA}"
                                 </p>
                             </div>
                             <p className="text-xs text-brand-text-secondary mt-2">
                                 This DNA will be injected into every post you generate.
                             </p>
                        </div>
                    )}
                </div>
            )}

          </form>
        </div>

        <footer className="p-6 border-t border-gray-700 bg-brand-bg-light/50 rounded-b-2xl">
           <button
              type="submit"
              form="brand-profile-form"
              disabled={isSaving}
              className="w-full bg-brand-primary text-brand-bg-dark font-bold py-3 px-4 rounded-lg hover:bg-opacity-90 transition-transform transform hover:scale-[1.02] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSaving ? <Loader size="sm" /> : <span>Save Brand Profile</span>}
            </button>
        </footer>
      </div>
    </div>
  );
};
