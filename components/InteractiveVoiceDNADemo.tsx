import React, { useState, useEffect } from 'react';
import { Sparkles, Wand2, Check, Copy, CheckCircle2 } from 'lucide-react';

const VOICE_PROFILES = [
    {
        name: "Travel Influencer",
        tone: "Casual & Adventurous",
        emoji: "60%",
        color: "from-orange-600 to-yellow-600",
        defaultTopic: "Share my latest travel adventure and inspire my audience",
        exampleResponse: (topic: string) => {
            if (topic.toLowerCase().includes('product') || topic.toLowerCase().includes('launch')) {
                return "OMG you guys!! 🎉✨ I've been working on something AMAZING behind the scenes and it's finally here! This product literally changed how I travel and I just HAD to share it with you all 🌍💫 \n\nSwipe to see why I'm obsessed → The quality is insane and it's perfect for adventures like mine! Who else is ready to level up their travel game? 🙌 Comment '✈️' if you want the link! #TravelEssentials #NewDrop";
            }
            if (topic.toLowerCase().includes('achievement') || topic.toLowerCase().includes('milestone')) {
                return "Guys I'm literally crying happy tears right now 😭✨ Just hit a HUGE milestone and I had to share this moment with you! 🎊 \n\nRemember when I started this journey scared AF? Look at us now! 🚀 This proves that if you stay consistent and keep pushing, anything is possible 💪 Thank you for being on this ride with me! \n\nDrop a 🔥 if this inspired you! Let's celebrate together! 🥂 #DreamBig #MilestoneUnlocked";
            }
            return "Just discovered this HIDDEN gem and I'm literally speechless 😍✨ The kind of place that makes you forget all your worries exist! \n\nThe views? UNREAL 🌅 The vibes? Immaculate 💯 The memories? Priceless 🎬 \n\nSwipe to see why I'm never leaving this paradise 🌴 (JK flight's tomorrow 😅) Who else needs a sign like this to book that trip? Tag your travel buddy! ✈️ #Wanderlust #TravelGoals #HiddenGems";
        }
    },
    {
        name: "Tech SaaS CEO",
        tone: "Professional & Direct",
        emoji: "10%",
        color: "from-blue-600 to-purple-600",
        defaultTopic: "Announce my product launch and drive signups",
        exampleResponse: (topic: string) => {
            if (topic.toLowerCase().includes('achievement') || topic.toLowerCase().includes('milestone')) {
                return "Hit $1M ARR today. 18 months from launch.\n\nKey drivers:\n• Product-market fit (NPS 72)\n• Word-of-mouth (60% organic)\n• Zero paid ads\n\nNext milestone: $5M by Q4 2025.\n\nLesson learned: Build something people actually need. Distribution follows.";
            }
            if (topic.toLowerCase().includes('travel') || topic.toLowerCase().includes('adventure')) {
                return "Took the team off-grid for 3 days. No Slack. No email. \n\nResult: Best strategic decisions we've made all quarter.\n\nProductivity isn't about more hours. It's about clearer thinking.\n\nScheduling these quarterly now.";
            }
            return "Shipped v2.0 today.\n\nNew features:\n• AI-powered analytics\n• Real-time dashboards  \n• Native API integrations\n\n3x faster than v1. 50% lower latency.\n\nEarly access: [link in bio]\n\nNo fluff. Just results.";
        }
    },
    {
        name: "Fitness Coach",
        tone: "Motivational & Energetic",
        emoji: "80%",
        color: "from-green-600 to-teal-600",
        defaultTopic: "Share client transformation and motivate my community",
        exampleResponse: (topic: string) => {
            if (topic.toLowerCase().includes('product') || topic.toLowerCase().includes('launch')) {
                return "🚨 GAME CHANGER ALERT!! 🚨\n\nI've been DYING to share this with you! 💪🔥 The product I've been using with my clients that's getting INSANE results is finally available to YOU! \n\nThis isn't just another supplement or gadget - this is the REAL DEAL that helped my clients:\n✅ Drop 20+ lbs\n✅ Build SERIOUS muscle\n✅ Have MORE energy than ever!\n\nWho's ready to TRANSFORM their body?! 💯 Comment 'READY' and I'll send you the details! Let's GET IT! 🙌💥 #FitnessRevolution #TransformationStation";
            }
            if (topic.toLowerCase().includes('travel') || topic.toLowerCase().includes('adventure')) {
                return "🏔️ ADVENTURE GAINS!! 🏔️\n\nJust got back from the most INCREDIBLE hiking trip and my body feels ALIVE! 💪✨ \n\nHere's the thing - fitness isn't just about the gym! It's about EXPERIENCING life! Climbing mountains, chasing sunsets, FEELING that burn in your legs as you conquer that peak! 🔥\n\nYour body was MADE to move! Who else is ready to take their fitness OUTSIDE? Drop a 🏃 below! Let's make exercise an ADVENTURE! #FitnessLifestyle #OutdoorWorkout #EpicLife";
            }
            return "💪 30-DAY TRANSFORMATION ALERT!! 💪\n\nThis is what happens when you show up EVERY. SINGLE. DAY! 🔥\n\nLook at this INCREDIBLE progress! 📸 Same person. Same gym. Different MINDSET! 🧠💯\n\nNo shortcuts ❌\nNo excuses ❌  \nJust PURE DEDICATION! ✅\n\nYou don't need to be perfect - you need to be CONSISTENT! Who's ready to start their own transformation journey?! 🙌\n\nDrop a 💯 below if this fired you UP! LET'S GOOO! 🚀 #TransformationTuesday #FitnessMotivation #NoExcuses";
        }
    }
];

