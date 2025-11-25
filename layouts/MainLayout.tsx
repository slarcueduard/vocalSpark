import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  LogOut, 
  Zap, 
  Menu, 
  X,
  Sparkles,
  Briefcase,
  Building2 
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { PricingModal } from '../components/PricingModal';

interface MainLayoutProps {
  children: React.ReactNode;
  onOpenBrandProfile: () => void; // <--- Prop nou pentru a deschide modalul din App
}

export function MainLayout({ children, onOpenBrandProfile }: MainLayoutProps) {
  const { userProfile, logout, credits } = useAuth(); 
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isPricingOpen, setIsPricingOpen] = useState(false); 

  const planName = userProfile?.subscriptionTier === 'trial' 
    ? 'Free Trial' 
    : userProfile?.subscriptionTier?.toUpperCase() + ' PLAN';
const { userProfile, logout, credits, user, brandProfile } = useAuth(); // <--- ADAGUAT brandProfile
  const isPremium = userProfile?.subscriptionTier !== 'trial';

  return (
    <div className="min-h-screen bg-[#0f1115] text-white flex font-sans">
      
      {/* Modalul de Prețuri (Global) */}
      <PricingModal 
        isOpen={isPricingOpen} 
        onClose={() => setIsPricingOpen(false)} 
      />

      {/* Mobile Menu Toggle */}
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
  
  <NavItem icon={<LayoutDashboard size={20} />} label="Creator Studio" active />
  
  {/* BUTON BRAND PROFILE + PREVIEW */}
  <div onClick={onOpenBrandProfile}>
    <NavItem icon={<Briefcase size={20} />} label="Brand Identity" />
    
    {/* AICI AFIȘĂM REZUMATUL DACĂ EXISTĂ */}
    {brandProfile && (
        <div className="ml-12 mt-1 p-2 bg-[#1c1c2e] rounded-lg border border-gray-800 text-[10px] text-gray-400 cursor-pointer hover:border-gray-600 transition">
            <p><span className="text-blue-400 font-bold">Niche:</span> {brandProfile.industry}</p>
            <p><span className="text-purple-400 font-bold">Lang:</span> {brandProfile.language}</p>
            <p className="truncate mt-1 opacity-70">"{brandProfile.voiceDNA}"</p>
        </div>
    )}
  </div>
</nav>

        {/* User Profile (Bottom) */}
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
              <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden">
                 <span className="font-bold">{userProfile?.email?.[0].toUpperCase()}</span>
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-medium truncate">{userProfile?.email?.split('@')[0]}</p>
                <button 
                  onClick={() => logout()}
                  className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1"
                >
                  <LogOut size={10} /> Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* --- MAIN CONTENT AREA --- */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Top Header */}
        <header className="h-16 border-b border-gray-800 bg-[#0f1115]/80 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-30">
          
          <div className="flex items-center gap-3">
             <span className="px-2 py-1 rounded border border-blue-500/30 bg-blue-500/10 text-blue-400 text-xs font-mono">
               v1.4 PRO
             </span>
          </div>

          <div className="flex items-center gap-4">
            {/* Credits Display */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-[#1c1c2e] border border-gray-700 rounded-full">
              <Zap size={14} className={credits > 0 ? "text-yellow-400 fill-yellow-400" : "text-gray-500"} />
              <span className="text-sm font-medium text-gray-200">
                Credits: <span className="text-white font-bold">{credits}</span>
              </span>
            </div>

            {/* Upgrade Button */}
            <button 
              onClick={() => setIsPricingOpen(true)}
              className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-1.5 rounded-lg text-sm font-bold transition-colors flex items-center gap-2 shadow-lg shadow-blue-900/20"
            >
              <Building2 size={14} />
              UPGRADE PLAN
            </button>
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>

      </main>
    </div>
  );
}

// Helper Component
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
