import React, { useState } from 'react';
import { Loader } from './Loader';
import { generateSocialMediaPosts, safeFetch } from '../services/geminiService';
import { useAuth } from '../contexts/AuthContext';
import { Copy, Check, Lock, Zap } from 'lucide-react';

interface HookGeneratorProps {
    onClose: () => void;
}

export const HookGenerator: React.FC<HookGeneratorProps> = ({ onClose }) => {
    const { userProfile, brandProfile, checkCredits, refundCredits } = useAuth();
    const [topic, setTopic] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [hooks, setHooks] = useState<any[]>([]);
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

    const isAgency = userProfile?.subscriptionTier === 'agency' || userProfile?.subscriptionTier === 'trial';

    const handleGenerateHooks = async () => {
        if (!topic.trim()) return;
        const cost = 2; // Fixed cost for Hook Batch
        if (!checkCredits(cost)) {
            alert(`Insufficient credits! This tool costs ${cost} credits.`);
            return;
        }

        setIsGenerating(true);
        try {
            // We use a custom direct fetch or a modified generate call.
            // For simplicity, let's call the generic text generator with a specific HOOK prompt
            // injected via valid params, or we can use the 'generate-text' endpoint directly here for max control.

            const prompt = `
            ROLE: Viral Social Media Strategist.
            TASK: Generate ${isAgency ? '10' : '3'} VIRAL HOOKS for the topic: "${topic}".
            TARGET AUDIENCE: ${brandProfile?.targetAudience || 'General'}.
            
            REQUIREMENTS:
            - Hooks must be under 15 words.
            - Optimize for <1.7s attention span.
            - Use psychology: Negativity Bias, Curiosity Gap, Strong Statement.
            
            OUTPUT FORMAT (JSON ARRAY):
            [
              {
                "hook": "Text of the hook...",
                "type": "Psychological Type (e.g. Negativity)",
                ${isAgency ? '"visual_cue": "Describe the visual (e.g. Text on screen, green screen bg)",' : ''}
                ${isAgency ? '"why_it_works": "1 sentence analysis",' : ''}
              }
            ]
            `;

            const data = await safeFetch('/api/generate-text', {
                prompt: prompt,
                useRealTime: false,
                isHooks: true,
            });

            // Parse the response
            let rawOutput = data.output;

            // Clean markdown JSON delimiters if present
            rawOutput = rawOutput.replace(/```json|```/g, '').trim();

            console.log("Raw Hook Output:", rawOutput);

            let strategies;
            try {
                strategies = JSON.parse(rawOutput);
                // Handle double-stringified case (common with LLM APIs)
                if (typeof strategies === 'string') {
                    strategies = JSON.parse(strategies);
                }
            } catch (e) {
                console.error("JSON Parse Error", e);
                // Fallback: try to extract array manually
                const firstBracket = rawOutput.indexOf('[');
                const lastBracket = rawOutput.lastIndexOf(']');
                if (firstBracket !== -1 && lastBracket !== -1) {
                    const arrayStr = rawOutput.substring(firstBracket, lastBracket + 1);
                    strategies = JSON.parse(arrayStr);
                } else {
                    throw new Error("Could not parse AI response.");
                }
            }

            if (!Array.isArray(strategies)) {
                throw new Error("AI response was not an array of hooks.");
            }

            setHooks(strategies);

        } catch (e: any) {
            console.error("Hook Gen Failed:", e);
            alert("Failed to generate hooks. " + e.message);
            refundCredits(cost);
        } finally {
            setIsGenerating(false);
        }
    };

    const copyToClipboard = (text: string, index: number) => {
        navigator.clipboard.writeText(text);
        setCopiedIndex(index);
        setTimeout(() => setCopiedIndex(null), 2000);
    };

    return (
        <div className="max-w-4xl mx-auto pb-20">
            <header className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-pink-500/10 rounded-lg text-pink-500"><Zap size={24} /></div>
                    <h2 className="text-2xl font-bold text-white tracking-tight">Viral Hook Generator</h2>
                </div>
                <p className="text-gray-400 text-sm">
                    Stop the scroll in 1.7 seconds. Generate psychological hooks that arrest attention.
                </p>
            </header>

            <div className="bg-[#161b22] border border-gray-800 rounded-2xl p-6 mb-8">
                <div className="flex gap-4">
                    <input
                        type="text"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        placeholder="What is your video about? (e.g., 'How to save money on taxes')"
                        className="flex-1 bg-[#0d1117] border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-pink-500 focus:ring-1 focus:ring-pink-500 outline-none transition"
                        onKeyDown={(e) => e.key === 'Enter' && handleGenerateHooks()}
                    />
                    <button
                        onClick={handleGenerateHooks}
                        disabled={isGenerating || !topic.trim()}
                        className="bg-pink-600 hover:bg-pink-500 text-white font-bold px-6 rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {isGenerating ? <Loader size={18} className="animate-spin" /> : <Zap size={18} fill="currentColor" />}
                        Generate
                    </button>
                </div>
            </div>

            {hooks.length > 0 && (
                <div className="grid grid-cols-1 gap-4">
                    {hooks.map((hook, idx) => (
                        <div key={idx} className="bg-[#161b22] border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition group relative">
                            <div className="flex justify-between items-start gap-4">
                                <div className="space-y-2 flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">{hook.type}</span>
                                        {isAgency && hook.why_it_works && <span className="text-[10px] text-green-500/80 italic border-l border-gray-700 pl-2">Brain Science: {hook.why_it_works}</span>}
                                    </div>
                                    <h3 className="text-lg font-medium text-white leading-relaxed pr-10">"{hook.hook}"</h3>

                                    {isAgency && hook.visual_cue && (
                                        <div className="mt-3 p-3 bg-[#0d1117] rounded-lg border border-gray-800 flex items-start gap-2">
                                            <span className="text-xs font-bold text-pink-500 whitespace-nowrap">🎥 Visual Cue:</span>
                                            <p className="text-xs text-gray-400">{hook.visual_cue}</p>
                                        </div>
                                    )}
                                </div>
                                <button
                                    onClick={() => copyToClipboard(hook.hook, idx)}
                                    className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white transition"
                                >
                                    {copiedIndex === idx ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
                                </button>
                            </div>
                        </div>
                    ))}

                    {!isAgency && (
                        <div className="bg-gradient-to-r from-gray-900 to-[#161b22] border border-gray-800 border-dashed rounded-xl p-8 text-center mt-4">
                            <Lock className="mx-auto text-gray-500 mb-3" size={24} />
                            <h3 className="text-white font-bold">Unlock 7 More Hooks + Visual Cues</h3>
                            <p className="text-gray-400 text-sm mb-4">Agency Plan users get 10 variations per run plus specific visual direction.</p>
                            <button className="text-pink-500 hover:text-pink-400 text-sm font-bold">Upgrade to Agency</button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
