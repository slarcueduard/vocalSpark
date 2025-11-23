import React, { ReactNode } from 'react';
import { User } from 'firebase/auth';
import { SparklesIcon, BriefcaseIcon, MagicWandIcon, ImageIcon } from '../components/Icons';
import { useAuth } from '../contexts/AuthContext'; // Importăm Auth pentru a citi profilul

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
    children, user, onSignOut, onOpenImageStudio, onOpenBrandProfile, currentMode, onSwitchMode 
}) => {
  
  const { userProfile } = useAuth(); // Luăm datele despre abonament

  // Helper pentru culoarea badge-ului
  const getPlanBadge = () => {
      const tier = userProfile?.subscriptionTier || 'trial';
      if (tier === 'business') return <span className="text-[10px] bg-purple-500 text-white px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">PRO</span>;
      if (tier === 'creator') return <span className="text-[10px] bg-blue-500 text-white px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">CREATOR</span>;
      return <span className="text-[10px] bg-yellow-500/20 text-yellow-400 border border-yellow-500/50 px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">TRIAL</span>;
  };

  return (
    <div className="flex h-screen bg-brand-bg-dark text-brand-text overflow-hidden">
      {/* SIDEBAR */}
      <aside className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col hidden md:flex">
        <div className="p-6 flex items-center gap-3">
          <div className="bg-gradient-to-br from-brand-primary to-blue-600 p-2 rounded-lg">
            <SparklesIcon className="w-6 h-6 text-white" />
          </div>
          <h1 className="font-bold text-xl tracking-tight">Social Spark</h1>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
            <div className="text-xs font-bold text-gray-500 uppercase px-4 mb-2">Workspace</div>
            
            <button 
                onClick={() => onSwitchMode('creator')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${currentMode === 'creator' ? 'bg-brand-primary/10 text-brand-primary border border-brand-primary/20' : 'text-gray-400 hover:bg-gray-800'}`}
            >
                <MagicWandIcon className="w-5 h-5" />
                <span className="font-medium">Creator Studio</span>
            </button>

            <button 
                onClick={() => onSwitchMode('business')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${currentMode === 'business' ? 'bg-brand-secondary/10 text-brand-secondary border border-brand-secondary/20' : 'text-gray-400 hover:bg-gray-800'}`}
            >
                <BriefcaseIcon className="w-5 h-5" />
                <span className="font-medium">Business Hub</span>
            </button>
        </nav>

        {/* USER PROFILE SECTION */}
        <div className="p-4 border-t border-gray-800">
            <div className="bg-gray-800 rounded-xl p-3">
                {/* Plan Info */}
                <div className="mb-3 flex justify-between items-center">
                    <span className="text-xs text-gray-400">Current Plan:</span>
                    {getPlanBadge()}
                </div>

                {/* Trial Progress Bar (Only for Trial) */}
                {userProfile?.subscriptionTier === 'trial' && (
                    <div className="mb-3">
                        <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                            <span>Free Trial</span>
                            <span>30 Days Left</span>
                        </div>
                        <div className="w-full bg-gray-700 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-brand-primary h-full w-1/6"></div>
                        </div>
                    </div>
                )}

                <div className="flex items-center gap-3 mt-2">
                    {user.photoURL ? (
                        <img src={user.photoURL} alt="User" className="w-8 h-8 rounded-full border border-gray-600" />
                    ) : (
                        <div className="w-8 h-8 rounded-full bg-brand-primary text-black flex items-center justify-center font-bold">
                            {user.displayName?.[0] || 'U'}
                        </div>
                    )}
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-white truncate">{user.displayName}</p>
                        <button onClick={onSignOut} className="text-xs text-red-400 hover:text-red-300 hover:underline">Logout</button>
                    </div>
                </div>
            </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        {children}
      </main>
    </div>
  );
};
