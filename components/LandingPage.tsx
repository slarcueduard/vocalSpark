import React, { useState } from 'react';
import {
    Sparkles, Check, Zap, Globe, Fingerprint,
    Image as ImageIcon, Repeat, Database,
    Layers, Lock, Wand2, UserCheck,
    Search, Smartphone, ChevronDown, ChevronUp,
    Calendar, LayoutTemplate, MessageSquarePlus, Share2,
    Play, X, ArrowRight, Mic, Clock, ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { CountdownTimer } from './CountdownTimer';
import { FAQSection } from './FAQSection';
import { InteractiveVoiceDNADemo } from './InteractiveVoiceDNADemo';
import { DocumentationView } from './DocumentationView';
import { VisualHowItWorks } from './VisualHowItWorks';

// --- CONFIGURATION ---

const PLANS = {
    pro: {
        name: "Pro",
        price: 12.99,
        features: [
            "Model: GPT-4o (Smartest)",
            "2,000 Credits / mo",
            "2 Voice DNA Profiles",
            "Content Vault (25 Saved Posts)",
            "One-Click Follow-Up",
            "Real-Time Data (Perplexity)",
            "Premium Images (DALL-E 3)"
        ]
    },
    agency: {
        name: "Agency",
        price: 29.99,
        features: [
            "Everything in Pro, plus:",
            "5,000 Credits / mo",
            "5 Voice DNA Profiles",
            "Viral Hooks Library",
            "Competitor X-Ray Analysis",
            "Campaign Mode + Calendar View",
            "Content Vault (100 Saved Posts)",
            "Smart Reply System",
            "Visual-Text Sync"
        ]
    }
};

interface LandingPageProps {
    onLogin: () => void;
}

export function LandingPage({ onLogin }: LandingPageProps) {
    const [showDocs, setShowDocs] = useState(false);

    if (showDocs) {
        return (
            <div className="min-h-screen bg-[#0f1115] p-8">
                <DocumentationView onClose={() => setShowDocs(false)} />
            </div>
        );
    }

    return (
        <div className="w-full min-h-screen bg-[#0f1115] text-white font-sans selection:bg-blue-500/30">
            <Navbar onLogin={onLogin} setShowDocs={setShowDocs} />

            {/* 1. HERO SECTION: Instant Clarity */}
            <HeroSection onLogin={onLogin} />

            {/* DEMO: Show, Don't Explain */}
            <div className="border-b border-gray-800 bg-[#0f1115]">
                <InteractiveVoiceDNADemo />
            </div>

            {/* 2. PROBLEM AGITATION: Emotional Hook */}
            <ProblemAgitationSection />

            {/* 3. SOLUTION: Brand Voice Workspace */}
            <SolutionSection onLogin={onLogin} />

            {/* 4. CORE FEATURES: Benefit-First */}
            <FeaturesSection />

            {/* 5. HOW IT WORKS: Reduce Perceived Effort */}
            <section className="py-24 bg-[#0a0c10] border-y border-gray-800">
                <div className="max-w-7xl mx-auto px-6 mb-12 text-center">
                    <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">Your New 3-Step Workflow</h2>
                    <p className="text-gray-400">From "blank screen" to "scheduled for the week" in minutes.</p>
                </div>
                <VisualHowItWorks />
            </section>

            {/* 6. SOCIAL PROOF: Trust */}
            <SocialProofSection />

            {/* 7. PRICING: Risk Reduction */}
            <PricingSection onLogin={onLogin} />

            {/* 8. FAQ: Objection Handling */}
            <FAQSection />

            {/* 9. FINAL CTA */}
            <Footer onLogin={onLogin} />
        </div>
    );
}

// --- SECTIONS ---

function Navbar({ onLogin, setShowDocs }: any) {
    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0f1115]/80 backdrop-blur-md border-b border-gray-800/50">
            <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 md:py-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <img src="/social-spark-logo.png" alt="Vocal Spark" className="w-8 h-8 object-contain scale-[1.5]" />
                    <span className="text-lg font-bold tracking-tight">Vocal Spark</span>
                </div>
                <div className="flex gap-4 items-center">
                    <button onClick={() => setShowDocs(true)} className="hidden md:block text-sm text-gray-400 hover:text-white transition">Docs</button>
                    <button onClick={onLogin} className="text-sm font-medium hover:text-blue-400 transition">Log in</button>
                    <button
                        onClick={onLogin}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-lg transition shadow-lg shadow-blue-900/20"
                    >
                        Start Free Trial
                    </button>
                </div>
            </div>
        </nav>
    );
}

