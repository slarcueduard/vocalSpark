import React from 'react';
import { Sparkles, ArrowRight, Check, Zap, Globe, Fingerprint, Image as ImageIcon, LayoutTemplate, Repeat, Database, Calendar, Crown, Users } from 'lucide-react';
import { GoogleIcon } from './Icons'; 
import { PLANS } from '../types';

interface LandingPageProps {
  onLogin: () => void;
}

export function LandingPage({ onLogin }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-[#0f1115] text-white flex flex-col font-sans selection:bg-blue-500/30">
      
      {/* --- NAVIGARE --- */}
      <nav className="w-full px-6 py-6 flex justify-between items-center max-w-7xl mx-auto sticky top-0 z-50 bg-[#0f1115]/80 backdrop-blur-md border-b border-gray-800/50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-900/20">
            <Sparkles className="text-white" size={18} fill="currentColor" />
          </div>
          <span className="text-lg font-bold tracking-tight">Social Spark</span>
        </div>
        <div className="flex gap-4">
            <button onClick={onLogin} className="text-sm text-gray-300 hover:text-white font-medium transition">Log in</button>
            <button 
                onClick={onLogin}
                className="px-5 py-2 bg-white text-black text-sm font-bold rounded-lg hover:bg-gray-200 transition"
            >
                Join Founders
            </button>
        </div>
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
            v1.5: Real-Time & Remix Mode
          </div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-tight">
            Create Viral Content. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500">Clone Your Brand Voice.</span>
          </h1>

          <p className="text-lg text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            Stop using generic AI. Use a workspace that knows your brand, generates strategy, and visuals in seconds. 
            <strong>Better than Canva. Smarter than ChatGPT.</strong>
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button 
                onClick={onLogin}
                className="group relative px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-lg flex items-center gap-3 transition-all shadow-xl shadow-blue-900/30 hover:scale-105"
              >
                <GoogleIcon className="w-6 h-6 bg-white rounded-full p-1" />
                <span>Get Founder Access</span>
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </button>
          </div>
          <p className="text-xs text-gray-600 mt-4">Limited spots for Freemium Founder Tier.</p>
        </div>
      </section>

      {/* --- CORE FEATURES (Actuale din Tool) --- */}
      <section className="py-20 bg-[#161b22]/50 border-y border-gray-800">
        <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
                <h2 className="text-3xl font-bold text-white mb-4">The Power Suite</h2>
                <p className="text-gray-400">Everything you need to dominate social media.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
                <FeatureCard 
                    icon={<Fingerprint className="text-purple-400" />}
                    title="Brand Identity (Voice DNA)"
                    desc="Don't prompt every time. Save your Niche, Tone, and Audience once. AI applies it to every post automatically."
                />
                <FeatureCard 
                    icon={<Repeat className="text-green-400" />}
                    title="Remix Mode"
                    desc="The ultimate repurposing tool. Paste a blog or transcript, and turn it into 5 LinkedIn posts, Threads, or TikTok scripts instantly."
                />
                <FeatureCard 
                    icon={<LayoutTemplate className="text-blue-400" />}
                    title="Campaign Mode"
                    desc="Plan a week of content in one click. Generate cohesive sequences (Teaser -> Value -> Sales) automatically."
                />
                <FeatureCard 
                    icon={<Database className="text-orange-400" />}
                    title="Content Vault"
                    desc="Your permanent library. Auto-saves every generation. Lock your favorites, edit later, and build your asset base."
                />
                <FeatureCard 
                    icon={<Globe className="text-cyan-400" />}
                    title="Real-Time Data"
                    desc="Connected to the live internet via Perplexity. Create content about today's news, not history."
                />
            </div>
        </div>
      </section>

      {/* --- HOW IT WORKS (WORKFLOW) --- */}
      <section className="py-24 px-6 bg-[#0a0c10]">
          <div className="max-w-6xl mx-auto">
              <div className="text-center mb-16">
                  <h2 className="text-3xl font-bold text-white mb-4">How It Works</h2>
                  <p className="text-gray-400">Two ways to create. Same viral result.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
                  
                  {/* SCENARIUL 1: FROM SCRATCH */}
                  <div className="relative p-8 rounded-3xl border border-gray-800 bg-[#0f1115] hover:border-gray-700 transition group">
                      <div className="absolute -top-4 -left-4 bg-blue-600 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider">New User</div>
                      <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                          <Sparkles size={20} className="text-blue-500"/> Starting from Scratch
                      </h3>
                      
                      <div className="space-y-6 relative">
                          {/* Line */}
                          <div className="absolute left-[15px] top-2 bottom-2 w-0.5 bg-gray-800 -z-10"></div>

                          <Step number={1} title="Define Brand" desc="Fill in your Niche & Tone in Brand Identity." />
                          <Step number={2} title="Auto-Suggest" desc="The AI suggests topics based on your Niche." />
                          <Step number={3} title="Generate & Save" desc="Get Text + Visuals. Auto-saved to Vault." />
                      </div>
                  </div>

                  {/* SCENARIUL 2: PRO FLOW */}
                  <div className="relative p-8 rounded-3xl border border-gray-800 bg-[#0f1115] hover:border-gray-700 transition group">
                      <div className="absolute -top-4 -right-4 bg-purple-600 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Pro Workflow</div>
                      <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2 justify-end">
                           Automated Growth <Zap size={20} className="text-purple-500"/>
                      </h3>
                      
                      <div className="space-y-6 relative">
                          {/* Line */}
                          <div className="absolute left-[15px] top-2 bottom-2 w-0.5 bg-gray-800 -z-10"></div>

                          <Step number={1} title="Remix Content" desc="Paste a YouTube transcript or Blog link." />
                          <Step number={2} title="Multi-Format" desc="AI creates LinkedIn + Twitter + TikTok posts at once." />
                          <Step number={3} title="Schedule" desc="Pick visuals from Vault and plan for the week." />
                      </div>
                  </div>

              </div>
          </div>
      </section>

      {/* --- PRICING SECTION --- */}
      <section className="w-full max-w-7xl mx-auto py-20 px-6">
            <div className="text-center mb-16">
                <h2 className="text-3xl font-bold text-white mb-4">Founder Pricing</h2>
                <p className="text-gray-400">Lock in early-bird rates. Prices increase soon.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                
                {/* FREE / FOUNDER */}
                <PricingCardLanding 
                    title="Founder Free"
                    price="0"
                    desc="For early adopters."
                    features={[
                        "300 Credits / mo (Reset)",
                        "Access to GPT-4o Mini",
                        "Standard Images",
                        "1 Brand Profile",
                        "Limited Vault (20 items)"
                    ]}
                    btnLabel="Join Free"
                    onAction={onLogin}
                />

                {/* CREATOR */}
                <PricingCardLanding 
                    title={PLANS.creator.name}
                    price={PLANS.creator.price.toString()}
                    desc="Side-hustlers."
                    features={[
                        "600 Credits / mo",
                        "GPT-4o Mini (Fast)",
                        "5 Premium Images",
                        "Platform Optimizer",
                        "Buy extra credits"
                    ]}
                    btnLabel="Start Creator"
                    onAction={onLogin}
                    highlight
                />

                {/* PRO (Canva Competitor) */}
                <PricingCardLanding 
                    title={PLANS.pro.name}
                    price={PLANS.pro.price.toString()}
                    desc="Influencers & Brands."
                    features={[
                        "2,000 Credits / mo",
                        "Full GPT-4o Intelligence",
                        "Real-Time News (Perplexity)",
                        "40+ Premium DALL-E Images",
                        "Remix Mode Unlocked"
                    ]}
                    btnLabel="Go Pro"
                    onAction={onLogin}
                    isPopular
                />

                {/* AGENCY */}
                <PricingCardLanding 
                    title={PLANS.agency.name}
                    price={PLANS.agency.price.toString()}
                    desc="Scale & Volume."
                    features={[
                        "7,000 Credits / mo",
                        "Unlimited Brand Voices",
                        "Bulk Generation",
                        "Prioritized Support",
                        "Calendar Strategy"
                    ]}
                    btnLabel="Scale Now"
                    onAction={onLogin}
                />

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

// --- SUB-COMPONENTS ---

function FeatureCard({ icon, title, desc }: { icon: any, title: string, desc: string }) {
    return (
        <div className="bg-[#0f1115] p-6 rounded-xl border border-gray-800 hover:border-gray-600 transition duration-300 h-full flex flex-col">
            <div className="w-10 h-10 bg-gray-800/50 rounded-lg flex items-center justify-center mb-4">
                {icon}
            </div>
            <h3 className="text-base font-bold text-white mb-2">{title}</h3>
            <p className="text-xs text-gray-400 leading-relaxed">{desc}</p>
        </div>
    )
}

function Step({ number, title, desc }: { number: number, title: string, desc: string }) {
    return (
        <div className="flex gap-4 items-start relative z-10">
            <div className="w-8 h-8 rounded-full bg-gray-800 border border-gray-600 flex items-center justify-center shrink-0 text-sm font-bold text-white">
                {number}
            </div>
            <div>
                <h4 className="text-sm font-bold text-white">{title}</h4>
                <p className="text-xs text-gray-400 mt-1">{desc}</p>
            </div>
        </div>
    )
}

function PricingCardLanding({ title, price, desc, features, btnLabel, onAction, isPopular, highlight }: any) {
    return (
        <div className={`relative p-6 rounded-2xl border flex flex-col h-full ${
            isPopular 
            ? 'bg-[#161b22] border-purple-500/50 shadow-2xl shadow-purple-900/20 scale-105 z-10' 
            : highlight 
                ? 'bg-[#0f1115] border-blue-500/30 shadow-lg'
                : 'bg-[#0f1115] border-gray-800 opacity-80 hover:opacity-100 transition'
        }`}>
            {isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-purple-600 text-white px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-lg">
                    Best Value
                </div>
            )}

            <div className="mb-4">
                <h3 className="text-lg font-bold text-white">{title}</h3>
                <p className="text-gray-400 text-xs mt-1">{desc}</p>
            </div>
          // ... în interiorul PricingCardLanding ...
            <div className="mb-6 flex items-baseline gap-1">
                <span className="text-4xl font-bold text-white">${plan.price}</span> {/* Aici era € */}
                <span className="text-gray-500">/mo</span>
            </div>
// ...

            <div className="mb-6 flex items-baseline gap-1">
                <span className="text-3xl font-bold text-white">€{price}</span>
                <span className="text-gray-500 text-xs">/mo</span>
            </div>

            <div className="space-y-3 mb-8 flex-1">
                {features.map((feature: string, idx: number) => (
                    <div key={idx} className="flex items-start gap-2">
                        <Check size={14} className={`mt-0.5 ${isPopular ? 'text-purple-400' : 'text-blue-500'}`} />
                        <span className="text-gray-300 text-xs">{feature}</span>
                    </div>
                ))}
            </div>

            <button 
                onClick={onAction}
                className={`w-full py-3 rounded-lg text-xs font-bold transition ${
                    isPopular 
                    ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-lg' 
                    : highlight 
                        ? 'bg-blue-600 hover:bg-blue-500 text-white'
                        : 'bg-gray-800 hover:bg-gray-700 text-white'
                }`}
            >
                {btnLabel}
            </button>
        </div>
    );
}
