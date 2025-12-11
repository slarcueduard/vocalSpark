import React, { useState, useEffect } from 'react';
import { Sparkles, Wand2, Check } from 'lucide-react';

const VOICE_PROFILES = [
    {
        name: "Travel Influencer",
        tone: "Casual & Adventurous",
        emoji: "60%",
        color: "from-orange-600 to-yellow-600"
    },
    {
        name: "Tech SaaS CEO",
        tone: "Professional & Direct",
        emoji: "10%",
        color: "from-blue-600 to-purple-600"
    },
    {
        name: "Fitness Coach",
        tone: "Motivational & Energetic",
        emoji: "80%",
        color: "from-green-600 to-teal-600"
    }
];

const SAMPLE_OUTPUTS = {
    "Travel Influencer": "Just discovered this HIDDEN gem in Bali 😍✨ The kind of place that makes you forget your worries exist. Swipe to see why I'm never leaving 🌴 (JK, flight's tomorrow 😅) #BaliVibes #TravelGoals",
    "Tech SaaS CEO": "Shipped v2.0 today. New features: AI-powered analytics, real-time dashboards, and API integrations. 3x faster than v1. No fluff, just results. Early access link in bio.",
    "Fitness Coach": "💪 DAY 30 TRANSFORMATION ALERT! 💪 This is what happens when you show up EVERY. SINGLE. DAY. No shortcuts. No excuses. Just pure dedication! 🔥 Who's ready to start their journey? Drop a 💯 below!"
};

export function InteractiveVoiceDNADemo() {
    const [selectedProfile, setSelectedProfile] = useState(0);
    const [isGenerating, setIsGenerating] = useState(false);
    const [displayedText, setDisplayedText] = useState("");
    const [showOutput, setShowOutput] = useState(false);

    const currentProfile = VOICE_PROFILES[selectedProfile];
    const targetText = SAMPLE_OUTPUTS[currentProfile.name as keyof typeof SAMPLE_OUTPUTS];

    // Typing animation effect
    useEffect(() => {
        if (!isGenerating) return;

        setDisplayedText("");
        setShowOutput(true);
        let index = 0;

        const interval = setInterval(() => {
            if (index < targetText.length) {
                setDisplayedText((prev) => prev + targetText[index]);
                index++;
            } else {
                setIsGenerating(false);
                clearInterval(interval);
            }
        }, 30);

        return () => clearInterval(interval);
    }, [isGenerating, targetText]);

    const handleGenerate = () => {
        setIsGenerating(true);
        setShowOutput(false);
        // Simulate 500ms loading before typing starts
        setTimeout(() => setShowOutput(true), 500);
    };

    return (
        <section className="py-20 px-6 bg-[#161b22]/50">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-900/20 border border-purple-500/30 rounded-full mb-4">
                        <Wand2 size={16} className="text-purple-400" />
                        <span className="text-purple-400 text-xs font-bold uppercase tracking-wider">
                            Interactive Demo
                        </span>
                    </div>
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                        Voice DNA in Action
                    </h2>
                    <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                        Select a brand voice below and watch AI generate content that matches that exact style. Same topic, different personalities.
                    </p>
                </div>

                {/* Demo Interface */}
                <div className="bg-gradient-to-br from-[#0f1115] to-[#161b22] border border-gray-800 rounded-2xl p-8 shadow-2xl">

                    {/* Step 1: Select Voice Profile */}
                    <div className="mb-8">
                        <label className="text-sm font-bold text-gray-300 uppercase tracking-wider mb-4 block">
                            Step 1: Choose a Voice DNA Profile
                        </label>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {VOICE_PROFILES.map((profile, index) => (
                                <button
                                    key={profile.name}
                                    onClick={() => setSelectedProfile(index)}
                                    className={`relative p-4 rounded-xl border-2 transition-all text-left ${selectedProfile === index
                                            ? 'border-purple-500 bg-purple-900/20 scale-105'
                                            : 'border-gray-700 hover:border-gray-600 bg-gray-800/30'
                                        }`}
                                >
                                    {selectedProfile === index && (
                                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center">
                                            <Check size={14} className="text-white" />
                                        </div>
                                    )}
                                    <div className={`w-12 h-12 bg-gradient-to-br ${profile.color} rounded-lg mb-3 flex items-center justify-center`}>
                                        <Sparkles size={24} className="text-white" />
                                    </div>
                                    <h3 className="font-bold text-white mb-1">{profile.name}</h3>
                                    <p className="text-xs text-gray-400 mb-2">{profile.tone}</p>
                                    <div className="flex items-center gap-2 text-[10px] text-gray-500">
                                        <span>Emoji: {profile.emoji}</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Step 2: Topic Input (Static for demo) */}
                    <div className="mb-8">
                        <label className="text-sm font-bold text-gray-300 uppercase tracking-wider mb-3 block">
                            Step 2: Topic
                        </label>
                        <div className="bg-[#0a0c10] border border-gray-700 rounded-xl p-4">
                            <p className="text-gray-400 italic text-sm">
                                "Share my latest achievement and inspire my audience"
                            </p>
                        </div>
                    </div>

                    {/* Generate Button */}
                    <button
                        onClick={handleGenerate}
                        disabled={isGenerating}
                        className="w-full py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold rounded-xl flex items-center justify-center gap-3 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed mb-8"
                    >
                        {isGenerating ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Generating...
                            </>
                        ) : (
                            <>
                                <Sparkles size={20} />
                                Generate with {currentProfile.name}
                            </>
                        )}
                    </button>

                    {/* Output Display */}
                    {showOutput && (
                        <div className="bg-[#0a0c10] border border-purple-500/30 rounded-xl p-6 animate-in fade-in slide-in-from-bottom-4">
                            <div className="flex items-center gap-2 mb-4 pb-4 border-b border-gray-800">
                                <div className={`w-8 h-8 bg-gradient-to-br ${currentProfile.color} rounded-full flex items-center justify-center shrink-0`}>
                                    <Sparkles size={16} className="text-white" />
                                </div>
                                <div>
                                    <p className="text-white font-bold text-sm">{currentProfile.name}</p>
                                    <p className="text-gray-500 text-xs">{currentProfile.tone}</p>
                                </div>
                            </div>

                            <div className="min-h-[100px]">
                                <p className="text-gray-200 text-base leading-relaxed">
                                    {displayedText}
                                    {isGenerating && (
                                        <span className="inline-block w-0.5 h-4 bg-purple-500 ml-1 animate-pulse" />
                                    )}
                                </p>
                            </div>

                            {!isGenerating && (
                                <div className="mt-6 pt-4 border-t border-gray-800 flex items-center justify-between">
                                    <p className="text-xs text-gray-500">
                                        ✨ Generated with Voice DNA technology
                                    </p>
                                    <button className="text-xs text-purple-400 hover:text-purple-300 font-medium transition">
                                        Copy to Clipboard
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Explanation */}
                <div className="mt-8 text-center">
                    <p className="text-gray-400 text-sm">
                        Notice how each profile generates completely different content for the same topic? <br />
                        That's the power of <strong className="text-purple-400">Voice DNA</strong> - consistent brand voice, every single time.
                    </p>
                </div>
            </div>
        </section>
    );
}
