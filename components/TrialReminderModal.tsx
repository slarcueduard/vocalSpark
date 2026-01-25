
import React, { useEffect, useState } from 'react';
import { X, Clock, CheckCircle, Shield, Zap } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { PricingModal } from './PricingModal';

export function TrialReminderModal() {
    const { userProfile } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [showPricing, setShowPricing] = useState(false);
    const [hoursLeft, setHoursLeft] = useState<number | null>(null);

    useEffect(() => {
        if (!userProfile) return;

        // 1. Check if user is on Trial
        if (userProfile.subscriptionTier !== 'trial') return;

        // 2. Check if trialEndDate exists
        if (!userProfile.trialEndDate) return;

        const end = new Date(userProfile.trialEndDate).getTime();
        const now = new Date().getTime();
        const diffMs = end - now;
        const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));

        // 3. Logic: Show if within last 48 hours AND not expired yet
        if (diffHours > 0 && diffHours <= 48) {

            // 4. Check localStorage to avoid spamming (show once per 24h or session)
            const lastSeen = localStorage.getItem('trial_reminder_seen');
            const nowStr = new Date().toISOString();

            // Simple logic: if seen today, don't show. Or just show every refresh? 
            // Let's mimic strict "Reminder" behavior: Show every time layout mounts if < 48h to be urgent, 
            // OR better: show once per session.
            if (!sessionStorage.getItem('trial_reminder_session_seen')) {
                setHoursLeft(diffHours);
                setIsOpen(true);
                sessionStorage.setItem('trial_reminder_session_seen', 'true');
            }
        }

    }, [userProfile]);

    const handleClose = () => {
        setIsOpen(false);
    };

    const handleUpgrade = () => {
        setIsOpen(false);
        setShowPricing(true);
    };

    if (!isOpen) return (
        <>
            {/* Also mount pricing logic here if needed, or rely on MainLayout's pricing modal if accessible. 
              Since PricingModal is often in MainLayout, we might just open it there, 
              BUT MainLayout logic is separate. simpler to duplicate PricingModal triggers or 
              pass a handler. Given MainLayout has one, let's just trigger a global event or 
              use a callback if we were inside MainLayout.
              
              Refactor: I will include PricingModal here locally to ensure it works standalone.
           */}
            <PricingModal isOpen={showPricing} onClose={() => setShowPricing(false)} />
        </>
    );

    return (
        <>
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
                <div className="bg-[#161b22] border border-yellow-500/30 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden relative animate-in zoom-in-95 duration-300">

                    {/* Decorative Top */}
                    <div className="h-2 bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 w-full" />

                    <button
                        onClick={handleClose}
                        className="absolute top-4 right-4 text-gray-500 hover:text-white transition"
                    >
                        <X size={20} />
                    </button>

                    <div className="p-8 text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-yellow-500/10 mb-6 relative">
                            <Clock size={32} className="text-yellow-500 animate-pulse" />
                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full border-2 border-[#161b22] flex items-center justify-center text-[10px] font-bold text-white">!</div>
                        </div>

                        <h2 className="text-2xl font-bold text-white mb-2"> Your Free Trial Ends Soon!</h2>
                        <p className="text-gray-400 mb-6">
                            You have <span className="text-yellow-400 font-bold">{hoursLeft} hours</span> remaining.
                            Don't lose access to your generated content, voice profiles, and automation tools.
                        </p>

                        <div className="bg-[#0f1115] rounded-xl p-4 border border-gray-800 mb-8 text-left">
                            <div className="flex items-center gap-3 mb-2">
                                <Shield size={16} className="text-blue-400" />
                                <span className="text-sm font-bold text-gray-300">Keep your features:</span>
                            </div>
                            <ul className="space-y-2">
                                <li className="flex items-center gap-2 text-xs text-gray-400">
                                    <CheckCircle size={12} className="text-green-500" />
                                    Unlimited Social Post Generation
                                </li>
                                <li className="flex items-center gap-2 text-xs text-gray-400">
                                    <CheckCircle size={12} className="text-green-500" />
                                    Voice DNA & Brand Profiles
                                </li>
                                <li className="flex items-center gap-2 text-xs text-gray-400">
                                    <CheckCircle size={12} className="text-green-500" />
                                    Calendar & Scheduling
                                </li>
                            </ul>
                        </div>

                        <div className="flex flex-col gap-3">
                            <button
                                onClick={handleUpgrade}
                                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-3 rounded-xl transition shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2"
                            >
                                <Zap size={18} fill="currentColor" />
                                Choose a Plan
                            </button>
                            <button
                                onClick={handleClose}
                                className="text-gray-500 hover:text-white text-sm font-medium transition"
                            >
                                Remind me later
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <PricingModal isOpen={showPricing} onClose={() => setShowPricing(false)} />
        </>
    );
}
