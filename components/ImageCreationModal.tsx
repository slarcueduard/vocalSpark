import React, { useState } from 'react';
import { X, Sparkles, Zap, Crown, Download, AlertCircle } from 'lucide-react';
import { generateImageForPost } from '../services/geminiService';
import { useAuth } from '../contexts/AuthContext';

interface ImageCreationModalProps {
  onClose: () => void;
  onSelectImage: (imageUrl: string) => void;
  initialPrompt?: string;
}

export function ImageCreationModal({ onClose, onSelectImage, initialPrompt = '' }: ImageCreationModalProps) {
  const { checkCredits, credits, incrementImageCount } = useAuth(); // incrementImageCount e doar pt update local rapid
  const [prompt, setPrompt] = useState(initialPrompt);
  const [modelType, setModelType] = useState<'standard' | 'premium'>('standard');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Definim costurile (Trebuie să fie la fel ca în Backend!)
  const COST_STANDARD = 2;
  const COST_PREMIUM = 20;
  
  const currentCost = modelType === 'standard' ? COST_STANDARD : COST_PREMIUM;
  const canAfford = checkCredits(currentCost);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    if (!canAfford) {
        setError(`Not enough credits. You need ${currentCost}, but have ${credits}.`);
        return;
    }

    setIsGenerating(true);
    setError(null);
    setGeneratedImage(null);

    try {
      // Apelăm API-ul cu tipul selectat
      const imageUrl = await generateImageForPost(prompt, modelType === 'premium');
      
      setGeneratedImage(imageUrl);
      // Backend-ul scade creditele, dar putem forța un refresh vizual dacă avem funcția expusă, 
      // sau ne bazăm pe onSnapshot din AuthContext care va actualiza automat creditele în câteva secunde.
    } catch (err: any) {
      setError(err.message || "Failed to generate image. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUseImage = () => {
    if (generatedImage) {
      onSelectImage(generatedImage);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-4xl bg-[#0f1115] border border-gray-800 rounded-2xl overflow-hidden flex flex-col md:flex-row h-[600px] shadow-2xl">
        
        {/* LEFT: Controls */}
        <div className="w-full md:w-1/2 p-6 flex flex-col border-r border-gray-800">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Sparkles className="text-blue-500" /> Visuals Studio
            </h2>
            
            {/* Credit Display */}
            <div className="bg-gray-800 px-3 py-1 rounded-full border border-gray-700 text-xs font-medium text-gray-300">
                Credits: <span className={canAfford ? "text-white" : "text-red-400"}>{credits}</span>
            </div>
          </div>

          {/* Prompt Input */}
          <div className="mb-6">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">
                Describe your idea
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full h-24 bg-[#161b22] border border-gray-700 rounded-xl p-3 text-white text-sm focus:ring-2 focus:ring-blue-600 outline-none resize-none"
              placeholder="A futuristic workspace with neon lights..."
            />
          </div>

          {/* Model Selection Cards */}
          <div className="grid grid-cols-2 gap-3 mb-auto">
            {/* Standard Card */}
            <div 
                onClick={() => setModelType('standard')}
                className={`cursor-pointer p-3 rounded-xl border-2 transition-all ${
                    modelType === 'standard' 
                    ? 'border-blue-500 bg-blue-500/10' 
                    : 'border-gray-800 bg-gray-900 hover:border-gray-700'
                }`}
            >
                <div className="flex justify-between items-start mb-2">
                    <Zap size={20} className={modelType === 'standard' ? 'text-blue-400' : 'text-gray-600'} />
                    <span className="text-xs font-bold bg-gray-800 px-1.5 py-0.5 rounded text-gray-300">
                        {COST_STANDARD} Cr
                    </span>
                </div>
                <div className="text-sm font-bold text-white">Standard</div>
                <div className="text-[10px] text-gray-400">Fast generation. Good for social posts.</div>
            </div>

            {/* Premium Card */}
            <div 
                onClick={() => setModelType('premium')}
                className={`cursor-pointer p-3 rounded-xl border-2 transition-all ${
                    modelType === 'premium' 
                    ? 'border-purple-500 bg-purple-500/10' 
                    : 'border-gray-800 bg-gray-900 hover:border-gray-700'
                }`}
            >
                <div className="flex justify-between items-start mb-2">
                    <Crown size={20} className={modelType === 'premium' ? 'text-purple-400' : 'text-gray-600'} />
                    <span className="text-xs font-bold bg-gray-800 px-1.5 py-0.5 rounded text-gray-300">
                        {COST_PREMIUM} Cr
                    </span>
                </div>
                <div className="text-sm font-bold text-white">Premium</div>
                <div className="text-[10px] text-gray-400">DALL-E 3 Quality. HD & High detail.</div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-900/20 border border-red-800/50 rounded-lg flex items-center gap-2 text-red-400 text-xs">
                <AlertCircle size={14} /> {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 mt-4">
            <button onClick={onClose} className="px-4 py-3 rounded-xl text-gray-400 hover:bg-gray-800 text-sm font-medium">
                Cancel
            </button>
            <button 
                onClick={handleGenerate}
                disabled={isGenerating || !prompt || !canAfford}
                className={`flex-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                    isGenerating || !canAfford
                    ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                    : modelType === 'premium' 
                        ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-900/30 hover:scale-[1.02]'
                        : 'bg-blue-600 text-white hover:bg-blue-500'
                }`}
            >
                {isGenerating ? (
                    <span className="animate-pulse">Generating...</span>
                ) : (
                    <>
                        <Sparkles size={16} /> 
                        Generate ({currentCost} Credits)
                    </>
                )}
            </button>
          </div>
        </div>

        {/* RIGHT: Preview Area */}
        <div className="w-full md:w-1/2 bg-[#0a0c10] flex flex-col items-center justify-center relative p-6">
            {generatedImage ? (
                <div className="relative w-full h-full flex flex-col items-center justify-center animate-in zoom-in-50 duration-300">
                    <img 
                        src={generatedImage} 
                        alt="Generated AI" 
                        className="max-w-full max-h-[400px] rounded-lg shadow-2xl border border-gray-800 object-contain"
                    />
                    <div className="mt-6 flex gap-3 w-full max-w-xs">
                        <button 
                            onClick={handleUseImage}
                            className="flex-1 bg-green-600 hover:bg-green-500 text-white py-2 rounded-lg text-sm font-bold shadow-lg"
                        >
                            Use Image
                        </button>
                        <a 
                            href={generatedImage} 
                            download="social-spark-ai.png"
                            target="_blank"
                            rel="noreferrer"
                            className="p-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 border border-gray-700"
                        >
                            <Download size={20} />
                        </a>
                    </div>
                </div>
            ) : (
                <div className="text-center">
                    <div className="w-24 h-24 bg-gray-900 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-gray-800 border-dashed">
                        {isGenerating ? (
                            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                            <Sparkles className="text-gray-700 w-10 h-10" />
                        )}
                    </div>
                    <p className="text-gray-500 text-sm">
                        {isGenerating ? "Creating your masterpiece..." : "Your visualization will appear here"}
                    </p>
                </div>
            )}
            
            {/* Close X top right (Mobile friendly) */}
            <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-black/50 rounded-full text-white hover:bg-white/20 md:hidden">
                <X size={20} />
            </button>
        </div>
      </div>
    </div>
  );
}
