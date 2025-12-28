import React, { useState } from 'react';
import {
    Sparkles, Check, Zap, Globe, Fingerprint,
    Image as ImageIcon, Repeat, Database,
    Layers, Lock, Wand2, UserCheck,
    Search, Smartphone, ChevronDown, ChevronUp,
    Calendar, LayoutTemplate, MessageSquarePlus, Share2
} from 'lucide-react';
import { CountdownTimer } from './CountdownTimer';
import { FAQSection } from './FAQSection';
import { VisualHowItWorks } from './VisualHowItWorks';
import { InteractiveVoiceDNADemo } from './InteractiveVoiceDNADemo';
import { SocialIconsCompact } from './SocialSupportButtons';
import { DocumentationView } from './DocumentationView';

// --- DATA & CONFIGURATION ---

const PLANS = {
    pro: {
        name: "Pro",
        price: 12.99,
        features: [
            "Model: GPT-4o (Smartest)",
            "2,000 Credits / mo",
            "2 Voice DNA Profiles",
            "Real-Time Data (Perplexity)",
            "Premium Images (DALL-E 3)"
        ]
    },
    agency: {
        name: "Agency",
        price: 29.99,
        features: [
            "Model: GPT-4o (Smartest)",
            "5,000 Credits / mo",
            "5 Voice DNA Profiles",
            "Campaign Mode (Calendar)",
            "Visual-Text Sync"
        ]
    }
};

const PLAN_EXTENSIONS: any = {
    pro: {
        deepDive: [
            "Multi-Mode Engine: Remix Mode ♻️",
            "Real-Time Data 🌍 (Live Internet Access)",
            "Follow-up Post Chain 🔗 (Story Arcs)",
            "Hybrid Visuals: Flux + DALL-E 3",
            "Vault: 10 Active Locked Posts",
            "2 Distinct Brand Voices"
        ],
        unavailable: [
            { name: "Campaign Mode (Strategic Calendar)", upgradeTo: "Agency" },
            { name: "Visual-Text Sync", upgradeTo: "Agency" },
            { name: "Bulk Content Export", upgradeTo: "Agency" }
        ],
        competitor: "Replaces Jasper ($49) + Midjourney ($30). Best ROI for creators."
    },
    agency: {
        deepDive: [
            "Campaign Mode 🚀 (Full Editorial Calendar)",
            "Follow-up Post Chain 🔗 (Unlimited)",
            "Visual-Text Sync (Perfect Overlays)",
            "Bulk Content Export",
            "Vault: 50 Active Locked Posts",
            "5 Distinct Brand Voices" // Updated from 3
        ],
        unavailable: [],
        competitor: "A fraction of the cost of a social media agency ($2k+)."
    }
};

// Componenta Iconita Google
const GoogleIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
);

// --- MAIN COMPONENT ---

interface LandingPageProps {
    onLogin: () => void;
}