function HeroSection({ onLogin }: any) {
    return (
        <section className="relative pt-40 pb-20 px-4 overflow-hidden min-h-[90vh] flex flex-col justify-center items-center text-center bg-[#0f1115]">
            {/* Background Visuals */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-[0.4]" />
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] -z-10" />
            </div>

            <div className="relative z-10 w-full max-w-4xl mx-auto">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-500/20 bg-blue-900/10 text-blue-400 text-xs font-bold uppercase tracking-wider mb-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                    <Sparkles size={12} />
                    <span>The AI that knows your voice</span>
                </div>

                <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 leading-tight max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-100">
                    Stop writing posts <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">from scratch.</span>
                </h1>

                <p className="text-xl md:text-2xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
                    VocalSpark turns one idea or voice note into ready-to-publish social content — <strong className="text-white">written exactly in your own voice.</strong>
                </p>

                <div className="flex flex-col items-center gap-4 w-full max-w-sm mx-auto animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
                    <button
                        onClick={onLogin}
                        className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all shadow-xl shadow-blue-900/20 hover:scale-[1.02]"
                    >
                        <span>Start Free for 5 Days</span>
                        <ArrowRight size={20} />
                    </button>
                    <p className="text-sm text-gray-500 flex items-center gap-2">
                        <Check size={14} className="text-green-500" /> No credit card required
                    </p>
                </div>
            </div>
        </section>
    );
}

function ProblemAgitationSection() {
    return (
        <section className="py-24 bg-[#0a0c10] border-b border-gray-800">
            <div className="max-w-5xl mx-auto px-6">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-bold text-white mb-4">The "Content Hamster Wheel" is broken.</h2>
                    <p className="text-gray-400 text-lg">You know you need to post, but the process is painful.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <ProblemCard
                        icon={<Clock className="text-red-400" />}
                        title="The Time Drain"
                        desc="Staring at a blank screen for 30 minutes just to write one mediocre LinkedIn post."
                    />
                    <ProblemCard
                        icon={<Fingerprint className="text-orange-400" />}
                        title="The Generic Trap"
                        desc="Using ChatGPT results in robotic, soul-less content that your audience ignores."
                    />
                    <ProblemCard
                        icon={<Layers className="text-purple-400" />}
                        title="The Platform Chaos"
                        desc="Rewriting the same idea 4 times for X, LinkedIn, Instagram, and your Newsletter."
                    />
                </div>
            </div>
        </section>
    );
}

function ProblemCard({ icon, title, desc }: any) {
    return (
        <div className="bg-[#161b22] p-8 rounded-2xl border border-gray-800 hover:border-red-500/30 transition group">
            <div className="mb-6 bg-gray-800/50 w-12 h-12 rounded-xl flex items-center justify-center group-hover:scale-110 transition">
                {icon}
            </div>
            <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
            <p className="text-gray-400 leading-relaxed text-sm">{desc}</p>
        </div>
    )
}

