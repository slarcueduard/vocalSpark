import React, { useState } from 'react';
import { 
  Sparkles, ArrowRight, Check, Zap, Globe, Fingerprint, 
  Image as ImageIcon, LayoutTemplate, Repeat, Database, 
  Calendar, ChevronDown, ChevronUp, Layers, History, 
  MousePointerClick, Play, Lock, Copy, Wand2, UserCheck,
  Search, Share, FileText, PenTool
} from 'lucide-react';

// --- DATA & TYPES: SOCIAL SPARK MVP FEATURES ---

const PLANS = {
  creator: {
    name: "Creator",
    price: 4.99,
    features: [
      "1 Voice DNA (Brand Identity)", // Esential MVP
      "Smart Text Generation",        // Single Post
      "Standard Images (Flux)",       // Cost-Eficient
      "Basic Remix Mode"              // Killer Feature (Limitat)
    ]
  },
  pro: {
    name: "Pro",
    price: 12.99,
    features: [
      "Real-Time Data (Live News)",   // Perplexity Integration
      "Premium Images (DALL-E 3)",    // High-End Visuals
      "Visual-Text Sync",             // Priority Feature
      "Unlimited Remix Mode"          // Unlocked
    ]
  },
  agency: {
    name: "Agency",
    price: 29.99,
    features: [
      "Strategic Content Calendar",   // Planificare
      "Bulk Content Export",          // Volum
      "Commercial License",           // Legal
      "Priority Support"
    ]
  }
};

// Detalii extinse (Deep Dive) - Sursa: Documentatie MVP
const PLAN_EXTENSIONS: any = {
    creator: {
        deepDive: [
            "1 Brand Tone (Voice DNA)",
            "Single Post Creation",
            "Auto-Save to Vault",
            "Remix Mode (5 Credits/mo)",
            "Standard Flux Model (Square)"
        ],
        // Ce lipseste (Upsell la Pro)
        unavailable: [
            { name: "Visual-Text Sync", upgradeTo: "Pro" },
            { name: "Live Trend Hunter", upgradeTo: "Pro" },
            { name: "DALL-E 3 HD Images", upgradeTo: "Pro" },
            { name: "Contextual Awareness", upgradeTo: "Pro" }
        ],
        competitor: "Better than Canva Pro ($15) because we ensure Brand Consistency, not just design templates."
    },
    pro: {
        deepDive: [
            "Unlimited Remixing (Repurposing)",
            "Contextual Memory (Reads Vault history)",
            "Live News Integration (Perplexity)",
            "Visual-Text Sync (Text matches Image)",
            "DALL-E 3 Quality (All Ratios)"
        ],
        // Ce lipseste (Upsell la Agency)
        unavailable: [
            { name: "Strategic Calendar", upgradeTo: "Agency" },
            { name: "Bulk Export", upgradeTo: "Agency" }
        ],
        competitor: "Cheaper than Jasper ($49) + Midjourney ($30). Includes full Repurposing capabilities."
    },
    agency: {
        deepDive: [
            "Full Content Calendar View",
            "Batch Export (PDF/CSV)",
            "High-Volume Generation Limits",
            "Commercial Use Rights",
            "Dedicated Account Manager"
        ],
        unavailable: [], // Agency are totul
        competitor: "A fraction of the cost of a full marketing agency retainer ($2k+)."
    }
};

// Componenta Simpla pentru Iconita Google (svg inline)
const GoogleIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);

// --- MAIN COMPONENT ---

interface LandingPageProps {
  onLogin: () => void;
}

