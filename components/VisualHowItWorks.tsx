import React, { useState } from 'react';
import { Sparkles, ArrowRight, Wand2, Calendar as CalendarIcon, Archive, Image as ImageIcon } from 'lucide-react';

export function VisualHowItWorks() {
    const [activeStep, setActiveStep] = useState(0);

    const steps = [
        {
            number: 1,
            title: "Set Your Voice DNA",
            description: "Create custom brand profiles that capture your unique writing style. Clone influencers or define your own tone, industry, and personality.",
            image: "/screenshots/brand-profile.png",
            icon: <Sparkles className="text-purple-400" size={28} />,
            color: "purple"
        },
        {
            number: 2,
            title: "Choose Your Mode",
            description: "Generate a single viral post, create a full campaign calendar, or remix existing content into multiple formats.",
            image: "/screenshots/campaign-mode.png",
            icon: <Wand2 className="text-blue-400" size={28} />,
            color: "blue"
        },
        {
            number: 3,
            title: "AI Creates Premium Visuals",
            description: "Choose between fast Flux images (2 credits) or premium DALL-E 3 quality (20 credits). Your content, your budget.",
            image: "/screenshots/image-generation.png",
            icon: <ImageIcon className="text-pink-400" size={28} />,
            color: "pink"
        },
        {
            number: 4,
            title: "Save to Your Vault",
            description: "All content auto-saves to your private vault. Lock your best posts, create follow-up content with one click, search by date, and never lose a winner.",
            image: "/screenshots/content-vault.png",
            icon: <Archive className="text-orange-400" size={28} />,
            color: "orange"
        },
        {
            number: 5,
            title: "Schedule & Plan Ahead",
            description: "Use the built-in calendar to plan your content strategy. Schedule posts and maintain consistent publishing.",
            image: "/screenshots/calendar-view.png",
            icon: <CalendarIcon className="text-cyan-400" size={28} />,
            color: "cyan"
        }
    ];

    const currentStep = steps[activeStep];

    return (
        <section className="py-16 md:py-24 px-6 bg-[#0a0c10]">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12 md:mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                        See How It Works
                    </h2>
                    <p className="text-base md:text-lg text-gray-400 max-w-2xl mx-auto">
                        From idea to published post in 5 simple steps. See the actual product in action.
                    </p>
                </div>

                {/* Mobile: Vertical Cards */}
                <div className="md:hidden space-y-6">
                    {steps.map((step, index) => (
                        <div
                            key={index}
                            className="bg-[#161b22] border border-gray-800 rounded-xl overflow-hidden"
                        >
                            {/* Step Header */}
                            <div className="p-4 flex items-center gap-3 border-b border-gray-800">
                                <div className={`w-10 h-10 rounded-lg bg-${step.color}-600/20 flex items-center justify-center`}>
                                    {step.icon}
                                </div>
                                <div className="flex-1">
                                    <div className="text-xs text-gray-500 font-bold">STEP {step.number}</div>
                                    <h3 className="text-sm font-bold text-white">{step.title}</h3>
                                </div>
                            </div>

                            {/* Screenshot */}
                            <div className="relative aspect-video bg-gray-900">
                                <img
                                    src={step.image}
                                    alt={step.title}
                                    className="w-full h-full object-cover"
                                />
                            </div>

                            {/* Description */}
                            <div className="p-4">
                                <p className="text-sm text-gray-400">{step.description}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Desktop: Interactive Showcase */}
                <div className="hidden md:block">
                    {/* Step Indicators */}
                    <div className="flex items-center justify-center gap-2 mb-12">
                        {steps.map((step, index) => (
                            <button
                                key={index}
                                onClick={() => setActiveStep(index)}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeStep === index
                                    ? 'bg-blue-600 text-white scale-105 shadow-lg shadow-blue-600/30'
                                    : 'bg-[#161b22] text-gray-400 hover:text-white hover:bg-[#1c1c2e]'
                                    }`}
                            >
                                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-xs font-bold">
                                    {step.number}
                                </div>
                                <span className="text-sm font-medium">{step.title}</span>
                                {index < steps.length - 1 && activeStep === index && (
                                    <ArrowRight size={16} className="ml-2" />
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Main Showcase Area */}
                    <div className="bg-gradient-to-br from-[#0f1115] to-[#161b22] border border-gray-800 rounded-2xl p-8 shadow-2xl">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                            {/* Left: Description */}
                            <div>
                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-600/20 border border-blue-500/30 rounded-full mb-4">
                                    <span className="text-blue-400 text-xs font-bold">STEP {currentStep.number} OF 5</span>
                                </div>

                                <h3 className="text-3xl font-bold text-white mb-4">
                                    {currentStep.title}
                                </h3>

                                <p className="text-lg text-gray-400 leading-relaxed mb-6">
                                    {currentStep.description}
                                </p>

                                {/* Navigation Arrows */}
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => setActiveStep(Math.max(0, activeStep - 1))}
                                        disabled={activeStep === 0}
                                        className="px-4 py-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition"
                                    >
                                        ← Previous
                                    </button>
                                    <button
                                        onClick={() => setActiveStep(Math.min(steps.length - 1, activeStep + 1))}
                                        disabled={activeStep === steps.length - 1}
                                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-30 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition"
                                    >
                                        Next →
                                    </button>
                                </div>
                            </div>

                            {/* Right: Screenshot */}
                            <div className="relative">
                                <div className="relative rounded-xl overflow-hidden border-2 border-gray-700 shadow-2xl">
                                    <img
                                        src={currentStep.image}
                                        alt={currentStep.title}
                                        className="w-full h-auto"
                                    />

                                    {/* Animated Glow Effect */}
                                    <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/10 via-transparent to-purple-600/10 pointer-events-none"></div>
                                </div>

                                {/* Decorative Elements */}
                                <div className="absolute -top-4 -right-4 w-24 h-24 bg-blue-600/20 rounded-full blur-3xl"></div>
                                <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-purple-600/20 rounded-full blur-3xl"></div>
                            </div>
                        </div>
                    </div>

                    {/* Progress Dots */}
                    <div className="flex items-center justify-center gap-2 mt-8">
                        {steps.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => setActiveStep(index)}
                                className={`h-2 rounded-full transition-all ${activeStep === index
                                    ? 'w-8 bg-blue-600'
                                    : 'w-2 bg-gray-700 hover:bg-gray-600'
                                    }`}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
