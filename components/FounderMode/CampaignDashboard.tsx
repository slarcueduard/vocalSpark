import React from 'react';
import { Calendar, Copy, Check, Share2, Download } from 'lucide-react';

interface Post {
    platform: string;
    content: string;
    media_suggestion: string;
    hook_analysis: string;
}

interface DayPlan {
    day: number;
    theme: string;
    posts: Post[];
}

interface CampaignData {
    campaign_title: string;
    strategy_summary: string;
    explanation?: string;
    tracking_KPIs?: string[];
    execution_guide?: {
        platform_strategy: { platform: string; advice: string }[];
        engagement_tips: string[];
    };
    days: DayPlan[];
}

interface CampaignDashboardProps {
    data: CampaignData;
    onReset: () => void;
    onSchedule: (startDate: string) => void;
    isScheduling: boolean;
}

export const CampaignDashboard: React.FC<CampaignDashboardProps> = ({ data, onReset, onSchedule, isScheduling }) => {
    const [startDate, setStartDate] = React.useState<string>(new Date().toISOString().split('T')[0]);

    const getDayDate = (dayOffset: number) => {
        const date = new Date(startDate);
        date.setDate(date.getDate() + (dayOffset - 1));
        return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    };
    return (
        <div className="max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-8 pb-20">

            {/* HEADER */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="bg-blue-900/30 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">Campaign Ready</span>
                        <span className="text-gray-500 text-sm">• 3 Day Plan</span>
                    </div>
                    <h1 className="text-3xl font-bold text-white">{data.campaign_title}</h1>
                    <p className="text-gray-400 mt-1 max-w-2xl">{data.strategy_summary}</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={onReset} className="px-4 py-2 text-sm font-bold text-gray-400 hover:text-white transition">New Campaign</button>
                    <button className="bg-white text-black px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-gray-200 transition">
                        <Download size={16} /> Export CSV
                    </button>
                    <div className="flex items-center gap-2 bg-[#161b22] p-1 rounded-lg border border-gray-700 ml-2">
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="bg-transparent text-white text-sm px-2 focus:outline-none"
                        />
                        <button
                            onClick={() => onSchedule(startDate)}
                            disabled={isScheduling}
                            className="bg-green-600 hover:bg-green-500 text-white px-3 py-1.5 rounded-md text-sm font-bold transition flex items-center gap-1 disabled:opacity-50"
                        >
                            {isScheduling ? 'Scheduling...' : 'Schedule All'}
                        </button>
                    </div>
                </div>
            </div>

            {/* STRATEGY INSIGHTS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                <div className="md:col-span-2 bg-[#161b22] border border-gray-800 rounded-xl p-5">
                    <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider mb-2 flex items-center gap-2">
                        <span className="w-2 h-2 bg-blue-500 rounded-full"></span> Campaign Narrative
                    </h3>
                    <p className="text-sm text-gray-400 leading-relaxed">
                        {data.explanation || "This campaign helps you achieve your goal by building a narrative arc."}
                    </p>
                </div>
                <div className="bg-[#161b22] border border-gray-800 rounded-xl p-5">
                    <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider mb-2 flex items-center gap-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span> Success Metrics
                    </h3>
                    <ul className="space-y-2">
                        {(data.tracking_KPIs || []).map((kpi, i) => (
                            <li key={i} className="text-sm text-gray-400 flex items-start gap-2">
                                <Check size={14} className="mt-1 text-green-500 shrink-0" />
                                {kpi}
                            </li>
                        ))}
                        {(!data.tracking_KPIs || data.tracking_KPIs.length === 0) && (
                            <li className="text-sm text-gray-500 italic">No specific KPIs generated.</li>
                        )}
                    </ul>
                </div>
            </div>

            {/* EXECUTION GUIDE (NEW) */}
            {data.execution_guide && (
                <div className="mb-10 bg-[#161b22] border border-gray-800 rounded-xl p-6">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <span className="text-xl">⚡</span> Execution Guide
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Platform Strategy */}
                        <div>
                            <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-3">Platform Strategy</h4>
                            <div className="space-y-4">
                                {data.execution_guide.platform_strategy.map((strat, i) => (
                                    <div key={i} className="bg-[#0f1115] p-3 rounded-lg border border-gray-800">
                                        <div className="text-xs font-bold text-white mb-1">{strat.platform}</div>
                                        <p className="text-xs text-gray-400">{strat.advice}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Engagement Tips */}
                        <div>
                            <h4 className="text-xs font-bold text-green-400 uppercase tracking-wider mb-3">Engagement Hacks</h4>
                            <ul className="space-y-2">
                                {data.execution_guide.engagement_tips.map((tip, i) => (
                                    <li key={i} className="flex items-start gap-2 text-sm text-gray-400">
                                        <span className="text-green-500 mt-1">•</span>
                                        {tip}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            )}

            {/* TIMELINE GRID */}
            <div className="space-y-8 relative">
                <div className="absolute left-6 top-8 bottom-8 w-0.5 bg-gray-800 hidden md:block"></div>

                {data.days.map((day, idx) => (
                    <div key={idx} className="relative pl-0 md:pl-16">
                        {/* Day Marker */}
                        <div className="absolute left-2 top-0 w-8 h-8 bg-[#161b22] border border-gray-700 rounded-full flex items-center justify-center font-bold text-sm text-gray-500 z-10 hidden md:flex">
                            {day.day}
                        </div>

                        <div className="mb-4">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                <span className="md:hidden bg-gray-800 px-2 rounded text-xs">Day {day.day}</span>
                                {day.theme}
                                <span className="text-sm font-normal text-gray-500 ml-2 border border-gray-700 px-2 rounded-full">
                                    {getDayDate(day.day)}
                                </span>
                            </h3>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {day.posts.map((post, pIdx) => (
                                <div key={pIdx} className="bg-[#161b22] border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition group">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-2">
                                            <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider 
                                                ${post.platform.includes('Linked') ? 'bg-blue-900/20 text-blue-400' :
                                                    post.platform.includes('X') ? 'bg-gray-800 text-white' :
                                                        'bg-purple-900/20 text-purple-400'}`}>
                                                {post.platform}
                                            </span>
                                        </div>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                                            <button className="p-1.5 hover:bg-gray-800 rounded text-gray-400 hover:text-white" title="Copy Text">
                                                <Copy size={14} />
                                            </button>
                                            <button className="p-1.5 hover:bg-gray-800 rounded text-gray-400 hover:text-white" title="Schedule">
                                                <Calendar size={14} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Hook Analysis */}
                                    <div className="bg-[#0f1115] p-3 rounded-lg mb-4 border-l-2 border-yellow-500/50">
                                        <p className="text-[10px] text-yellow-500/80 font-bold uppercase mb-1">Strategy Note</p>
                                        <p className="text-xs text-gray-400 italic">{post.hook_analysis}</p>
                                    </div>

                                    {/* Content Preview */}
                                    <div className="bg-[#0f1115] rounded-lg p-4 font-mono text-sm text-gray-300 whitespace-pre-wrap border border-gray-800/50 h-56 overflow-y-auto custom-scrollbar">
                                        {post.content}
                                    </div>

                                    {/* Media Suggestion */}
                                    <div className="mt-4 pt-4 border-t border-gray-800 flex items-start gap-2">
                                        <div className="bg-gray-800 p-1.5 rounded text-gray-400 mt-0.5">
                                            <Share2 size={12} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-gray-500 font-bold uppercase">Visual Suggestion</p>
                                            <p className="text-xs text-gray-400">{post.media_suggestion}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
