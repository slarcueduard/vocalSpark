import React, { useState, useEffect } from 'react';
import { Sparkles, Zap, Smartphone, Briefcase, Plane, User, Play, RefreshCw, Copy, Check } from 'lucide-react';

const VOICES = [
    {
        id: 'gary',
        name: 'Business Guru',
        label: 'Gary V Style',
        desc: 'High Energy, Direct, Hustle-Focused',
        icon: <Zap size={24} className="text-yellow-400" />,
        color: 'yellow',
        emoji: '🔥',
        templates: [
            "Stop overthinking {topic}! 🛑 It doesn't matter if you're ready. What matters is EXECUTION. speed > perfection. Go breaks things! 🚀 #Hustle",
            "You're worried about {topic}? Why? Because you care what other people think? 😤 ONE LIFE. doing > planning. Get after it! 🔥",
            "The truth about {topic} is simple: NOBODY CARES until you make them care. Put in the work. 14 hours a day. Let's go! 👊"
        ]
    },
    {
        id: 'tech',
        name: 'Tech SaaS CEO',
        label: 'Silicon Valley',
        desc: 'Professional, Visionary, Jargon-Heavy',
        icon: <Briefcase size={24} className="text-blue-400" />,
        color: 'blue',
        emoji: '🚀',
        templates: [
            "When we think about {topic}, we need to look at the underlying infrastructure. It's about scalability and seamless integration. 💡 #TechTrends #SaaS",
            "Disrupting the {topic} space requires a paradigm shift. We aren't just building features; we're architecting ecosystems. 🌐",
            "Optimizing for {topic} is the key differentiator in Q4. It's not just data; it's actionable intelligence. 📈 #Growth"
        ]
    },
    {
        id: 'travel',
        name: 'Travel Influencer',
        label: 'Wanderlust',
        desc: 'Aesthetic, Emotional, Emoji-Heavy',
        icon: <Plane size={24} className="text-pink-400" />,
        color: 'pink',
        emoji: '✨',
        templates: [
            "POV: You just discovered the magic of {topic} ✨✈️. Literally obsessed. Adding this to my bucket list ASAP! 💖 #Wanderlust",
            "Romanticizing {topic} today... 🌸 There's something so special about just being in the moment. Who else feels this? 👇☕️",
            "Current mood: sipping coffee and thinking about {topic} 🌊. Life is too short for bad vibes. Sending love! 💌"
        ]
    }
];