export function LandingPage({ onLogin }: LandingPageProps) {
  // State pentru Toggle-ul din How It Works
  const [activeScenario, setActiveScenario] = useState<'standard' | 'premium'>('standard');

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
        <div className="flex gap-4">
            <button onClick={onLogin} className="text-sm text-gray-300 hover:text-white font-medium transition">Log in</button>
            <button 
                onClick={onLogin}
                className="px-5 py-2 bg-white text-black text-sm font-bold rounded-lg hover:bg-gray-200 transition"
            >
                Start Free Trial
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
            v1.0: Real-Time & Remix Mode
          </div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-tight">
            Stop Sounding Like AI. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500">Clone Your Brand Voice.</span>
          </h1>

          <p className="text-lg text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            The only workspace that remembers your brand DNA and repurposes your best content in seconds.
            <br className="hidden md:block" />
            <strong>Better than Canva. Smarter than generic ChatGPT.</strong>
          </p>

          <div className="flex flex-col items-center gap-3">
              <button 
                onClick={onLogin}
                className="group relative px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-lg flex items-center gap-3 transition-all shadow-xl shadow-blue-900/30 hover:scale-105"
              >
                <GoogleIcon className="w-6 h-6 bg-white rounded-full p-1" />
                <span>Start 5-Day PRO Trial</span>
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </button>
              <p className="text-xs text-gray-500">Includes 1000 Credits + Voice DNA. No credit card required.</p>
          </div>
        </div>
      </section>

      {/* --- CORE FEATURES --- */}
      <section className="py-20 bg-[#161b22]/50 border-y border-gray-800">
        <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
                <h2 className="text-3xl font-bold text-white mb-4">The Coherent Workspace</h2>
                <p className="text-gray-400">Solves the biggest problem with AI: Consistency.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
                <FeatureCard icon={<Fingerprint className="text-purple-400" />} title="Voice DNA" desc="We clone your tone so you never sound like a robot." />
                <FeatureCard icon={<Repeat className="text-green-400" />} title="Remix Mode" desc="Turn 1 blog into 10 LinkedIn posts instantly." />
                <FeatureCard icon={<ImageIcon className="text-pink-400" />} title="Visual-Text Sync" desc="Text on images finally matches your caption context." />
                <FeatureCard icon={<Database className="text-orange-400" />} title="Content Vault" desc="Auto-save & organize your winning posts." />
                <FeatureCard icon={<Globe className="text-cyan-400" />} title="Real-Time Data" desc="Pro: Search the live web for trending topics." />
            </div>
        </div>
      </section>

      {/* --- HOW IT WORKS (5 STEPS) --- */}
      <section className="py-24 px-6 bg-[#0a0c10]">
          <div className="max-w-7xl mx-auto">
              <div className="text-center mb-12">
                  <h2 className="text-3xl font-bold text-white mb-4">How It Works</h2>
                  <p className="text-gray-400 mb-8">See how fast you can go from Idea to Viral.</p>
                  
                  {/* SCENARIO TOGGLE */}
                  <div className="inline-flex bg-[#1c1c2e] p-1 rounded-full border border-gray-700">
                      <button 
                        onClick={() => setActiveScenario('standard')}
                        className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${activeScenario === 'standard' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                      >
                        Standard Flow
                      </button>
                      <button 
                        onClick={() => setActiveScenario('premium')}
                        className={`px-6 py-2 rounded-full text-sm font-bold transition-all flex items-center gap-2 ${activeScenario === 'premium' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                      >
                        <Sparkles size={14} /> Premium Flow
                      </button>
                  </div>
              </div>

              {/* DYNAMIC 5 STEPS CONTAINER */}
              <div className="relative mt-16">
                  {/* Background Line (Desktop only) */}
                  <div className="hidden md:block absolute top-12 left-10 right-10 h-0.5 bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 -z-10" />

                  <div className="grid grid-cols-2 md:grid-cols-5 gap-6 md:gap-4 relative">
                      
                      {activeScenario === 'standard' ? (
                        /* SCENARIUL 1: STANDARD (BASIC CREATOR) - 5 PASI */
                        <>
                           <StepCard 
                              number={1} 
                              icon={<Fingerprint size={28} className="text-blue-400" />} 
                              title="Define DNA" 
                              desc="Input your niche & tone. AI learns who you are."
                              color="blue"
                           />
                           <StepArrow />
                           <StepCard 
                              number={2} 
                              icon={<Zap size={28} className="text-blue-400" />} 
                              title="Input Idea" 
                              desc="Tell AI what's on your mind simply."
                              color="blue"
                           />
                           <StepArrow />
                           <StepCard 
                              number={3} 
                              icon={<PenTool size={28} className="text-blue-400" />} 
                              title="Generate" 
                              desc="Get caption + Standard Flux Image instantly."
                              color="blue"
                           />
                           <StepArrow />
                           <StepCard 
                              number={4} 
                              icon={<Copy size={28} className="text-blue-400" />} 
                              title="Publish" 
                              desc="Copy text & download image to post."
                              color="blue"
                           />
                           <StepArrow />
                           <StepCard 
                              number={5} 
                              icon={<Database size={28} className="text-blue-400" />} 
                              title="Vault" 
                              desc="Content auto-saves for future use."
                              color="blue"
                           />
                        </>
                      ) : (
                        /* SCENARIUL 2: PREMIUM (PRO / INFLUENCER) - 5 PASI */
                        <>
                           <StepCard 
                              number={1} 
                              icon={<UserCheck size={28} className="text-purple-400" />} 
                              title="Clone Style" 
                              desc="Or pick an influencer style from the library."
                              color="purple"
                           />
                           <StepArrow color="purple" />
                           <StepCard 
                              number={2} 
                              icon={<Search size={28} className="text-purple-400" />} 
                              title="Live Data" 
                              desc="AI finds real-time news to make it relevant."
                              color="purple"
                           />
                           <StepArrow color="purple" />
                           <StepCard 
                              number={3} 
                              icon={<Wand2 size={28} className="text-purple-400" />} 
                              title="Pro Visuals" 
                              desc="Generates DALL-E 3 with perfectly synced text."
                              color="purple"
                           />
                           <StepArrow color="purple" />
                           <StepCard 
                              number={4} 
                              icon={<Repeat size={28} className="text-purple-400" />} 
                              title="Remix" 
                              desc="Turn that post into a Thread or Script instantly."
                              color="purple"
                           />
                           <StepArrow color="purple" />
                           <StepCard 
                              number={5} 
                              icon={<Share size={28} className="text-purple-400" />} 
                              title="Scale" 
                              desc="Export to all platforms & save to Vault."
                              color="purple"
                           />
                        </>
                      )}

                  </div>
              </div>
          </div>
      </section>

      {/* --- PRICING SECTION --- */}
      <section className="w-full max-w-7xl mx-auto py-24 px-6">
            <div className="text-center mb-16">
                <h2 className="text-3xl font-bold text-white mb-4">Transparent Pricing</h2>
                <p className="text-gray-400">Starts small. Scales with you.</p>
            </div>

            {/* 1. LIFETIME DEAL BANNER */}
            <div className="max-w-4xl mx-auto mb-16 p-0.5 bg-gradient-to-r from-orange-500 via-red-500 to-purple-600 rounded-2xl shadow-2xl shadow-orange-900/20 transform hover:scale-[1.01] transition cursor-pointer">
                <div className="bg-[#161b22] rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/10 rounded-full blur-[100px] -z-10" />
                    
                    <div className="flex-1 text-center md:text-left">
                        <div className="inline-block bg-orange-600 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-3 animate-pulse">
                            Founding Member Offer
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2">Lifetime Access Deal</h3>
                        <p className="text-gray-400 text-sm max-w-md">
                            Get <strong>Lifetime Pro Features</strong> (Remix Mode, Voice DNA, Visual-Text Sync). 
                            One payment of <strong>$97</strong>. Keep it forever.
                        </p>
                    </div>

                    <div className="text-center">
                        <div className="flex items-center gap-2 justify-center md:justify-end mb-1">
                             <span className="text-gray-500 line-through decoration-red-500 decoration-2 text-lg">$297</span>
                             <span className="text-4xl font-bold text-white">$97</span>
                        </div>
                        <button onClick={onLogin} className="bg-white text-black px-8 py-3 rounded-lg font-bold hover:bg-gray-200 transition shadow-lg">
                            Get Lifetime Deal
                        </button>
                    </div>
                </div>
            </div>

            {/* 2. MONTHLY SUBSCRIPTIONS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
                
                {/* CREATOR */}
                <PricingCardLanding 
                    plan={PLANS.creator}
                    desc="For Side-hustlers & Solopreneurs."
                    btnLabel="Start Creator"
                    onAction={onLogin}
                    planType="creator"
                />

                {/* PRO */}
                <PricingCardLanding 
                    plan={PLANS.pro}
                    desc="For Influencers & Growing Brands."
                    btnLabel="Go Pro"
                    onAction={onLogin}
                    highlight
                    isPopular
                    planType="pro"
                />

                {/* AGENCY */}
                <PricingCardLanding 
                    plan={PLANS.agency}
                    desc="For Volume & Strategy."
                    btnLabel="Scale Now"
                    onAction={onLogin}
                    planType="agency"
                />

            </div>
      </section>

      <footer className="py-12 border-t border-gray-800 bg-[#0a0c10] text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
             <Sparkles className="text-blue-600" size={16} />
             <span className="font-bold text-white">Social Spark AI</span>
        </div>
        <p className="text-xs text-gray-600">&copy; 2024 Social Spark AI. All rights reserved.</p>
      </footer>
    </div>
  );
}

// --- SUB-COMPONENTS & HELPERS ---

function FeatureCard({ icon, title, desc }: { icon: any, title: string, desc: string }) {
    return (
        <div className="bg-[#0f1115] p-6 rounded-xl border border-gray-800 hover:border-gray-600 transition duration-300 h-full flex flex-col">
            <div className="w-10 h-10 bg-gray-800/50 rounded-lg flex items-center justify-center mb-4 text-white">
                {icon}
            </div>
            <h3 className="text-base font-bold text-white mb-2">{title}</h3>
            <p className="text-xs text-gray-400 leading-relaxed">{desc}</p>
        </div>
    )
}

function StepCard({ number, icon, title, desc, color }: any) {
    const borderColor = color === 'purple' ? 'border-purple-500/30' : 'border-blue-500/30';
    const numBg = color === 'purple' ? 'bg-purple-600' : 'bg-blue-600';

    return (
        <div className="flex flex-col items-center text-center flex-1 z-10 px-1">
            <div className={`w-16 h-16 md:w-20 md:h-20 bg-[#1c1c2e] border ${borderColor} rounded-2xl flex items-center justify-center mb-4 shadow-xl relative transition-transform hover:-translate-y-1 duration-300`}>
                <div className={`absolute -top-2 -left-2 w-6 h-6 ${numBg} rounded-full flex items-center justify-center font-bold text-xs text-white border border-[#0f1115] shadow-lg`}>
                    {number}
                </div>
                {icon}
            </div>
            <h3 className="text-sm md:text-base font-bold text-white mb-1">{title}</h3>
            <p className="text-[10px] md:text-xs text-gray-400 leading-tight">{desc}</p>
        </div>
    );
}

function StepArrow({ color }: { color?: string }) {
    return (
        <div className="hidden md:flex items-center justify-center text-gray-600 pt-6 animate-pulse -ml-3 -mr-3 z-0">
            <ArrowRight size={16} className={color === 'purple' ? 'text-purple-900' : 'text-blue-900'} />
        </div>
    );
}

function PricingCardLanding({ plan, desc, btnLabel, onAction, isPopular, highlight, planType }: any) {
    const [isExpanded, setIsExpanded] = useState(false);
    
    const extraDetails = PLAN_EXTENSIONS[planType] || { deepDive: [], unavailable: [], competitor: "" };
    
    const includedFeatures = extraDetails.deepDive || [];
    const unavailableFeatures = extraDetails.unavailable || [];

    return (
        <div className={`relative p-6 rounded-2xl border flex flex-col transition-all duration-300 ${
            isPopular 
            ? 'bg-[#161b22] border-purple-500/50 shadow-2xl shadow-purple-900/20 scale-105 z-10' 
            : highlight 
                ? 'bg-[#0f1115] border-blue-500/30 shadow-lg'
                : 'bg-[#0f1115] border-gray-800 opacity-80 hover:opacity-100'
        }`}>
            {isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-purple-600 text-white px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-lg">
                    Best Value
                </div>
            )}

            <div className="mb-4">
                <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                <p className="text-gray-400 text-xs mt-1">{desc}</p>
            </div>

            <div className="mb-6 flex items-baseline gap-1">
                <span className="text-3xl font-bold text-white">${plan.price}</span>
                <span className="text-gray-500 text-xs">/mo</span>
            </div>

            {/* Listam feature-urile principale - Simplu si Clar */}
            <div className="space-y-3 mb-6">
                {plan.features.map((feature: string, idx: number) => (
                    <div key={idx} className="flex items-start gap-2">
                        <Check size={14} className={`mt-0.5 ${isPopular ? 'text-purple-400' : 'text-blue-500'}`} />
                        <span className="text-gray-300 text-xs">{feature}</span>
                    </div>
                ))}
            </div>

            {/* EXTENDED DETAILS (TOGGLE) */}
            <div className={`overflow-hidden transition-all duration-500 ease-in-out ${isExpanded ? 'max-h-[800px] opacity-100 mb-6' : 'max-h-0 opacity-0 mb-0'}`}>
                <div className="pt-4 border-t border-gray-800 space-y-4">
                    
                    {/* Deep Dive (INCLUDED) */}
                    <div>
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Deep Dive</p>
                        <ul className="space-y-2 mb-4">
                            {includedFeatures.map((feature: string, idx: number) => (
                                <li key={idx} className="flex items-start gap-2">
                                    <div className="mt-1.5 w-1 h-1 rounded-full bg-gray-500 shrink-0"></div>
                                    <span className="text-gray-400 text-xs">{feature}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* UNAVAILABLE (MISSING - UPSELL) */}
                    {unavailableFeatures.length > 0 && (
                        <div>
                             <p className="text-[10px] font-bold text-red-900/70 uppercase tracking-wider mb-2">Missing in this plan</p>
                             <ul className="space-y-2">
                                {unavailableFeatures.map((item: any, idx: number) => (
                                    <li key={idx} className="flex items-start gap-2 text-gray-600 opacity-60">
                                        <Lock size={12} className="mt-0.5 shrink-0" />
                                        <div className="flex flex-col">
                                            <span className="text-xs line-through decoration-gray-700">{item.name}</span>
                                            <span className="text-[10px] text-purple-500/50 font-medium">Upgrade to {item.upgradeTo}</span>
                                        </div>
                                    </li>
                                ))}
                             </ul>
                        </div>
                    )}

                    {/* Competitor Comparison */}
                    <div className="bg-gray-800/30 p-3 rounded-lg border border-gray-700/50 mt-4">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                             <Layers size={10} /> VS Competitors
                        </p>
                        <p className="text-xs text-gray-300 italic leading-relaxed">
                            "{extraDetails.competitor}"
                        </p>
                    </div>

                </div>
            </div>

            <div className="mt-auto">
                <button 
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="flex items-center justify-center gap-1 text-xs text-gray-500 hover:text-white mb-4 transition w-full py-2 hover:bg-gray-800/50 rounded"
                >
                    {isExpanded ? 'Hide details' : 'View full benefits'} 
                    {isExpanded ? <ChevronUp size={12}/> : <ChevronDown size={12}/>}
                </button>

                <button 
                    onClick={onAction}
                    className={`w-full py-3 rounded-lg text-xs font-bold transition shadow-lg ${
                        isPopular 
                        ? 'bg-purple-600 hover:bg-purple-500 text-white' 
                        : highlight 
                            ? 'bg-blue-600 hover:bg-blue-500 text-white'
                            : 'bg-gray-800 hover:bg-gray-700 text-white'
                    }`}
                >
                    {btnLabel}
                </button>
            </div>
        </div>
    );
}
