import React from 'react';
import { Loader2 } from 'lucide-react';

export function ScanningImage() {
    return (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 z-20 overflow-hidden">
            {/* Background Grid Effect */}
            <div className="absolute inset-0 opacity-20" style={{
                backgroundImage: 'radial-gradient(circle at 1px 1px, #3b82f6 1px, transparent 0)',
                backgroundSize: '40px 40px'
            }}></div>

            {/* Central Scanning Frame */}
            <div className="relative w-64 h-64 border-2 border-blue-500/30 rounded-lg overflow-hidden bg-black/50 shadow-[0_0_50px_rgba(59,130,246,0.2)]">
                {/* Developing Image Placeholder */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                </div>

                {/* Scanning Bar */}
                <div className="absolute top-0 left-0 w-full h-1 bg-blue-400 shadow-[0_0_15px_#60a5fa] animate-scan-down"></div>

                {/* HUD Elements */}
                <div className="absolute top-2 left-2 text-[10px] text-blue-400 font-mono tracking-widest">AI_GENERATING...</div>
                <div className="absolute bottom-2 right-2 text-[10px] text-blue-400 font-mono">PROCESSING_LAYERS</div>

                {/* Corner Brackets */}
                <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-blue-500"></div>
                <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-blue-500"></div>
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-blue-500"></div>
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-blue-500"></div>
            </div>

            <div className="mt-8 space-y-1 text-center relative z-10">
                <p className="text-blue-400 font-bold animate-pulse tracking-[0.2em] text-sm">DEVELOPING VISUAL</p>
                <p className="text-xs text-blue-500/60 font-mono">DALL-E 3 ENGINE ACTIVE</p>
            </div>

            <style>{`
                @keyframes scan-down {
                    0% { top: 0%; opacity: 0; }
                    10% { opacity: 1; }
                    90% { opacity: 1; }
                    100% { top: 100%; opacity: 0; }
                }
                .animate-scan-down {
                    animation: scan-down 2s linear infinite;
                }
            `}</style>
        </div>
    );
}
