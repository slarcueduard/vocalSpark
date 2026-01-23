import React, { useState } from 'react';
import { Check, Settings, Play, ArrowRight, Loader } from 'lucide-react';
import { Platform } from '../../types'; // Adjust path if needed
import { GoalType } from './WizardStepGoal';

interface WizardStepReviewProps {
    onGenerate: (platforms: Platform[]) => void;
    onBack: () => void;
    data: {
        input: string;
        goal: GoalType;
    };
    isGenerating: boolean;
}

export const WizardStepReview: React.FC<WizardStepReviewProps> = ({ onGenerate, onBack, data, isGenerating }) => {
    // Default smart selection based on goal (Simulated AI Logic)
    const getDefaultPlatforms = (): Platform[] => {
        if (data.goal === 'hype') return [Platform.X, Platform.LinkedIn];
        if (data.goal === 'story') return [Platform.LinkedIn];
        if (data.goal === 'value') return [Platform.LinkedIn, Platform.X, Platform.Instagram];
        return [Platform.LinkedIn, Platform.X]; // Fallback
    };

    const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>(getDefaultPlatforms());

    const togglePlatform = (p: Platform) => {
        if (selectedPlatforms.includes(p)) {
            if (selectedPlatforms.length > 1) setSelectedPlatforms(prev => prev.filter(x => x !== p));
        } else {
            setSelectedPlatforms(prev => [...prev, p]);
        }
    };

    return (
        <div className="max-w-xl mx-auto animate-in fade-in slide-in-from-right-8">
            <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-white mb-2">Ready to Launch?</h2>
                <p className="text-gray-400">Review the strategy before we generate the assets.</p>
            </div>

            <div className="bg-[#161b22] border border-gray-800 rounded-2xl p-6 shadow-xl space-y-6">

                {/* 1. STRATEGY SUMMARY */}
                <div className="flex items-center justify-between p-4 bg-[#0f1115] rounded-xl border border-gray-800">
                    <div>
                        <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">STRATEGY</p>
                        <p className="text-white font-bold capitalize">{data.goal} Mode</p>
                    </div>
                    <div className="h-8 w-[1px] bg-gray-800"></div>
                    <div className="text-right">
                        <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">INTENT</p>
                        <p className="text-white text-sm truncate max-w-[150px]">{data.input}</p>
                    </div>
                </div>

                {/* 2. PLATFORMS SELECTOR */}
                <div>
                    <label className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-3 block">TARGET CHANNELS (AI SUGGESTED)</label>
                    <div className="flex gap-2">
                        {[Platform.LinkedIn, Platform.X, Platform.Instagram, Platform.Facebook].map(p => (
                            <button
                                key={p}
                                onClick={() => togglePlatform(p)}
                                className={`flex-1 py-3 rounded-lg text-sm font-bold transition flex flex-col items-center justify-center gap-1 border ${selectedPlatforms.includes(p)
                                        ? 'bg-blue-600/20 border-blue-500 text-blue-400'
                                        : 'bg-[#0f1115] border-gray-800 text-gray-600 hover:border-gray-600'
                                    }`}
                            >
                                {selectedPlatforms.includes(p) && <Check size={12} className="mb-0.5" />}
                                {p === Platform.X ? 'X (Twitter)' : p}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="pt-4 border-t border-gray-800">
                    <button
                        onClick={() => onGenerate(selectedPlatforms)}
                        disabled={isGenerating}
                        className="w-full bg-white text-black py-4 rounded-xl font-bold text-lg hover:scale-[1.02] transition shadow-lg flex items-center justify-center gap-2"
                    >
                        {isGenerating ? <Loader className="animate-spin" /> : <Play fill="currentColor" />}
                        {isGenerating ? 'Designing Campaign...' : 'Generate Campaign Plan'}
                    </button>
                    <button onClick={onBack} className="w-full text-center text-gray-500 text-sm mt-4 hover:text-white transition">Back to Goal</button>
                </div>

            </div>
        </div>
    );
};
