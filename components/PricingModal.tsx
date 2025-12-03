import React, { useState } from 'react';
import { X, Check, Info, Star, Zap, Building2, Loader, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { PLANS, SubscriptionTier } from '../types';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PricingModal({ isOpen, onClose }: PricingModalProps) {
  const { user, userProfile } = useAuth();
  const currentTier = userProfile?.subscriptionTier || 'trial';
  const [loadingTier, setLoadingTier] = useState<SubscriptionTier | 'founder' | null>(null);

  // State pentru cardul expandat
  const [expandedTier, setExpandedTier] = useState<string | null>(null);

  if (!isOpen) return null;

 // ...
  const handleUpgrade = async (tier: SubscriptionTier | 'founder') => {
    setLoadingTier(tier);
    try {
        const token = await user?.getIdToken();
        if (!token) { alert("Please log in first."); return; }
        
        console.log("Initiating checkout for:", tier);

        const response = await fetch('/api/create-checkout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ planId: tier })
        });

        // Citim răspunsul serverului (poate fi eroare)
        const data = await response.json();
        
        if (!response.ok) {
            // AICI ESTE FIX-UL: Afișăm eroarea reală de la server
            throw new Error(data.error || `Server error: ${response.status}`);
        }
        
        if (data.url) {
            window.location.href = data.url;
        } else {
            throw new Error("No checkout URL returned");
        }

    } catch (error: any) {
        console.error("Checkout Error:", error);
        // Afișăm eroarea exactă utilizatorului (pt debugging)
        alert(`Payment Failed: ${error.message}`); 
    } finally {
        setLoadingTier(null);
    }
  };
  // ...

  const toggleDetails = (tierId: string) => {
      if (expandedTier === tierId) setExpandedTier(null);
      else setExpandedTier(tierId);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl bg-[#0f1115] border border-gray-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 text-center border-b border-gray-800 bg-[#161b22]">
          <button onClick={onClose} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white transition-colors"><X size={20} /></button>
          <h2 className="text-2xl font-bold text-white mb-2">Upgrade your Workspace</h2>
          <p className="text-gray-400 text-sm">Choose the power you need. Prices in USD ($).</p>
        </div>

        {/* Plans Grid */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            <PricingCard 
              planKey="creator"
              icon={<Zap className="text-blue-400" />}
              currentTier={currentTier}
              description="Perfect for individuals starting out."
              isLoading={loadingTier === 'creator'}
              onSelect={() => handleUpgrade('creator')}
              isExpanded={expandedTier === 'creator'}
              onToggleExpand={() => toggleDetails('creator')}
            />

            <PricingCard 
              planKey="pro"
              icon={<Star className="text-purple-400" />}
              currentTier={currentTier}
              isPopular={true}
              description="For growing influencers & brands."
              isLoading={loadingTier === 'pro'}
              onSelect={() => handleUpgrade('pro')}
              isExpanded={expandedTier === 'pro'}
              onToggleExpand={() => toggleDetails('pro')}
            />

            <PricingCard 
              planKey="agency"
              icon={<Building2 className="text-orange-400" />}
              currentTier={currentTier}
              description="Volume & power for multiple clients."
              isLoading={loadingTier === 'agency'}
              onSelect={() => handleUpgrade('agency')}
              isExpanded={expandedTier === 'agency'}
              onToggleExpand={() => toggleDetails('agency')}
            />

          </div>

          {/* LTD SECTION */}
          <div className="mt-8 p-1 bg-gradient-to-r from-yellow-600 via-orange-500 to-red-500 rounded-2xl">
            <div className="bg-[#161b22] rounded-xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full blur-[80px] -z-10" />
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">Limited Time</span>
                        <span className="text-orange-400 text-xs font-bold">Founding Member Offer</span>
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">Get Lifetime Access 🚀</h3>
                    <p className="text-gray-400 text-sm">Pay once, use forever. Include <strong>Pro Plan features</strong> + Priority Support + Early access.</p>
                </div>
                <div className="text-center md:text-right">
                    <div className="flex items-baseline justify-center md:justify-end gap-1">
                        <span className="text-gray-500 line-through text-sm">$297</span>
                        <span className="text-3xl font-bold text-white">$97</span>
                    </div>
                    <p className="text-xs text-gray-500 mb-3">One-time payment</p>
                    <button onClick={() => handleUpgrade('founder')} className="px-8 py-3 bg-white text-black font-bold rounded-lg hover:bg-gray-200 transition shadow-lg shadow-orange-900/20">
                        {loadingTier === 'founder' ? 'Processing...' : 'Become a Founder'}
                    </button>
                </div>
            </div>
          </div>

        </div>

        <div className="p-4 border-t border-gray-800 bg-[#161b22] text-center"><p className="text-xs text-gray-500">Secure payment via Stripe • 14-day money-back guarantee • Cancel anytime</p></div>
      </div>
    </div>
  );
}

interface CardProps {
  planKey: SubscriptionTier;
  icon: React.ReactNode;
  currentTier: string;
  isPopular?: boolean;
  description: string;
  isLoading?: boolean;
  isExpanded: boolean;
  onSelect: () => void;
  onToggleExpand: () => void;
}

function PricingCard({ planKey, icon, currentTier, isPopular, description, isLoading, onSelect, isExpanded, onToggleExpand }: CardProps) {
  const plan = PLANS[planKey];
  const isCurrent = currentTier === planKey;

  return (
    <div className={`relative flex flex-col p-5 rounded-xl border transition-all duration-300 ${isPopular ? 'bg-gradient-to-b from-gray-800 to-[#1c1c2e] border-purple-500/50 shadow-lg shadow-purple-900/20 scale-[1.02] z-10' : 'bg-[#161b22] border-gray-800 hover:border-gray-600'}`}>
      {isPopular && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-purple-600 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-sm uppercase tracking-wider">Best Value</div>}

      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="p-2 bg-gray-800 rounded-lg">{icon}</div>
          {isCurrent ? <span className="text-green-400 text-xs font-medium border border-green-400/30 bg-green-400/10 px-2 py-1 rounded">Current</span> : <div className="text-right"><span className="text-2xl font-bold text-white">${plan.price}</span><span className="text-gray-500 text-xs">/mo</span></div>}
        </div>
        <h3 className="text-lg font-bold text-white">{plan.name}</h3>
        <p className="text-gray-400 text-xs mt-1 h-8">{description}</p>
      </div>

      <div className="mb-6 p-3 bg-black/30 rounded-lg border border-gray-700/50">
        <div className="flex justify-between items-center mb-1"><span className="text-gray-300 text-sm font-medium">Monthly Credits</span><span className="text-white font-bold">{plan.credits}</span></div>
        <div className="w-full bg-gray-700 h-1.5 rounded-full overflow-hidden"><div className={`h-full ${isPopular ? 'bg-purple-500' : 'bg-blue-500'}`} style={{ width: '100%' }}></div></div>
        <p className="text-[10px] text-gray-500 mt-2 text-center">≈ {Math.floor(plan.credits / 20)} Premium Images OR {plan.credits} Posts</p>
      </div>

      {/* LISTA FEATURES SCURTĂ */}
      <div className="flex-1 space-y-3 mb-4">
        {plan.features.map((feature, idx) => (
            <div key={idx} className="flex items-start gap-2"><Check size={14} className={`mt-0.5 ${isPopular ? 'text-purple-400' : 'text-blue-400'}`} /><span className="text-gray-300 text-sm">{feature}</span></div>
        ))}
      </div>

      {/* EXTENDED DETAILS (ASCUNS/VISIBLE) */}
      {isExpanded && (
          <div className="space-y-3 mb-4 pt-4 border-t border-gray-700/50 animate-in fade-in slide-in-from-top-2">
              {plan.detailedFeatures.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-2"><div className="mt-1.5 w-1 h-1 rounded-full bg-gray-500"></div><span className="text-gray-400 text-xs">{feature}</span></div>
              ))}
          </div>
      )}

      {/* TOGGLE BUTTON */}
      <button onClick={onToggleExpand} className="flex items-center justify-center gap-1 text-xs text-gray-500 hover:text-white mb-4 transition">
          {isExpanded ? 'Hide details' : 'View full details'} 
          {isExpanded ? <ChevronUp size={12}/> : <ChevronDown size={12}/>}
      </button>

      <button onClick={onSelect} disabled={isCurrent || isLoading} className={`w-full py-2.5 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${isCurrent ? 'bg-gray-800 text-gray-500 cursor-default' : isPopular ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-lg' : 'bg-white text-black hover:bg-gray-200'} ${isLoading ? 'opacity-70' : ''}`}>
        {isLoading ? <Loader size={14} className="animate-spin" /> : (isCurrent ? 'Current Plan' : `Upgrade to ${plan.name}`)}
      </button>
    </div>
  );
}
