import React, { useState } from 'react';
import { ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';

interface FAQItem {
    question: string;
    answer: string;
    category?: string;
}

const FAQ_DATA: FAQItem[] = [
    {
        question: "Does this sound better than ChatGPT?",
        answer: "Yes. ChatGPT sounds generic because it doesn't know you. Vocal Spark analyzes your previous work to clone your exact tone, humor, and sentence structure/Voice DNA™.",
        category: "Product"
    },
    {
        question: "Do I need to write anything?",
        answer: "No. You can just talk. Our audio-to-post engine turns your rants, voice notes, or random thoughts into structured social media posts automatically.",
        category: "Features"
    },
    {
        question: "How fast can I generate content?",
        answer: "Under 60 seconds. Speak for 1 minute, effectively get 1 week of content for X, LinkedIn, and Instagram.",
        category: "Performance"
    },
    {
        question: "Will this really sound like me?",
        answer: "Yes. Our Voice DNA engine is designed specifically to capture nuances, slang, and your unique rhythm. It gets smarter the more you use it. You can also edit the DNA manually.",
        category: "Product"
    },
    {
        question: "Which platforms are supported?",
        answer: "We optimize content for LinkedIn, X (Twitter), Instagram, Facebook, and TikTok scripts. One idea is automatically reformatted for all of them.",
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
                        Everything you need to know about Vocal Spark
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
                            href="mailto:support@vocalspark.io"
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