export function InteractiveVoiceDNADemo() {
    const [selectedProfile, setSelectedProfile] = useState(0);
    const [customTopic, setCustomTopic] = useState(VOICE_PROFILES[0].defaultTopic);
    const [isGenerating, setIsGenerating] = useState(false);
    const [displayedText, setDisplayedText] = useState("");
    const [generatedContent, setGeneratedContent] = useState("");
    const [showOutput, setShowOutput] = useState(false);
    const [copied, setCopied] = useState(false);

    const currentProfile = VOICE_PROFILES[selectedProfile];

    // Update topic when profile changes
    useEffect(() => {
        setCustomTopic(currentProfile.defaultTopic);
        setShowOutput(false);
        setDisplayedText("");
    }, [selectedProfile, currentProfile.defaultTopic]);

    // Typing animation effect
    useEffect(() => {
        if (!generatedContent || !showOutput) return;

        setDisplayedText("");
        let index = 0;

        const interval = setInterval(() => {
            if (index < generatedContent.length) {
                setDisplayedText((prev) => prev + generatedContent[index]);
                index++;
            } else {
                clearInterval(interval);
            }
        }, 20);

        return () => clearInterval(interval);
    }, [generatedContent, showOutput]);

    const handleGenerate = async () => {
        if (!customTopic.trim()) {
            alert("Please enter a topic!");
            return;
        }

        setIsGenerating(true);
        setShowOutput(false);
        setDisplayedText("");
        setCopied(false);

        // Simulate AI generation delay for realism
        setTimeout(() => {
            const content = currentProfile.exampleResponse(customTopic);
            setGeneratedContent(content);
            setShowOutput(true);
            setIsGenerating(false);
        }, 1500);
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(displayedText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <section className="py-20 px-6 bg-[#161b22]/50">
            <div className="max-w-5xl mx-auto">
                <div className="text-center mb-12">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-900/20 border border-purple-500/30 rounded-full mb-4">
                        <Wand2 size={16} className="text-purple-400" />
                        <span className="text-purple-400 text-xs font-bold uppercase tracking-wider">
                            Live Interactive Demo
                        </span>
                    </div>
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                        Voice DNA in Action
                    </h2>
                    <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                        Select a brand voice below, enter your topic, and watch AI generate content that matches that exact style. Same topic, completely different personalities.
                    </p>
                </div>

                <div className="bg-gradient-to-br from-[#0f1115] to-[#161b22] border border-gray-800 rounded-2xl p-8 shadow-2xl">
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

                    <div className="mb-8">
                        <label className="text-sm font-bold text-gray-300 uppercase tracking-wider mb-3 block">
                            Step 2: Your Topic
                        </label>
                        <input
                            type="text"
                            value={customTopic}
                            onChange={(e) => setCustomTopic(e.target.value)}
                            placeholder={currentProfile.defaultTopic}
                            className="w-full bg-[#0a0c10] border border-gray-700 rounded-xl p-4 text-gray-200 placeholder-gray-500 focus:border-purple-500 focus:outline-none transition"
                        />
                        <p className="text-xs text-gray-500 mt-2">
                            💡 Try different topics to see how the Voice DNA adapts
                        </p>
                    </div>

                    <button
                        onClick={handleGenerate}
                        disabled={isGenerating || !customTopic.trim()}
                        className="w-full py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold rounded-xl flex items-center justify-center gap-3 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed mb-8"
                    >
                        {isGenerating ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Generating with AI...
                            </>
                        ) : (
                            <>
                                <Sparkles size={20} />
                                Generate with {currentProfile.name}
                            </>
                        )}
                    </button>

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
                                <p className="text-gray-200 text-base leading-relaxed whitespace-pre-wrap">
                                    {displayedText}
                                    {isGenerating && displayedText.length === 0 && (
                                        <span className="inline-block w-0.5 h-4 bg-purple-500 ml-1 animate-pulse" />
                                    )}
                                    {displayedText.length > 0 && displayedText.length < generatedContent.length && (
                                        <span className="inline-block w-0.5 h-4 bg-purple-500 ml-1 animate-pulse" />
                                    )}
                                </p>
                            </div>

                            {!isGenerating && displayedText.length > 0 && (
                                <div className="mt-6 pt-4 border-t border-gray-800 flex items-center justify-between">
                                    <p className="text-xs text-gray-500 flex items-center gap-1">
                                        <Sparkles size={12} className="text-purple-400" />
                                        Generated with Voice DNA technology
                                    </p>
                                    <button
                                        onClick={handleCopy}
                                        className="text-xs text-purple-400 hover:text-purple-300 font-medium transition flex items-center gap-1"
                                    >
                                        {copied ? (
                                            <>
                                                <CheckCircle2 size={14} />
                                                Copied!
                                            </>
                                        ) : (
                                            <>
                                                <Copy size={14} />
                                                Copy to Clipboard
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

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
