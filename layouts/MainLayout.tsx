import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  LogOut, 
  Zap, 
  Menu, 
  X, 
  Sparkles, 
  Briefcase, 
  Building2, 
  Archive, 
  Calendar as CalendarIcon 
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { PricingModal } from '../components/PricingModal';

// --- CONFIGURARE LINK PLATA ---
const STRIPE_LINK = "https://buy.stripe.com/pui_linkul_tau_aici"; // <-- Pune linkul tau

interface MainLayoutProps {
  children: React.ReactNode;
  onOpenBrandProfile: () => void;
  currentView: 'create' | 'history' | 'calendar';
  onViewChange: (view: 'create' | 'history' | 'calendar') => void;
}

export function MainLayout({ children, onOpenBrandProfile, currentView, onViewChange }: MainLayoutProps) {
  // Aici facem corectia: Luam 'userProfile' si extragem 'credits' din el
  const { userProfile, logout, user, brandProfile } = useAuth(); 
  
  const credits = userProfile?.credits ?? 0; // Fallback la 0 daca e null

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isPricingOpen, setIsPricingOpen] = useState(false); 

  const planName = userProfile?.subscriptionTier === 'trial' 
    ? 'Free Trial' 
    : (userProfile?.subscriptionTier || '').toUpperCase() + ' PLAN';

  const isPremium = userProfile?.subscriptionTier !== 'trial';

  return (
    <div className="min-h-screen bg-[#0f1115] text-white flex font-sans">
      
      <PricingModal 
        isOpen={isPricingOpen} 
        onClose={() => setIsPricingOpen(false)} 
      />

      {/* Mobile Toggle */}
      <button 
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-gray-800 rounded-md"
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
      >
        {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* --- SIDEBAR --- */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-40 w-72 bg-[#161b22] border-r border-gray-800 
        transform transition-transform duration-300 ease-in-out flex flex-col
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        
        {/* Logo */}
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/20">
            <Sparkles className="text-white" size={20} fill="currentColor" />
          </div>
          <span className="text-xl font-bold tracking-tight">Social Spark</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Workspace
          </div>
          
          <div onClick={() => onViewChange('create')}>
            <NavItem 
                icon={<LayoutDashboard size={20} />} 
                label="Creator Studio" 
                active={currentView === 'create'} 
            />
          </div>

          <div onClick={() => onViewChange('history')}>
            <NavItem 
                icon={<Archive size={20} />} 
                label="Content Vault" 
                active={currentView === 'history'} 
            />
          </div>

          <div onClick={() => onViewChange('calendar')}>
            <NavItem 
                icon={<CalendarIcon size={20} />} 
                label="Calendar" 
                active={currentView === 'calendar'} 
            />
          </div>
          
          <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mt-6">
            Strategy
          </div>

       {/* BUTON BRAND PROFILE */}
<div onClick={onOpenBrandProfile} className="cursor-pointer mt-auto"> {/* Poti pune mt-auto daca vrei sa fie jos */}
  <NavItem icon={<Briefcase size={20} />} label="Brand Identity" />
  
  {brandProfile && (
      <div className="ml-12 mt-2 p-3 bg-[#161b22] rounded-xl border border-gray-800/50 text-[10px] text-gray-400 hover:border-gray-600 transition group shadow-inner">
          {/* Numele Profilului */}
          <div className="flex items-center gap-1.5 mb-2 pb-2 border-b border-gray-800">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-white font-bold truncate">{brandProfile.name || 'Personal Brand'}</span>
          </div>
          
          {/* Detalii Extra */}
          <div className="space-y-1">
              <div className="flex justify-between">
                  <span className="text-gray-600">Niche:</span>
                  <span className="text-blue-400 font-medium truncate max-w-[80px]">{brandProfile.industry || '-'}</span>
              </div>
              <div className="flex justify-between">
                  <span className="text-gray-600">Tone:</span>
                  {/* Facem un mic "hack" sa afisam un rezumat scurt din VoiceDNA sau un placeholder */}
                  <span className="text-purple-400 font-medium">Custom AI</span>
              </div>
          </div>
      </div>
  )}
</div>
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-gray-800">
          <div className="bg-[#0f1115] rounded-xl p-4 border border-gray-800">
            <div className="flex justify-between items-center mb-3">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                CURRENT PLAN
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded text-black ${isPremium ? 'bg-purple-400' : 'bg-yellow-500'}`}>
                {planName}
              </span>
            </div>

            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden text-sm font-bold">
                 {user?.email?.[0].toUpperCase()}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-medium truncate w-32">{user?.email?.split('@')[0]}</p>
                <button 
                  onClick={() => logout()}
                  className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 mt-0.5"
                >
                  <LogOut size={10} /> Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* --- MAIN HEADER & CONTENT --- */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        <header className="h-16 border-b border-gray-800 bg-[#0f1115]/80 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-30">
          <div className="flex items-center gap-3">
             <span className="px-2 py-1 rounded border border-blue-500/30 bg-blue-500/10 text-blue-400 text-xs font-mono">
               v1.5 PRO
             </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-[#1c1c2e] border border-gray-700 rounded-full">
              <Zap size={14} className={credits > 0 ? "text-yellow-400 fill-yellow-400" : "text-gray-500"} />
              <span className="text-sm font-medium text-gray-200">
                Credits: <span className="text-white font-bold">{credits}</span>
              </span>
            </div>

            <button 
              onClick={() => {
                  // Deschidem link-ul de Stripe sau Modala de Pricing
                  // setIsPricingOpen(true); // Daca vrei modal intern
                  window.open(STRIPE_LINK, "_blank"); // Daca vrei direct la checkout
              }}
              className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-1.5 rounded-lg text-sm font-bold transition-colors flex items-center gap-2 shadow-lg shadow-blue-900/20"
            >
              <Building2 size={14} />
              UPGRADE PLAN
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>

      </main>
    </div>
  );
}

function NavItem({ icon, label, active }: { icon: any, label: string, active?: boolean }) {
  return (
    <div className={`
      flex items-center justify-between px-4 py-3 rounded-xl cursor-pointer transition-all duration-200
      ${active 
        ? 'bg-blue-600 text-white shadow-md shadow-blue-900/20' 
        : 'text-gray-400 hover:bg-[#1c1c2e] hover:text-white'
      }
    `}>
      <div className="flex items-center gap-3">
        {icon}
        <span className="font-medium text-sm">{label}</span>
      </div>
    </div>
  );
}
