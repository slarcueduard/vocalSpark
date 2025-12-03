import React, { useState } from 'react';
import { Sparkles, ArrowRight, Check, Zap, Globe, Fingerprint, Image as ImageIcon, LayoutTemplate, Repeat, Database, Calendar, ChevronDown, ChevronUp, Layers, MousePointerClick, History } from 'lucide-react';
import { GoogleIcon } from './Icons'; 
// Presupunem ca PLANS e importat corect. Daca lipsesc proprietati, le gestionam mai jos.
import { PLANS } from '../types';

interface LandingPageProps {
  onLogin: () => void;
}

export function LandingPage({ onLogin }: LandingPageProps) {
  // State pentru How It Works (Scenario Toggle)
  const [activeScenario, setActiveScenario] = useState<'new' | 'existing'>('new');

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

          <div className="flex flex-col items-center gap-3">
              <button 
                onClick={onLogin}
                className="group relative px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-lg flex items-center gap-3 transition-all shadow-xl shadow-blue-900/30 hover:scale-105"
              >
                <GoogleIcon className="w-6 h-6 bg-white rounded-full p-1" />
                <span>Start 5-Day PRO Trial</span>
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </button>
              <p className="text-xs text-gray-500">Includes 1000 Credits + GPT-4o. No credit card required.</p>
          </div>
        </div>
      </section>

      {/* --- CORE FEATURES --- */}
      <section className="py-20 bg-[#161b22]/50 border-y border-gray-800">
        <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
                <h2 className="text-3xl font-bold text-white mb-4">The Power Suite</h2>
                <p className="text-gray-400">Everything you need to dominate social media.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
                <FeatureCard icon={<Fingerprint className="text-purple-400" />} title="Voice DNA" desc="AI clones your unique tone and style instantly." />
                <FeatureCard icon={<Repeat className="text-green-400" />} title="Remix Mode" desc="Turn blogs into threads, scripts & posts." />
                <FeatureCard icon={<LayoutTemplate className="text-blue-400" />} title="Campaigns" desc="Generate a full week of content in 1 click." />
                <FeatureCard icon={<Database className="text-orange-400" />} title="Content Vault" desc="Auto-save, organize, and edit your viral hits." />
                <FeatureCard icon={<Globe className="text-cyan-400" />} title="Real-Time Data" desc="Write about today's news, not history." />
            </div>
        </div>
      </section>

      {/* --- HOW IT WORKS (UPDATED: SCENARIOS) --- */}
      <section className="py-24 px-6 bg-[#0a0c10]">
          <div className="max-w-6xl mx-auto">
              <div className="text-center mb-12">
                  <h2 className="text-3xl font-bold text-white mb-4">How It Works</h2>
                  <p className="text-gray-400 mb-8">Choose your starting point.</p>
                  
                  {/* SCENARIO TOGGLE */}
                  <div className="inline-flex bg-[#1c1c2e] p-1 rounded-full border border-gray-700">
                      <button 
                        onClick={() => setActiveScenario('new')}
                        className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${activeScenario === 'new' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                      >
                        Start from Scratch
                      </button>
                      <button 
                        onClick={() => setActiveScenario('existing')}
                        className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${activeScenario === 'existing' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                      >
                        Using Vault & Voice
                      </button>
                  </div>
              </div>

              {/* DYNAMIC STEPS CONTAINER */}
              <div className="relative mt-16">
                  {/* Background Line (Desktop only) */}
                  <div className="hidden md:block absolute top-12 left-20 right-20 h-0.5 bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 -z-10" />

                  <div className="flex flex-col md:flex-row justify-between gap-8 md:gap-4 relative">
                      
                      {activeScenario === 'new' ? (
                        <>
                           <StepCard 
                              number={1} 
                              icon={<Fingerprint size={32} className="text-blue-400" />} 
                              title="Define Brand Identity" 
                              desc="Input your niche, tone of voice, and target audience. The AI builds your profile."
                              color="blue"
                           />
                           <StepArrow />
                           <StepCard 
                              number={2} 
                              icon={<Zap size={32} className="text-blue-400" />} 
                              title="Generate Strategy" 
                              desc="Select a goal (Viral/Sales). The AI writes the copy and creates the visuals."
                              color="blue"
                           />
                           <StepArrow />
                           <StepCard 
                              number={3} 
                              icon={<ImageIcon size={32} className="text-blue-400" />} 
                              title="Publish & Learn" 
                              desc="Post directly. The system learns from performance to improve next time."
                              color="blue"
                           />
                        </>
                      ) : (
                        <>
                           <StepCard 
                              number={1} 
                              icon={<Database size={32} className="text-purple-400" />} 
                              title="Access Content Vault" 
                              desc="Your brand voice is already saved. Select a top-performing past post."
                              color="purple"
                           />
                           <StepArrow color="purple" />
                           <StepCard 
                              number={2} 
                              icon={<Repeat size={32} className="text-purple-400" />} 
                              title="Remix & Repurpose" 
                              desc="Use 'Remix Mode' to turn that post into a Thread, LinkedIn article, or Script."
                              color="purple"
                           />
                           <StepArrow color="purple" />
                           <StepCard 
                              number={3} 
                              icon={<Calendar size={32} className="text-purple-400" />} 
                              title="Auto-Schedule" 
                              desc="Queue the new content for the whole week with one click."
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
                <h2 className="text-3xl font-bold text-white mb-4">Founder Pricing</h2>
                <p className="text-gray-400">Lock in early-bird rates. Compare plans below.</p>
            </div>

            {/* 1. LIFETIME DEAL BANNER */}
            <div className="max-w-4xl mx-auto mb-16 p-0.5 bg-gradient-to-r from-orange-500 via-red-500 to-purple-600 rounded-2xl shadow-2xl shadow-orange-900/20 transform hover:scale-[1.01] transition cursor-pointer">
                <div className="bg-[#161b22] rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/10 rounded-full blur-[100px] -z-10" />
                    
                    <div className="flex-1 text-center md:text-left">
                        <div className="inline-block bg-orange-600 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-3 animate-pulse">
                            Only 25 Spots Left
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2">Founding Member - Lifetime Deal</h3>
                        <p className="text-gray-400 text-sm max-w-md">
                            Get <strong>Lifetime Access</strong> to the Pro Plan features without monthly fees. 
                            One payment of <strong>$97</strong>. Forever.
                        </p>
                    </div>

                    <div className="text-center">
                        <div className="flex items-center gap-2 justify-center md:justify-end mb-1">
                             <span className="text-gray-500 line-through decoration-red-500 decoration-2 text-lg">$297</span>
                             <span className="text-4xl font-bold text-white">$97</span>
                        </div>
                        <button onClick={onLogin} className="bg-white text-black px-8 py-3 rounded-lg font-bold hover:bg-gray-200 transition shadow-lg">
                            Login to Claim Deal
                        </button>
                    </div>
                </div>
            </div>

            {/* 2. MONTHLY SUBSCRIPTIONS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
                
                {/* CREATOR */}
                <PricingCardLanding 
                    plan={PLANS.creator}
                    desc="Side-hustlers & Beginners."
                    btnLabel="Start Creator"
                    onAction={onLogin}
                    planType="creator"
                />

                {/* PRO */}
                <PricingCardLanding 
                    plan={PLANS.pro}
                    desc="Influencers & Growing Brands."
                    btnLabel="Go Pro"
                    onAction={onLogin}
                    highlight
                    isPopular
                    planType="pro"
                />

                {/* AGENCY */}
                <PricingCardLanding 
                    plan={PLANS.agency}
                    desc="Scale & Volume Management."
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
        <p className="text-xs text-gray-600">&copy; 2024 Velocity Automation AI. All rights reserved.</p>
      </footer>
    </div>
  );
}

// --- SUB-COMPONENTS & HELPERS ---

// Simulam datele extra pentru "Expand" daca nu sunt in PLANS
const PLAN_EXTENSIONS: any = {
    creator: {
        deepDive: ["Basic Text Generation", "Standard Image Models", "3 Brand Voices", "Email Support"],
        competitor: "Better value than ChatGPT Plus ($20) because we include specialized Image Generation."
    },
    pro: {
        deepDive: ["GPT-4o Advanced Mode", "HD Flux/Midjourney Models", "Unlimited Brand Voices", "Priority Support", "Remix Existing Content"],
        competitor: "Cheaper than paying for Jasper ($59) + Midjourney ($30) separately."
    },
    agency: {
        deepDive: ["API Access", "White-label Reports", "Team Collaboration (5 Seats)", "Dedicated Acct. Manager", "Custom Integrations"],
        competitor: "A fraction of the cost of a full marketing agency retainer ($2k+)."
    }
};

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

// Componenta noua pentru Pasii din How It Works
function StepCard({ number, icon, title, desc, color }: any) {
    const borderColor = color === 'purple' ? 'border-purple-500/30' : 'border-blue-500/30';
    const numBg = color === 'purple' ? 'bg-purple-600' : 'bg-blue-600';

    return (
        <div className="flex flex-col items-center text-center flex-1 z-10">
            <div className={`w-24 h-24 bg-[#1c1c2e] border ${borderColor} rounded-2xl flex items-center justify-center mb-6 shadow-xl relative transition-transform hover:-translate-y-1 duration-300`}>
                <div className={`absolute -top-3 -left-3 w-8 h-8 ${numBg} rounded-full flex items-center justify-center font-bold text-white border border-[#0f1115] shadow-lg`}>
                    {number}
                </div>
                {icon}
            </div>
            <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
            <p className="text-sm text-gray-400 max-w-xs">{desc}</p>
        </div>
    );
}

// Componenta noua pentru Sageata dintre pasi
function StepArrow({ color }: { color?: string }) {
    return (
        <div className="hidden md:flex items-center justify-center text-gray-600 pt-8 animate-pulse">
            <ArrowRight size={24} className={color === 'purple' ? 'text-purple-900' : 'text-blue-900'} />
        </div>
    );
}

function PricingCardLanding({ plan, desc, btnLabel, onAction, isPopular, highlight, planType }: any) {
    const [isExpanded, setIsExpanded] = useState(false);
    
    // Fallback daca datele nu vin din prop-ul 'plan'
    const extraDetails = PLAN_EXTENSIONS[planType] || { deepDive: [], competitor: "" };
    // Combinam feature-urile de baza cu cele din "detailedFeatures" (daca exista in plan) sau fallback
    const featuresList = plan.detailedFeatures || extraDetails.deepDive;

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

            <div className="space-y-3 mb-6">
                {plan.features.map((feature: string, idx: number) => (
                    <div key={idx} className="flex items-start gap-2">
                        <Check size={14} className={`mt-0.5 ${isPopular ? 'text-purple-400' : 'text-blue-500'}`} />
                        <span className="text-gray-300 text-xs">{feature}</span>
                    </div>
                ))}
            </div>

            {/* EXTENDED DETAILS (TOGGLE) */}
            <div className={`overflow-hidden transition-all duration-500 ease-in-out ${isExpanded ? 'max-h-[500px] opacity-100 mb-6' : 'max-h-0 opacity-0 mb-0'}`}>
                <div className="pt-4 border-t border-gray-800 space-y-4">
                    
                    {/* Deep Dive Features */}
                    <div>
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Detailed Features</p>
                        <ul className="space-y-2">
                            {featuresList.map((feature: string, idx: number) => (
                                <li key={idx} className="flex items-start gap-2">
                                    <div className="mt-1.5 w-1 h-1 rounded-full bg-gray-500 shrink-0"></div>
                                    <span className="text-gray-400 text-xs">{feature}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Competitor Comparison */}
                    <div className="bg-gray-800/30 p-3 rounded-lg border border-gray-700/50">
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
