
import React, { useState, useEffect } from 'react';
import { X, Globe, Search, ArrowRight, Clock, FileText, AlertCircle } from 'lucide-react';
import { Loader } from './Loader';
import { findTrendingSources, SourceItem } from '../services/geminiService';
import { useAuth } from '../contexts/AuthContext';

interface SourceFinderModalProps {
    onClose: () => void;
    onSelectUrl: (url: string) => void;
    initialTopic?: string;
}

export function SourceFinderModal({ onClose, onSelectUrl, initialTopic = '' }: SourceFinderModalProps) {
    const { checkCredits, userProfile } = useAuth();
    const [topic, setTopic] = useState(initialTopic);
    const [isLoading, setIsLoading] = useState(false);
    const [results, setResults] = useState<SourceItem[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [hasSearched, setHasSearched] = useState(false);

    // Auto-search if topic exists on mount
    useEffect(() => {
        if (initialTopic && !hasSearched) {
            handleSearch();
        }
    }, []);

    const handleSearch = async () => {
        if (!topic.trim()) return;
        if (!checkCredits(2)) {
            setError("Insufficient credits (2 Credits required).");
            return;
        }

        setIsLoading(true);
        setError(null);
        setResults([]);
        setHasSearched(true);

        try {
            const data = await findTrendingSources(topic);
            if (data && data.length > 0) {
                setResults(data);
            } else {
                setError("No trending sources found. Try a different topic.");
            }
        } catch (err) {
            setError("Search failed. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
            <div className="w-full max-w-2xl bg-[#161b22] border border-gray-800 rounded-2xl shadow-2xl flex flex-col max-h-[85vh]">

                {/* Header */}
                <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-[#0d1117] rounded-t-2xl">
                    <div>
                        <h2 className="text-lg font-bold text-white flex items-center gap-2">
                            <Globe className="text-blue-500" size={20} />
                            Smart Source Finder
                        </h2>
                        <p className="text-xs text-gray-400">Discover trending content in your niche</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white transition">
                        <X size={20} />
                    </button>
                </div>

                {/* Search Bar */}
                <div className="p-4 border-b border-gray-800 bg-[#0d1117]">
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                            <input
                                type="text"
                                value={topic}
                                onChange={(e) => setTopic(e.target.value)}
                                placeholder="Enter a topic (e.g. AI Marketing, Real Estate Trends)..."
                                className="w-full bg-[#1e252e] border border-gray-700 rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:border-blue-500 outline-none placeholder-gray-500"
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            />
                        </div>
                        <button
                            onClick={handleSearch}
                            disabled={isLoading || !topic.trim()}
                            className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-2 rounded-xl transition disabled:opacity-50 flex items-center gap-2 whitespace-nowrap"
                        >
                            {isLoading ? <Loader size="sm" /> : "Find Content"}
                        </button>
                    </div>
                    <div className="mt-2 text-[10px] text-gray-500 flex justify-between">
                        <span>Queries access live web data via Perplexity AI</span>
                        <span>Cost: 2 Credits / Search</span>
                    </div>
                </div>

                {/* Results Area */}
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-[#0d1117]">
                    {isLoading ? (
                        <div className="space-y-3">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-24 bg-gray-800/50 rounded-xl animate-pulse" />
                            ))}
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center py-10 text-center">
                            <AlertCircle className="text-red-500 mb-2" size={32} />
                            <p className="text-red-400 text-sm font-medium">{error}</p>
                        </div>
                    ) : results.length > 0 ? (
                        <div className="space-y-3">
                            {results.map((item, idx) => (
                                <div key={idx} className="group bg-[#1e252e] border border-gray-800 hover:border-blue-500/50 rounded-xl p-4 transition-all hover:shadow-lg">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="text-sm font-bold text-gray-200 group-hover:text-blue-400 transition leading-snug mr-4">
                                            {item.title}
                                        </h3>
                                        {item.publishedTime && (
                                            <span className="text-[10px] bg-gray-800 text-gray-400 px-2 py-1 rounded-full whitespace-nowrap flex items-center gap-1">
                                                <Clock size={10} /> {item.publishedTime}
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-2 text-[10px] text-gray-500 mb-2 uppercase tracking-wide font-semibold">
                                        <FileText size={10} />
                                        <span>{item.source}</span>
                                    </div>

                                    <p className="text-xs text-gray-400 mb-4 line-clamp-2">
                                        {item.summary}
                                    </p>

                                    <button
                                        onClick={() => onSelectUrl(item.url)}
                                        className="w-full py-2 bg-gray-800 hover:bg-blue-600 hover:text-white text-gray-300 text-xs font-bold rounded-lg transition flex items-center justify-center gap-2"
                                    >
                                        Use This Source <ArrowRight size={12} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : hasSearched ? (
                        <div className="text-center py-10 text-gray-500 text-xs">
                            No results found. Try broader keywords.
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-gray-500 opacity-50">
                            <Search size={48} className="mb-4" />
                            <p className="text-sm">Search for trending news to remix</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
