import React, { ReactNode } from 'react';
import { User } from 'firebase/auth';
import { SparklesIcon, BriefcaseIcon, MagicWandIcon } from '../components/Icons';
import { useAuth } from '../contexts/AuthContext';

interface MainLayoutProps {
  children: ReactNode;
  user: User;
  onSignOut: () => void;
  onOpenImageStudio: () => void;
  onOpenBrandProfile: () => void;
  currentMode: 'creator' | 'business';
  onSwitchMode: (mode: 'creator' | 'business') => void;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ 
    children, user, onSignOut, currentMode, onSwitchMode 
}) => {
  
  const { userProfile } = useAuth();

  // Funcție pentru a decide culoarea badge-ului
  const getPlanBadge = () => {
      const tier = userProfile?.subscriptionTier || 'trial';
      
      if (tier === 'business') {
          return <span className="bg-purple-600 text-white text-[10px] font-bold px-2 py-0.5 rounded border border-purple-400 shadow-[0_0_10px_rgba(147,51,234,0.5)]">BUSINESS PRO</span>;
      }
      if (tier === 'creator') {
          return <span className="bg-blue-500 text-white text-[10px] font-bold px-2 py-0.5 rounded border border-blue-400">CREATOR</span>;
      }
      return <span className="bg-yellow-500/20 text-yellow-400 text-[10px] font-bold px-2 py-0.5 rounded border border-yellow-500/50">FREE TRIAL</span>;
  };

  return (
    <div className="flex h-screen bg-brand-bg-dark text-brand-text overflow-hidden">
      {/* SIDEBAR */}
      <aside className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col hidden md:flex shadow-2xl z-20">
        <div className="p-6 flex items-center gap-3">
          <div className="bg-gradient-to-br from-brand-primary to-blue-600 p-2 rounded-lg shadow-lg">
            <SparklesIcon className="w-6 h-6 text-white" />
          </div>
          <h1 className="font-bold text-xl tracking-tight text-white">Social Spark</h1>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
            <div className="text-xs font-bold text-gray-500 uppercase px-4 mb-2 tracking-wider">Workspace</div>
            
            <button 
                onClick={() => onSwitchMode('creator')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${currentMode === 'creator' ? 'bg-brand-primary/10 text-brand-primary border border-brand-primary/20 shadow-sm' : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'}`}
            >
                <MagicWandIcon className="w-5 h-5" />
                <span className="font-medium">Creator Studio</span>
            </button>

            <button 
                onClick={() => onSwitchMode('business')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${currentMode === 'business' ? 'bg-brand-secondary/10 text-brand-secondary border border-brand-secondary/20 shadow-sm' : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'}`}
            >
                <BriefcaseIcon className="w-5 h-5" />
                <span className="font-medium">Business Hub</span>
            </button>
        </nav>

        {/* USER PROFILE FOOTER */}
        <div className="p-4 border-t border-gray-800 bg-gray-900/50">
            <div className="bg-gray-800/80 backdrop-blur-sm rounded-xl p-3 border border-gray-700">
                <div className="flex justify-between items-center mb-3">
                    <span className="text-[10px] text-gray-400 uppercase font-semibold">Plan</span>
                    {getPlanBadge()}
                </div>

                <div className="flex items-center gap-3">
                    {user.photoURL ? (
                        <img src={user.photoURL} alt="User" className="w-9 h-9 rounded-full border-2 border-gray-600" />
                    ) : (
                        <div className="w-9 h-9 rounded-full bg-gradient-to-r from-gray-700 to-gray-600 flex items-center justify-center text-white font-bold border-2 border-gray-500">
                            {user.displayName?.[0] || 'U'}
                        </div>
                    )}
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-white truncate">{user.displayName}</p>
                        <button onClick={onSignOut} className="text-xs text-red-400 hover:text-red-300 hover:underline transition-colors">Sign Out</button>
                    </div>
                </div>
            </div>
        </div>
      </aside>

      {/* MAIN CONTENT WRAPPER */}
      <main className="flex-1 flex flex-col relative overflow-hidden bg-black">
        {children}
      </main>
    </div>
  );
};
