import React from 'react';
import { Sparkles, ArrowRight, Check, Star, Zap, Building2 } from 'lucide-react';
import { GoogleIcon } from './Icons'; 
import { PLANS } from '../types'; // Importăm planurile

interface LandingPageProps {
  onLogin: () => void;
}

export function LandingPage({ onLogin }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-[#0f1115] text-white flex flex-col font-sans selection:bg-blue-500/30">
      
      {/* --- NAVIGATION --- */}
      <nav className="w-full px-6 py-6 flex justify-between items-center max-w-7xl mx-auto sticky top-0 z-50 bg-[#0f1115]/80 backdrop-blur-md">
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
      <main className="flex-1 flex flex-col items-center pt-20 px-4 relative overflow-hidden">
        
        {/* Background Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] -z-10 opacity-50" />

        <div className="text-center max-w-4xl mx-auto z-10 mb-24">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-900/20 border border-blue-800/50 text-blue-400 text-xs font-bold mb-6">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            v1.4 Live
          </div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white via-gray-100 to-gray-500">
            Content Creation on <br />
            <span className="text-blue-500">Autopilot.</span>
          </h1>

          <p className="text-lg text-gray-400 mb-10 max-w-xl mx-auto">
            The all-in-one AI workspace. Generate viral posts, design photorealistic visuals, and maintain your brand identity effortlessly.
          </p>

          <button 
            onClick={onLogin}
            className="group relative px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-lg flex items-center gap-3 mx-auto transition-all shadow-xl shadow-blue-900/30 hover:scale-105"
          >
            <GoogleIcon className="w-6 h-6 bg-white rounded-full p-1" />
            <span>Start Free Trial</span>
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </button>
          <p className="text-xs text-gray-600 mt-4">No credit card required for trial.</p>
        </div>

        {/* --- PRICING SECTION --- */}
        <section className="w-full max-w-6xl mx-auto py-20 border-t border-gray-800/50">
            <div className="text-center mb-16">
                <h2 className="text-3xl font-bold text-white mb-4">Simple, Transparent Pricing</h2>
                <p className="text-gray-400">Start for free, upgrade as you grow.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 px-4">
                
                {/* CREATOR */}
                <PricingCardLanding 
                    plan={PLANS.creator} 
                    icon={<Zap className="text-blue-400" />} 
                    description="For individuals & side-hustlers."
                />

                {/* PRO */}
                <PricingCardLanding 
                    plan={PLANS.pro} 
                    icon={<Star className="text-purple-400" />} 
                    description="For influencers & small brands."
                    isPopular
                />

                {/* AGENCY */}
                <PricingCardLanding 
                    plan={PLANS.agency} 
                    icon={<Building2 className="text-orange-400" />} 
                    description="For social media managers."
                />

            </div>
        </section>

      </main>

      <footer className="py-8 border-t border-gray-800 text-center text-xs text-gray-600">
        <p>&copy; 2024 Social Spark AI. Built for creators.</p>
      </footer>
    </div>
  );
}

// Helper Component pentru Cardurile de pe Landing
function PricingCardLanding({ plan, icon, description, isPopular }: { plan: any, icon: any, description: string, isPopular?: boolean }) {
    return (
        <div className={`relative p-8 rounded-2xl border flex flex-col h-full ${
            isPopular 
            ? 'bg-[#161b22] border-purple-500/50 shadow-2xl shadow-purple-900/10' 
            : 'bg-[#0f1115] border-gray-800'
        }`}>
            {isPopular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-purple-600 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                    Most Popular
                </div>
            )}

            <div className="mb-6">
                <div className="w-12 h-12 bg-gray-800 rounded-xl flex items-center justify-center mb-4">
                    {icon}
                </div>
                <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                <p className="text-gray-400 text-sm mt-2">{description}</p>
            </div>

            <div className="mb-6">
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

            <div className="mt-auto">
                <div className="w-full bg-gray-800/50 rounded-lg p-3 mb-4 text-center">
                    <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">Monthly Credits</span>
                    <div className="text-lg font-bold text-white">{plan.credits}</div>
                </div>
            </div>
        </div>
    );
}
