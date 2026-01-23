import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../services/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { TodayPostSettings } from '../../types';
import { Play, Pause, RefreshCw, Zap } from 'lucide-react';

interface TodaysPostSettingsProps {
    onRefresh: () => void; // Callback to refresh feed
}

export const TodaysPostWidget: React.FC<TodaysPostSettingsProps> = ({ onRefresh }) => {
    const { user, allProfiles, userProfile } = useAuth();
    const [settings, setSettings] = useState<TodayPostSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [selectedProfileIndex, setSelectedProfileIndex] = useState(0);

    // Listen to Settings
    useEffect(() => {
        if (!user) return;
        const unsub = onSnapshot(doc(db, 'todayPostSettings', user.uid), (doc) => {
            if (doc.exists()) {
                setSettings(doc.data() as TodayPostSettings);
            } else {
                setSettings(null);
            }
            setLoading(false);
        });
        return () => unsub();
    }, [user]);

    const handleActivate = async () => {
        if (!user) return;
        setGenerating(true);
        try {
            const profile = allProfiles[selectedProfileIndex];
            const token = await user.getIdToken();

            const res = await fetch('/api/generate-todays-post', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    brandProfile: profile,
                    action: 'activate'
                })
            });

            if (!res.ok) throw new Error("Failed to activate");
            onRefresh(); // Refresh feed
        } catch (error) {
            console.error(error);
            alert("Failed to activate Daily Series.");
        } finally {
            setGenerating(false);
        }
    };

    const handleCheckDaily = async () => {
        if (!user || !settings) return;
        setGenerating(true);
        try {
            const profile = allProfiles.find(p => p.name === settings.brandDnaId) || allProfiles[0];
            const token = await user.getIdToken();

            const res = await fetch('/api/generate-todays-post', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    brandProfile: profile,
                    action: 'check_daily',
                    currentSettings: settings
                })
            });

            if (!res.ok) throw new Error("Failed to generate");
            onRefresh();
        } catch (error) {
            console.error(error);
            alert("Failed to generate daily post.");
        } finally {
            setGenerating(false);
        }
    };

    if (loading) return <div className="text-gray-500 text-xs">Loading Settings...</div>;

    if (!settings || settings.status === 'paused') {
        return (
            <div className="bg-[#161b22] border border-blue-900/30 p-5 rounded-xl">
                <div className="flex items-center gap-3 mb-4">
                    <div className="bg-blue-600/20 p-2 rounded-lg text-blue-400">
                        <Zap size={20} />
                    </div>
                    <div>
                        <h3 className="font-bold text-white text-sm">Activate Today's Post</h3>
                        <p className="text-xs text-gray-500">Automated daily content series.</p>
                    </div>
                </div>

                <div className="mb-4">
                    <label className="text-xs text-gray-400 block mb-1">Select Brand Voice</label>
                    <select
                        value={selectedProfileIndex}
                        onChange={(e) => setSelectedProfileIndex(Number(e.target.value))}
                        className="w-full bg-[#0a0c10] border border-gray-700 text-white text-sm rounded-lg p-2"
                    >
                        {allProfiles.map((p, idx) => (
                            <option key={idx} value={idx}>{p.name}</option>
                        ))}
                    </select>
                </div>

                {allProfiles.length === 0 ? (
                    <div className="text-red-500 text-xs text-center mb-2">No Brand Profiles found. Please create one first.</div>
                ) : (
                    <button
                        onClick={handleActivate}
                        disabled={generating}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold py-2 rounded-lg flex items-center justify-center gap-2 transition"
                    >
                        {generating ? <RefreshCw size={14} className="animate-spin" /> : <Play size={14} />}
                        {generating ? 'Starting Engine...' : 'Start Daily Series'}
                    </button>
                )}
            </div>
        );
    }

    return (
        <div className="bg-[#161b22] border border-green-900/30 p-5 rounded-xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-green-500"></div>

            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                    <div className="bg-green-600/20 p-2 rounded-lg text-green-400">
                        <Zap size={20} />
                    </div>
                    <div>
                        <h3 className="font-bold text-white text-sm">Daily Series Active</h3>
                        <p className="text-xs text-green-400">Voice: {settings.brandDnaId}</p>
                    </div>
                </div>
                <div className="text-right">
                    <span className="text-[10px] text-gray-500 uppercase tracking-wider block">Status</span>
                    <span className="text-xs font-bold text-white flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span> Running
                    </span>
                </div>
            </div>

            <div className="flex gap-2">
                <button
                    onClick={handleCheckDaily}
                    disabled={generating}
                    className="flex-1 bg-[#0a0c10] border border-gray-700 hover:border-gray-500 text-white text-xs font-bold py-2 rounded-lg transition"
                >
                    {generating ? 'Generating...' : 'Force Generate (Test)'}
                </button>
                <button className="px-3 bg-[#0a0c10] border border-gray-700 hover:text-red-400 text-gray-500 rounded-lg">
                    <Pause size={14} />
                </button>
            </div>
        </div>
    );
};