export function InteractiveVoiceDNADemo() {
    const [selectedVoice, setSelectedVoice] = useState(VOICES[0]);
    const [topic, setTopic] = useState('growing a business');
    const [isGenerating, setIsGenerating] = useState(false);
    const [output, setOutput] = useState('');
    const [displayedOutput, setDisplayedOutput] = useState('');
    const [hasCopied, setHasCopied] = useState(false);

    // Initial output generation
    useEffect(() => {
        handleGenerate();
    }, []);

    // Typing effect
    useEffect(() => {
        if (!output) {
            setDisplayedOutput('');
            return;
        }

        // If we just clicked generate, clear displayed and start typing
        if (isGenerating) {
            setDisplayedOutput('');
            let i = 0;
            const speed = 15; // ms per char
            const interval = setInterval(() => {
                setDisplayedOutput(output.substring(0, i));
                i++;
                if (i > output.length) {
                    clearInterval(interval);
                    setIsGenerating(false);
                }
            }, speed);
            return () => clearInterval(interval);
        }
    }, [output, isGenerating]);


    const handleGenerate = () => {
        setIsGenerating(true);
        // Simulate "thinking" delay briefly for realism if triggered by user, 
        // but for initial load maybe instant? Let's keep it snappy.

        // Select random template
        const templates = selectedVoice.templates;
        const randomTemplate = templates[Math.floor(Math.random() * templates.length)];

        // Simple replacement logic
        // We handle title case for topic if needed, but raw is usually fine
        const generated = randomTemplate.replace(/{topic}/g, topic);

        setOutput(generated);
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(displayedOutput);
        setHasCopied(true);
        setTimeout(() => setHasCopied(false), 2000);
    };

    return (
        <section className="py-20 bg-[#0a0c10] border-y border-gray-800 relative overflow-hidden">
            {/* Background Gradients */}
            <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full blur-[100px] -z-10 opacity-20 transition-colors duration-1000 ${selectedVoice.color === 'yellow' ? 'bg-yellow-600' :
                    selectedVoice.color === 'blue' ? 'bg-blue-600' : 'bg-pink-600'
                }`}></div>

            <div className="max-w-6xl mx-auto px-6">
                <div className="text-center mb-12">
                    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-900/30 border border-purple-500/30 text-purple-300 text-[10px] font-bold uppercase tracking-wider mb-4 animate-in fade-in slide-in-from-bottom-2">
                        <Sparkles size={12} /> Live Interactive Demo
                    </span>
                    <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
                        Voice DNA in Action
                    </h2>
                    <p className="text-gray-400 max-w-2xl mx-auto text-lg">
                        Select a brand voice below, enter your topic, and watch AI generate content that matches that exact style. Same topic, completely different personalities.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                    {/* LEFT: Controls (Voice Selector & Input) */}
                    <div className="lg:col-span-5 space-y-8">
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 block">Step 1: Choose a Voice DNA Profile</label>
                            <div className="space-y-3">
                                {VOICES.map(voice => (
                                    <button
                                        key={voice.id}
                                        onClick={() => setSelectedVoice(voice)}
                                        className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all duration-300 text-left group ${selectedVoice.id === voice.id
                                                ? `bg-[#161b22] border-${voice.color}-500 ring-1 ring-${voice.color}-500/50 shadow-lg shadow-${voice.color}-900/20`
                                                : 'bg-[#161b22]/50 border-gray-800 hover:border-gray-700 hover:bg-[#161b22]'
                                            }`}
                                    >
                                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center transition-colors ${selectedVoice.id === voice.id ? `bg-${voice.color}-500/20` : 'bg-gray-800'
                                            }`}>
                                            {voice.icon}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className={`font-bold transition-colors ${selectedVoice.id === voice.id ? 'text-white' : 'text-gray-300 group-hover:text-white'}`}>
                                                    {voice.name}
                                                </h3>
                                                {selectedVoice.id === voice.id && <span className={`text-[10px] bg-${voice.color}-500 text-white px-1.5 rounded font-bold`}>ACTIVE</span>}
                                            </div>
                                            <p className="text-xs text-gray-500 mt-1">{voice.desc}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 block">Step 2: Your Topic</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={topic}
                                    onChange={(e) => setTopic(e.target.value)}
                                    className="w-full bg-[#161b22] border border-gray-700 text-white rounded-xl px-4 py-4 pr-12 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition shadow-inner"
                                    placeholder="Enter a topic..."
                                />
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
                                    ✍️
                                </div>
                            </div>
                            <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                                <span className="text-yellow-500">💡</span> Try "remote work", "Bitcoin", or "workout routines"
                            </p>
                        </div>

                        <button
                            onClick={handleGenerate}
                            disabled={isGenerating || !topic.trim()}
                            className={`w-full py-4 rounded-xl font-bold text-white text-lg flex items-center justify-center gap-2 shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98] ${selectedVoice.color === 'yellow' ? 'bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-500 hover:to-orange-500 shadow-orange-900/30' :
                                    selectedVoice.color === 'blue' ? 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 shadow-blue-900/30' :
                                        'bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 shadow-pink-900/30'
                                }`}
                        >
                            {isGenerating ? <RefreshCw className="animate-spin" /> : <Sparkles />}
                            {isGenerating ? 'Generating...' : `Generate with ${selectedVoice.name}`}
                        </button>
                    </div>

                    {/* RIGHT: Output (Phone Preview Style) */}
                    <div className="lg:col-span-7 flex justify-center lg:justify-end">
                        <div className="relative w-full max-w-md">
                            {/* Phone Frame */}
                            <div className="absolute inset-0 bg-gradient-to-tr from-gray-800 to-gray-900 blur-xl opacity-50 -z-10 rounded-3xl"></div>

                            <div className="bg-[#000000] border border-gray-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden min-h-[400px]">
                                {/* Header */}
                                <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-800">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-${selectedVoice.color}-500 text-white font-bold`}>
                                        {selectedVoice.name[0]}
                                    </div>
                                    <div>
                                        <div className="text-white font-bold text-sm flex items-center gap-1">
                                            {selectedVoice.name} <div className="text-blue-400 bg-blue-400/10 rounded-full p-[2px]"><Check size={8} strokeWidth={4} /></div>
                                        </div>
                                        <div className="text-xs text-gray-500">Just now • {selectedVoice.label}</div>
                                    </div>
                                    <div className="ml-auto">
                                        <button onClick={handleCopy} className="p-2 hover:bg-gray-800 rounded-full text-gray-400 transition">
                                            {hasCopied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                                        </button>
                                    </div>
                                </div>

                                {/* Content Area */}
                                <div className="space-y-4">
                                    <div className="min-h-[120px] text-lg leading-relaxed text-gray-200 whitespace-pre-wrap font-medium">
                                        {displayedOutput}
                                        {isGenerating && <span className="inline-block w-2 h-5 bg-blue-500 ml-1 animate-pulse"></span>}
                                    </div>

                                    {/* Simulated Image Placeholder */}
                                    <div className="aspect-video bg-[#161b22] rounded-xl flex items-center justify-center border border-gray-800 relative overflow-hidden group">
                                        <div className={`absolute inset-0 opacity-20 bg-${selectedVoice.color}-600/20`}></div>
                                        <div className="text-center z-10 transition-transform duration-500 group-hover:scale-110">
                                            <div className="text-4xl mb-2">{selectedVoice.emoji}</div>
                                            <div className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Visual Style: {selectedVoice.label}</div>
                                        </div>
                                    </div>

                                    {/* Action Bar */}
                                    <div className="flex items-center justify-between pt-4 text-gray-500">
                                        <div className="flex gap-4 text-xs">
                                            <span>❤️ 1.2k</span>
                                            <span>💬 48</span>
                                            <span>🔄 125</span>
                                        </div>
                                        <div className="text-xs">
                                            🔥 Voice Match: 99%
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Floating Tooltip */}
                            {!isGenerating && output && (
                                <div className="absolute -right-4 top-20 bg-green-500 text-black text-xs font-bold px-3 py-1.5 rounded-full shadow-lg animate-in fade-in slide-in-from-left-2 flex items-center gap-1">
                                    <Check size={12} /> Generated in 0.2s
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
}
