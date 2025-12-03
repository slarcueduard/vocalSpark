import React, { useState } from 'react';
import { X, Check, Info, Star, Zap, Building2, Loader } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { PLANS, SubscriptionTier } from '../types';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PricingModal({ isOpen, onClose }: PricingModalProps) {
  const { user, userProfile } = useAuth();
  const currentTier = userProfile?.subscriptionTier || 'trial';
  
  // Stare pentru loading la apăsarea butonului
  const [loadingTier, setLoadingTier] = useState<SubscriptionTier | null>(null);

  if (!isOpen) return null;

  // --- FUNCȚIA DE CHECKOUT REALĂ ---
  const handleUpgrade = async (tier: SubscriptionTier) => {
    setLoadingTier(tier);
    try {
        const token = await user?.getIdToken();
        if (!token) {
            alert("Please log in first.");
            return;
        }
        
        const response = await fetch('/api/create-checkout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ planId: tier })
        });

        const data = await response.json();
        
        if (data.url) {
            // Redirecționare către Stripe Checkout
            window.location.href = data.url;
        } else {
            alert(`Error: ${data.error || "Could not create checkout session."}`);
        }

    } catch (error) {
        console.error(error);
        alert("Connection error. Please try again.");
    } finally {
        setLoadingTier(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl bg-[#0f1115] border border-gray-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 text-center border-b border-gray-800 bg-[#161b22]">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
          <h2 className="text-2xl font-bold text-white mb-2">Upgrade your Workspace</h2>
          <p className="text-gray-400 text-sm">
            Choose the power you need. Switch or cancel anytime.
          </p>
        </div>

        {/* SCROLLABLE CONTENT AREA */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          
          {/* 1. SUBSCRIPTION CARDS GRID */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <PricingCard 
              planKey="creator"
              icon={<Zap className="text-blue-400" />}
              currentTier={currentTier}
              description="Perfect for individuals starting out."
              isLoading={loadingTier === 'creator'}
              onSelect={() => handleUpgrade('creator')}
            />

            <PricingCard 
              planKey="pro"
              icon={<Star className="text-purple-400" />}
              currentTier={currentTier}
              isPopular={true}
              description="For growing influencers & brands."
              isLoading={loadingTier === 'pro'}
              onSelect={() => handleUpgrade('pro')}
            />

            <PricingCard 
              planKey="agency"
              icon={<Building2 className="text-orange-400" />}
              currentTier={currentTier}
              description="Volume & power for multiple clients."
              isLoading={loadingTier === 'agency'}
              onSelect={() => handleUpgrade('agency')}
            />
          </div>

          {/* 2. LTD SECTION (SUB GRID) */}
          <div className="mt-8 p-1 bg-gradient-to-r from-yellow-600 via-orange-500 to-red-500 rounded-2xl shadow-lg shadow-orange-900/20">
            <div className="bg-[#161b22] rounded-xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
                {/* Background Shine */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full blur-[80px] -z-10" />
                
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">Limited Time</span>
                        <span className="text-orange-400 text-xs font-bold">Founding Member Offer</span>
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">Get Lifetime Access 🚀</h3>
                    <p className="text-gray-400 text-sm">
                        Pay once, use forever. Includes all <strong>Pro Plan features</strong> + Priority Support + Early access to new features.
                    </p>
                </div>

                <div className="text-center md:text-right min-w-[140px]">
                    <div className="flex items-baseline justify-center md:justify-end gap-2">
                        <span className="text-gray-500 line-through text-sm">$297</span>
                        <span className="text-3xl font-bold text-white">$97</span>
                    </div>
                    <p className="text-[10px] text-gray-500 mb-3 uppercase tracking-wide">One-time payment</p>
                // ... în interiorul componentei
    <button 
        // Folosim handleUpgrade cu un ID special 'founder'
        onClick={() => handleUpgrade('founder' as any)} 
        className="px-8 py-3 bg-white text-black font-bold rounded-lg hover:bg-gray-200 transition shadow-lg shadow-orange-900/20"
    >
        Become a Founder
    </button>

                </div>
            </div>
          </div>

        </div>

        {/* Footer info */}
        <div className="p-4 border-t border-gray-800 bg-[#161b22] text-center">
          <p className="text-xs text-gray-500">
            Secure payment via Stripe • 14-day money-back guarantee • Cancel anytime
          </p>
        </div>
      </div>
    </div>
  );
}

// --- SUB-COMPONENT ---

interface CardProps {
  planKey: SubscriptionTier;
  icon: React.ReactNode;
  currentTier: string;
  isPopular?: boolean;
  description: string;
  isLoading?: boolean;
  onSelect: () => void;
}

function PricingCard({ planKey, icon, currentTier, isPopular, description, isLoading, onSelect }: CardProps) {
  const plan = PLANS[planKey];
  const isCurrent = currentTier === planKey;

  const getFeatureTooltip = (feature: string) => {
    if (feature.includes('Premium')) return "Uses DALL-E 3 (OpenAI) for photorealistic, high-fidelity art.";
    if (feature.includes('Standard')) return "Uses Flux/Pollinations. Fast generation, good for social posts.";
    if (feature.includes('Brand Voice')) return "AI learns your style (tone, emojis, length) and writes exactly like you.";
    return null;
  };

  return (
    <div className={`relative flex flex-col p-5 rounded-xl border transition-all duration-300 ${
      isPopular 
        ? 'bg-gradient-to-b from-gray-800 to-[#1c1c2e] border-purple-500/50 shadow-lg shadow-purple-900/20 scale-[1.02] z-10' 
        : 'bg-[#161b22] border-gray-800 hover:border-gray-600'
    }`}>
      {isPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-purple-600 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-sm uppercase tracking-wider">
          Best Value
        </div>
      )}

      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="p-2 bg-gray-800 rounded-lg">{icon}</div>
          {isCurrent ? (
            <span className="text-green-400 text-xs font-medium border border-green-400/30 bg-green-400/10 px-2 py-1 rounded">Current</span>
          ) : (
            <div className="text-right">
              <span className="text-2xl font-bold text-white">€{plan.price}</span>
              <span className="text-gray-500 text-xs">/mo</span>
            </div>
          )}
        </div>
        <h3 className="text-lg font-bold text-white">{plan.name}</h3>
        <p className="text-gray-400 text-xs mt-1 h-8">{description}</p>
      </div>

      {/* Credits Bar */}
      <div className="mb-6 p-3 bg-black/30 rounded-lg border border-gray-700/50">
        <div className="flex justify-between items-center mb-1">
          <span className="text-gray-300 text-sm font-medium">Monthly Credits</span>
          <span className="text-white font-bold">{plan.credits}</span>
        </div>
        <div className="w-full bg-gray-700 h-1.5 rounded-full overflow-hidden">
          <div 
            className={`h-full ${isPopular ? 'bg-purple-500' : 'bg-blue-500'}`} 
            style={{ width: '100%' }}
          ></div>
        </div>
        <p className="text-[10px] text-gray-500 mt-2 text-center">
            ≈ {Math.floor(plan.credits / 20)} Premium Images OR {plan.credits} Posts
        </p>
      </div>

      {/* Features */}
      <div className="flex-1 space-y-3 mb-6">
        {plan.features.map((feature, idx) => {
           const tooltip = getFeatureTooltip(feature);
           return (
            <div key={idx} className="flex items-start gap-2 group relative">
              <Check size={14} className={`mt-0.5 ${isPopular ? 'text-purple-400' : 'text-blue-400'}`} />
              <span className="text-gray-300 text-sm">{feature}</span>
              {tooltip && (
                <div className="relative group/tooltip ml-auto">
                   <Info size={12} className="text-gray-600 cursor-help hover:text-gray-400" />
                   <div className="absolute bottom-full right-0 mb-2 w-48 p-2 bg-black text-white text-[10px] rounded shadow-xl border border-gray-700 opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none z-10">
                     {tooltip}
                   </div>
                </div>
              )}
            </div>
           );
        })}
      </div>

      {/* CTA Button */}
      <button
        onClick={onSelect}
        disabled={isCurrent || isLoading}
        className={`w-full py-2.5 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${
          isCurrent 
            ? 'bg-gray-800 text-gray-500 cursor-default'
            : isPopular 
              ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-900/40 hover:scale-[1.02]' 
              : 'bg-white text-black hover:bg-gray-200'
        } ${isLoading ? 'opacity-70 cursor-wait' : ''}`}
      >
        {isLoading ? (
            <>
                <Loader size={14} className="animate-spin" /> processing...
            </>
        ) : (
            isCurrent ? 'Current Plan' : `Upgrade to ${plan.name}`
        )}
      </button>
    </div>
  );
}