function SolutionSection({ onLogin }: any) {
    return (
        <section className="py-24 bg-[#0f1115]">
            <div className="max-w-6xl mx-auto px-6">
                <div className="flex flex-col md:flex-row items-center gap-16">
                    <div className="w-full md:w-1/2">
                        <div className="inline-block text-blue-500 font-bold mb-4 tracking-wider text-sm uppercase">The Solution</div>
                        <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Your Personal Brand <br /> Operating System</h2>
                        <p className="text-lg text-gray-400 mb-8 leading-relaxed">
                            VocalSpark isn't a chatbot. It's a <strong className="text-white">Brand Voice Workspace</strong>. It acts as your personal ghostwriter that never sleeps, never complains, and knows exactly how you sound.
                        </p>

                        <div className="space-y-6">
                            <SolutionPoint
                                title="Learns Your Voice DNA™"
                                desc="We analyze your past content to clone your tone, humor, and rhythm."
                            />
                            <SolutionPoint
                                title="One Idea → Everywhere"
                                desc="Drop a voice note. Get a Thread, a LinkedIn post, and an Instagram caption instantly."
                            />
                            <SolutionPoint
                                title="No Prompt Engineering"
                                desc="Stop fighting with prompts. Just speak or write naturally."
                            />
                        </div>

                        <div className="mt-8">
                            <button
                                onClick={onLogin}
                                className="px-8 py-4 bg-white text-black hover:bg-gray-200 rounded-xl font-bold text-lg flex items-center gap-2 transition-all shadow-xl hover:scale-[1.02]"
                            >
                                <Zap size={20} className="text-yellow-600 fill-yellow-600" />
                                Generate My First Post Now
                            </button>
                        </div>
                    </div>

                    <div className="w-full md:w-1/2">
                        <div className="relative rounded-2xl overflow-hidden border border-gray-700 shadow-2xl bg-[#0a0c10] aspect-square flex items-center justify-center">
                            {/* Visual representation of the 'Operating System' */}
                            <div className="absolute inset-0 bg-gradient-to-tr from-blue-900/20 to-purple-900/20" />
                            <div className="relative z-10 text-center space-y-4">
                                <Fingerprint size={80} className="text-blue-500 mx-auto animate-pulse" />
                                <div className="text-2xl font-bold text-white">Voice DNA™ Active</div>
                                <div className="text-sm text-gray-400 bg-gray-900 px-4 py-2 rounded-full border border-gray-700 mx-auto inline-block">
                                    Analysis Complete • 98% Match
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

function SolutionPoint({ title, desc }: any) {
    return (
        <div className="flex gap-4">
            <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0 mt-1">
                <Check size={14} className="text-blue-400" />
            </div>
            <div>
                <h4 className="text-white font-bold">{title}</h4>
                <p className="text-sm text-gray-400">{desc}</p>
            </div>
        </div>
    )
}

function FeaturesSection() {
    return (
        <section className="py-24 bg-[#0a0c10] border-t border-gray-800">
            <div className="max-w-7xl mx-auto px-6">
                <div className="text-center mb-20">
                    <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">Features Built for ROI</h2>
                    <p className="text-gray-400">Every feature is designed to save you time or increase engagement.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <FeatureBlock
                        icon={<Mic className="text-purple-400" />}
                        title="Voice-to-Post Engine"
                        headline="Turn rambles into revenue."
                        desc="Record a messy voice note while walking. We turn it into clean, structured, high-performing posts."
                    />
                    <FeatureBlock
                        icon={<Repeat className="text-blue-400" />}
                        title="Content Repurposing"
                        headline="Never waste a good idea."
                        desc="Paste a YouTube URL or an article. We extract the key points and remix them into social content."
                    />
                    <FeatureBlock
                        icon={<Fingerprint className="text-pink-400" />}
                        title="Voice DNA™ Cloning"
                        headline="Consistency on autopilot."
                        desc="The AI learns your specific vocabulary, sentence length, and formatting style."
                    />
                    <FeatureBlock
                        icon={<Database className="text-green-400" />}
                        title="Content Vault"
                        headline="Your personal asset library."
                        desc="Save your best ideas. Schedule them for later. Build a searchable database of your brain."
                    />
                </div>
            </div>
        </section>
    )
}

function FeatureBlock({ icon, title, headline, desc }: any) {
    return (
        <div className="bg-[#161b22] p-8 rounded-2xl border border-gray-800 hover:border-gray-600 transition">
            <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-gray-800/50 rounded-lg flex items-center justify-center">
                    {icon}
                </div>
                <div className="text-sm font-bold text-gray-500 uppercase tracking-widest">{title}</div>
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">{headline}</h3>
            <p className="text-gray-400 leading-relaxed">{desc}</p>
        </div>
    )
}

function SocialProofSection() {
    const stats = [
        { label: "Posts Generated", value: "10,000+" },
        { label: "Founders", value: "500+" },
        { label: "Hours Saved", value: "2,500+" },
    ];

    const testimonials = [
        { name: "Sarah J.", handle: "@startupsarah", role: "SaaS Founder", text: "VocalSpark cut my content creation time by 90%. I just speak, and it writes better than I do." },
        { name: "Mark T.", handle: "@mark_indie", role: "Indie Hacker", text: "Finally an AI that sounds like *me*, not a robot. The Voice DNA is scary good." },
        { name: "Elena R.", handle: "@elena_growth", role: "Marketing Director", text: "I managed to schedule a month of content for 3 clients in one afternoon. Game changer." },
    ];

    return (
        <section className="py-24 bg-[#0f1115] border-t border-gray-800">
            <div className="max-w-7xl mx-auto px-6">

                {/* 1. STATS HEADER */}
                <div className="flex flex-wrap justify-center gap-12 mb-20 border-b border-gray-800 pb-12">
                    {stats.map((stat, i) => (
                        <div key={i} className="text-center">
                            <div className="text-4xl md:text-5xl font-bold text-white mb-2">{stat.value}</div>
                            <div className="text-gray-500 uppercase tracking-wider text-sm font-bold">{stat.label}</div>
                        </div>
                    ))}
                </div>

                {/* 2. LOGO STRIP (Placeholders) */}
                <div className="text-center mb-20">
                    <p className="text-sm text-gray-500 uppercase tracking-widest mb-8">Trusted by founders building on</p>
                    <div className="flex flex-wrap justify-center gap-8 md:gap-16 opacity-50 grayscale">
                        {/* Simple text placeholders for logos to avoid broken images */}
                        <span className="text-xl font-bold text-gray-400">STRIPE</span>
                        <span className="text-xl font-bold text-gray-400">YCOMBINATOR</span>
                        <span className="text-xl font-bold text-gray-400">INDIEHACKERS</span>
                        <span className="text-xl font-bold text-gray-400">PRODUCTHUNT</span>
                        <span className="text-xl font-bold text-gray-400">X</span>
                    </div>
                </div>

                {/* 3. TESTIMONIALS */}
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-bold text-white mb-4">Don't take our word for it.</h2>
                    <p className="text-gray-400">Join hundreds of founders reclaiming their time.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
                    {testimonials.map((t, i) => (
                        <div key={i} className="bg-[#161b22] p-8 rounded-2xl border border-gray-800 relative group hover:border-blue-500/30 transition">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center font-bold text-white">
                                    {t.name[0]}
                                </div>
                                <div className="text-left">
                                    <div className="font-bold text-white leading-none mb-1">{t.name}</div>
                                    <div className="text-xs text-gray-500">{t.role}</div>
                                </div>
                            </div>
                            <p className="text-gray-300 leading-relaxed">"{t.text}"</p>
                        </div>
                    ))}
                </div>

                {/* 4. TRUST BADGES */}
                <div className="flex flex-wrap justify-center gap-6">
                    <div className="flex items-center gap-2 px-4 py-2 bg-gray-900 rounded-full border border-gray-800 text-gray-400 text-sm">
                        <Lock size={14} className="text-green-500" /> Secure & Private
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-gray-900 rounded-full border border-gray-800 text-gray-400 text-sm">
                        <Database size={14} className="text-blue-500" /> No Data Training
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-gray-900 rounded-full border border-gray-800 text-gray-400 text-sm">
                        <UserCheck size={14} className="text-purple-500" /> Verified Results
                    </div>
                </div>
            </div>
        </section>
    );
}

function PricingSection({ onLogin }: any) {
    return (
        <section id="pricing" className="py-24 bg-[#0a0c10] border-t border-gray-800">
            <div className="max-w-7xl mx-auto px-6 text-center">
                <h2 className="text-4xl font-bold text-white mb-6">Invest in your Peace of Mind</h2>
                <p className="text-gray-400 mb-16 max-w-2xl mx-auto">Try it with your real content first. If it doesn't save you 5 hours this week, cancel instantly.</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                    {/* PRO PLAN */}
                    <div className="bg-[#111318] p-8 rounded-3xl border-2 border-blue-900/30 flex flex-col relative overflow-hidden group hover:border-blue-500 transition duration-300 shadow-2xl">
                        <div className="text-left mb-2">
                            <h3 className="text-xl font-bold text-white">Pro Starter</h3>
                            <p className="text-gray-500 text-sm">For solo founders</p>
                        </div>
                        <div className="text-left mb-6 flex items-baseline gap-1">
                            <span className="text-4xl font-bold text-white">$12.99</span>
                            <span className="text-gray-500">/mo</span>
                        </div>
                        <ul className="space-y-4 mb-8 text-left">
                            {PLANS.pro.features.map((f, i) => (
                                <li key={i} className="flex items-center gap-3 text-sm text-gray-300">
                                    <Check size={16} className="text-blue-500 shrink-0" /> {f}
                                </li>
                            ))}
                        </ul>
                        <button onClick={onLogin} className="mt-auto w-full py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-500 transition shadow-lg">
                            Start 5-Day Free Trial
                        </button>
                        <p className="text-xs text-gray-500 mt-3">No credit card required</p>
                    </div>

                    {/* AGENCY PLAN */}
                    <div className="bg-[#15121c] p-8 rounded-3xl border-2 border-purple-900/30 flex flex-col relative overflow-hidden group hover:border-purple-500 transition duration-300 shadow-2xl">
                        <div className="absolute top-0 right-0 bg-purple-600 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl shadow-lg">BEST VALUE</div>
                        <div className="text-left mb-2">
                            <h3 className="text-xl font-bold text-white">Agency Growth</h3>
                            <p className="text-gray-500 text-sm">For power users</p>
                        </div>
                        <div className="text-left mb-6 flex items-baseline gap-1">
                            <span className="text-4xl font-bold text-white">$29.99</span>
                            <span className="text-gray-500">/mo</span>
                        </div>
                        <ul className="space-y-4 mb-8 text-left">
                            {PLANS.agency.features.map((f, i) => (
                                <li key={i} className="flex items-center gap-3 text-sm text-gray-300">
                                    <Check size={16} className="text-purple-500 shrink-0" /> {f}
                                </li>
                            ))}
                        </ul>
                        <button onClick={onLogin} className="mt-auto w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold rounded-xl hover:opacity-90 transition shadow-lg">
                            Get Agency Access
                        </button>
                        <p className="text-xs text-gray-500 mt-3">Cancel anytime</p>
                    </div>
                </div>

                {/* LIFETIME DEAL BANNER */}
                <div className="max-w-4xl mx-auto mt-16 p-0.5 bg-gradient-to-r from-orange-500 via-red-500 to-purple-600 rounded-2xl shadow-2xl transform hover:scale-[1.01] transition cursor-pointer" onClick={() => {
                    localStorage.setItem('redirect_to_founder', 'true');
                    onLogin();
                }}>
                    <div className="bg-[#161b22] rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="text-left">
                            <div className="inline-block bg-orange-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider mb-1">
                                Limited Time
                            </div>
                            <h3 className="text-lg font-bold text-white">Lifetime Access Deal</h3>
                            <p className="text-gray-400 text-sm">Pay once ($97). Use forever.</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <CountdownTimer endDate={new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)} compact={true} />
                            <ArrowRight className="text-white" />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

function Footer({ onLogin }: any) {
    return (
        <footer className="py-16 bg-[#0a0c10] border-t border-gray-800 text-center">
            <div className="max-w-2xl mx-auto px-6 mb-12">
                <h2 className="text-3xl font-bold text-white mb-6">Create content faster — without sounding like AI.</h2>
                <button onClick={onLogin} className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition shadow-lg text-lg">
                    Start 5-Day Free Trial
                </button>
                <div className="flex justify-center gap-6 mt-6 text-sm text-gray-500">
                    <span className="flex items-center gap-1"><ShieldCheck size={14} /> Secure Payment</span>
                    <span className="flex items-center gap-1"><Clock size={14} /> Cancel Anytime</span>
                </div>
            </div>

            <div className="text-gray-600 text-sm">
                &copy; 2024 Vocal Spark. Built for Founders.
            </div>
        </footer>
    )
}
