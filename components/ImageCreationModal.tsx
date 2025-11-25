import React, { useState, useRef } from 'react';
import { 
  X, 
  Sparkles, 
  Zap, 
  Crown, 
  Download, 
  AlertCircle, 
  ArrowLeft, 
  Upload, 
  Image as ImageIcon, 
  Palette,
  Trash
} from 'lucide-react';
import { generateImageForPost } from '../services/geminiService';
import { useAuth } from '../contexts/AuthContext';

interface ImageCreationModalProps {
  onClose: () => void;
  onSelectImage: (imageUrl: string) => void;
  initialPrompt?: string;
}

// --- DEFINIREA FILTRELOR (Focus: Realism & Business) ---
const IMAGE_STYLES = [
  { 
    id: 'velocity', 
    label: 'Velocity Dark', 
    description: 'Cyberpunk, Neon, Moody',
    promptSuffix: ', dark moody cyberpunk aesthetic, neon blue and purple lighting, high contrast, John Wick style, cinematic atmosphere, sharp focus, 8k',
    isExclusive: true 
  },
  { 
    id: 'lifestyle', 
    label: 'Lifestyle Social', 
    description: 'Natural, Influencer',
    promptSuffix: ', authentic lifestyle photography, shot on iPhone 15 Pro, natural sunlight, candid moment, instagram aesthetic, soft bokeh, high quality, trending',
    isExclusive: false
  },
  { 
    id: 'studio', 
    label: 'Studio Pro', 
    description: 'Clean, Product',
    promptSuffix: ', professional studio photography, neutral background, softbox lighting, 85mm lens, sharp details, 4k, commercial look, product photography',
    isExclusive: false
  },
  { 
    id: 'realism', 
    label: 'Hyper Realism', 
    description: 'Photojournalism, Raw',
    promptSuffix: ', award winning photography, national geographic style, highly detailed texture, natural lighting, unedited look, raw file, 8k resolution',
    isExclusive: false
  },
  { 
    id: 'minimalist', 
    label: 'Minimalist Tech', 
    description: 'Clean, Apple style',
    promptSuffix: ', minimalist aesthetic, apple design style, white background, soft shadows, clean lines, modern, futuristic but clean',
    isExclusive: false
  },
  { 
    id: 'corporate', 
    label: 'Corporate', 
    description: 'Office, Professional',
    promptSuffix: ', corporate modern office environment, professional atmosphere, confident, success, linkedin style, bright meeting room',
    isExclusive: false
  }
];