export function LandingPage({ onLogin }: LandingPageProps) {
    const [activeScenario, setActiveScenario] = useState<'standard' | 'premium'>('standard');
    const [showDocs, setShowDocs] = useState(false);

    if (showDocs) {
        return (
            <div className="min-h-screen bg-[#0f1115] p-8">
                <DocumentationView onClose={() => setShowDocs(false)} />
            </div>
        );
    }

    return (
        <div className="w-full min-h-screen bg-[#0f1115] text-white">

            {/* --- NAVIGATION --- */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0f1115]/80 backdrop-blur-md border-b border-gray-800/50">
                <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 md:py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center">
                            <img src="/social-spark-logo.png" alt="Vocal Spark" className="w-full h-full object-contain scale-[1.8]" />
                        </div>
                        <span className="text-base md:text-lg font-bold tracking-tight">Vocal Spark</span>
                    </div>
                    <div className="flex gap-4">
                        <button onClick={() => setShowDocs(true)} className="hidden md:block text-sm text-gray-300 hover:text-white font-medium transition">Docs</button>
                        <button onClick={onLogin} className="text-sm text-gray-300 hover:text-white font-medium transition">Log in</button>
                        <button
                            onClick={() => {
                                localStorage.setItem('redirect_to_founder', 'true');
                                const pricingSection = document.getElementById('pricing');
                                pricingSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            }}
                            className="px-3 py-1.5 md:px-5 md:py-2 bg-gradient-to-r from-orange-600 to-red-600 text-white text-xs md:text-sm font-bold rounded-lg hover:from-orange-500 hover:to-red-500 transition shadow-lg"
                        >
                            Become a Founder
                        </button>
                    </div>
                </div>
            </nav>

            {/* --- HERO SECTION --- */}
            <section className="relative pt-16 md:pt-24 pb-12 md:pb-16 px-4 overflow-hidden min-h-[90vh] flex flex-col justify-center bg-[#0f1115]">
                {/* Background Grid Pattern */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] -z-10 opacity-50" />

                <div className="text-center max-w-4xl mx-auto z-10">
                    <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight mb-4 md:mb-6 leading-tight">
                        Stop Sounding Like AI. <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500">Clone Your Brand Voice.</span>
                    </h1>

                    <p className="text-base md:text-lg text-gray-400 mb-8 md:mb-10 max-w-2xl mx-auto leading-relaxed">
                        The only workspace that remembers your brand DNA and repurposes your best content in seconds.
                        <br className="hidden md:block" />
                        <strong>Build your audience with consistent, high-quality content.</strong>
                    </p>

                    <div className="flex flex-col items-center gap-3">
                        <button
                            onClick={onLogin}
                            className="group relative px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-lg flex items-center gap-3 transition-all shadow-xl shadow-blue-900/30 hover:scale-105"
                        >
                            <GoogleIcon className="w-6 h-6 bg-white rounded-full p-1" />
                            <span>Start 5-Day PRO Trial</span>
                        </button>
                        <p className="text-xs text-gray-500">Includes 150 Credits. No credit card required.</p>
                    </div>
                </div>

                {/* Scroll Indicator */}
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce flex flex-col items-center gap-2 opacity-60">
                    <span className="text-[10px] uppercase tracking-widest text-gray-500">Explore</span>
                    <ChevronDown className="text-gray-400" size={20} />
                </div>
            </section>

            {/* --- TRUSTED BY STRIP + VIDEO BRIDGE (Visual Bridge) --- */}
            <div className="border-y border-gray-800/50 bg-[#0f1115]/80 backdrop-blur-sm py-8 overflow-hidden relative z-20">
                {/* Trusted By Logos */}
                <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-center gap-6 md:gap-12 opacity-50 grayscale hover:grayscale-0 transition-all duration-500 mb-12">
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-600">Powering Creators On:</p>
                    <div className="flex items-center gap-8">
                        <span className="text-sm font-bold text-gray-400 flex items-center gap-2"> <Smartphone size={16} /> Instagram</span>
                        <span className="text-sm font-bold text-gray-400 flex items-center gap-2"> <Share2 size={16} /> LinkedIn</span>
                        <span className="text-sm font-bold text-gray-400 flex items-center gap-2"> <Globe size={16} /> Twitter / X</span>
                        <span className="text-sm font-bold text-gray-400 flex items-center gap-2"> <LayoutTemplate size={16} /> Blogs</span>
                    </div>
                </div>

                {/* THE VIDEO PLAYER (Relocated Here) */}
                <div className="max-w-5xl mx-auto px-6">
                    <div className="relative aspect-video rounded-2xl overflow-hidden border border-gray-700 shadow-2xl shadow-blue-900/20 bg-black group mx-auto">
                        <video
                            controls
                            className="w-full h-full object-cover"
                        >
                            <source src="/presentation.mp4" type="video/mp4" />
                            Your browser does not support the video tag.
                        </video>
                    </div>
                </div>
            </div>

            {/* --- CORE FEATURES (REDESIGNED) --- */}
            {/* --- CORE FEATURES (REDESIGNED) --- */}
            <section className="pt-16 pb-20 md:pt-24 md:pb-32 bg-[#0f1115] relative overflow-hidden">
                <div className="absolute top-1/4 left-0 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px] -z-10" />
                <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px] -z-10" />

                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16 md:mb-24 max-w-3xl mx-auto">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-wider mb-6">
                            <Sparkles size={12} />
                            <span>Powerhouse Features</span>
                        </div>
                        <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 leading-tight">
                            Everything You Need to <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">Dominate Every Channel.</span>
                        </h2>
                        <p className="text-lg text-gray-400 leading-relaxed">
                            Vocal Spark isn't just a writer. It's a strategist, designer, and scheduler wrapped into one coherent workspace.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">

                        {/* FEATURE 1: CAMPAIGN GENERATION */}
                        <DetailedFeatureCard
                            icon={<LayoutTemplate size={24} className="text-white" />}
                            iconBg="bg-blue-600"
                            title="Campaign Generation"
                            desc="Stop posting randomly. Define a goal, and let the AI map out a full strategic content calendar for weeks."
                            points={["Goal-Oriented Planning", "Multi-Platform Adaptation", "Consistent Messaging Arc"]}
                        />

                        {/* FEATURE 2: REMIX MODE */}
                        <DetailedFeatureCard
                            icon={<Repeat size={24} className="text-white" />}
                            iconBg="bg-green-600"
                            title="Smart Remix Engine"
                            desc="The ultimate repurposing tool. Turn one YouTube video, blog post, or thought into 10 unique pieces of content."
                            points={["Context-Aware Rewrites", "Format Conversion (Blog → Thread)", "Preserves Key Insights"]}
                        />

                        {/* FEATURE 3: THE VAULT & FOLLOW UP */}
                        <DetailedFeatureCard
                            icon={<Database size={24} className="text-white" />}
                            iconBg="bg-orange-600"
                            title="The Vault & Follow-Up"
                            desc="Your content goldmine. Save winning posts and use the 'Follow-Up' button to instantly generate sequels."
                            points={["One-Click Thread Continuation", "Organize by Performance", "Never Lose a Draft"]}
                            highlight
                        />

                        {/* FEATURE 4: HYBRID VISUALS */}
                        <DetailedFeatureCard
                            icon={<ImageIcon size={24} className="text-white" />}
                            iconBg="bg-pink-600"
                            title="Hybrid Image Studio"
                            desc="Visuals that pop. Generate standard graphics for speed or premium, detailed art for high-stakes posts."
                            points={["Flux Model (Speed)", "DALL-E 3 (High Fidelity)", "Brand Style Matching"]}
                        />

                        {/* FEATURE 5: POST SCHEDULING */}
                        <DetailedFeatureCard
                            icon={<Calendar size={24} className="text-white" />}
                            iconBg="bg-purple-600"
                            title="Strategic Planning Calendar"
                            desc="Your personal content roadmap. Plan posts in the built-in calendar and get notifications when it's time to post."
                            points={["Drag-and-Drop Planner", "Post Notifications", "Strategic Organization"]}
                        />

                        {/* FEATURE 6: REAL-TIME DATA (Catch-all/Bonus) */}
                        <DetailedFeatureCard
                            icon={<Globe size={24} className="text-white" />}
                            iconBg="bg-cyan-600"
                            title="Real-Time Knowledge"
                            desc="Stop hallucinating. Access the live internet to research trends, news, and facts for your content."
                            points={["Live Web Search", "Fact Verification", "Trend Analysis"]}
                        />

                    </div>
                </div>
            </section>

            {/* --- PRODUCT SHOWCASE (Interactive Steps Only) --- */}
            <section className="py-20 bg-[#0f1115] border-t border-gray-800/30 relative overflow-hidden">
                <div className="absolute inset-0 bg-blue-600/5 blur-[100px] pointer-events-none" />

                <div className="max-w-7xl mx-auto px-6">
                    {/* Unified Header */}
                    <div className="text-center mb-16 relative z-10">
                        <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
                            Experience the Coherent Workspace
                        </h2>
                        <p className="text-lg text-gray-400 max-w-2xl mx-auto">
                            Explore the step-by-step workflow below.
                        </p>
                    </div>

                    {/* 2. Interactive Steps (The Deep Dive) */}
                    <VisualHowItWorks />
                </div>
            </section>

            {/* --- PRICING SECTION --- */}
            <section id="pricing" className="w-full max-w-7xl mx-auto py-16 md:py-24 px-6">
                <div className="text-center mb-12 md:mb-16">
                    <h2 className="text-2xl md:text-3xl font-bold text-white mb-3 md:mb-4">Transparent ROI Pricing</h2>
                    <p className="text-sm md:text-base text-gray-400">Hybrid Model: Subscription + Credits to protect quality.</p>
                </div>

                {/* 1. LIFETIME DEAL BANNER with COUNTDOWN */}
                <div className="max-w-4xl mx-auto mb-16 p-0.5 bg-gradient-to-r from-orange-500 via-red-500 to-purple-600 rounded-2xl shadow-2xl shadow-orange-900/20 transform hover:scale-[1.01] transition cursor-pointer">
                    <div className="bg-[#161b22] rounded-2xl p-4 md:p-8 flex flex-col gap-6 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/10 rounded-full blur-[100px] -z-10" />

                        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                            <div className="flex-1 text-center md:text-left">
                                <div className="inline-block bg-orange-600 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-3 animate-pulse">
                                    Founding Member Offer - Limited to 50 Members
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-2">Lifetime Access Deal</h3>
                                <p className="text-gray-400 text-sm max-w-md">
                                    Get <strong>Lifetime Pro Features</strong> (Remix Mode, Voice DNA, Visual-Text Sync).
                                    One payment of <strong>$97</strong>. Keep it forever.
                                </p>
                            </div>

                            <div className="text-center">
                                <div className="flex items-center gap-2 justify-center md:justify-end mb-1">
                                    <span className="text-gray-500 line-through decoration-red-500 decoration-2 text-lg">$297</span>
                                    <span className="text-4xl font-bold text-white">$97</span>
                                </div>
                                <button onClick={() => {
                                    localStorage.setItem('redirect_to_founder', 'true');
                                    onLogin();
                                }} className="bg-white text-black px-8 py-3 rounded-lg font-bold hover:bg-gray-200 transition shadow-lg">
                                    Get Lifetime Deal
                                </button>
                            </div>
                        </div>

                        {/* Spots Remaining Counter */}
                        <div className="border-t border-orange-500/20 pt-4">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-xs text-gray-400">
                                    <span className="font-bold text-orange-400">37 spots taken</span> • Only <span className="font-bold text-white">13 spots left</span>
                                </p>
                                <p className="text-xs text-gray-500">Max 50 members</p>
                            </div>
                            {/* Progress Bar */}
                            <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
                                <div
                                    className="bg-gradient-to-r from-orange-500 to-red-500 h-full rounded-full transition-all duration-500 shadow-lg shadow-orange-500/50"
                                    style={{ width: '74%' }}
                                />
                            </div>
                            <p className="text-[10px] text-gray-600 mt-2 text-center">
                                🔥 Filling up fast - secure your spot before it's gone!
                            </p>
                        </div>

                        {/* Countdown Timer */}
                        <div className="border-t border-orange-500/20 pt-4">
                            <p className="text-xs text-gray-400 text-center mb-3">⏰ Offer ends in:</p>
                            <CountdownTimer
                                endDate={new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)}
                                compact={false}
                            />
                        </div>
                    </div>
                </div>

                {/* 2. MONTHLY SUBSCRIPTIONS - 2 COLUMNS */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 max-w-4xl mx-auto">

                    {/* PRO PLAN */}
                    <PricingCardLanding
                        plan={PLANS.pro}
                        desc="For Quality & Consistency."
                        btnLabel="Go Pro"
                        onAction={onLogin}
                        highlight
                        isPopular
                        planType="pro"
                    />

                    <PricingCardLanding
                        plan={PLANS.agency}
                        desc="For Strategy & Scale."
                        btnLabel="Scale Now"
                        onAction={onLogin}
                        planType="agency"
                    />

                </div>
            </section>

            {/* NEW: Interactive Voice DNA Demo */}
            <InteractiveVoiceDNADemo />

            {/* NEW: FAQ Section */}
            <FAQSection />

            {/* ENHANCED FOOTER */}
            <footer className="py-16 border-t border-gray-800 bg-[#0a0c10]">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">

                        {/* Brand Column */}
                        <div className="md:col-span-2">
                            <div className="flex items-center gap-2 mb-4">
                                <img src="/social-spark-logo.png" alt="Vocal Spark" className="w-8 h-8 object-contain scale-[1.8]" />
                                <span className="font-bold text-white text-lg">Vocal Spark</span>
                            </div>
                            <p className="text-gray-400 text-sm mb-6 max-w-md">
                                The only AI workspace that remembers your brand DNA and creates consistent, on-brand content. Stop sounding like generic AI.
                            </p>
                            <div className="mb-4">
                                <p className="text-gray-500 text-xs mb-2">Get Support:</p>
                                <SocialIconsCompact />
                            </div>
                        </div>

                        {/* Product Links */}
                        <div>
                            <h3 className="text-white font-bold mb-4 text-sm">Product</h3>
                            <ul className="space-y-2 text-sm">
                                <li><button onClick={onLogin} className="text-gray-400 hover:text-white transition">Features</button></li>
                                <li><button onClick={onLogin} className="text-gray-400 hover:text-white transition">Pricing</button></li>
                                <li><button onClick={onLogin} className="text-gray-400 hover:text-white transition">Voice DNA</button></li>
                                <li><button onClick={onLogin} className="text-gray-400 hover:text-white transition">Content Vault</button></li>
                            </ul>
                        </div>

                        {/* Company Links */}
                        <div>
                            <h3 className="text-white font-bold mb-4 text-sm">Company</h3>
                            <ul className="space-y-2 text-sm">
                                <li><a href="#" className="text-gray-400 hover:text-white transition">Privacy Policy</a></li>
                                <li><a href="#" className="text-gray-400 hover:text-white transition">Terms of Service</a></li>
                                <li><a href="mailto:support@vocalspark.io" className="text-gray-400 hover:text-white transition">Support</a></li>
                                <li><a href="#" className="text-gray-400 hover:text-white transition">FAQ</a></li>
                            </ul>
                        </div>
                    </div>

                    {/* Bottom Bar */}
                    <div className="pt-8 border-t border-gray-800 flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="text-center md:text-left">
                            <p className="text-xs text-gray-600">&copy; 2024 Vocal Spark. All rights reserved.</p>
                            <p className="text-xs text-gray-700 mt-1">
                                Built with ❤️ by <a href="https://velocityautomation.ai" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-400 transition font-medium">Velocity Automation AI</a>
                            </p>
                        </div>
                        <div className="flex items-center gap-4 text-xs">
                            <a href="#" className="text-gray-500 hover:text-gray-300 transition">Status</a>
                            <span className="text-gray-700">•</span>
                            <a href="#" className="text-gray-500 hover:text-gray-300 transition">Changelog</a>
                            <span className="text-gray-700">•</span>
                            <a href="#" className="text-gray-500 hover:text-gray-300 transition">API</a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}

