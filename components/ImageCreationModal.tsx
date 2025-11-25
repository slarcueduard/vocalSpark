import React, { useState } from 'react';
import { X, Sparkles, Zap, Crown, Download, AlertCircle, ArrowLeft } from 'lucide-react';
import { generateImageForPost } from '../services/geminiService';
import { useAuth } from '../contexts/AuthContext';

interface ImageCreationModalProps {
  onClose: () => void;
  onSelectImage: (imageUrl: string) => void;
  initialPrompt?: string;
}

export function ImageCreationModal({ onClose, onSelectImage, initialPrompt = '' }: ImageCreationModalProps) {
  const { checkCredits, credits } = useAuth();
  const [prompt, setPrompt] = useState(initialPrompt);
  const [modelType, setModelType] = useState<'standard' | 'premium'>('standard');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [imageLoadError, setImageLoadError] = useState(false); // State nou pt eroare încărcare

  const COST_STANDARD = 2;
  const COST_PREMIUM = 20;
  const currentCost = modelType === 'standard' ? COST_STANDARD : COST_PREMIUM;
  const canAfford = checkCredits(currentCost);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    if (!canAfford) {
        setError(`Not enough credits. Upgrade plan.`);
        return;
    }

    setIsGenerating(true);
    setError(null);
    setGeneratedImage(null);
    setImageLoadError(false);

    try {
      const imageUrl = await generateImageForPost(prompt, modelType === 'premium');
      setGeneratedImage(imageUrl);
    } catch (err: any) {
      setError(err.message || "Failed to generate image.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-4xl bg-[#0f1115] border border-gray-800 rounded-2xl overflow-hidden flex flex-col md:flex-row h-[650px] shadow-2xl">
        
        {/* LEFT: Controls */}
        <div className="w-full md:w-1/2 p-6 flex flex-col border-r border-gray-800 bg-[#161b22]">
          
          {/* Header cu Back Button */}
          <div className="flex justify-between items-center mb-6">
            <button onClick={onClose} className="flex items-center gap-2 text-gray-400 hover:text-white text-sm font-medium transition">
                <ArrowLeft size={16} /> Back
            </button>
            <div className="bg-gray-800 px-3 py-1 rounded-full border border-gray-700 text-xs text-gray-300">
                Credits: <span className="text-white font-bold">{credits}</span>
            </div>
          </div>

          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Sparkles className="text-blue-500" size={20} /> AI Visuals Studio
          </h2>

          <div className="mb-6">
            <label className="text-xs font-semibold text-gray-500 uppercase mb-2 block">Describe your visual</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full h-28 bg-[#0f1115] border border-gray-700 rounded-xl p-3 text-white text-sm focus:border-blue-500 outline-none resize-none"
              placeholder="E.g. A luxury watch on a rock, splashes of water, cinematic lighting..."
            />
          </div>

          <div className="grid grid-cols-2 gap-3 mb-auto">
            <div 
                onClick={() => setModelType('standard')}
                className={`cursor-pointer p-3 rounded-xl border-2 transition-all ${modelType === 'standard' ? 'border-blue-500 bg-blue-500/10' : 'border-gray-700 bg-gray-800'}`}
            >
                <div className="flex justify-between mb-2"><Zap size={18} className="text-blue-400" /><span className="text-xs bg-black/30 px-2 py-0.5 rounded text-gray-300">{COST_STANDARD} Cr</span></div>
                <div className="font-bold text-sm text-white">Standard</div>
                <div className="text-[10px] text-gray-400">Fast & Abstract</div>
            </div>

            <div 
                onClick={() => setModelType('premium')}
                className={`cursor-pointer p-3 rounded-xl border-2 transition-all ${modelType === 'premium' ? 'border-purple-500 bg-purple-500/10' : 'border-gray-700 bg-gray-800'}`}
            >
                <div className="flex justify-between mb-2"><Crown size={18} className="text-purple-400" /><span className="text-xs bg-black/30 px-2 py-0.5 rounded text-gray-300">{COST_PREMIUM} Cr</span></div>
                <div className="font-bold text-sm text-white">Premium</div>
                <div className="text-[10px] text-gray-400">Photorealistic HD</div>
            </div>
          </div>

          {error && <div className="mt-2 text-red-400 text-xs flex items-center gap-1"><AlertCircle size={12}/> {error}</div>}

          <button 
                onClick={handleGenerate}
                disabled={isGenerating || !prompt || !canAfford}
                className={`w-full py-3 mt-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 ${
                    isGenerating ? 'bg-gray-700' : modelType === 'premium' ? 'bg-gradient-to-r from-purple-600 to-blue-600' : 'bg-blue-600'
                } text-white transition hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed`}
            >
                {isGenerating ? "Generating..." : `Generate (${currentCost} Credits)`}
            </button>
        </div>

        {/* RIGHT: Preview */}
        <div className="w-full md:w-1/2 bg-[#050505] flex flex-col items-center justify-center p-6 relative">
            <button onClick={onClose} className="absolute top-4 right-4 p-2 text-gray-500 hover:text-white"><X size={20}/></button>
            
            {generatedImage && !imageLoadError ? (
                <div className="flex flex-col items-center w-full h-full justify-center gap-4 animate-in fade-in">
                    <img 
                        src={generatedImage} 
                        alt="Result" 
                        onError={() => setImageLoadError(true)}
                        className="max-h-[400px] max-w-full rounded-lg shadow-2xl border border-gray-800"
                    />
                    <div className="flex gap-3 w-full max-w-xs">
                        <button onClick={() => { onSelectImage(generatedImage); onClose(); }} className="flex-1 bg-green-600 hover:bg-green-500 text-white py-2 rounded-lg text-sm font-bold">Use Image</button>
                        <a href={generatedImage} target="_blank" download className="p-2 bg-gray-800 text-white rounded-lg border border-gray-700"><Download size={20}/></a>
                    </div>
                </div>
            ) : (
                <div className="text-center text-gray-500">
                    {imageLoadError ? (
                        <div className="text-red-400 flex flex-col items-center"><AlertCircle size={32} className="mb-2"/> Image load failed. Try again.</div>
                    ) : (
                        <>
                            <Sparkles className={`w-12 h-12 mx-auto mb-4 ${isGenerating ? 'animate-spin text-blue-500' : 'text-gray-700'}`} />
                            <p>{isGenerating ? "Creating magic..." : "Your image will appear here"}</p>
                        </>
                    )}
                </div>
            )}
        </div>
      </div>
    </div>
  );
}
