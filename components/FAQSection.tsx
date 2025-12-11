import React, { useState } from 'react';
import { ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';

interface FAQItem {
    question: string;
    answer: string;
    category?: string;
}

const FAQ_DATA: FAQItem[] = [
    {
        question: "What makes Social Spark different from ChatGPT?",
        answer: "ChatGPT gives you generic content that sounds robotic. Social Spark uses Voice DNA technology to clone YOUR specific writing style, tone, and brand identity. Every post is injected with your brand profile, ensuring consistency across all content. Plus, we have Remix Mode, Campaign Planning, and Visual-Text Sync - features ChatGPT doesn't offer.",
        category: "Product"
    },
    {
        question: "How does the credit system work?",
        answer: "Credits are consumed based on AI complexity. Text generation costs 1-10 credits depending on length and real-time data usage. Standard images (Flux) cost 2 credits, while Premium DALL-E 3 images cost 20 credits. Your plan renews monthly with a fresh credit allocation. Unused credits don't roll over.",
        category: "Pricing"
    },
    {
        question: "Can I cancel my subscription anytime?",
        answer: "Absolutely! There are no contracts or commitments. Cancel anytime from your account settings. You'll retain access until the end of your billing period. No refunds for partial months, but you can use all remaining credits.",
        category: "Pricing"
    },
    {
        question: "What is Voice DNA and how does it work?",
        answer: "Voice DNA is our proprietary brand cloning technology. You provide sample content (blogs, posts, or influencer URLs), and our AI analyzes tone, vocabulary, humor style, emoji usage, and writing patterns. This creates a DNA profile that's injected into every generation, ensuring your content never sounds generic.",
        category: "Features"
    },
    {
        question: "Do I need technical skills to use Social Spark?",
        answer: "Not at all! Social Spark is designed for creators, not developers. Just type your idea, select your brand voice, and click generate. The AI handles everything. No coding, no complex setup.",
        category: "Product"
    },
    {
        question: "Is my data secure? Do you train AI on my content?",
        answer: "Your data is 100% secure with Firebase/Google Cloud infrastructure. We NEVER train AI models on your private content or brand profiles. Your Voice DNA and vault content are encrypted and private. We're GDPR-compliant and take privacy seriously.",
        category: "Security"
    },
    {
        question: "What happens after my 5-day Pro trial ends?",
        answer: "After 5 days, you'll need to choose a paid plan to continue. If you don't upgrade, you won't lose your saved posts in the Vault, but you won't be able to generate new content. Your brand profiles are preserved.",
        category: "Pricing"
    },
    {
        question: "Can I use Social Spark for client work?",
        answer: "Yes! The Agency plan is built for this. You get unlimited brand voices, 7,000 credits/month, and commercial usage rights. Perfect for agencies, freelancers, and consultants managing multiple client brands.",
        category: "Features"
    },
    {
        question: "What's the difference between Standard and Premium images?",
        answer: "Standard images use Flux AI (2 credits) - fast, good quality, perfect for volume. Premium uses DALL-E 3 (20 credits) - photorealistic, high-detail, best for flagship campaigns. Pro+ users can toggle between both.",
        category: "Features"
    },
    {
        question: "How does Remix Mode work?",
        answer: "Paste one piece of content (blog post, article, video script), select output formats (LinkedIn, Twitter Thread, Instagram Carousel, etc.), and AI repurposes it into multiple platform-specific variations in seconds. It's like having 5 copywriters working simultaneously.",
        category: "Features"
    }
];

export function FAQSection() {
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    const toggleFAQ = (index: number) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    return (
        <section className="py-20 px-6 bg-[#0a0c10]">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-900/20 border border-blue-500/30 rounded-full mb-4">
                        <HelpCircle size={16} className="text-blue-400" />
                        <span className="text-blue-400 text-xs font-bold uppercase tracking-wider">FAQ</span>
                    </div>
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                        Frequently Asked Questions
                    </h2>
                    <p className="text-gray-400 text-lg">
                        Everything you need to know about Social Spark AI
                    </p>
                </div>

                {/* FAQ Items */}
                <div className="space-y-4">
                    {FAQ_DATA.map((faq, index) => (
                        <div
                            key={index}
                            className="bg-[#161b22] border border-gray-800 rounded-xl overflow-hidden hover:border-gray-700 transition-all"
                        >
                            <button
                                onClick={() => toggleFAQ(index)}
                                className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-gray-800/30 transition"
                            >
                                <div className="flex-1">
                                    <h3 className="text-white font-semibold text-base md:text-lg pr-4">
                                        {faq.question}
                                    </h3>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    {faq.category && (
                                        <span className="hidden sm:inline-block text-[10px] text-gray-500 uppercase tracking-wider bg-gray-800 px-2 py-1 rounded">
                                            {faq.category}
                                        </span>
                                    )}
                                    {openIndex === index ? (
                                        <ChevronUp className="text-blue-400" size={20} />
                                    ) : (
                                        <ChevronDown className="text-gray-500" size={20} />
                                    )}
                                </div>
                            </button>

                            <div
                                className={`overflow-hidden transition-all duration-300 ease-in-out ${openIndex === index ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                                    }`}
                            >
                                <div className="px-6 pb-5 pt-2">
                                    <p className="text-gray-300 text-sm md:text-base leading-relaxed">
                                        {faq.answer}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Contact CTA */}
                <div className="mt-12 text-center p-6 bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-500/30 rounded-xl">
                    <p className="text-gray-300 mb-4">
                        Still have questions? We're here to help!
                    </p>
                    <div className="flex flex-wrap gap-3 justify-center">
                        <a
                            href="https://discord.gg/your-server"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition"
                        >
                            Join Discord
                        </a>
                        <a
                            href="mailto:support@socialspark.ai"
                            className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition"
                        >
                            Email Support
                        </a>
                    </div>
                </div>
            </div>
        </section>
    );
}