export function ImageCreationModal({ onClose, onSelectImage, initialPrompt = '' }: ImageCreationModalProps) {
  const { checkCredits, credits } = useAuth();
  const [activeTab, setActiveTab] = useState<'generate' | 'upload'>('generate');
  const [prompt, setPrompt] = useState(initialPrompt);
  const [modelType, setModelType] = useState<'standard' | 'premium'>('standard');
  const [selectedStyle, setSelectedStyle] = useState<string>('velocity');
  const [isGenerating, setIsGenerating] = useState(false);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const COST_STANDARD = 2;
  const COST_PREMIUM = 20;
  const currentCost = modelType === 'standard' ? COST_STANDARD : COST_PREMIUM;
  const canAfford = checkCredits(currentCost);

  // --- LOGICA GENERARE AI ---
  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    if (!canAfford) { setError(`Not enough credits.`); return; }

    setIsGenerating(true);
    setError(null);
    setResultImage(null);

    try {
      // 1. Găsim stilul selectat
      const styleObj = IMAGE_STYLES.find(s => s.id === selectedStyle);
      
      // 2. Combinăm promptul userului cu stilul
      const finalPrompt = styleObj 
        ? `${prompt}${styleObj.promptSuffix}` 
        : prompt;

      // 3. Trimitem la backend
      const imageUrl = await generateImageForPost(finalPrompt, modelType === 'premium');
      setResultImage(imageUrl);
    } catch (err: any) {
      setError(err.message || "Failed to generate image.");
    } finally {
      setIsGenerating(false);
    }
  };

  // --- LOGICA UPLOAD ---
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validare simplă dimensiune (ex: max 5MB)
    if (file.size > 5 * 1024 * 1024) {
        setError("File is too large (Max 5MB)");
        return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
        setResultImage(reader.result as string);
        setError(null); // Curățăm erorile anterioare
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-6xl bg-[#0f1115] border border-gray-800 rounded-2xl overflow-hidden flex flex-col md:flex-row h-[750px] shadow-2xl">
        
        {/* LEFT: Controls */}
        <div className="w-full md:w-1/2 p-6 flex flex-col border-r border-gray-800 bg-[#161b22] overflow-y-auto custom-scrollbar">
          
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <button onClick={onClose} className="flex items-center gap-2 text-gray-400 hover:text-white text-sm font-medium">
                <ArrowLeft size={16} /> Back
            </button>
            <div className="bg-gray-800 px-3 py-1 rounded-full border border-gray-700 text-xs text-gray-300">
                Credits: <span className={canAfford ? "text-white font-bold" : "text-red-400 font-bold"}>{credits}</span>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex p-1 bg-gray-900 rounded-xl mb-6 border border-gray-800 sticky top-0 z-10">
              <button 
                onClick={() => setActiveTab('generate')}
                className={`flex-1 py-2 text-sm font-medium rounded-lg flex items-center justify-center gap-2 transition ${activeTab === 'generate' ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}
              >
                  <Sparkles size={14} /> AI Generate
              </button>
              <button 
                onClick={() => setActiveTab('upload')}
                className={`flex-1 py-2 text-sm font-medium rounded-lg flex items-center justify-center gap-2 transition ${activeTab === 'upload' ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}
              >
                  <Upload size={14} /> Upload
              </button>
          </div>

          {/* CONTENT BASED ON TAB */}
          {activeTab === 'generate' ? (
            <>
                <div className="mb-4">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2 block">PROMPT</label>
                    <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="w-full h-24 bg-[#0f1115] border border-gray-700 rounded-xl p-3 text-white text-sm focus:border-blue-500 outline-none resize-none placeholder-gray-600"
                    placeholder="Describe your visual idea..."
                    />
                </div>

                {/* Quality Selection */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                    <div 
                        onClick={() => setModelType('standard')}
                        className={`cursor-pointer p-3 rounded-xl border-2 transition ${modelType === 'standard' ? 'border-blue-500 bg-blue-500/10' : 'border-gray-700 bg-gray-900'}`}
                    >
                        <div className="flex justify-between mb-1"><Zap size={16} className="text-blue-400" /><span className="text-[10px] bg-gray-800 px-1.5 rounded text-gray-300">{COST_STANDARD} Cr</span></div>
                        <div className="font-bold text-sm text-white">Standard</div>
                    </div>

                    <div 
                        onClick={() => setModelType('premium')}
                        className={`cursor-pointer p-3 rounded-xl border-2 transition ${modelType === 'premium' ? 'border-purple-500 bg-purple-500/10' : 'border-gray-700 bg-gray-900'}`}
                    >
                        <div className="flex justify-between mb-1"><Crown size={16} className="text-purple-400" /><span className="text-[10px] bg-gray-800 px-1.5 rounded text-gray-300">{COST_PREMIUM} Cr</span></div>
                        <div className="font-bold text-sm text-white">Premium</div>
                    </div>
                </div>

                {/* FILTERS / STYLES */}
                <div className="mb-6">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <Palette size={12} /> Select Style
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                        {IMAGE_STYLES.map((style) => (
                            <button
                                key={style.id}
                                onClick={() => setSelectedStyle(style.id)}
                                className={`relative p-3 rounded-lg border text-left transition-all ${
                                    selectedStyle === style.id 
                                    ? style.isExclusive 
                                        ? 'border-blue-400 bg-gradient-to-r from-blue-900/40 to-purple-900/40' // Velocity Style Highlight
                                        : 'border-gray-400 bg-gray-800'
                                    : 'border-gray-800 bg-[#0f1115] hover:border-gray-600'
                                }`}
                            >
                                {style.isExclusive && (
                                    <span className="absolute top-0 right-0 text-[8px] font-bold bg-blue-600 text-white px-1.5 py-0.5 rounded-bl-lg rounded-tr-lg">
                                        VELOCITY
                                    </span>
                                )}
                                <div className={`text-xs font-bold mb-0.5 ${selectedStyle === style.id ? 'text-white' : 'text-gray-300'}`}>
                                    {style.label}
                                </div>
                                <div className="text-[10px] text-gray-500 leading-tight truncate">
                                    {style.description}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                <button 
                    onClick={handleGenerate}
                    disabled={isGenerating || !prompt || !canAfford}
                    className={`w-full py-3 mt-auto rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg ${
                        isGenerating ? 'bg-gray-700' : 'bg-gradient-to-r from-blue-600 to-blue-500 hover:scale-[1.02]'
                    } text-white transition disabled:opacity-50 disabled:scale-100`}
                >
                    {isGenerating ? "Creating Magic..." : `Generate Image (${currentCost} Cr)`}
                </button>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full border-2 border-dashed border-gray-700 rounded-xl bg-[#0f1115] hover:border-gray-500 transition cursor-pointer group" onClick={() => fileInputRef.current?.click()}>
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" hidden />
                <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition">
                    <ImageIcon size={32} className="text-gray-400" />
                </div>
                <p className="text-white font-medium mb-1">Click to upload</p>
                <p className="text-xs text-gray-500">JPG, PNG up to 5MB</p>
            </div>
          )}

          {error && <div className="mt-4 p-3 bg-red-900/20 border border-red-800/50 rounded-lg flex items-center gap-2 text-red-400 text-xs"><AlertCircle size={14}/> {error}</div>}
        </div>

        {/* RIGHT: Preview */}
        <div className="w-full md:w-1/2 bg-[#050505] flex flex-col items-center justify-center p-6 relative">
            {/* Buton X pentru închidere modal */}
            <button onClick={onClose} className="absolute top-4 right-4 p-2 text-gray-500 hover:text-white z-10"><X size={20}/></button>
            
            {resultImage ? (
                <div className="flex flex-col items-center w-full h-full justify-center gap-4 animate-in fade-in relative">
                    
                    {/* Buton Ștergere */}
                    <button 
                        onClick={() => setResultImage(null)} 
                        className="absolute top-4 left-4 p-2 bg-red-500/20 hover:bg-red-500 text-red-400 hover:text-white rounded-full border border-red-500/50 transition z-10"
                        title="Delete Image"
                    >
                        <Trash size={16} /> 
                    </button>

                    <img src={resultImage} alt="Result" className="max-h-[500px] max-w-full rounded-lg shadow-2xl border border-gray-800 object-contain bg-black" />
                    
                    <div className="flex gap-3 w-full max-w-xs">
                        <button onClick={() => { onSelectImage(resultImage); onClose(); }} className="flex-1 bg-green-600 hover:bg-green-500 text-white py-3 rounded-lg text-sm font-bold shadow-lg">
                            Use Image
                        </button>
                        <a href={resultImage} download="velocity-ai.png" className="p-3 bg-gray-800 text-white rounded-lg border border-gray-700 hover:bg-gray-700">
                            <Download size={20}/>
                        </a>
                    </div>
                </div>
            ) : (
                <div className="text-center text-gray-500">
                    <Sparkles className={`w-12 h-12 mx-auto mb-4 ${isGenerating ? 'animate-spin text-blue-500' : 'text-gray-800'}`} />
                    <p className="text-sm">{isGenerating ? "Applying Velocity Magic..." : "Your visual will appear here"}</p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
}
