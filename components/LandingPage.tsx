import React, { useState } from 'react';
import {
    Sparkles, Check, Zap, Globe, Fingerprint,
    Image as ImageIcon, Repeat, Database,
    Layers, Lock, Wand2, UserCheck,
    Search, Smartphone, ChevronDown, ChevronUp,
    Calendar, LayoutTemplate, MessageSquarePlus, Share2,
    Play, X, ArrowRight, Mic
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { CountdownTimer } from './CountdownTimer';
import { FAQSection } from './FAQSection';
import { InteractiveVoiceDNADemo } from './InteractiveVoiceDNADemo';
import { SocialIconsCompact } from './SocialSupportButtons';
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

    // Simple query param parsing
    const getSource = () => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            return params.get('source') || 'default';
        }
        return 'default';
    };

    const source = getSource();
    const isTikTok = source === 'tiktok';
    const isEmail = source === 'email';

    // DYNAMIC CONTENT CONFIGURATION
    const CONTENT = {
        default: {
            theme: 'blue',
            badge: "The AI that knows your voice",
            badgeIcon: <Sparkles size={12} />,
            heroTitle: <>Speak once. <br className="md:hidden" /><span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">Post everywhere.</span></>,
            heroSub: "Without rewriting, prompting, or editing.",
            heroDesc: <>Turn a 60-second voice note into high-engagement posts for every platform — <strong className="text-white">in your own voice.</strong></>,
            ctaText: "Start 5-Day Free Trial",
            showWallOfLove: false,
            showDemoAtTop: true
        },
        tiktok: {
            theme: 'red',
            badge: "Viral Post Generator",
            badgeIcon: <Zap size={12} className="fill-current" />,
            heroTitle: <>Speak once. <br className="md:hidden" /><span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-pink-500">Post everywhere.</span></>,
            heroSub: "Without rewriting, prompting, or editing.",
            heroDesc: <>Turn a 60-second voice note or idea into ready-to-post content for TikTok, Instagram, X, and LinkedIn — <strong className="text-white">in your own voice.</strong></>,
            ctaText: "Start 5-Day Free Trial",
            showWallOfLove: true,
            showDemoAtTop: true
        },
        email: {
            theme: 'orange', // Professional/Productivity feel
            badge: "Productivity Engine for Founders",
            badgeIcon: <Play size={12} className="fill-current" />,
            heroTitle: <>Turn 1 minute of talking <br className="md:hidden" /><span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">into 1 week of posts.</span></>,
            heroSub: "Stop staring at a blank page. Automate your personal brand.",
            heroDesc: <>The average founder spends 6 hours/week writing content. <strong className="text-white">Vocal Spark does it in 15 minutes.</strong></>,
            ctaText: "See The Efficiency Demo",
            showWallOfLove: false, // Cold leads rely more on the "Comparison" table below
            showDemoAtTop: true // "Proof of Competence"
        }
    };

    const currentContent = CONTENT[isTikTok ? 'tiktok' : (isEmail ? 'email' : 'default')];

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

            {/* 1. HERO SECTION (DYNAMIC) */}
            <HeroSection onLogin={onLogin} content={currentContent} theme={currentContent.theme} />

            {/* DEMO MOVED UP (TikTok & Email) */}
            {currentContent.showDemoAtTop && (
                <div className="border-b border-gray-800">
                    <InteractiveVoiceDNADemo />
                </div>
            )}

            {/* 2. AHA MOMENT (HOW IT WORKS) */}
            <section className="py-20 bg-[#0f1115]">
                <div className="max-w-7xl mx-auto px-6 mb-12 text-center">
                    <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">How It Works</h2>
                    <p className="text-gray-400">From voice note to viral post in 3 steps.</p>
                </div>
                <VisualHowItWorks />
            </section>

            {/* WALL OF LOVE (TikTok Only) */}
            {currentContent.showWallOfLove && <WallOfLoveSection />}

            {/* 3. AUDIENCE QUALIFICATION */}
            <AudienceSection />

            {/* 4. VALUE PROP (NOT A CHATBOT) */}
            <ValuePropSection />

            {/* 5. FEATURE HIGHLIGHTS (WITH VIDEOS) */}
            <FeaturesSection />

            {/* 6. OBJECTION KILL (VS CHATGPT) */}
            <ComparisonSection />

            {/* DEMO AT BOTTOM (Default Only) */}
            {!currentContent.showDemoAtTop && (
                <div className="border-y border-gray-800">
                    <InteractiveVoiceDNADemo />
                </div>
            )}

            {/* 7. SOCIAL PROOF (Classic Trust) - Show on Default & Email */}
            {!currentContent.showWallOfLove && <SocialProofSection />}

            {/* 8. PRICING & CTA */}
            <PricingSection onLogin={onLogin} />

            {/* 9. FAQ */}
            <FAQSection />

            {/* 10. EMOTIONAL CLOSE & FOOTER */}
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

