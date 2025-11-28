import React from 'react';
import { Sparkles, ArrowRight, Check, Zap, Globe, Fingerprint, Image as ImageIcon, LayoutTemplate } from 'lucide-react';
import { GoogleIcon } from './Icons'; 
import { PLANS } from '../types';

interface LandingPageProps {
  onLogin: () => void;
}

export function LandingPage({ onLogin }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-[#0f1115] text-white flex flex-col font-sans selection:bg-blue-500/30">
      
      {/* --- NAVIGATION --- */}
      <nav className="w-full px-6 py-6 flex justify-between items-center max-w-7xl mx-auto sticky top-0 z-50 bg-[#0f1115]/80 backdrop-blur-md border-b border-gray-800/50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-900/20">
            <Sparkles className="text-white" size={18} fill="currentColor" />
          </div>
          <span className="text-lg font-bold tracking-tight">Social Spark</span>
        </div>
        <button 
            onClick={onLogin}
            className="px-5 py-2 bg-white text-black text-sm font-bold rounded-lg hover:bg-gray-200 transition"
        >
            Login / Start Trial
        </button>
      </nav>

      {/* --- HERO SECTION --- */}
      <section className="relative pt-20 pb-32 px-4 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] -z-10 opacity-50" />

        <div className="text-center max-w-4xl mx-auto z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-900/20 border border-blue-800/50 text-blue-400 text-xs font-bold mb-6">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            v1.4 Available Now
          </div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-tight">
            Stop Posting Generic Content. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">Start Building a Brand.</span>
          </h1>

          <p className="text-lg text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            The only AI Workspace that <strong>learns your voice</strong>, creates <strong>viral visuals</strong>, and uses <strong>real-time data</strong> to keep you relevant.
          </p>

          <button 
            onClick={onLogin}
            className="group relative px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-lg flex items-center gap-3 mx-auto transition-all shadow-xl shadow-blue-900/30 hover:scale-105"
          >
            <GoogleIcon className="w-6 h-6 bg-white rounded-full p-1" />
            <span>Start Free Trial</span>
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </button>
          <p className="text-xs text-gray-600 mt-4">No credit card required for 5-day trial.</p>
        </div>
      </section>

      {/* --- WHY US? (FEATURES) --- */}
      <section className="py-20 bg-[#161b22]/50 border-y border-gray-800">
        <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-16">
                <h2 className="text-3xl font-bold text-white mb-4">Why Creators Choose Us</h2>
                <p className="text-gray-400">Generic AI tools sound robotic. Social Spark sounds like YOU.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <FeatureCard 
                    icon={<Fingerprint className="text-purple-400" />}
                    title="Voice DNA Identity"
                    desc="Paste your best posts. Our AI analyzes your tone, style, and formatting to clone your unique voice instantly."
                />
                <FeatureCard 
                    icon={<ImageIcon className="text-blue-400" />}
                    title="Premium Visuals"
                    desc="Don't use boring stock photos. Generate photorealistic, HD images powered by DALL-E 3 directly in the editor."
                />
                <FeatureCard 
                    icon={<Globe className="text-green-400" />}
                    title="Real-Time Intelligence"
                    desc="Connected to the live internet (via Perplexity). Write about today's news, not data from 2021."
                />
            </div>
        </div>
      </section>

      {/* --- HOW IT WORKS (WORKFLOW) --- */}
      <section className="py-24 px-6">
          <div className="max-w-6xl mx-auto">
              <div className="text-center mb-16">
                  <h2 className="text-3xl font-bold text-white mb-4">From Idea to Viral in 3 Steps</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
                  {/* Connecting Line (Desktop) */}
                  <div className="hidden md:block absolute top-12 left-1/6 right-1/6 h-0.5 bg-gradient-to-r from-blue-900 via-purple-900 to-blue-900 -z-10" />

                  {/* Step 1 */}
                  <div className="flex flex-col items-center text-center">
                      <div className="w-24 h-24 bg-[#1c1c2e] border border-gray-700 rounded-2xl flex items-center justify-center mb-6 shadow-lg relative">
                          <div className="absolute -top-3 -left-3 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center font-bold text-white border border-[#0f1115]">1</div>
                          <LayoutTemplate size={40} className="text-blue-400" />
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2">Define Your Brand</h3>
                      <p className="text-sm text-gray-400">Set your niche, language, and upload samples. The AI learns your "DNA".</p>
                  </div>

                  {/* Step 2 */}
                  <div className="flex flex-col items-center text-center">
                      <div className="w-24 h-24 bg-[#1c1c2e] border border-gray-700 rounded-2xl flex items-center justify-center mb-6 shadow-lg relative">
                          <div className="absolute -top-3 -left-3 w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center font-bold text-white border border-[#0f1115]">2</div>
                          <Zap size={40} className="text-purple-400" />
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2">Generate with Intent</h3>
                      <p className="text-sm text-gray-400">Choose a goal (Sales, Viral, Educational). Get text + visuals perfectly adapted.</p>
                  </div>

                  {/* Step 3 */}
                  <div className="flex flex-col items-center text-center">
                      <div className="w-24 h-24 bg-[#1c1c2e] border border-gray-700 rounded-2xl flex items-center justify-center mb-6 shadow-lg relative">
                          <div className="absolute -top-3 -left-3 w-8 h-8 bg-green-600 rounded-full flex items-center justify-center font-bold text-white border border-[#0f1115]">3</div>
                          <Fingerprint size={40} className="text-green-400" />
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2">Publish & Scale</h3>
                      <p className="text-sm text-gray-400">Copy the optimized text, download the HD image, and post to grow your audience.</p>
                  </div>
              </div>
          </div>
      </section>

      {/* --- PRICING SECTION --- */}
      <section className="w-full max-w-6xl mx-auto py-20 border-t border-gray-800/50 px-6">
            <div className="text-center mb-16">
                <h2 className="text-3xl font-bold text-white mb-4">Simple Pricing</h2>
                <p className="text-gray-400">Start with a 5-day Free Trial. No commitment.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <PricingCardLanding plan={PLANS.creator} description="For individuals & side-hustlers." />
                <PricingCardLanding plan={PLANS.pro} description="For influencers & small brands." isPopular />
                <PricingCardLanding plan={PLANS.agency} description="For social media managers." />
            </div>
      </section>

      <footer className="py-12 border-t border-gray-800 bg-[#0a0c10] text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
             <Sparkles className="text-blue-600" size={16} />
             <span className="font-bold text-white">Social Spark AI</span>
        </div>
        <p className="text-xs text-gray-600">&copy; 2024 Velocity Automation AI. All rights reserved.</p>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, desc }: { icon: any, title: string, desc: string }) {
    return (
        <div className="bg-[#0f1115] p-6 rounded-xl border border-gray-800 hover:border-gray-600 transition duration-300">
            <div className="w-12 h-12 bg-gray-800/50 rounded-lg flex items-center justify-center mb-4">
                {icon}
            </div>
            <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
            <p className="text-sm text-gray-400 leading-relaxed">{desc}</p>
        </div>
    )
}

function PricingCardLanding({ plan, description, isPopular }: { plan: any, description: string, isPopular?: boolean }) {
    return (
        <div className={`relative p-8 rounded-2xl border flex flex-col h-full ${
            isPopular 
            ? 'bg-[#161b22] border-purple-500/50 shadow-2xl shadow-purple-900/10 scale-105 z-10' 
            : 'bg-[#0f1115] border-gray-800 hover:border-gray-700'
        }`}>
            {isPopular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-purple-600 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-lg">
                    Most Popular
                </div>
            )}

            <div className="mb-6">
                <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                <p className="text-gray-400 text-sm mt-2 h-10">{description}</p>
            </div>

            <div className="mb-6 flex items-baseline gap-1">
                <span className="text-4xl font-bold text-white">€{plan.price}</span>
                <span className="text-gray-500">/mo</span>
            </div>

            <div className="space-y-4 mb-8 flex-1">
                {plan.features.map((feature: string, idx: number) => (
                    <div key={idx} className="flex items-start gap-3">
                        <Check size={16} className={`mt-1 ${isPopular ? 'text-purple-400' : 'text-blue-500'}`} />
                        <span className="text-gray-300 text-sm">{feature}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
