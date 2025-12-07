import React, { useState } from 'react';
import { X, Check, Zap, Crown, CreditCard, ChevronDown, ChevronUp, Star, Building2 } from 'lucide-react';
import { PLANS, SubscriptionTier } from '../types';
import { useAuth } from '../contexts/AuthContext';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// --- CONFIGURARE LINK-URI STRIPE (PUNE LINKURILE TALE AICI) ---
const STRIPE_LINKS = {
    plans: {
        creator: "LINK_STRIPE_CREATOR", // $4.99
        pro: "LINK_STRIPE_PRO",         // $11.99
        agency: "LINK_STRIPE_AGENCY"    // $29.99
    },
    credits: {
        small: "LINK_STRIPE_500_CREDITS",  // $5.00
        large: "LINK_STRIPE_1500_CREDITS"  // $12.99
    },
    founder: "LINK_STRIPE_LTD" // $97 (Optional)
};

export function PricingModal({ isOpen, onClose }: PricingModalProps) {
  const { userProfile } = useAuth();
  const currentTier = userProfile?.subscriptionTier || 'trial';
  
  const [activeTab, setActiveTab] = useState<'plans' | 'credits'>('plans');
  const [expandedTier, setExpandedTier] = useState<string | null>(null); // Pentru detalii extra

  if (!isOpen) return null;

  const handlePurchase = (link: string) => {
      if (link.includes("LINK_STRIPE")) {
          alert("Te rog configureaza link-urile de Stripe in fisierul PricingModal.tsx");
      } else {
          window.open(link, "_blank");
      }
  };

  const toggleDetails = (tierId: string) => {
      if (expandedTier === tierId) setExpandedTier(null);
      else setExpandedTier(tierId);
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-[#0f1115] w-full max-w-5xl rounded-2xl border border-gray-800 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* HEADER */}
        <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-[#161b22]">
            <div>
                <h2 className="text-2xl font-bold text-white">Upgrade Workspace</h2>
                <p className="text-gray-400 text-sm">Choose the power you need. Prices in USD ($).</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-full text-gray-400 hover:text-white transition">
                <X size={24} />
            </button>
        </div>

        {/* TABS (PLANS vs CREDITS) */}
        <div className="flex border-b border-gray-800 bg-[#0f1115]">
            <button 
                onClick={() => setActiveTab('plans')}
                className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition ${activeTab === 'plans' ? 'border-blue-500 text-white bg-blue-500/5' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
            >
                <Crown size={18} /> Monthly Plans
            </button>
            <button 
                onClick={() => setActiveTab('credits')}
                className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition ${activeTab === 'credits' ? 'border-yellow-500 text-white bg-yellow-500/5' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
            >
                <Zap size={18} /> Credit Packs (Pay-as-you-go)
            </button>
        </div>

        {/* CONTENT SCROLLABLE */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-[#0f1115]">
            
            {/* --- TAB: PLANS --- */}
            {activeTab === 'plans' && (
                <div className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        
                        {/* CREATOR */}
                        <PlanCard 
                            planKey="creator"
                            planData={PLANS.creator}
                            icon={<Zap className="text-blue-400" />}
                            currentTier={currentTier}
                            description="Perfect for individuals starting out."
                            onSelect={() => handlePurchase(STRIPE_LINKS.plans.creator)}
                            isExpanded={expandedTier === 'creator'}
                            onToggleExpand={() => toggleDetails('creator')}
                        />

                        {/* PRO */}
                        <PlanCard 
                            planKey="pro"
                            planData={PLANS.pro}
                            icon={<Star className="text-purple-400" />}
                            currentTier={currentTier}
                            isPopular={true}
                            description="For growing influencers & brands."
                            onSelect={() => handlePurchase(STRIPE_LINKS.plans.pro)}
                            isExpanded={expandedTier === 'pro'}
                            onToggleExpand={() => toggleDetails('pro')}
                        />

                        {/* AGENCY */}
                        <PlanCard 
                            planKey="agency"
                            planData={PLANS.agency}
                            icon={<Building2 className="text-orange-400" />}
                            currentTier={currentTier}
                            description="Volume & power for multiple clients."
                            onSelect={() => handlePurchase(STRIPE_LINKS.plans.agency)}
                            isExpanded={expandedTier === 'agency'}
                            onToggleExpand={() => toggleDetails('agency')}
                        />
                    </div>

                    {/* LTD SECTION (Optional) */}
                    <div className="p-1 bg-gradient-to-r from-yellow-600 via-orange-500 to-red-500 rounded-2xl">
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
                                <button onClick={() => handlePurchase(STRIPE_LINKS.founder)} className="px-8 py-3 bg-white text-black font-bold rounded-lg hover:bg-gray-200 transition shadow-lg shadow-orange-900/20">
                                    Become a Founder
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* --- TAB: CREDITS --- */}
            {activeTab === 'credits' && (
                <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in">
                    <div className="text-center mb-8">
                        <h3 className="text-xl font-bold text-white">Need a boost?</h3>
                        <p className="text-gray-400">Credit packs do not expire. Add them to any active subscription.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* 500 PACK */}
                        <div className="bg-[#161b22] border border-gray-700 rounded-2xl p-6 flex flex-col items-center text-center hover:border-yellow-500/50 transition transform hover:scale-[1.02]">
                            <div className="w-16 h-16 bg-yellow-500/10 rounded-full flex items-center justify-center mb-4 text-yellow-500">
                                <Zap size={32} fill="currentColor" />
                            </div>
                            <h3 className="text-2xl font-bold text-white">500 Credits</h3>
                            <p className="text-sm text-gray-400 mt-1">Perfect for ~50 posts</p>
                            <div className="text-3xl font-bold text-white my-6">$5.00</div>
                            <button 
                                onClick={() => handlePurchase(STRIPE_LINKS.credits.small)}
                                className="w-full py-3 bg-yellow-600 hover:bg-yellow-500 text-black font-bold rounded-xl transition shadow-lg shadow-yellow-900/20"
                            >
                                Buy Pack
                            </button>
                        </div>

                        {/* 1500 PACK */}
                        <div className="bg-[#161b22] border border-gray-700 rounded-2xl p-6 flex flex-col items-center text-center hover:border-blue-500/50 transition transform hover:scale-[1.02] relative overflow-hidden">
                            <div className="absolute top-3 right-3 bg-blue-600 text-[10px] font-bold px-2 py-1 rounded uppercase text-white">Best Value</div>
                            <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mb-4 text-blue-500">
                                <Zap size={32} fill="currentColor" />
                            </div>
                            <h3 className="text-2xl font-bold text-white">1500 Credits</h3>
                            <p className="text-sm text-gray-400 mt-1">Huge pack for ~150 posts</p>
                            <div className="text-3xl font-bold text-white my-6">$12.99</div>
                            <button 
                                onClick={() => handlePurchase(STRIPE_LINKS.credits.large)}
                                className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition shadow-lg shadow-blue-900/20"
                            >
                                Buy Pack
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
        
        {/* FOOTER */}
        <div className="p-4 border-t border-gray-800 bg-[#161b22] text-center">
            <p className="text-xs text-gray-500">Secure payment via Stripe • 14-day money-back guarantee • Cancel anytime</p>
        </div>
      </div>
    </div>
  );
}

// Helper Card
interface CardProps {
  planKey: SubscriptionTier;
  planData: any;
  icon: React.ReactNode;
  currentTier: string;
  isPopular?: boolean;
  description: string;
  isExpanded: boolean;
  onSelect: () => void;
  onToggleExpand: () => void;
}

function PlanCard({ planKey, planData, icon, currentTier, isPopular, description, onSelect, isExpanded, onToggleExpand }: CardProps) {
  const isCurrent = currentTier === planKey;
  const borderColor = isPopular ? 'border-purple-500' : 'border-gray-700';
  
  return (
    <div className={`relative flex flex-col p-5 rounded-xl border transition-all duration-300 ${isPopular ? 'bg-gradient-to-b from-gray-800 to-[#1c1c2e] shadow-lg shadow-purple-900/20 scale-[1.02] z-10' : 'bg-[#161b22] hover:border-gray-600'} ${borderColor}`}>
      {isPopular && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-purple-600 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-sm uppercase tracking-wider">Best Value</div>}

      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="p-2 bg-gray-800 rounded-lg">{icon}</div>
          {isCurrent ? <span className="text-green-400 text-xs font-medium border border-green-400/30 bg-green-400/10 px-2 py-1 rounded">Current</span> : <div className="text-right"><span className="text-2xl font-bold text-white">${planData.price}</span><span className="text-gray-500 text-xs">/mo</span></div>}
        </div>
        <h3 className="text-lg font-bold text-white">{planData.name}</h3>
        <p className="text-gray-400 text-xs mt-1 h-8">{description}</p>
      </div>

      <div className="mb-6 p-3 bg-black/30 rounded-lg border border-gray-700/50">
        <div className="flex justify-between items-center mb-1"><span className="text-gray-300 text-sm font-medium">Monthly Credits</span><span className="text-white font-bold">{planData.credits}</span></div>
        <div className="w-full bg-gray-700 h-1.5 rounded-full overflow-hidden"><div className={`h-full ${isPopular ? 'bg-purple-500' : 'bg-blue-500'}`} style={{ width: '100%' }}></div></div>
        <p className="text-[10px] text-gray-500 mt-2 text-center">≈ {Math.floor(planData.credits / 20)} Premium Images OR {planData.credits} Posts</p>
      </div>

      {/* SHORT FEATURES */}
      <div className="flex-1 space-y-3 mb-4">
        {planData.features.map((feature: string, idx: number) => (
            <div key={idx} className="flex items-start gap-2"><Check size={14} className={`mt-0.5 ${isPopular ? 'text-purple-400' : 'text-blue-400'}`} /><span className="text-gray-300 text-sm">{feature}</span></div>
        ))}
      </div>

      {/* EXTENDED DETAILS (ASCUNS/VISIBLE) */}
      {isExpanded && (
          <div className="space-y-3 mb-4 pt-4 border-t border-gray-700/50 animate-in fade-in slide-in-from-top-2">
              {planData.detailedFeatures.map((feature: string, idx: number) => (
                  <div key={idx} className="flex items-start gap-2"><div className="mt-1.5 w-1 h-1 rounded-full bg-gray-500 shrink-0"></div><span className="text-gray-400 text-xs">{feature}</span></div>
              ))}
          </div>
      )}

      {/* TOGGLE BUTTON */}
      <button onClick={onToggleExpand} className="flex items-center justify-center gap-1 text-xs text-gray-500 hover:text-white mb-4 transition w-full">
          {isExpanded ? 'Hide details' : 'View full details'} 
          {isExpanded ? <ChevronUp size={12}/> : <ChevronDown size={12}/>}
      </button>

      <button 
        onClick={onSelect} 
        disabled={isCurrent} 
        className={`w-full py-2.5 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${isCurrent ? 'bg-gray-800 text-gray-500 cursor-default' : isPopular ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-lg' : 'bg-white text-black hover:bg-gray-200'}`}
      >
        {isCurrent ? 'Current Plan' : `Upgrade to ${planData.name}`}
      </button>
    </div>
  );
}
