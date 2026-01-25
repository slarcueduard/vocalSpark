import React, { useState } from 'react';
import { BookOpen, Map, ChevronRight, Zap, Fingerprint, Repeat, ImageIcon, Play, Wand2, Link, Layers, Sparkles, Briefcase, Crown, Check, Mic } from 'lucide-react';

interface DocumentationViewProps {
    onClose?: () => void;
}

export function DocumentationView({ onClose }: DocumentationViewProps) {
    const [activeTab, setActiveTab] = useState<'about' | 'guide' | 'roadmap'>('guide');

    return (
        <div className="max-w-4xl mx-auto pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* Header */}
            <div className="flex flex-row flex-wrap items-center justify-between gap-4 mb-6">
                <div>
                    <h2 className="text-xl md:text-3xl font-bold text-white tracking-tight">Documentation</h2>
                    <p className="text-gray-400 mt-1 text-xs md:text-base hidden sm:block">Master the Vocal Spark workspace.</p>
                </div>
                {onClose && (
                    <button onClick={onClose} className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-xs md:text-sm font-medium transition whitespace-nowrap border border-gray-700 sticky top-2 z-50 shadow-lg">
                        Back to App
                    </button>
                )}
            </div>

            {/* Tabs */}
            <div className="flex flex-wrap gap-2 bg-[#161b22] p-1 rounded-xl border border-gray-800 w-fit mb-8">
                <button
                    onClick={() => setActiveTab('about')}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition ${activeTab === 'about' ? 'bg-indigo-500 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                >
                    <Sparkles size={16} /> About
                </button>
                <button
                    onClick={() => setActiveTab('guide')}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition ${activeTab === 'guide' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                >
                    <BookOpen size={16} /> User Guide
                </button>
                <button
                    onClick={() => setActiveTab('roadmap')}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition ${activeTab === 'roadmap' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                >
                    <Map size={16} /> Future Roadmap
                </button>
            </div>

            {/* CONTENT AREA */}
            <div className="bg-[#161b22] border border-gray-800 rounded-2xl p-8 shadow-xl">

                {activeTab === 'about' ? (
                    <div className="space-y-12 animate-in fade-in slide-in-from-left-4 duration-300">
                        {/* HERO */}
                        <div className="text-center border-b border-gray-800 pb-10">
                            <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-indigo-400 mb-6 drop-shadow-sm">Vocal Spark AI v1.9</h1>
                            <p className="text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
                                The first AI workspace that combines <span className="text-white font-bold">Founder Strategy</span>, <span className="text-white font-bold">Voice Cloning</span>, and <span className="text-white font-bold">Viral Execution</span>.
                            </p>
                        </div>

                        {/* DETAILED TEXT CONTENT */}
                        <div className="space-y-10 text-gray-300 leading-relaxed max-w-3xl mx-auto">

                            <section>
                                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                    <Sparkles className="text-blue-500" size={20} /> What is Vocal Spark AI?
                                </h3>
                                <p className="mb-4">
                                    Vocal Spark is a comprehensive <strong>Founder Operating System</strong> for content. It doesn't just write posts; it understands your business goals, clones your unique writing style via <strong>Voice DNA™</strong>, and helps you execute a cohesive strategy without hiring an agency.
                                </p>
                            </section>

                            <div className="w-full h-px bg-gray-800 my-8"></div>

                            <section>
                                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                    <Zap className="text-yellow-500" size={20} /> Core Workflows
                                </h3>

                                <div className="mb-8 p-4 bg-gray-900/30 rounded-xl border border-gray-800/50">
                                    <h4 className="font-bold text-yellow-400 mb-2 text-lg flex items-center gap-2"><Crown size={16} /> 1. Founder Mode (Strategy)</h4>
                                    <p className="mb-3">
                                        For when you have raw ideas but no structure.
                                    </p>
                                    <ul className="list-disc pl-5 space-y-2 marker:text-yellow-500 text-sm">
                                        <li><strong>Brain Dump Input:</strong> Speak or type your raw thoughts. "I want to talk about how we failed our first launch."</li>
                                        <li><strong>Strategic Mapping:</strong> The AI identifies the goal (e.g., Vulnerability/Trust) and your Archetype (e.g., The Builder).</li>
                                        <li><strong>Campaign Generation:</strong> It turns that one thought into a 3-part campaign (Teaser, Deep Dive, Call to Action) automatically scheduled on your calendar.</li>
                                    </ul>
                                </div>

                                <div className="mb-8 p-4 bg-gray-900/30 rounded-xl border border-gray-800/50">
                                    <h4 className="font-bold text-blue-400 mb-2 text-lg flex items-center gap-2"><Wand2 size={16} /> 2. Creator Studio (Execution)</h4>
                                    <p className="mb-3">
                                        Your daily creation dashboard for speed and precision.
                                    </p>
                                    <ul className="list-disc pl-5 space-y-2 marker:text-blue-500 text-sm">
                                        <li><strong>Voice DNA Wizard:</strong> New users are guided through a 3-step calibration to clone their voice perfectly (Audio or Text).</li>
                                        <li><strong>Creator Studio:</strong> Create single posts, "Smart Replies" to comments, or multi-platform blasts.</li>
                                        <li><strong>Remix Studio 2.0:</strong>
                                            <ul className="list-circle pl-5 mt-2 space-y-1 text-gray-400">
                                                <li><strong>X-Ray Analysis:</strong> Paste a viral post to decode *why* it worked (Hook type, structure) and replicate it.</li>
                                                <li><strong>YouTube Remix:</strong> Paste a video URL to extract clips and tweets instantly.</li>
                                            </ul>
                                        </li>
                                    </ul>
                                </div>

                                <div className="mb-8 p-4 bg-gray-900/30 rounded-xl border border-gray-800/50">
                                    <h4 className="font-bold text-green-400 mb-2 text-lg flex items-center gap-2"><Briefcase size={16} /> 3. Daily Consistency</h4>
                                    <p className="mb-2">Features designed to keep you posting every day.</p>
                                    <ul className="list-disc pl-5 space-y-2 marker:text-green-500 text-sm">
                                        <li><strong>Today's Post Widget:</strong> A daily "Assignment" based on trending topics in your niche.</li>
                                        <li><strong>Streak Tracker:</strong> Visualize your consistency.</li>
                                        <li><strong>Trial Reminders:</strong> Smart notifications to keep you on track during your evaluation.</li>
                                    </ul>
                                </div>
                            </section>
                        </div>
                    </div>
                ) : activeTab === 'guide' ? (
                    <div className="space-y-12">

                        <Section title="Getting Started: Voice DNA" icon={<Fingerprint className="text-blue-400" />}>
                            <p className="text-gray-400 mb-4">The first step to success is teaching the AI who you are.</p>

                            <div className="bg-[#0f1115] p-5 rounded-xl border border-gray-700/50 mb-6">
                                <h4 className="font-bold text-white mb-2">The Wizard 🧙‍♂️</h4>
                                <p className="text-sm text-gray-400 mb-4">When you first join, or when you add a new profile, you'll enter the Voice DNA Wizard.</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="border border-gray-700 p-3 rounded-lg flex items-center gap-3">
                                        <div className="p-2 bg-blue-900/20 text-blue-400 rounded-full"><Mic size={16} /></div>
                                        <div>
                                            <div className="text-sm font-bold text-white">Audio Analysis</div>
                                            <div className="text-xs text-gray-500"> Speak for 60s. We extract tone & cadence.</div>
                                        </div>
                                    </div>
                                    <div className="border border-gray-700 p-3 rounded-lg flex items-center gap-3">
                                        <div className="p-2 bg-purple-900/20 text-purple-400 rounded-full"><Link size={16} /></div>
                                        <div>
                                            <div className="text-sm font-bold text-white">Text Analysis</div>
                                            <div className="text-xs text-gray-500">Paste your best LinkedIn/X posts.</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Section>

                        <Section title="Founder Mode (New)" icon={<Crown className="text-yellow-400" />}>
                            <p className="text-gray-400 mb-4">Stop acting like a social media manager. Act like a Founder.</p>
                            <img src="/docs/founder-mode.png" alt="Founder Mode UI" className="w-full rounded-xl border border-gray-700/50 shadow-lg mb-6 hover:scale-[1.01] transition duration-500" />

                            <ol className="space-y-4 text-sm text-gray-300 list-decimal pl-4">
                                <li>
                                    <strong>Input Step:</strong> Click the yellow "Founder Mode" tab. Use the <strong className="text-red-400">Red Mic Button</strong> to rant about a problem, a win, or a lesson.
                                </li>
                                <li>
                                    <strong>Strategy Step:</strong> The AI suggests a "Campaign Angle".
                                    <em className="block mt-1 text-gray-500">Example: If you rant about a bad hire, it might suggest a "Leadership Lessons" campaign.</em>
                                </li>
                                <li>
                                    <strong>Execution Step:</strong> Review the generated plan. It creates 3 posts instantly:
                                    <ul className="list-disc pl-5 mt-2 space-y-1 text-gray-400">
                                        <li>Day 1: The Story (Hook)</li>
                                        <li>Day 2: The Lesson (Value)</li>
                                        <li>Day 3: The Ask (Sales/Conversion)</li>
                                    </ul>
                                </li>
                            </ol>
                        </Section>

                        <Section title="Remix Studio & X-Ray" icon={<Repeat className="text-green-400" />}>
                            <p className="text-gray-400 mb-4">Don't guess what goes viral. Know why.</p>
                            <div className="space-y-4">
                                <div className="bg-[#0f1115] p-4 rounded-xl border border-gray-700/50">
                                    <h4 className="font-bold text-white text-sm mb-2 flex items-center gap-2"><Zap size={14} className="text-indigo-400" /> X-Ray Analysis</h4>
                                    <p className="text-xs text-gray-400 mb-2">Paste a URL or text from a competitor's top post.</p>
                                    <ul className="text-xs text-gray-500 space-y-1 pl-2 border-l-2 border-indigo-500/30">
                                        <li>• Detects the <strong>Hook Structure</strong> (e.g., "Contrarian Statement").</li>
                                        <li>• Identifies the <strong>Emotional Tone</strong>.</li>
                                        <li>• Lets you <strong>Save the Template</strong> to your Vault for future use.</li>
                                    </ul>
                                </div>
                            </div>
                        </Section>

                        <Section title="Plans & Limits" icon={<Briefcase className="text-white" />}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                                <div className="bg-[#0f1115] p-4 rounded-lg border border-gray-800 relative overflow-hidden">
                                    <h5 className="font-bold text-blue-400 text-sm mb-2">Pro Plan ($12.99)</h5>
                                    <ul className="space-y-2 text-xs text-gray-400">
                                        <li className="flex items-center gap-2"><Check size={12} /> 2,000 Credits / mo</li>
                                        <li className="flex items-center gap-2"><Check size={12} /> Creator Studio Access</li>
                                        <li className="flex items-center gap-2"><Check size={12} /> Premium Images (DALL-E)</li>
                                    </ul>
                                </div>
                                <div className="bg-[#0f1115] p-4 rounded-lg border border-yellow-500/30 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 bg-yellow-500 text-black text-[9px] font-bold px-2 py-0.5">BEST VALUE</div>
                                    <h5 className="font-bold text-yellow-500 text-sm mb-2">Agency / Founder ($29.99)</h5>
                                    <ul className="space-y-2 text-xs text-gray-400">
                                        <li className="flex items-center gap-2"><Check size={12} /> <strong>5,000 Credits / mo</strong></li>
                                        <li className="flex items-center gap-2"><Check size={12} /> <strong>Founder Mode</strong> (Strategy)</li>
                                        <li className="flex items-center gap-2"><Check size={12} /> <strong>X-Ray Analysis</strong></li>
                                        <li className="flex items-center gap-2"><Check size={12} /> <strong>Video/YouTube Remix</strong></li>
                                        <li className="flex items-center gap-2"><Check size={12} /> 5+ Brand Profiles</li>
                                    </ul>
                                </div>
                            </div>
                        </Section>

                    </div>
                ) : (
                    <div className="space-y-8">
                        <div className="text-center mb-10">
                            <h3 className="text-xl font-bold text-white">Product Roadmap</h3>
                            <p className="text-gray-400 text-sm mt-2">Executed & Planned Features.</p>
                        </div>

                        <RoadmapItem
                            status="done"
                            quarter="Q4 2024"
                            title="Foundation (v1.0)"
                            desc="Core AI Engine, Voice DNA Calibration, Basic Post Generation."
                        />

                        <RoadmapItem
                            status="done"
                            quarter="Jan 2025"
                            title="Founder Mode Release (v1.5)"
                            desc="Strategic Goal Mapping, Campaign Wizard, Calendar Integration."
                        />

                        <RoadmapItem
                            status="done"
                            quarter="Feb 2025"
                            title="Growth Suite (v1.9)"
                            desc="X-Ray Analysis, Voice Wizard Onboarding, Grounded YouTube Remix, Today's Post Widget."
                        />

                        <RoadmapItem
                            status="in-progress"
                            quarter="Q2 2025"
                            title="Direct Integrations"
                            desc="One-click publishing to LinkedIn & Twitter (X). Auto-scheduling API."
                        />

                        <RoadmapItem
                            status="planned"
                            quarter="Q3 2025"
                            title="Collaborative Teams"
                            desc="Invite team members, approval workflows, and shared brand vaults."
                        />

                        <div className="mt-12 p-6 bg-gradient-to-r from-blue-900/20 to-purple-900/20 rounded-xl border border-blue-500/30 text-center">
                            <h4 className="font-bold text-white mb-2">Have a feature request?</h4>
                            <p className="text-sm text-gray-400 mb-4">We build fast. Tell us what you need next.</p>
                            <a href="mailto:founders@vocalspark.io" className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-lg transition">Email Executives</a>
                        </div>
                    </div>
                )}
            </div>

            <div className="text-center pt-8">
                <button onClick={onClose} className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg hover:shadow-blue-500/25 transition transform hover:scale-[1.02]">
                    Start Creating Now
                </button>
            </div>
        </div>
    );
}

// --- Helpers ---

function Section({ title, icon, children }: any) {
    return (
        <div className="border-b border-gray-800 pb-8 last:border-0 last:pb-0">
            <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-[#0f1115] border border-gray-700 flex items-center justify-center">
                    {icon}
                </div>
                <h3 className="text-lg font-bold text-white">{title}</h3>
            </div>
            <div className="pl-11">
                {children}
            </div>
        </div>
    );
}

function CheckCircle({ className }: { className?: string }) {
    return <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
}

function RoadmapItem({ status, quarter, title, desc }: any) {
    const isDone = status === 'done';
    const isInProgress = status === 'in-progress';

    return (
        <div className={`relative pl-8 border-l-2 ${isDone ? 'border-green-500' : isInProgress ? 'border-blue-500' : 'border-gray-700'} pb-8 last:pb-0`}>
            <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 ${isDone ? 'bg-green-500 border-green-500' : isInProgress ? 'bg-[#161b22] border-blue-500' : 'bg-[#161b22] border-gray-700'}`}></div>

            <div className="flex items-center gap-3 mb-1">
                <span className={`text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wider ${isDone ? 'bg-green-900/30 text-green-400' : isInProgress ? 'bg-blue-900/30 text-blue-400' : 'bg-gray-800 text-gray-500'}`}>
                    {status === 'done' ? 'Completed' : status === 'in-progress' ? 'In Progress' : quarter}
                </span>
            </div>
            <h4 className={`text-lg font-bold ${isDone || isInProgress ? 'text-white' : 'text-gray-400'}`}>{title}</h4>
            <p className="text-sm text-gray-500 mt-1 max-w-xl">{desc}</p>
        </div>
    );
}
function FeatureCard({ icon, title, desc }: any) {
    return (
        <div className="bg-[#0f1115] p-5 rounded-xl border border-gray-700/50 hover:border-gray-500 transition-colors">
            <div className="mb-3">{icon}</div>
            <h4 className="text-sm font-bold text-white mb-1">{title}</h4>
            <p className="text-xs text-gray-400">{desc}</p>
        </div>
    );
}
