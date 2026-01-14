import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Play } from 'lucide-react';

interface DemoSlide {
    title: string;
    description: string;
    image: string; // Placeholder path - will need actual screenshots
    highlight: string;
}

const DEMO_SLIDES: DemoSlide[] = [
    {
        title: "Voice DNA Profile",
        description: "Clone any influencer's style or analyze your own content. AI extracts tone, audience, and brand rules automatically.",
        image: "/demo-voice-dna.png",
        highlight: "Brand Consistency Made Easy"
    },
    {
        title: "Creator Studio",
        description: "Single Post, Campaign Mode, or Remix Mode - all powered by your active brand persona. Context remembered across sessions.",
        image: "/demo-creator-studio.png",
        highlight: "3 Modes, Infinite Possibilities"
    },
    {
        title: "Hybrid Visual Generation",
        description: "Toggle between Fast Flux (2 credits) and Premium DALL-E 3 (20 credits). Add your brand logo as watermark.",
        image: "/demo-visuals.png",
        highlight: "Professional Images On Demand"
    },
    {
        title: "Content Vault",
        description: "Auto-saves everything. Filter by mode, lock favorites, link to calendar events. Never lose a winning post.",
        image: "/demo-vault.png",
        highlight: "Your Content Library"
    },
    {
        title: "Real-Time Data (Pro)",
        description: "AI searches the web for live news and trends. Create timely, relevant content that rides the wave.",
        image: "/demo-realtime.png",
        highlight: "Stay Current, Stay Viral"
    }
];

export function ProductDemoCarousel() {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [autoPlay, setAutoPlay] = useState(false);

    const nextSlide = () => {
        setCurrentSlide((prev) => (prev + 1) % DEMO_SLIDES.length);
    };

    const prevSlide = () => {
        setCurrentSlide((prev) => (prev - 1 + DEMO_SLIDES.length) % DEMO_SLIDES.length);
    };

    React.useEffect(() => {
        if (!autoPlay) return;
        const interval = setInterval(nextSlide, 4000);
        return () => clearInterval(interval);
    }, [autoPlay]);

    const slide = DEMO_SLIDES[currentSlide];

    return (
        <section className="py-20 px-6 bg-[#0a0c10] relative overflow-hidden">
            {/* Background Gradient */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[150px] -z-10" />

            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                        See Vocal Spark in Action
                    </h2>
                    <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                        A quick tour of the features that make Vocal Spark the smartest AI workspace for content creators.
                    </p>
                </div>

                {/* Carousel Container */}
                <div className="relative bg-gradient-to-br from-[#161b22] to-[#0f1115] border border-gray-800 rounded-2xl overflow-hidden shadow-2xl">

                    {/* Slide Content */}
                    <div className="grid md:grid-cols-2 gap-8 p-8 md:p-12">

                        {/* Left: Text Content */}
                        <div className="flex flex-col justify-center space-y-6">
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-900/30 border border-purple-500/30 rounded-full w-fit">
                                <span className="text-purple-400 text-xs font-bold uppercase tracking-wider">
                                    {slide.highlight}
                                </span>
                            </div>

                            <h3 className="text-2xl md:text-3xl font-bold text-white">
                                {slide.title}
                            </h3>

                            <p className="text-gray-300 text-base md:text-lg leading-relaxed">
                                {slide.description}
                            </p>

                            {/* Slide Indicators */}
                            <div className="flex items-center gap-2">
                                {DEMO_SLIDES.map((_, index) => (
                                    <button
                                        key={index}
                                        onClick={() => setCurrentSlide(index)}
                                        className={`h-1.5 rounded-full transition-all ${index === currentSlide
                                            ? 'w-8 bg-purple-500'
                                            : 'w-4 bg-gray-700 hover:bg-gray-600'
                                            }`}
                                        aria-label={`Go to slide ${index + 1}`}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Right: Image Placeholder */}
                        <div className="relative rounded-xl bg-gradient-to-br from-purple-900/20 to-blue-900/20 border border-purple-500/20 overflow-hidden min-h-[300px] flex items-center justify-center">
                            {/* Placeholder for screenshot */}
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="text-center">
                                    <div className="w-24 h-24 bg-purple-600/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-purple-500/30">
                                        <Play size={40} className="text-purple-400" />
                                    </div>
                                    <p className="text-gray-500 text-sm">
                                        Screenshot: {slide.image}
                                    </p>
                                    <p className="text-gray-600 text-xs mt-2">
                                        (Add actual product screenshots here)
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Navigation Buttons */}
                    <div className="absolute top-1/2 -translate-y-1/2 left-4 right-4 flex justify-between pointer-events-none">
                        <button
                            onClick={prevSlide}
                            className="pointer-events-auto w-10 h-10 bg-gray-800/90 hover:bg-gray-700 rounded-full flex items-center justify-center text-white transition shadow-lg backdrop-blur-sm"
                            aria-label="Previous slide"
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <button
                            onClick={nextSlide}
                            className="pointer-events-auto w-10 h-10 bg-gray-800/90 hover:bg-gray-700 rounded-full flex items-center justify-center text-white transition shadow-lg backdrop-blur-sm"
                            aria-label="Next slide"
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>

                    {/* Progress Bar */}
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-800">
                        <div
                            className="h-full bg-gradient-to-r from-purple-600 to-blue-500 transition-all duration-300"
                            style={{ width: `${((currentSlide + 1) / DEMO_SLIDES.length) * 100}%` }}
                        />
                    </div>
                </div>

                {/* Auto-play Toggle */}
                <div className="flex justify-center mt-6">
                    <button
                        onClick={() => setAutoPlay(!autoPlay)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition ${autoPlay
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                            }`}
                    >
                        {autoPlay ? 'Pause Auto-Play' : 'Enable Auto-Play'}
                    </button>
                </div>
            </div>
        </section>
    );
}
