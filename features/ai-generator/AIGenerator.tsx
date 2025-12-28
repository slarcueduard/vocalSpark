import React, { useState, useCallback, useEffect } from 'react';
import { Tone, BrandProfile } from '../../types';
import { TONES, INDUSTRIES } from '../../constants';
import { SparklesIcon, CheckCircleIcon, SettingsIcon } from '../../components/Icons';
import { Loader } from '../../components/Loader';
import { useAuth } from '../../contexts/AuthContext';

interface AIGeneratorProps {
  isLoading: boolean;
  topicHistory: string[];
  onGenerate: (topic: string, tone: Tone, postCount: number, language: string, brandVoice: string) => void;
}

const AIGenerator: React.FC<AIGeneratorProps> = ({ isLoading, topicHistory, onGenerate }) => {
  const { brandProfile, saveBrandProfile } = useAuth();
  const [topic, setTopic] = useState('The future of renewable energy');
  const [tone, setTone] = useState<Tone>(Tone.Inspirational);
  const [postCount, setPostCount] = useState(3);
  const [language, setLanguage] = useState('English');
  const [campaignContext, setCampaignContext] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Brand Profile Local State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [industry, setIndustry] = useState(INDUSTRIES[0]);
  const [customIndustry, setCustomIndustry] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [socialUrl, setSocialUrl] = useState('');
  const [description, setDescription] = useState('');

  // Initialize fields from global profile
  useEffect(() => {
    if (brandProfile) {
      setIndustry(brandProfile.industry);
      setCustomIndustry(brandProfile.customIndustry || '');
      setWebsiteUrl(brandProfile.websiteUrl);
      setSocialUrl(brandProfile.socialUrl);
      setDescription(brandProfile.description);
      setIsEditingProfile(false);
    } else {
      setIsEditingProfile(true);
    }
  }, [brandProfile]);

  // Helper to fix URLs on blur
  const normalizeUrl = (value: string, setter: (val: string) => void) => {
    if (value && !/^https?:\/\//i.test(value)) {
      setter(`https://${value.trim()}`);
    }
  };

  const handleSaveProfile = async () => {
    setIsSavingProfile(true);

    // Ensure URLs are valid before saving
    let finalWebsite = websiteUrl;
    if (finalWebsite && !/^https?:\/\//i.test(finalWebsite)) finalWebsite = `https://${finalWebsite.trim()}`;

    let finalSocial = socialUrl;
    if (finalSocial && !/^https?:\/\//i.test(finalSocial)) finalSocial = `https://${finalSocial.trim()}`;

    const newProfile: BrandProfile = {
      industry,
      customIndustry: industry === 'Other' ? customIndustry : undefined,
      websiteUrl: finalWebsite,
      socialUrl: finalSocial,
      description
    };
    try {
      await saveBrandProfile(newProfile);
      setWebsiteUrl(finalWebsite); // Update local state to show fixed version
      setSocialUrl(finalSocial);
      setIsEditingProfile(false);
    } catch (e) {
      console.error(e);
      setError("Failed to save brand profile.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!topic.trim()) {
      setError('Please enter a topic for your posts.');
      return;
    }
    if (postCount < 1 || postCount > 10) {
      setError('Please enter a number of posts between 1 and 10.');
      return;
    }
    onGenerate(topic, tone, postCount, language, campaignContext);
  }, [topic, tone, postCount, language, campaignContext, onGenerate]);

  const displayIndustry = brandProfile ? (brandProfile.industry === 'Other' ? brandProfile.customIndustry : brandProfile.industry) : industry;

  return (
    <>
      <h2 className="text-xl font-semibold mb-1 text-center">Create your next viral campaign with AI</h2>
      <p className="text-brand-text-secondary mb-8 text-center">Setup your brand identity and let AI do the rest.</p>

      {/* --- BRAND PROFILE SECTION --- */}
      <div className="mb-8 border border-gray-700 rounded-xl bg-brand-bg-dark/50 overflow-hidden">
        <div className="bg-gray-800/50 px-4 py-3 border-b border-gray-700 flex justify-between items-center">
          <h3 className="font-semibold text-brand-text flex items-center gap-2">
            <SparklesIcon className="w-4 h-4 text-brand-secondary" />
            Voice DNA
          </h3>
          {!isEditingProfile && brandProfile && (
            <button
              onClick={() => setIsEditingProfile(true)}
              className="text-xs text-brand-secondary hover:text-white transition flex items-center gap-1"
            >
              <SettingsIcon className="w-3 h-3" />
              Edit Profile
            </button>
          )}
        </div>

        <div className="p-5">
          {!isEditingProfile && brandProfile ? (
            <div className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
              <div>
                <p className="text-sm text-brand-text font-medium"><span className="text-brand-text-secondary">Industry:</span> {displayIndustry}</p>
                <p className="text-sm text-brand-text font-medium mt-1"><span className="text-brand-text-secondary">Website:</span> {brandProfile.websiteUrl || 'Not set'}</p>
              </div>
              <div className="flex items-center gap-2 text-green-400 bg-green-400/10 px-3 py-1.5 rounded-full text-xs font-semibold self-start sm:self-center">
                <CheckCircleIcon className="w-3.5 h-3.5" />
                <span>Profile Active</span>
              </div>
            </div>
          ) : (
            <div className="space-y-4 animate-fadeIn">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Industry */}
                <div>
                  <label className="block text-xs font-semibold text-brand-text-secondary mb-1.5">Industry Selection</label>
                  <select
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    className="w-full bg-brand-bg-light border border-gray-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-secondary focus:outline-none transition"
                  >
                    {INDUSTRIES.map(ind => <option key={ind} value={ind}>{ind}</option>)}
                  </select>
                </div>
                {industry === 'Other' && (
                  <div>
                    <label className="block text-xs font-semibold text-brand-text-secondary mb-1.5">Custom Industry</label>
                    <input
                      type="text"
                      value={customIndustry}
                      onChange={(e) => setCustomIndustry(e.target.value)}
                      placeholder="e.g. Pet Grooming"
                      className="w-full bg-brand-bg-light border border-gray-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-secondary focus:outline-none transition"
                    />
                  </div>
                )}
                {/* Website */}
                <div className={industry === 'Other' ? 'md:col-span-2' : ''}>
                  <label className="block text-xs font-semibold text-brand-text-secondary mb-1.5">Website URL (Analysis)</label>
                  <input
                    type="text"
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    onBlur={() => normalizeUrl(websiteUrl, setWebsiteUrl)}
                    placeholder="velocityautomationai.com"
                    className="w-full bg-brand-bg-light border border-gray-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-secondary focus:outline-none transition"
                  />
                </div>
              </div>

              {/* Social & Description */}
              <div>
                <label className="block text-xs font-semibold text-brand-text-secondary mb-1.5">Social Media Style (Tone Reference)</label>
                <input
                  type="text"
                  value={socialUrl}
                  onChange={(e) => setSocialUrl(e.target.value)}
                  onBlur={() => normalizeUrl(socialUrl, setSocialUrl)}
                  placeholder="instagram.com/yourbrand"
                  className="w-full bg-brand-bg-light border border-gray-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-secondary focus:outline-none transition"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-brand-text-secondary mb-1.5">Business Description</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe specific services, target audience, and USPs."
                  className="w-full bg-brand-bg-light border border-gray-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand-secondary focus:outline-none transition"
                ></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                {brandProfile && (
                  <button
                    type="button"
                    onClick={() => setIsEditingProfile(false)}
                    className="px-4 py-2 text-xs font-semibold text-brand-text-secondary hover:text-white transition"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleSaveProfile}
                  disabled={isSavingProfile}
                  className="bg-brand-secondary text-brand-bg-dark font-bold py-2 px-4 rounded-lg text-xs hover:bg-opacity-90 transition disabled:opacity-50 flex items-center gap-2"
                >
                  {isSavingProfile ? <Loader size="sm" /> : <span>Save Brand Profile</span>}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* --- CAMPAIGN FORM --- */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 items-start">
        <div className="md:col-span-2">
          <label htmlFor="topic-input" className="block text-sm font-medium mb-2">Campaign Topic</label>
          <input
            id="topic-input"
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g., The future of renewable energy"
            className="w-full bg-brand-bg-dark border border-gray-600 rounded-md px-3 py-2 focus:ring-2 focus:ring-brand-primary focus:outline-none transition"
            list="topic-history"
          />
          <datalist id="topic-history">
            {topicHistory.map((item, index) => <option key={index} value={item} />)}
          </datalist>
        </div>
        <div>
          <label htmlFor="tone" className="block text-sm font-medium mb-2">Tone</label>
          <select
            id="tone"
            value={tone}
            onChange={(e) => setTone(e.target.value as Tone)}
            className="w-full bg-brand-bg-dark border border-gray-600 rounded-md px-3 py-2 focus:ring-2 focus:ring-brand-primary focus:outline-none transition appearance-none"
          >
            {TONES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="post-count" className="block text-sm font-medium mb-2">Number of Posts</label>
          <input
            id="post-count"
            type="number"
            value={postCount}
            onChange={(e) => setPostCount(Number(e.target.value))}
            min="1"
            max="10"
            className="w-full bg-brand-bg-dark border border-gray-600 rounded-md px-3 py-2 focus:ring-2 focus:ring-brand-primary focus:outline-none transition"
          />
        </div>
        <div>
          <label htmlFor="language" className="block text-sm font-medium mb-2">Language</label>
          <input
            id="language"
            type="text"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            placeholder="e.g., English, Spanish"
            className="w-full bg-brand-bg-dark border border-gray-600 rounded-md px-3 py-2 focus:ring-2 focus:ring-brand-primary focus:outline-none transition"
          />
        </div>
        <div className="md:col-span-2">
          <label htmlFor="campaign-context" className="block text-sm font-medium mb-2">Campaign Context (Optional)</label>
          <textarea
            id="campaign-context"
            value={campaignContext}
            onChange={(e) => setCampaignContext(e.target.value)}
            rows={2}
            placeholder="Any specific focus for this campaign? (e.g. 'Mention our 20% discount')"
            className="w-full bg-brand-bg-dark border border-gray-600 rounded-md px-3 py-2 focus:ring-2 focus:ring-brand-primary focus:outline-none transition"
          ></textarea>
        </div>
        {error && <p className="md:col-span-2 text-red-400 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={isLoading}
          className="md:col-span-2 w-full bg-brand-primary text-brand-bg-dark font-bold py-3 px-4 rounded-md hover:bg-opacity-90 transition-transform transform hover:scale-[1.01] disabled:bg-gray-500 disabled:scale-100 flex items-center justify-center gap-2 mt-2"
        >
          {isLoading ? <Loader size="sm" /> : <SparklesIcon className="w-5 h-5" />}
          <span>{isLoading ? 'Generating...' : 'Generate Campaign'}</span>
        </button>
      </form>
    </>
  );
};

export default AIGenerator;