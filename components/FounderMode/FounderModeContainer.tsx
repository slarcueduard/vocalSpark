import React, { useState } from 'react';
import { WizardStepInput } from './WizardStepInput';
import { WizardStepGoal, GoalType } from './WizardStepGoal';
import { WizardStepReview } from './WizardStepReview';
import { CampaignDashboard } from './CampaignDashboard';
import { Platform, Post as PostType } from '../../types';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../services/firebase';

interface FounderModeContainerProps {
    onClose: () => void;
}

export const FounderModeContainer: React.FC<FounderModeContainerProps> = ({ onClose }) => {

    const { user, brandProfile, userProfile } = useAuth(); // Get Brand Profile

    // WIZARD STATE
    const [step, setStep] = useState<1 | 2 | 3 | 4>(1); // Added Step 4 (Results)

    // DATA STATE
    const [wizardData, setWizardData] = useState<{
        input: string;
        goal: GoalType | null;
        platforms: Platform[];
    }>({
        input: '',
        goal: null,
        platforms: []
    });

    const [campaignResult, setCampaignResult] = useState<any>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isScheduling, setIsScheduling] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // HANDLERS
    const handleInputNext = (input: string) => {
        setWizardData(prev => ({ ...prev, input }));
        setStep(2);
    };

    const handleGoalNext = (goal: GoalType) => {
        setWizardData(prev => ({ ...prev, goal }));
        setStep(3);
    };

    const handleGenerate = async (platforms: Platform[]) => {
        setWizardData(prev => ({ ...prev, platforms }));
        setIsGenerating(true);
        setError(null);

        if (!user || !brandProfile) {
            setError("No active brand profile found.");
            setIsGenerating(false);
            return;
        }

        try {
            const token = await user.getIdToken();
            const response = await fetch('/api/generate-founder-campaign', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    userInput: wizardData.input,
                    goal: wizardData.goal,
                    platforms: platforms,
                    brandProfile: brandProfile
                })
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || "Generation failed");
            }

            const data = await response.json();
            setCampaignResult(data);
            setStep(4);

        } catch (err: any) {
            console.error(err);
            setError(err.message || "Something went wrong.");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleScheduleCampaign = async (startDate: string) => {
        if (!campaignResult || !user) return;
        setIsScheduling(true);

        try {
            const start = new Date(startDate);
            const postsPromises: Promise<any>[] = [];

            campaignResult.days.forEach((day: any) => {
                const currentDayDate = new Date(start);
                currentDayDate.setDate(start.getDate() + (day.day - 1));

                day.posts.forEach((p: any) => {
                    const newPost: Partial<PostType> = {
                        content: p.content,
                        platform: p.platform,
                        scheduledDate: currentDayDate.toISOString(),
                        isPublished: false,
                        type: 'campaign', // Mark as campaign
                        generationType: 'campaign',
                        createdAt: serverTimestamp() as any,
                        userId: user.uid, // Ensure ownership
                        authorId: user.uid,
                        status: 'scheduled',
                        // Include analysis metadata
                        xRayAnalysis: {
                            hook_type: 'founder_mode',
                            tone_detected: brandProfile?.voiceDNA || 'Professional',
                            structure_tag: day.theme
                        }
                    };

                    // Add to Batch
                    postsPromises.push(addDoc(collection(db, 'posts'), newPost));
                });
            });

            await Promise.all(postsPromises);
            alert("Campaign Scheduled Successfully! 📅");
            onClose(); // Close Founder Mode and check calendar
        } catch (e: any) {
            console.error("Scheduling failed: ", e);
            alert("Failed to schedule campaign.");
        } finally {
            setIsScheduling(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0a0c10] text-white flex flex-col items-center pt-20 px-4 relative">

            {/* Header / Nav */}
            <div className="absolute top-6 left-6 flex items-center gap-4">
                <button
                    onClick={onClose}
                    className="p-2 rounded-full hover:bg-gray-800 text-gray-400 hover:text-white transition"
                >
                    <ArrowLeft size={24} />
                </button>
                <div className="flex flex-col">
                    <span className="font-bold text-lg tracking-tight">Founder Mode <span className="text-blue-500 text-xs align-top uppercase ml-1">Beta</span></span>
                </div>
            </div>

            {/* PROGRESS BAR (Hide on Result) */}
            {step < 4 && (
                <div className="w-full max-w-lg mb-12">
                    <div className="flex items-center justify-between relative">
                        {/* Connecting Line */}
                        <div className="absolute left-0 top-4 w-full h-0.5 bg-gray-800 -z-10"></div>

                        {/* Step 1: Brain Dump */}
                        <div className="flex flex-col items-center gap-2">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-500 z-10 
                                ${step >= 1 ? 'bg-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.5)] scale-110' : 'bg-[#161b22] border border-gray-700 text-gray-500'}`}>
                                1
                            </div>
                            <span className={`text-xs font-medium transition-colors duration-300 ${step >= 1 ? 'text-blue-400' : 'text-gray-600'}`}>Brain Dump</span>
                        </div>

                        {/* Step 2: Strategy */}
                        <div className="flex flex-col items-center gap-2">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-500 z-10 
                                ${step >= 2 ? 'bg-purple-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.5)] scale-110' : 'bg-[#161b22] border border-gray-700 text-gray-500'}`}>
                                2
                            </div>
                            <span className={`text-xs font-medium transition-colors duration-300 ${step >= 2 ? 'text-purple-400' : 'text-gray-600'}`}>Strategy</span>
                        </div>

                        {/* Step 3: Review */}
                        <div className="flex flex-col items-center gap-2">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-500 z-10 
                                ${step >= 3 ? 'bg-green-500 text-white shadow-[0_0_15px_rgba(34,197,94,0.5)] scale-110' : 'bg-[#161b22] border border-gray-700 text-gray-500'}`}>
                                3
                            </div>
                            <span className={`text-xs font-medium transition-colors duration-300 ${step >= 3 ? 'text-green-400' : 'text-gray-600'}`}>Review</span>
                        </div>
                    </div>
                </div>
            )}

            {/* ERROR MESSAGE */}
            {error && (
                <div className="bg-red-900/20 text-red-500 px-4 py-2 rounded-lg mb-6 border border-red-500/30">
                    {error}
                </div>
            )}

            {/* STEPS RENDERER */}
            <div className="w-full">
                {step === 1 && <WizardStepInput onNext={handleInputNext} initialInput={wizardData.input} />}
                {step === 2 && <WizardStepGoal onNext={handleGoalNext} onBack={() => setStep(1)} selectedGoal={wizardData.goal || undefined} />}
                {step === 3 && wizardData.goal && <WizardStepReview onGenerate={handleGenerate} onBack={() => setStep(2)} data={{ input: wizardData.input, goal: wizardData.goal }} isGenerating={isGenerating} />}

                {step === 4 && campaignResult && (
                    <CampaignDashboard
                        data={campaignResult}
                        onReset={() => {
                            setStep(1);
                            setWizardData({ input: '', goal: null, platforms: [] });
                            setCampaignResult(null);
                        }}
                        onSchedule={handleScheduleCampaign}
                        isScheduling={isScheduling}
                    />
                )}
            </div>

        </div>
    );
};
