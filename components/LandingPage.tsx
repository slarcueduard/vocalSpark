import React from 'react';
import { Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';
import { GoogleIcon } from './Icons'; // Asigură-te că ai iconița Google aici sau o refacem mai jos

interface LandingPageProps {
  onLogin: () => void;
}

export function LandingPage({ onLogin }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-[#0f1115] text-white flex flex-col font-sans selection:bg-blue-500/30">
      
      {/* --- NAVIGATION --- */}
      <nav className="w-full px-6 py-6 flex justify-between items-center max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-900/20">
            <Sparkles className="text-white" size={18} fill="currentColor" />
          </div>
          <span className="text-lg font-bold tracking-tight">Social Spark</span>
        </div>
        <a 
            href="https://www.velocityautomationai.com" 
            className="text-sm text-gray-400 hover:text-white transition-colors"
        >
            Back to Website
        </a>
      </nav>

      {/* --- HERO SECTION --- */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 relative overflow-hidden">
        
        {/* Background Glow Effects */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[128px] -z-10" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-[128px] -z-10" />

        <div className="text-center max-w-3xl mx-auto z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-900/20 border border-blue-800/50 text-blue-400 text-xs font-bold mb-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            v1.4 Now Available
          </div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white via-gray-200 to-gray-500 animate-in fade-in slide-in-from-bottom-5 duration-700">
            Create Viral Content <br />
            <span className="text-white">in Seconds.</span>
          </h1>

          <p className="text-lg text-gray-400 mb-10 max-w-xl mx-auto animate-in fade-in slide-in-from-bottom-6 duration-1000">
            The AI-powered workspace for creators and agencies. Generate posts, design visuals, and manage your brand identity in one place.
          </p>

          {/* --- LOGIN CARD --- */}
          <div className="flex flex-col items-center gap-4 animate-in fade-in slide-in-from-bottom-8 duration-1000">
            <button 
              onClick={onLogin}
              className="group relative px-8 py-4 bg-white text-black rounded-xl font-bold text-lg flex items-center gap-3 hover:scale-[1.02] transition-all shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)]"
            >
              <GoogleIcon className="w-6 h-6" />
              <span>Continue with Google</span>
              <ArrowRight size={18} className="text-gray-400 group-hover:text-black group-hover:translate-x-1 transition-all" />
            </button>
            
            <p className="text-xs text-gray-500 mt-4">
              By continuing, you agree to our Terms of Service and Privacy Policy.
            </p>
          </div>
        </div>

        {/* --- APP PREVIEW (Mockup vizual) --- */}
        <div className="mt-16 w-full max-w-5xl relative z-0 perspective-1000 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-200">
            {/* Un "screenshot" stilizat făcut din CSS */}
            <div className="relative rounded-t-2xl border border-gray-800 bg-[#161b22]/80 backdrop-blur-xl p-2 shadow-2xl transform rotate-x-12 origin-bottom opacity-80 mask-linear-gradient">
                <div className="rounded-xl bg-[#0f1115] border border-gray-800 aspect-[16/9] flex items-center justify-center overflow-hidden relative">
                    {/* Abstract UI Elements */}
                    <div className="absolute top-0 left-0 w-64 h-full border-r border-gray-800 bg-[#161b22]/50 p-4 space-y-4">
                        <div className="h-8 w-32 bg-gray-800 rounded-lg" />
                        <div className="h-4 w-20 bg-gray-800/50 rounded" />
                        <div className="h-4 w-24 bg-gray-800/50 rounded" />
                    </div>
                    <div className="absolute top-4 right-4 flex gap-2">
                        <div className="h-8 w-24 bg-blue-600/20 rounded-lg border border-blue-500/30" />
                    </div>
                    <div className="text-center space-y-3">
                        <div className="w-16 h-16 bg-blue-500/20 rounded-full mx-auto flex items-center justify-center border border-blue-500/50">
                            <Sparkles className="text-blue-400" size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-gray-700">AI Workspace Active</h3>
                    </div>
                </div>
                
                {/* Gradient Overlay la baza imaginii pt blending */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0f1115] via-transparent to-transparent pointer-events-none" />
            </div>
        </div>

      </main>

      {/* --- FOOTER --- */}
      <footer className="py-8 border-t border-gray-800 text-center text-xs text-gray-600">
        <p>&copy; 2024 Velocity Automation AI. All rights reserved.</p>
      </footer>
    </div>
  );
}

// Iconita Google (daca nu o ai importata, o definim aici local)
function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.84z" fill="#FBBC05" />
      <path d="M12 4.6c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 1.09 14.97 0 12 0 7.7 0 3.99 2.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}
