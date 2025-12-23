import React, { useState } from 'react';
import { BookOpen, Map, ChevronRight, Zap, Fingerprint, Repeat, ImageIcon, Play, Wand2, Link, Layers, Sparkles, Briefcase } from 'lucide-react';

interface DocumentationViewProps {
    onClose?: () => void;
}

export function DocumentationView({ onClose }: DocumentationViewProps) {
    const [activeTab, setActiveTab] = useState<'about' | 'guide' | 'roadmap'>('guide');

    return (
        <div className="max-w-4xl mx-auto pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-3xl font-bold text-white tracking-tight">Documentation & Roadmap</h2>
                    <p className="text-gray-400 mt-2">Master the Social Spark workspace and see what's coming next.</p>
                </div>
                {onClose && (
                    <button onClick={onClose} className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-sm font-medium transition">
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
                            <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-indigo-400 mb-6 drop-shadow-sm">Social Spark AI</h1>
                            <p className="text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
                                The first AI workspace that truly understands <span className="text-white font-bold">Concept</span>, <span className="text-white font-bold">Context</span>, and <span className="text-white font-bold">Brand Voice</span>.
                            </p>
                        </div>

                        {/* DETAILED TEXT CONTENT */}
                        <div className="space-y-10 text-gray-300 leading-relaxed max-w-3xl mx-auto">

                            <section>
                                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                    <Sparkles className="text-blue-500" size={20} /> What is Social Spark AI?
                                </h3>
                                <p className="mb-4">
                                    Social Spark AI is not just another content generator. It is a specialized <strong>Brand Voice Cloning Workspace</strong> designed for founders, creators, and marketing teams who refuse to publish generic, robotic AI content.
                                </p>
                                <p className="mb-4">
                                    In the current landscape of AI tools, most models (like ChatGPT, Claude, or Gemini) are trained to be "helpful assistants." This means they default to a neutral, overly polite, and often boring tone. While great for customer support, this is terrible for social media, where <strong>personality, opinion, and unique flair</strong> are the only things that stop the scroll.
                                </p>
                                <p>
                                    Social Spark solves this by introducing a proprietary layer we call <strong>Voice DNA™</strong>. This technology analyzes your past successful posts, deconstructs your syntax, vocabulary, emoji usage, and sentence rhythm, and creates a custom "filter" that sits on top of advanced LLMs. The result is content that actually sounds like *you* wrote it on your best day.
                                </p>
                            </section>

                            <div className="w-full h-px bg-gray-800 my-8"></div>

                            <section>
                                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                    <Zap className="text-yellow-500" size={20} /> Core Features & Capabilities
                                </h3>

                                <div className="mb-8 p-4 bg-gray-900/30 rounded-xl border border-gray-800/50">
                                    <h4 className="font-bold text-blue-400 mb-2 text-lg">1. The Creator Studio</h4>
                                    <p className="mb-3">
                                        This is your command center. Unlike chat interfaces where you stare at a blinking cursor, the Creator Studio offers structured workflows:
                                    </p>
                                    <ul className="list-disc pl-5 space-y-2 marker:text-blue-500">
                                        <li><strong>Single Post Mode:</strong> Focused creation for one high-quality update. You input a topic or rough scribbles, select your Brand Profile, and get a polished post in seconds.</li>
                                        <li><strong>Campaign Mode:</strong> For strategic planning. Input a goal (e.g., "Launch our new leather boots line") and a duration (e.g., "7 days"). The AI generates a cohesive calendar of posts, mixing educational, promotional, and engagement-focused content.</li>
                                        <li><strong>Remix Mode (The Content Engine):</strong> The most powerful feature for consistency. Paste a URL to a YouTube video, a blog post, or a news article. Social Spark digests the content and repurposes it into 5-10 native social media posts (Threads, LinkedIn carousels, Tweets) that are ready to publish.</li>
                                    </ul>
                                </div>

                                <div className="mb-8 p-4 bg-gray-900/30 rounded-xl border border-gray-800/50">
                                    <h4 className="font-bold text-purple-400 mb-2 text-lg">2. The Content Vault</h4>
                                    <p>
                                        Your external brain. Every post you generate is automatically saved here. It's not just a history log; it's a workspace. You can edit drafts, mark posts as "Scheduled," and search through your entire library of ideas. It allows you to build a repository of evergreen content that you can recycle and refine over months.
                                    </p>
                                </div>

                                <div className="mb-8 p-4 bg-gray-900/30 rounded-xl border border-gray-800/50">
                                    <h4 className="font-bold text-green-400 mb-2 text-lg">3. Visual Intelligence</h4>
                                    <p>
                                        A post without an image is invisible. Social Spark integrates dual-engine image generation. Use the <strong>Standard Model (Flux)</strong> for fast, stylistic visuals, or switch to the <strong>Premium Model (DALL-E 3)</strong> for photorealistic, high-fidelity images that can even include accurate text rendering. The AI automatically reads your post context to suggest the perfect visual prompt.
                                    </p>
                                </div>
                            </section>

                            <div className="w-full h-px bg-gray-800 my-8"></div>

                            <section>
                                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                    <Briefcase className="text-green-500" size={20} /> Who is this for? (Use Cases)
                                </h3>
                                <div className="grid grid-cols-1 gap-6">
                                    <div className="bg-[#0f1115] p-5 rounded-lg border-l-4 border-blue-500">
                                        <h4 className="font-bold text-white mb-1">For Solo Founders</h4>
                                        <p className="text-sm">You are building in public but don't have 2 hours a day to write. Use Social Spark to take your 10-minute brain dump and turn it into a week's worth of LinkedIn authority posts.</p>
                                    </div>
                                    <div className="bg-[#0f1115] p-5 rounded-lg border-l-4 border-purple-500">
                                        <h4 className="font-bold text-white mb-1">For Content Creators</h4>
                                        <p className="text-sm">Volume is the game. Use Remix Mode to turn your one YouTube video into 15 tweets, 3 LinkedIn posts, and an Instagram caption. Multiply your output by 10x without working more hours.</p>
                                    </div>
                                    <div className="bg-[#0f1115] p-5 rounded-lg border-l-4 border-green-500">
                                        <h4 className="font-bold text-white mb-1">For Agencies</h4>
                                        <p className="text-sm">You manage 10 different clients with 10 different voices. The "Brand Profile" switcher allows you to instantly toggle between "Playful DTC Brand" and "Serious B2B SaaS" without ever mixing up the tone. It ensures consistency at scale.</p>
                                    </div>
                                </div>
                            </section>

                        </div>

                    </div>
                ) : activeTab === 'guide' ? (
                    <div className="space-y-12">

                        <Section title="Getting Started" icon={<Zap className="text-yellow-400" />}>
                            <p className="text-gray-400 mb-4">Social Spark isn't just a chatbot. It's a cohesive workspace designed to clone your brand voice.</p>

                            <img src="/docs/creator-studio.png" alt="Creator Studio Dashboard" className="w-full rounded-xl border border-gray-700/50 shadow-lg mb-6 hover:scale-[1.01] transition duration-500" />

                            <ul className="space-y-4 text-sm text-gray-300">
                                <li className="flex items-start gap-2">
                                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5 shrink-0"></div>
                                    <div>
                                        <strong>Single Post Mode:</strong> Create one perfect post.
                                    </div>
                                </li>
                                <li className="flex flex-col gap-2">
                                    <div className="flex items-start gap-2">
                                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5 shrink-0"></div>
                                        <div>
                                            <strong>Campaign Mode:</strong> Generate a full content calendar (3-30 posts).
                                        </div>
                                    </div>
                                    <img src="/docs/campaign-mode.png" alt="Campaign Mode UI" className="w-3/4 rounded-lg border border-gray-700/50 opacity-80 hover:opacity-100 transition" />
                                </li>
                                <li className="flex flex-col gap-2">
                                    <div className="flex items-start gap-2">
                                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5 shrink-0"></div>
                                        <div><strong>Remix Mode:</strong> Turn one source (text/video) into multiple formats.</div>
                                    </div>
                                    <img src="/docs/remix-mode.png" alt="Remix Mode UI" className="w-3/4 rounded-lg border border-gray-700/50 opacity-80 hover:opacity-100 transition" />
                                </li>
                            </ul>
                        </Section>

                        <Section title="Voice DNA" icon={<Fingerprint className="text-blue-400" />}>
                            <p className="text-gray-400 mb-4">Stop sounding like generic AI. Calibrate your Voice DNA to teach the AI your specific style.</p>

                            <div className="space-y-4">
                                <div className="bg-[#0f1115] p-4 rounded-xl border border-gray-700/50">
                                    <h4 className="font-bold text-white text-sm mb-2">1. How it works</h4>
                                    <p className="text-xs text-gray-400">
                                        When you create a Brand Profile, we don't just "save" your text. We use a separate AI agent to <strong>reverse-engineer</strong> your writing style. It measures your sentence length, emoji usage, vocabulary complexity, and "spiciness" level.
                                    </p>
                                </div>

                                <div className="bg-[#0f1115] p-4 rounded-xl border border-gray-700/50">
                                    <h4 className="font-bold text-white text-sm mb-2">2. How to Calibrate (Best Practices)</h4>
                                    <ol className="list-decimal list-inside space-y-2 text-sm text-gray-400 ml-1">
                                        <li>Go to <strong>Brand Identity</strong> &rarr; <strong>New Profile</strong>.</li>
                                        <li><strong>The "Magic" Step:</strong> You will be asked to paste content. <span className="text-yellow-400">This is crucial.</span></li>
                                        <li>
                                            <strong>DO NOT PASTE:</strong> Generic company descriptions, mission statements, or boring SEO articles.
                                        </li>
                                        <li>
                                            <strong>DO PASTE:</strong> Your 3-5 best high-performing social media posts. The ones where you showed personality, used slang, or had a strong opinion.
                                        </li>
                                    </ol>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="p-3 bg-red-900/10 border border-red-900/30 rounded-lg">
                                        <span className="text-xs font-bold text-red-500 uppercase">❌ Bad Example</span>
                                        <p className="text-xs text-gray-500 mt-1 italic">"We are a leading provider of solutions providing excellence to our customers since 2010..."</p>
                                        <p className="text-[10px] text-red-400 mt-1">(Too corporate. AI will sound robotic.)</p>
                                    </div>
                                    <div className="p-3 bg-green-900/10 border border-green-900/30 rounded-lg">
                                        <span className="text-xs font-bold text-green-500 uppercase">✅ Good Example</span>
                                        <p className="text-xs text-gray-500 mt-1 italic">"Stop overthinking your content. Just post it. Perfectionism is just procrastination in a fancy suit. 🚀"</p>
                                        <p className="text-[10px] text-green-400 mt-1">(Strong opinion. Punchy. AI will copy this energy.)</p>
                                    </div>
                                </div>

                                <img src="/docs/voice-dna.png" alt="Voice DNA Analysis" className="w-full rounded-xl border border-gray-700/50 shadow-lg mt-4 hover:scale-[1.01] transition duration-500" />
                            </div>
                        </Section>

                        <Section title="Visuals & Images" icon={<ImageIcon className="text-pink-400" />}>
                            <p className="text-gray-400 mb-4">Every post needs a visual. You have two powerful options.</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-[#0f1115] p-4 rounded-xl border border-gray-700/50">
                                    <h4 className="font-bold text-white text-sm mb-2">1. AI Generation</h4>
                                    <p className="text-xs text-gray-400 mb-2">Click the <ImageIcon size={12} className="inline" /> icon on any generated post.</p>
                                    <ul className="text-xs text-gray-500 space-y-1">
                                        <li>• <strong>Standard:</strong> Fast, abstract art (Flux model).</li>
                                        <li>• <strong>Premium:</strong> Photorealistic, high text accuracy (DALL-E 3).</li>
                                    </ul>
                                </div>
                                <div className="bg-[#0f1115] p-4 rounded-xl border border-gray-700/50">
                                    <h4 className="font-bold text-white text-sm mb-2">2. Upload Your Own</h4>
                                    <p className="text-xs text-gray-400 mb-2">Have a product shot? Upload it.</p>
                                    <ul className="text-xs text-gray-500 space-y-1">
                                        <li>• Click the Image Icon in the main input bar.</li>
                                        <li>• The AI will "see" your image and write captions about it.</li>
                                    </ul>
                                </div>
                            </div>
                        </Section>

                        <Section title="Advanced Tools" icon={<Wand2 className="text-purple-400" />}>
                            <div className="space-y-6">
                                <div>
                                    <h4 className="font-bold text-white flex items-center gap-2 mb-2"><CheckCircle className="w-4 h-4 text-green-500" /> Magic Refinement</h4>
                                    <p className="text-sm text-gray-400">Don't like a specific sentence? Click the <strong>Magic Wand</strong> icon on any post card. The AI will rewrite just that post to be punchier, shorter, or funnier.</p>
                                </div>
                                <div>
                                    <h4 className="font-bold text-white flex items-center gap-2 mb-2"><Link className="w-4 h-4 text-blue-500" /> Follow-up Threads</h4>
                                    <p className="text-sm text-gray-400 mb-3">Want to write a Twitter thread or LinkedIn carousel text? Use the <strong>"Follow-up"</strong> button on a generated post. It creates a "Part 2" that is contextually linked to the parent post.</p>
                                    <img src="/docs/content-vault.png" alt="Follow-up Button in Vault" className="w-full md:w-3/4 rounded-lg border border-gray-700/50 shadow-lg" />
                                </div>
                            </div>
                        </Section>

                    </div>
                ) : (
                    <div className="space-y-8">
                        <div className="text-center mb-10">
                            <h3 className="text-xl font-bold text-white">The Future of Social Spark</h3>
                            <p className="text-gray-400 text-sm mt-2">We are shipping weekly updates. Here is what we are building.</p>
                        </div>

                        <RoadmapItem
                            status="done"
                            quarter="Q4 2024"
                            title="Voice DNA & Remix Mode"
                            desc="The core engine is live. Analyze your brand voice and repurpose content seamlessly."
                        />

                        <RoadmapItem
                            status="in-progress"
                            quarter="Q1 2025"
                            title="Auto-Posting Integration"
                            desc="Connect LinkedIn & Twitter API directly. Schedule posts and let Social Spark publish for you automatically. No more copy-paste."
                        />

                        <RoadmapItem
                            status="planned"
                            quarter="Q2 2025"
                            title="Video Remix v2"
                            desc="Upload a raw video file. We will extract clips, write captions, and generate a thumbnail automatically."
                        />

                        <RoadmapItem
                            status="planned"
                            quarter="Q3 2025"
                            title="Mobile App (iOS & Android)"
                            desc="Create content on the go. Full feature parity with the desktop web app."
                        />

                        <div className="mt-12 p-6 bg-gradient-to-r from-blue-900/20 to-purple-900/20 rounded-xl border border-blue-500/30 text-center">
                            <h4 className="font-bold text-white mb-2">Have a feature request?</h4>
                            <p className="text-sm text-gray-400 mb-4">We build for you. Tell us what you need.</p>
                            <a href="mailto:support@socialspark.ai" className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-lg transition">Send Request</a>
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
