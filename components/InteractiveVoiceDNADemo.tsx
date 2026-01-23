import React, { useState, useEffect } from 'react';
import { Sparkles, Zap, Smartphone, Briefcase, Plane, User, Play, RefreshCw, Copy, Check } from 'lucide-react';

const VOICES = [
    {
        id: 'gary',
        name: 'Gary Vee',
        label: 'The Hustler',
        desc: 'High energy, direct, no excuses.',
        icon: <Zap size={24} className="text-yellow-400" />,
        color: 'yellow',
        emoji: '🔥'
    },
    {
        id: 'simon',
        name: 'Simon Sinek',
        label: 'The Visionary',
        desc: 'Empathetic, "Why"-focused, leadership.',
        icon: <User size={24} className="text-blue-400" />,
        color: 'blue',
        emoji: '🌍'
    },
    {
        id: 'gpt',
        name: 'Classic ChatGPT',
        label: 'The Robot',
        desc: 'Generic, polite, robotic, boring.',
        icon: <Smartphone size={24} className="text-gray-400" />,
        color: 'gray',
        emoji: '🤖'
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


    const handleGenerate = async () => {
        setIsGenerating(true);
        setOutput(''); // Clear previous output immediately

        try {
            const response = await fetch('/api/generate-demo-post', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    topic: topic,
                    voiceId: selectedVoice.id
                })
            });

            const data = await response.json();

            if (data.error) {
                setOutput('Error: ' + data.error);
            } else {
                setOutput(data.content);
            }

        } catch (error) {
            console.error(error);
            setOutput("Ops! The AI is overloaded. Try again in a moment.");
        } finally {
            // Loading state is handled by the typing effect dependency, 
            // but we ensure it stays true until data arrives.
            // The typing effect loop will set it to false when done.
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(displayedOutput);
        setHasCopied(true);
        setTimeout(() => setHasCopied(false), 2000);
    };

    return (
        <section className="py-10 md:py-20 bg-[#0a0c10] border-y border-gray-800 relative overflow-hidden">
            {/* Background Gradients */}
            <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full blur-[100px] -z-10 opacity-20 transition-colors duration-1000 ${selectedVoice.color === 'yellow' ? 'bg-yellow-600' :
                selectedVoice.color === 'blue' ? 'bg-blue-600' :
                    selectedVoice.color === 'gray' ? 'bg-gray-600' : 'bg-pink-600'
                }`}></div>

            <div className="max-w-6xl mx-auto px-6">
                <div className="text-center mb-8 md:mb-12">
                    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-900/30 border border-purple-500/30 text-purple-300 text-[10px] font-bold uppercase tracking-wider mb-4 animate-in fade-in slide-in-from-bottom-2">
                        <Sparkles size={12} /> Live Interactive Demo
                    </span>
                    <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 md:mb-6">
                        Voice DNA in Action
                    </h2>
                    <p className="text-gray-400 max-w-2xl mx-auto text-lg">
                        Select a brand voice below, enter your topic, and watch AI generate content that matches that exact style.
                    </p>
                    <p className="text-blue-400 font-medium mt-4 animate-pulse hidden md:block">
                        You can clone any influencer style and your posts can sound just like them.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                    {/* LEFT: Controls */}
                    <div className="lg:col-span-5 space-y-6 md:space-y-8">
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 block">Step 1: Choose a Voice DNA Profile</label>
                            {/* Grid on mobile, Stack on Desktop */}
                            <div className="grid grid-cols-3 lg:grid-cols-1 gap-2 md:space-y-3 md:gap-0">
                                {VOICES.map(voice => (
                                    <button
                                        key={voice.id}
                                        onClick={() => setSelectedVoice(voice)}
                                        className={`w-full flex flex-col md:flex-row items-center md:gap-4 p-3 md:p-4 rounded-xl border transition-all duration-300 text-center md:text-left group ${selectedVoice.id === voice.id
                                            ? `bg-[#161b22] border-${voice.color}-500 ring-1 ring-${voice.color}-500/50 shadow-lg shadow-${voice.color}-900/20`
                                            : 'bg-[#161b22]/50 border-gray-800 hover:border-gray-700 hover:bg-[#161b22]'
                                            }`}
                                    >
                                        <div className={`w-10 h-10 md:w-12 md:h-12 rounded-lg flex items-center justify-center transition-colors mb-2 md:mb-0 ${selectedVoice.id === voice.id ? `bg-${voice.color}-500/20` : 'bg-gray-800'
                                            }`}>
                                            {voice.icon}
                                        </div>
                                        <div>
                                            <div className="flex flex-col md:flex-row items-center gap-1 md:gap-2 justify-center md:justify-start">
                                                <h3 className={`font-bold text-xs md:text-base transition-colors ${selectedVoice.id === voice.id ? 'text-white' : 'text-gray-300 group-hover:text-white'}`}>
                                                    {voice.name}
                                                </h3>
                                                {selectedVoice.id === voice.id && <span className={`text-[8px] md:text-[10px] bg-${voice.color}-500 text-white px-1.5 rounded font-bold`}>ACTIVE</span>}
                                            </div>
                                            <p className="text-[10px] md:text-xs text-gray-500 mt-1 hidden md:block">{voice.desc}</p>
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
                                    className="w-full bg-[#161b22] border border-gray-700 text-white rounded-xl px-4 py-4 pr-12 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition shadow-inner text-sm md:text-base"
                                    placeholder="Enter a topic..."
                                />
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
                                    ✍️
                                </div>
                            </div>
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

                            <div className="bg-[#000000] border border-gray-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden min-h-[300px] md:min-h-[400px]">
                                {/* Header */}
                                <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-800">
                                    <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center bg-${selectedVoice.color}-500 text-white font-bold`}>
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
                                    <div className="min-h-[100px] md:min-h-[120px] text-base md:text-lg leading-relaxed text-gray-200 whitespace-pre-wrap font-medium">
                                        {displayedOutput}
                                        {isGenerating && <span className="inline-block w-2 h-5 bg-blue-500 ml-1 animate-pulse"></span>}
                                    </div>

                                    {/* Action Bar */}
                                    <div className="flex items-center justify-between pt-4 text-gray-500 border-t border-gray-900">
                                        <div className="flex gap-4 text-xs">
                                            <span>❤️ 1.2k</span>
                                            <span>💬 48</span>
                                        </div>
                                        <div className="text-xs">
                                            🔥 Voice Match: 99%
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Mobile Scroll Hint */}
                            <div className="md:hidden text-center mt-4 text-xs text-gray-600 animate-pulse">
                                Scroll down for more 👇
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
}