// --- SUB-COMPONENTS & HELPERS ---

function FeatureCard({ icon, title, desc }: { icon: any, title: string, desc: string }) {
    return (
        <div className="bg-[#0f1115] p-6 rounded-xl border border-gray-800 hover:border-gray-600 transition duration-300 h-full flex flex-col">
            <div className="w-10 h-10 bg-gray-800/50 rounded-lg flex items-center justify-center mb-4 text-white">
                {icon}
            </div>
            <h3 className="text-base font-bold text-white mb-2">{title}</h3>
            <p className="text-xs text-gray-400 leading-relaxed">{desc}</p>
        </div>
    )
}

function DetailedFeatureCard({ icon, iconBg, title, desc, points, highlight }: any) {
    return (
        <div className={`p-8 rounded-2xl border flex flex-col h-full transition-all duration-300 group hover:-translate-y-1 ${highlight
            ? 'bg-[#161b22] border-orange-500/30 shadow-2xl shadow-orange-900/10'
            : 'bg-[#161b22]/50 border-gray-800 hover:border-gray-600 hover:bg-[#161b22]'
            }`}>
            <div className={`w-14 h-14 ${iconBg} rounded-2xl flex items-center justify-center shadow-lg mb-6 group-hover:scale-110 transition-transform duration-300`}>
                {icon}
            </div>

            <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
            <p className="text-sm text-gray-400 leading-relaxed mb-6">
                {desc}
            </p>

            <div className="mt-auto space-y-3">
                {points.map((point: string, idx: number) => (
                    <div key={idx} className="flex items-center gap-2">
                        <Check size={14} className="text-gray-500 group-hover:text-blue-400 transition-colors" />
                        <span className="text-xs font-medium text-gray-300">{point}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

function StepCard({ number, icon, title, desc, color }: any) {
    const borderColor = color === 'purple' ? 'border-purple-500/30' : 'border-blue-500/30';
    const numBg = color === 'purple' ? 'bg-purple-600' : 'bg-blue-600';

    return (
        <div className="flex flex-col items-center text-center flex-1 z-10 px-1">
            <div className={`w-14 h-14 md:w-16 md:h-16 bg-[#1c1c2e] border ${borderColor} rounded-2xl flex items-center justify-center mb-3 shadow-xl relative transition-transform hover:-translate-y-1 duration-300`}>
                <div className={`absolute -top-2 -left-2 w-5 h-5 ${numBg} rounded-full flex items-center justify-center font-bold text-[10px] text-white border border-[#0f1115] shadow-lg`}>
                    {number}
                </div>
                {icon}
            </div>
            <h3 className="text-sm font-bold text-white mb-1">{title}</h3>
            <p className="text-[10px] text-gray-400 leading-tight">{desc}</p>
        </div>
    );
}

function PricingCardLanding({ plan, desc, btnLabel, onAction, isPopular, highlight, planType }: any) {
    const [isExpanded, setIsExpanded] = useState(false);

    const extraDetails = PLAN_EXTENSIONS[planType] || { deepDive: [], unavailable: [], competitor: "" };

    const includedFeatures = extraDetails.deepDive || [];
    const unavailableFeatures = extraDetails.unavailable || [];

    return (
        <div className={`relative p-6 rounded-2xl border flex flex-col transition-all duration-300 ${isPopular
            ? 'bg-[#161b22] border-purple-500/50 shadow-2xl shadow-purple-900/20 scale-105 z-10'
            : highlight
                ? 'bg-[#0f1115] border-blue-500/30 shadow-lg'
                : 'bg-[#0f1115] border-gray-800 opacity-80 hover:opacity-100'
            }`}>
            {isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-purple-600 text-white px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-lg">
                    Best ROI
                </div>
            )}

            <div className="mb-4">
                <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                <p className="text-gray-400 text-xs mt-1">{desc}</p>
            </div>

            <div className="mb-6 flex items-baseline gap-1">
                <span className="text-3xl font-bold text-white">${plan.price}</span>
                <span className="text-gray-500 text-xs">/mo</span>
            </div>

            <div className="space-y-3 mb-6">
                {plan.features.map((feature: string, idx: number) => (
                    <div key={idx} className="flex items-start gap-2">
                        <Check size={14} className={`mt-0.5 ${isPopular ? 'text-purple-400' : 'text-blue-500'}`} />
                        <span className="text-gray-300 text-xs">{feature}</span>
                    </div>
                ))}
            </div>

            <div className={`overflow-hidden transition-all duration-500 ease-in-out ${isExpanded ? 'max-h-[800px] opacity-100 mb-6' : 'max-h-0 opacity-0 mb-0'}`}>
                <div className="pt-4 border-t border-gray-800 space-y-4">

                    {/* Deep Dive (INCLUDED) */}
                    <div>
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Deep Dive</p>
                        <ul className="space-y-2 mb-4">
                            {includedFeatures.map((feature: string, idx: number) => (
                                <li key={idx} className="flex items-start gap-2">
                                    <div className="mt-1.5 w-1 h-1 rounded-full bg-gray-500 shrink-0"></div>
                                    <span className="text-gray-400 text-xs">{feature}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* UNAVAILABLE (MISSING - UPSELL) */}
                    {unavailableFeatures.length > 0 && (
                        <div>
                            <p className="text-[10px] font-bold text-red-900/70 uppercase tracking-wider mb-2">Missing in this plan</p>
                            <ul className="space-y-2">
                                {unavailableFeatures.map((item: any, idx: number) => (
                                    <li key={idx} className="flex items-start gap-2 text-gray-600 opacity-60">
                                        <Lock size={12} className="mt-0.5 shrink-0" />
                                        <div className="flex flex-col">
                                            <span className="text-xs line-through decoration-gray-700">{item.name}</span>
                                            <span className="text-[10px] text-purple-500/50 font-medium">Upgrade to {item.upgradeTo}</span>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Competitor Comparison */}
                    <div className="bg-gray-800/30 p-3 rounded-lg border border-gray-700/50 mt-4">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                            <Layers size={10} /> VS Competitors
                        </p>
                        <p className="text-xs text-gray-300 italic leading-relaxed">
                            "{extraDetails.competitor}"
                        </p>
                    </div>

                </div>
            </div>

            <div className="mt-auto">
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="flex items-center justify-center gap-1 text-xs text-gray-500 hover:text-white mb-4 transition w-full py-2 hover:bg-gray-800/50 rounded"
                >
                    {isExpanded ? 'Hide details' : 'View full benefits'}
                    {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                </button>

                <button
                    onClick={onAction}
                    className={`w-full py-3 rounded-lg text-xs font-bold transition shadow-lg ${isPopular
                        ? 'bg-purple-600 hover:bg-purple-500 text-white'
                        : highlight
                            ? 'bg-blue-600 hover:bg-blue-500 text-white'
                            : 'bg-gray-800 hover:bg-gray-700 text-white'
                        }`}
                >
                    {btnLabel}
                </button>
            </div>
        </div>
    );
}