function HeroSection({ onLogin, content, theme = 'blue' }: any) {
    const themeStyles = {
        blue: {
            bgGlow: 'bg-blue-600/20',
            badge: 'bg-blue-900/30 border-blue-500/30 text-blue-300',
            button: 'bg-blue-600 hover:bg-blue-500 shadow-blue-900/30'
        },
        red: {
            bgGlow: 'bg-red-600/20',
            badge: 'bg-red-900/30 border-red-500/30 text-red-300',
            button: 'bg-gradient-to-r from-red-600 to-pink-600 shadow-red-900/30'
        },
        orange: {
            bgGlow: 'bg-orange-600/20',
            badge: 'bg-orange-900/30 border-orange-500/30 text-orange-300',
            button: 'bg-gradient-to-r from-orange-600 to-amber-600 shadow-orange-900/30'
        }
    };

    const styles = themeStyles[theme as keyof typeof themeStyles] || themeStyles.blue;

    return (
        <section className="relative pt-32 pb-20 px-4 overflow-hidden min-h-[85vh] flex flex-col justify-center items-center text-center bg-[#0f1115]">
            {/* Hero Background Visual */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <img
                    src="/hero-bg-voice.png"
                    alt="AI Voice Visualization"
                    className="w-full h-full object-cover opacity-90"
                />
                {/* Visual Protection Layers */}
                <div className="absolute inset-0 bg-[#0f1115]/80 [mask-image:radial-gradient(circle_at_center,transparent_0%,black_100%)]" />
                <div className="absolute inset-0 bg-gradient-to-b from-[#0f1115]/20 via-transparent to-[#0f1115]" />

                {/* RESTORED GRID OVERLAY - Subtle Tech Feel */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-[0.65]" />
            </div>

            {/* Theme Tint Glow */}
            <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full blur-[120px] -z-10 opacity-50 mix-blend-overlay ${styles.bgGlow}`} />

            {/* CONTENT WRAPPER - Ensures text is above background */}
            <div className="relative z-10 flex flex-col items-center w-full max-w-5xl mx-auto">
                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-bold uppercase tracking-wider mb-8 animate-fade-in-up ${styles.badge}`}>
                    {content.badgeIcon}
                    <span>{content.badge}</span>
                </div>

                <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-[1.1] max-w-5xl mx-auto">
                    {content.heroTitle}
                    <br />
                    <span className="text-xl md:text-3xl text-gray-400 font-medium block mt-4">{content.heroSub}</span>
                </h1>

                <p className="text-lg md:text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
                    {content.heroDesc}
                </p>

                <div className="flex flex-col items-center gap-4 w-full max-w-sm">
                    <button
                        onClick={onLogin}
                        className={`w-full py-4 text-white rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all shadow-xl hover:scale-[1.02] active:scale-[0.98] ${styles.button}`}
                    >
                        <Zap className="fill-white" size={20} />
                        <span>{content.ctaText}</span>
                    </button>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1"><Check size={12} className="text-green-500" /> No credit card required</span>
                        <span className="flex items-center gap-1"><Check size={12} className="text-green-500" /> Takes under 1 minute to start</span>
                    </div>
                </div>

                {/* SUPPORTING LINE */}
                <p className="mt-8 text-sm text-gray-500 font-medium animate-fade-in-up delay-200">
                    Your content should sound like you — not like AI.
                </p>
            </div>
        </section>
    );
}



function AudienceSection() {
    return (
        <section className="py-24 bg-[#0a0c10] border-y border-gray-800/50">
            <div className="max-w-7xl mx-auto px-6">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-bold text-white mb-4">Built for Founders who <span className="line-through decoration-red-500 text-gray-500">Love</span> Hate Marketing</h2>
                    <p className="text-gray-400">You don't need to be a "creator". You just need a system.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <AudienceCard
                        icon={<Database className="text-blue-400" />}
                        title="SaaS Founders"
                        desc="You build perfect products, but struggle to tell the world consistently."
                    />
                    <AudienceCard
                        icon={<Fingerprint className="text-purple-400" />}
                        title="Solopreneurs"
                        desc="You know you need a personal brand, but you hate the vanity metrics game."
                    />
                    <AudienceCard
                        icon={<Mic className="text-orange-400" />}
                        title="Reluctant Creators"
                        desc="You have powerful ideas, but writing them down feels like pulling teeth."
                    />
                </div>
            </div>
        </section>
    );
}

function AudienceCard({ icon, title, desc }: any) {
    return (
        <div className="bg-[#161b22] p-8 rounded-2xl border border-gray-800 hover:border-gray-600 transition">
            <div className="mb-6 bg-gray-800/50 w-12 h-12 rounded-xl flex items-center justify-center">
                {icon}
            </div>
            <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
            <p className="text-gray-400 leading-relaxed text-sm">{desc}</p>
        </div>
    )
}

function ValuePropSection() {
    return (
        <section className="py-24 bg-[#0f1115]">
            <div className="max-w-5xl mx-auto px-6 text-center">
                <h2 className="text-4xl md:text-5xl font-bold text-white mb-8">Not Another Chatbot.</h2>
                <p className="text-xl text-gray-400 mb-12 max-w-3xl mx-auto">
                    ChatGPT gives you homework (prompts). Vocal Spark gives you <span className="text-white font-bold underline decoration-blue-500 underline-offset-4">freedom</span>.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center bg-[#161b22] rounded-3xl p-8 border border-gray-800">
                    <div className="text-left space-y-6">
                        <div className="flex items-start gap-4 p-4 rounded-xl bg-red-900/10 border border-red-900/20 opacity-70">
                            <X className="text-red-500 shrink-0 mt-1" />
                            <div>
                                <h4 className="font-bold text-white mb-1">Generic AI</h4>
                                <p className="text-sm text-gray-400">"Create a viral post about marketing." → *Returns robotic, cringe content you have to edit for 20 minutes.*</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4 p-4 rounded-xl bg-green-900/10 border border-green-900/20">
                            <Check className="text-green-500 shrink-0 mt-1" />
                            <div>
                                <h4 className="font-bold text-white mb-1">Vocal Spark</h4>
                                <p className="text-sm text-gray-400">"Here's my rant." → *Analyzes your Voice DNA. Generates 10 posts that sound exactly like you. 0 edits.*</p>
                            </div>
                        </div>
                    </div>
                    <div className="h-full min-h-[250px] bg-gradient-to-br from-blue-900/20 to-purple-900/20 rounded-2xl flex items-center justify-center border border-white/5">
                        <div className="text-center">
                            <Fingerprint size={64} className="mx-auto text-blue-500 mb-4 opacity-80" />
                            <p className="text-white font-bold">Vocal Spark sits next to you.</p>
                            <p className="text-sm text-gray-500">It remembers who you are.</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

function FeaturesSection() {
    return (
        <section className="py-24 bg-[#0f1115] border-t border-gray-800/30">
            <div className="max-w-7xl mx-auto px-6">
                <div className="mb-20 text-center">
                    <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">Your New Workflow</h2>
                    <p className="text-gray-400">Stop maximizing for "more prompts". Maximize for mental peace.</p>
                </div>

                <div className="space-y-24">
                    <FeatureRow
                        videoSrc="/voice2post.mp4"
                        title="Voice DNA Technology"
                        headline="The AI that actually sounds like you."
                        desc="Vocal Spark learns how you write and speak, so every post sounds natural — not robotic."
                        badges={["Analyzes your URL", "Learns slang/idioms", "Never sounds robotic"]}
                    />
                    <FeatureRow
                        videoSrc="/voice2post.mp4"
                        title="Audio-to-Post"
                        headline="Ramble into your phone. Get viral threads."
                        desc="Say it once. Vocal Spark turns your voice into structured, high-engagement posts automatically."
                        badges={["No typing needed", "Works in any language", "1 minute audio = 1 week content"]}
                        reversed
                    />
                    <FeatureRow
                        videoSrc="/remix.mp4"
                        title="Multi-Platform Posting"
                        headline="Never waste a good idea."
                        desc="One idea becomes platform-optimized posts — without rewriting for each network."
                        badges={["Video -> Article", "Thread -> Carousel", "Blog -> Newsletter"]}
                    />
                    <FeatureRow
                        videoSrc="/remix.mp4"
                        title="Content Vault"
                        headline="Build your asset library."
                        desc="Save, reuse, and remix your best content instead of starting from scratch every time."
                        badges={["Organize by Campaign", "Track Performance", "Remix Winners"]}
                        reversed
                    />

                    {/* MID-PAGE CTA */}
                    <div className="py-16 text-center">
                        <h3 className="text-3xl font-bold text-white mb-6">Ready to stop overthinking social posts?</h3>
                        <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-lg transition shadow-lg mb-3">
                            Start your free 5-day trial
                        </button>
                        <p className="text-sm text-gray-500">No credit card • Cancel anytime</p>
                    </div>
                </div>
            </div>
        </section>
    )
}

function FeatureRow({ videoSrc, title, headline, desc, badges, reversed }: any) {
    return (
        <div className={`flex flex-col ${reversed ? 'md:flex-row-reverse' : 'md:flex-row'} items-center gap-12 md:gap-20`}>
            <div className="w-full md:w-1/2">
                <div className="relative rounded-2xl overflow-hidden border border-gray-800 shadow-2xl bg-black aspect-video group">
                    <video autoPlay loop muted playsInline className="w-full h-full object-cover">
                        <source src={videoSrc} type="video/mp4" />
                    </video>
                </div>
            </div>
            <div className="w-full md:w-1/2 space-y-6">
                <div className="inline-block text-blue-400 text-sm font-bold uppercase tracking-wider mb-2">{title}</div>
                <h3 className="text-3xl md:text-4xl font-bold text-white leading-tight">{headline}</h3>
                <p className="text-lg text-gray-400 leading-relaxed">{desc}</p>
                <div className="flex flex-wrap gap-3 pt-4">
                    {badges.map((badge: string, idx: number) => (
                        <span key={idx} className="px-3 py-1.5 bg-gray-800 text-gray-300 rounded-lg text-xs font-medium border border-gray-700">
                            {badge}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    )
}

function ComparisonSection() {
    return (
        <section className="py-24 bg-[#0a0c10] border-y border-gray-800">
            <div className="max-w-4xl mx-auto px-6">
                <h2 className="text-3xl font-bold text-center text-white mb-12">Why not just use ChatGPT?</h2>

                <div className="bg-[#161b22] border border-gray-800 rounded-2xl overflow-hidden">
                    <div className="grid grid-cols-3 bg-gray-800/50 p-4 border-b border-gray-700 text-sm font-bold text-gray-400">
                        <div>Feature</div>
                        <div className="text-center">ChatGPT</div>
                        <div className="text-center text-blue-400">Vocal Spark</div>
                    </div>

                    <ComparisonRow feature="Brand Voice" bad="Forgot in new chat" good="Remembers forever" />
                    <ComparisonRow feature="Workflow" bad="Endless prompting" good="1-Click Actions" />
                    <ComparisonRow feature="Input" bad="Text only (mostly)" good="Voice, Audio, Video, URL" />
                    <ComparisonRow feature="Output Quality" bad="Generic / Robot" good="Human / Optimized" />
                    <ComparisonRow feature="Context Limit" bad="Resets often" good="Persistent Knowledge" />
                </div>
            </div>
        </section>
    )
}

function ComparisonRow({ feature, bad, good }: any) {
    return (
        <div className="grid grid-cols-3 p-4 border-b border-gray-800 items-center hover:bg-white/5 transition">
            <div className="font-medium text-white text-sm">{feature}</div>
            <div className="text-center text-gray-500 text-sm flex justify-center items-center gap-2">
                {bad}
            </div>
            <div className="text-center text-white text-sm font-bold flex justify-center items-center gap-2">
                <Check size={14} className="text-green-500" /> {good}
            </div>
        </div>
    )
}

function SocialProofSection() {
    return (
        <section className="py-20 bg-[#0f1115] text-center">
            <div className="max-w-3xl mx-auto px-6">
                <div className="flex justify-center mb-8">
                    <div className="flex -space-x-4">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="w-12 h-12 rounded-full border-2 border-[#0f1115] bg-gray-700 flex items-center justify-center font-bold text-xs text-white">
                                {i === 5 ? '300+' : <UserCheck size={16} />}
                            </div>
                        ))}
                    </div>
                </div>
                <h2 className="text-2xl font-bold text-white mb-4">Built for founders, creators, and marketers who hate writing but need to stay consistent.</h2>
                <div className="mt-4 text-sm font-bold text-gray-500">300+ Founders Joined</div>
            </div>
        </section>
    )
}

function PricingSection({ onLogin }: any) {
    return (
        <section id="pricing" className="py-24 bg-[#0a0c10] border-t border-gray-800">
            <div className="max-w-7xl mx-auto px-6 text-center">
                <h2 className="text-4xl font-bold text-white mb-6">Invest in your Peace of Mind</h2>
                <p className="text-gray-400 mb-16">Cheaper than an intern. Faster than an agency. Smarter than a chatbot.</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                    {/* PRO PLAN - BLUE THEME */}
                    <div className="bg-[#111318] p-8 rounded-3xl border-2 border-blue-900/30 flex flex-col relative overflow-hidden group hover:border-blue-500 transition duration-300 shadow-2xl">
                        <div className="absolute top-0 right-0 bg-blue-600 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl shadow-lg">POPULAR</div>
                        <h3 className="text-xl font-bold text-white mb-2 text-left flex items-center gap-2">
                            Pro <span className="text-blue-500 text-xs px-2 py-0.5 rounded-full bg-blue-900/20 border border-blue-500/30">Starter</span>
                        </h3>
                        <div className="text-left mb-6">
                            <span className="text-4xl font-bold text-white">$12.99</span><span className="text-gray-500">/mo</span>
                        </div>
                        <ul className="space-y-4 mb-8 text-left">
                            {PLANS.pro.features.map((f, i) => (
                                <li key={i} className="flex items-center gap-3 text-sm text-gray-300">
                                    <Check size={16} className="text-blue-500 shrink-0" /> {f}
                                </li>
                            ))}
                        </ul>
                        <button onClick={onLogin} className="mt-auto w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-500 transition shadow-lg shadow-blue-900/20 hover:shadow-blue-900/40">
                            Start Free Trial
                        </button>
                    </div>

                    {/* AGENCY PLAN - PURPLE/PREMIUM THEME */}
                    <div className="bg-[#15121c] p-8 rounded-3xl border-2 border-purple-900/30 flex flex-col relative overflow-hidden group hover:border-purple-500 transition duration-300 shadow-2xl scale-[1.02]">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-indigo-600"></div>
                        <div className="absolute top-0 right-0 bg-purple-600 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl shadow-lg">BEST VALUE</div>

                        <h3 className="text-xl font-bold text-white mb-2 text-left flex items-center gap-2">
                            Agency <span className="text-purple-400 text-xs px-2 py-0.5 rounded-full bg-purple-900/20 border border-purple-500/30">Growth</span>
                        </h3>
                        <div className="text-left mb-6">
                            <span className="text-4xl font-bold text-white">$29.99</span><span className="text-gray-500">/mo</span>
                        </div>
                        <ul className="space-y-4 mb-8 text-left">
                            {PLANS.agency.features.map((f, i) => (
                                <li key={i} className="flex items-center gap-3 text-sm text-gray-300">
                                    <Check size={16} className="text-purple-500 shrink-0" /> {f}
                                </li>
                            ))}
                        </ul>
                        <button onClick={onLogin} className="mt-auto w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold rounded-xl hover:opacity-90 transition shadow-lg shadow-purple-900/40 hover:shadow-purple-900/60 flex items-center justify-center gap-2">
                            <Sparkles size={16} /> Get Agency Access
                        </button>
                    </div>
                </div>

                {/* 1. LIFETIME DEAL BANNER */}
                <div className="max-w-4xl mx-auto mt-16 p-0.5 bg-gradient-to-r from-orange-500 via-red-500 to-purple-600 rounded-2xl shadow-2xl shadow-orange-900/20 transform hover:scale-[1.01] transition cursor-pointer">
                    <div className="bg-[#161b22] rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/10 rounded-full blur-[100px] -z-10" />

                        <div className="text-left flex-1">
                            <div className="inline-block bg-orange-600 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-3 animate-pulse">
                                Founding Member Offer
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-2">Lifetime Access Deal</h3>
                            <p className="text-gray-400 text-sm">Pay once. Use forever. Include all future Pro updates.</p>
                        </div>

                        <div className="text-right">
                            <div className="flex items-center justify-end gap-3 mb-2">
                                <span className="text-gray-500 line-through text-lg">$297</span>
                                <span className="text-4xl font-bold text-white">$97</span>
                            </div>
                            <button onClick={() => {
                                localStorage.setItem('redirect_to_founder', 'true');
                                onLogin();
                            }} className="bg-white text-black px-8 py-3 rounded-lg font-bold hover:bg-gray-200 transition shadow-lg">
                                Get Lifetime Access
                            </button>
                            <div className="mt-4">
                                <CountdownTimer endDate={new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)} compact={true} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}

function WallOfLoveSection() {
    const tweets = [
        { name: "Sarah J.", handle: "@startupsarah", text: "I just turned a 2 min rant about hiring into a 15-tweet thread. This feels illegal. 🤯", date: "2h ago" },
        { name: "David M.", handle: "@david_builds", text: "Stopped my agency subscription. VocalSpark sounds more like me than my copywriter did. #AI", date: "5h ago" },
        { name: "Alex Hormozi (Parody)", handle: "@hormozifake", text: "If you aren't using this workflow, you are literally losing money. Efficiency is king.", date: "1d ago" },
        { name: "Design Joy", handle: "@design_io", text: "The UI is clean, but the 'Voice DNA' feature is what sold me. It actually gets my sarcasm.", date: "2d ago" }
    ];

    return (
        <section className="py-20 bg-[#0f1115]">
            <div className="max-w-6xl mx-auto px-6">
                <div className="text-center mb-12">
                    <div className="inline-block px-3 py-1 bg-green-500/10 text-green-400 rounded-full text-xs font-bold uppercase tracking-wider mb-4 border border-green-500/20">
                        Viral on Twitter
                    </div>
                    <h2 className="text-3xl font-bold text-white">They're growing faster than you.</h2>
                    <p className="text-gray-400 mt-2">Join the founders who figured out the cheat code.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {tweets.map((tweet, i) => (
                        <div key={i} className="bg-[#161b22] p-6 rounded-2xl border border-gray-800 hover:border-gray-600 transition group hover:-translate-y-1">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-700 to-gray-600 flex items-center justify-center font-bold text-xs text-white">
                                        {tweet.name[0]}
                                    </div>
                                    <div>
                                        <div className="text-sm font-bold text-white leading-none">{tweet.name}</div>
                                        <div className="text-xs text-gray-500">{tweet.handle}</div>
                                    </div>
                                </div>
                                <div className="text-gray-400">
                                    <MessageSquarePlus size={16} />
                                </div>
                            </div>
                            <p className="text-gray-300 text-sm leading-relaxed mb-4">
                                {tweet.text}
                            </p>
                            <div className="text-xs text-gray-600 font-mono">{tweet.date}</div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

function Footer({ onLogin }: any) {
    return (
        <footer className="py-16 bg-[#0a0c10] border-t border-gray-800 text-center">
            <div className="max-w-2xl mx-auto px-6 mb-12">
                <h2 className="text-2xl font-bold text-white mb-4">Create content faster — without sounding like AI.</h2>
                <button onClick={onLogin} className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition shadow-lg">
                    Start Free Trial
                </button>
                <p className="text-xs text-gray-600 mt-4">5 days free • No credit card needed</p>
            </div>

            <div className="text-gray-600 text-sm">
                &copy; 2024 Vocal Spark. Built by <a href="#" className="text-blue-500 hover:underline">Velocity Automation AI</a>.
            </div>
        </footer>
    )
}
