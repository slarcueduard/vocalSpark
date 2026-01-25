import React, { useState, useEffect } from 'react';
import { Mic, Type, ArrowRight, Sparkles } from 'lucide-react';

interface WizardStepInputProps {
    onNext: (input: string, mode: 'text' | 'voice') => void;
    initialInput?: string;
}

export const WizardStepInput: React.FC<WizardStepInputProps> = ({ onNext, initialInput = '' }) => {
    const [input, setInput] = useState(initialInput);
    const [isListening, setIsListening] = useState(false);

    // Mock Voice Recognition for now
    const [recognition, setRecognition] = useState<any>(null);

    React.useEffect(() => {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            const recognitionInstance = new SpeechRecognition();
            recognitionInstance.continuous = true;
            recognitionInstance.interimResults = true;
            recognitionInstance.lang = 'en-US';

            recognitionInstance.onresult = (event: any) => {
                let interimTranscript = '';
                let finalTranscript = '';

                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        finalTranscript += event.results[i][0].transcript;
                    } else {
                        interimTranscript += event.results[i][0].transcript;
                    }
                }

                if (finalTranscript) {
                    setInput(prev => prev + ' ' + finalTranscript);
                }
            };

            recognitionInstance.onerror = (event: any) => {
                console.error("Speech recognition error", event.error);
                setIsListening(false);
            };

            recognitionInstance.onend = () => {
                setIsListening(false);
            };

            setRecognition(recognitionInstance);
        }
    }, []);

    const toggleListening = () => {
        if (!recognition) {
            alert("Voice recognition is not supported in this browser.");
            return;
        }

        if (isListening) {
            recognition.stop();
            setIsListening(false);
        } else {
            recognition.start();
            setIsListening(true);
        }
    };

    return (
        <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4">
            <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-white mb-2">What's on your mind?</h2>
                <p className="text-gray-400">Pour your thoughts out. We'll structure them later.</p>
            </div>

            <div className="bg-[#161b22] border border-gray-800 rounded-2xl p-1 shadow-lg">
                <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="e.g. 'I want to announce our new feature that helps users save time. It's called SpeedMode and it's available today.'"
                    className="w-full h-48 bg-transparent text-lg text-white p-6 focus:outline-none resize-none placeholder-gray-600"
                />

                <div className="flex justify-between items-center p-4 border-t border-gray-800 bg-[#0f1115] rounded-b-xl">
                    <button
                        onClick={toggleListening}
                        className={`p-3 rounded-full transition-all ${isListening ? 'bg-red-500/20 text-red-500 animate-pulse' : 'hover:bg-red-500/10 text-gray-400 hover:text-red-500'}`}
                    >
                        <Mic size={24} />
                    </button>

                    <button
                        onClick={() => onNext(input, 'text')}
                        disabled={!input.trim()}
                        className="bg-white text-black px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:scale-[1.02] transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Next Step <ArrowRight size={18} />
                    </button>
                </div>
            </div>

            <div className="mt-8 flex justify-center gap-4 text-sm text-gray-500">
                <span className="flex items-center gap-1"><Sparkles size={14} className="text-yellow-500" /> Don't worry about formatting</span>
                <span className="flex items-center gap-1"><Sparkles size={14} className="text-blue-500" /> Just raw ideas</span>
            </div>
        </div>
    );
};
