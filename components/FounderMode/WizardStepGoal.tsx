import React from 'react';
import { Rocket, BookOpen, Heart, DollarSign, CheckCircle } from 'lucide-react';

export type GoalType = 'hype' | 'story' | 'value' | 'sales';

interface WizardStepGoalProps {
    onNext: (goal: GoalType) => void;
    onBack: () => void;
    selectedGoal?: GoalType;
}

export const WizardStepGoal: React.FC<WizardStepGoalProps> = ({ onNext, onBack, selectedGoal }) => {

    const goals: { id: GoalType, icon: any, title: string, desc: string, color: string }[] = [
        {
            id: 'hype',
            icon: Rocket,
            title: "The Hype Launch",
            desc: "Aggressive, short, curiosity-driven. Best for new features.",
            color: "text-purple-500"
        },
        {
            id: 'story',
            icon: Heart,
            title: "The Storytelling",
            desc: "Vulnerable, human, building-in-public. Best for trust.",
            color: "text-red-500"
        },
        {
            id: 'value',
            icon: BookOpen,
            title: "Value / Educational",
            desc: "Practical, helpful, authority-driven. Best for inbound.",
            color: "text-blue-500"
        },
        {
            id: 'sales',
            icon: DollarSign,
            title: "The Sale",
            desc: "Direct, urgent, conversion-focused. Best for offers.",
            color: "text-green-500"
        }
    ];

    return (
        <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-right-8">
            <div className="text-center mb-10">
                <h2 className="text-3xl font-bold text-white mb-2">What is the Goal?</h2>
                <p className="text-gray-400">Choose the strategy. We'll handle the hooks.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {goals.map((g) => (
                    <button
                        key={g.id}
                        onClick={() => onNext(g.id)}
                        className={`group relative p-6 rounded-2xl border text-left transition-all hover:scale-[1.01] ${selectedGoal === g.id
                            ? 'bg-[#1c1c2e] border-blue-500 shadow-2xl shadow-blue-900/20'
                            : 'bg-[#161b22] border-gray-800 hover:border-gray-600'}`}
                    >
                        <div className={`p-3 rounded-xl bg-[#0f1115] w-fit mb-4 ${g.color} group-hover:scale-110 transition-transform`}>
                            <g.icon size={28} />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">{g.title}</h3>
                        <p className="text-sm text-gray-400">{g.desc}</p>

                        {selectedGoal === g.id && (
                            <div className="absolute top-4 right-4 text-blue-500">
                                <CheckCircle size={24} fill="currentColor" className="text-blue-500" />
                            </div>
                        )}
                    </button>
                ))}
            </div>

            <div className="mt-8 text-center">
                <button
                    onClick={onBack}
                    className="text-gray-500 hover:text-white text-sm font-medium transition"
                >
                    Back to Input
                </button>
            </div>
        </div>
    );
};
