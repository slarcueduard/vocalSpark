import React from 'react';

export function AnimatedVault() {
    return (
        <div className="flex flex-col items-center justify-center p-8 animate-in fade-in duration-700">
            <div className="relative w-48 h-48 flex items-center justify-center">
                {/* Outer Glow */}
                <div className="absolute inset-0 bg-blue-500/10 blur-3xl rounded-full animate-pulse-slow"></div>

                <svg width="200" height="200" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="relative z-10 drop-shadow-2xl">
                    <defs>
                        <linearGradient id="vaultGradient" x1="100" y1="20" x2="100" y2="180">
                            <stop offset="0%" stopColor="#3b82f6" />
                            <stop offset="100%" stopColor="#1e40af" />
                        </linearGradient>
                        <linearGradient id="lidGradient" x1="100" y1="20" x2="100" y2="100">
                            <stop offset="0%" stopColor="#60a5fa" />
                            <stop offset="100%" stopColor="#2563eb" />
                        </linearGradient>
                        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                            <feGaussianBlur stdDeviation="5" result="blur" />
                            <feComposite in="SourceGraphic" in2="blur" operator="over" />
                        </filter>
                    </defs>

                    {/* Floating Animation Container */}
                    <g className="animate-float">
                        {/* Box Body */}
                        <path
                            d="M40 80 L100 110 L160 80 L160 150 C160 165 100 190 100 190 C100 190 40 165 40 150 Z"
                            fill="url(#vaultGradient)"
                            stroke="#1e3a8a"
                            strokeWidth="2"
                        />

                        {/* Lid (Top Face) */}
                        <path
                            d="M40 80 L100 50 L160 80 L100 110 Z"
                            fill="url(#lidGradient)"
                            stroke="#60a5fa"
                            strokeWidth="1"
                            opacity="0.9"
                        />

                        {/* Internal "Holo" Grid - optional effect */}
                        <path d="M100 50 L100 110" stroke="#93c5fd" strokeWidth="0.5" opacity="0.5" />
                        <path d="M40 80 L160 80" stroke="#93c5fd" strokeWidth="0.5" opacity="0.5" />

                        {/* Lock Icon Floating Above */}
                        <g className="animate-bounce-slight" style={{ transformOrigin: 'center' }}>
                            <circle cx="100" cy="65" r="15" fill="#1e1e2e" stroke="#60a5fa" strokeWidth="2" />
                            <rect x="92" y="60" width="16" height="12" rx="2" fill="#60a5fa" />
                            <path d="M96 60 V 56 A 4 4 0 0 1 104 56 V 60" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" />
                        </g>
                    </g>

                    {/* Scanning Line Effect */}
                    <rect x="0" y="0" width="200" height="2" fill="#60a5fa" opacity="0.5" className="animate-scan">
                    </rect>
                </svg>
            </div>

            <div className="text-center mt-6 space-y-2">
                <h3 className="text-xl font-bold text-white tracking-widest uppercase">Vault Empty</h3>
                <p className="text-gray-400 text-sm">Your masterpieces will appear here.</p>
            </div>

            <style>{`
                @keyframes float {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-10px); }
                }
                @keyframes pulse-slow {
                    0%, 100% { opacity: 0.1; transform: scale(1); }
                    50% { opacity: 0.3; transform: scale(1.1); }
                }
                @keyframes bounce-slight {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-3px); }
                }
                @keyframes scan {
                    0% { transform: translateY(40px); opacity: 0; width: 0; x: 100; }
                    20% { opacity: 1; width: 120px; x: 40; }
                    80% { opacity: 1; width: 120px; x: 40; }
                    100% { transform: translateY(160px); opacity: 0; width: 0; x: 100; }
                }
                .animate-float { animation: float 6s ease-in-out infinite; }
                .animate-pulse-slow { animation: pulse-slow 4s ease-in-out infinite; }
                .animate-bounce-slight { animation: bounce-slight 3s ease-in-out infinite; }
                .animate-scan { animation: scan 3s linear infinite; }
            `}</style>
        </div>
    );
}
