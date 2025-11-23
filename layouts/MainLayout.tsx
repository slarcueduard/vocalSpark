import React from 'react';
import type { User } from 'firebase/auth';
import { 
    SparklesIcon, 
    SettingsIcon, 
    UserPlusIcon, 
    BriefcaseIcon, 
    PaletteIcon, 
    LayoutIcon, 
    HomeIcon 
} from '../components/Icons';
import { AppMode } from '../types';
import { useAuth } from '../contexts/AuthContext';

interface MainLayoutProps {
  user: User;
  onSignOut: () => void;
  onOpenImageStudio: () => void;
  onOpenBrandProfile: () => void;
  currentMode: AppMode;
  onSwitchMode: (mode: AppMode) => void;
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ 
    user, 
    onSignOut, 
    onOpenImageStudio, 
    onOpenBrandProfile, 
    currentMode,
    onSwitchMode,
    children 
}) => {
  const { isTrialExpired, daysRemaining } = useAuth();

  return (
    <div className="h-screen bg-brand-bg-dark text-brand-text font-sans flex overflow-hidden">
      {/* 1. LEFT SIDEBAR */}
      <aside className="w-20 lg:w-64 flex-shrink-0 border-r border-gray-800 bg-brand-bg-light/30 flex flex-col transition-all duration-300">
        {/* Logo Area */}
        <div className="h-16 flex items-center justify-center lg:justify-start lg:px-6 border-b border-gray-800">
             <SparklesIcon className="w-8 h-8 text-brand-primary flex-shrink-0" />
             <h1 className="ml-3 font-bold text-xl tracking-tight hidden lg:block bg-gradient-to-r from-brand-primary to-brand-secondary text-transparent bg-clip-text">
                Social Spark
             </h1>
        </div>

        {/* Navigation - Unlocked for Guest & Users */}
        <nav className="flex-1 py-6 px-3 space-y-2">
            <div className="px-3 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider hidden lg:block">
                Workspace
            </div>
            
            <button 
                onClick={() => onSwitchMode('creator')}
                className={`w-full flex items-center justify-center lg:justify-start gap-3 px-3 py-3 rounded-xl transition-all duration-200 group ${
                    currentMode === 'creator' 
                    ? 'bg-brand-primary/10 text-brand-primary border border-brand-primary/20 shadow-glow' 
                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`}
            >
                <PaletteIcon className={`w-5 h-5 ${currentMode === 'creator' ? 'text-brand-primary' : 'group-hover:text-white'}`} />
                <span className="hidden lg:block font-medium">Creator Studio</span>
            </button>

            <button 
                onClick={() => onSwitchMode('business')}
                className={`w-full flex items-center justify-center lg:justify-start gap-3 px-3 py-3 rounded-xl transition-all duration-200 group ${
                    currentMode === 'business' 
                    ? 'bg-brand-secondary/10 text-brand-secondary border border-brand-secondary/20 shadow-glow' 
                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`}
            >
                <BriefcaseIcon className={`w-5 h-5 ${currentMode === 'business' ? 'text-brand-secondary' : 'group-hover:text-white'}`} />
                <span className="hidden lg:block font-medium">Business Hub</span>
            </button>
        </nav>

        {/* User Footer */}
        <div className="p-4 border-t border-gray-800 bg-black/20">
            {!isTrialExpired && (
                <div className="mb-4 bg-brand-primary/20 rounded-lg p-2 text-center hidden lg:block">
                    <p className="text-xs font-bold text-brand-primary">{daysRemaining} Days Left</p>
                    <p className="text-[10px] text-brand-text-secondary">Free Trial</p>
                </div>
            )}
            
            <div className="flex items-center justify-center lg:justify-between">
                 <div className="flex items-center gap-2 hidden lg:flex">
                    {user.photoURL ? (
                        <img src={user.photoURL} alt="User" className="w-8 h-8 rounded-full border border-gray-600" />
                    ) : (
                         <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-xs">U</div>
                    )}
                    <div className="overflow-hidden">
                        <p className="text-sm font-semibold truncate w-24">{user.displayName || 'User'}</p>
                    </div>
                 </div>
                 <button onClick={onSignOut} className="text-xs text-brand-text-secondary hover:text-red-400 transition p-2 rounded-lg hover:bg-white/5">
                    <span className="hidden lg:inline">Logout</span>
                    <span className="lg:hidden">🚪</span>
                 </button>
            </div>
        </div>
      </aside>

      {/* 2. MAIN CONTENT AREA (Editor + Preview) */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
         {children}
      </main>
    </div>
  );
};
