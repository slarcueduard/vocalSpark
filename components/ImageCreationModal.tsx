import React, { useState, useRef, useEffect } from 'react';
import { 
  X, Sparkles, Zap, Crown, Download, AlertCircle, ArrowLeft, Upload, 
  Image as ImageIcon, Palette, Trash, Loader
} from 'lucide-react';
import { generateImageForPost } from '../services/geminiService';
import { useAuth } from '../contexts/AuthContext';

interface ImageCreationModalProps {
  onClose: () => void;
  onSelectImage: (imageUrl: string) => void;
  initialPrompt?: string;
}

// Stiluri AI simple
const AI_STYLES = [
  { id: 'none', label: 'Natural', description: 'No filters.', promptSuffix: '', isExclusive: false },
  { id: 'velocity', label: 'Velocity', description: 'Cyberpunk Neon', promptSuffix: ', dark moody cyberpunk aesthetic, neon lighting, 8k', isExclusive: true },
  { id: 'lifestyle', label: 'Lifestyle', description: 'Influencer', promptSuffix: ', authentic lifestyle photography, natural sunlight', isExclusive: false },
  { id: 'studio', label: 'Studio', description: 'Product', promptSuffix: ', professional studio photography, neutral background', isExclusive: false },
  { id: 'realism', label: 'Realism', description: 'Raw Photo', promptSuffix: ', award winning photography, highly detailed texture', isExclusive: false },
];

export function ImageCreationModal({ onClose, onSelectImage, initialPrompt = '' }: ImageCreationModalProps) {
  const { checkCredits, credits, brandProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<'generate' | 'upload'>('upload'); // Default Upload
  
  // Input State
  const [prompt, setPrompt] = useState(initialPrompt);
  const [modelType, setModelType] = useState<'standard' | 'premium'>('standard');
  const [selectedAiStyle, setSelectedAiStyle] = useState<string>('none');
  
  // Processing State
  const [isGenerating, setIsGenerating] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Image Data (Folosim un singur state pentru preview ca să fie simplu)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentCost = modelType === 'standard' ? 2 : 20;
  const canAfford = checkCredits(currentCost);

  // Cleanup Memory (Critic pentru a nu bloca browserul)
  useEffect(() => {
      return () => {
          if (previewUrl && previewUrl.startsWith('blob:')) {
              URL.revokeObjectURL(previewUrl);
          }
      };
  }, [previewUrl]);

  // 1. GENERARE AI
  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    if (!canAfford) { setError(`Not enough credits.`); return; }

    setIsGenerating(true);
    setError(null);
    setPreviewUrl(null);

    try {
      const styleObj = AI_STYLES.find(s => s.id === selectedAiStyle);
      const finalPrompt = styleObj ? `${prompt}${styleObj.promptSuffix}` : prompt;
      
      const imageUrl = await generateImageForPost(
          finalPrompt, 
          modelType === 'premium',
          initialPrompt, 
          brandProfile?.brandColors || []
      );
      
      setPreviewUrl(imageUrl);
      if (activeTab === 'upload') setActiveTab('generate');
      
    } catch (err: any) {
      setError("Failed to generate image.");
    } finally {
      setIsGenerating(false);
    }
  };

  // 2. UPLOAD SIMPLU (Fără procesare, doar vizualizare)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Limită hard 10MB
    if (file.size > 10 * 1024 * 1024) { 
        setError("File too large (Max 10MB)"); 
        return; 
    }

    // Creează link temporar (Instantaneu)
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setError(null);
  };

  // 3. USE IMAGE (Aici facem compresia pentru a nu crăpa aplicația principală)
  const handleUseImage = async () => {
    if (!previewUrl) return;

    setIsProcessing(true);
    try {
        // Dacă e deja URL extern (AI Standard), îl trimitem direct
        if (previewUrl.startsWith('http') && !previewUrl.startsWith('blob:')) {
            onSelectImage(previewUrl);
            onClose();
            return;
        }

        // Dacă e Blob (Upload sau AI Premium), îl comprimăm
        const img = new Image();
        img.src = previewUrl;
        img.crossOrigin = "anonymous";
        
        await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
        });

        const canvas = document.createElement('canvas');
        
        // Resize agresiv: Max 1080px (Suficient pentru social media)
        const MAX_SIZE = 1080;
        let w = img.width;
        let h = img.height;
        
        if (w > MAX_SIZE || h > MAX_SIZE) {
            const ratio = Math.min(MAX_SIZE / w, MAX_SIZE / h);
            w = Math.round(w * ratio);
            h = Math.round(h * ratio);
        }

        canvas.width = w;
        canvas.height = h;
        
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.drawImage(img, 0, 0, w, h);
            
            // Exportăm ca JPEG optimizat (0.8 calitate) => Fisier mic, memorie puțină
            const finalDataUrl = canvas.toDataURL('image/jpeg', 0.8);
            onSelectImage(finalDataUrl);
            onClose();
        }

    } catch (e) {
        console.error("Compression failed:", e);
        // Fallback: trimitem originalul dacă compresia eșuează (risc mic de crash)
        onSelectImage(previewUrl);
        onClose();
    } finally {
        setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-6xl bg-[#0f1115] border border-gray-800 rounded-2xl overflow-hidden flex flex-col md:flex-row h-[85vh] shadow-2xl">
        
        {/* LEFT: Controls */}
        <div className="w-full md:w-1/2 p-6 flex flex-col bg-[#161b22] border-r border-gray-800 overflow-y-auto custom-scrollbar">
             
             {/* Header */}
             <div className="flex justify-between items-center mb-6">
                <button onClick={onClose} className="flex items-center gap-2 text-gray-400 hover:text-white text-sm font-medium"><ArrowLeft size={16} /> Back</button>
                {activeTab === 'generate' && <div className="bg-gray-800 px-3 py-1 rounded-full border border-gray-700 text-xs text-white font-bold">Credits: {credits}</div>}
             </div>

             {/* Tabs */}
             <div className="flex p-1 bg-gray-900 rounded-xl mb-6 border border-gray-800">
                 <button onClick={() => setActiveTab('upload')} className={`flex-1 py-2 text-sm font-medium rounded-lg flex items-center justify-center gap-2 transition ${activeTab === 'upload' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}><Upload size={14} /> Upload</button>
                 <button onClick={() => setActiveTab('generate')} className={`flex-1 py-2 text-sm font-medium rounded-lg flex items-center justify-center gap-2 transition ${activeTab === 'generate' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}><Sparkles size={14} /> Generate</button>
             </div>

             {/* CONTENT - UPLOAD */}
             {activeTab === 'upload' && (
                 <div className="flex flex-col gap-4">
                    <div onClick={() => fileInputRef.current?.click()} className="h-48 border-2 border-dashed border-gray-700 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-gray-500 hover:bg-gray-800/50 transition group">
                        <ImageIcon className="text-gray-500 mb-2 group-hover:scale-110 transition" size={32} />
                        <span className="text-sm text-gray-400">Tap to upload image</span>
                        <span className="text-xs text-gray-600 mt-1">JPG, PNG (Max 10MB)</span>
                        <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" hidden />
                    </div>
                    
                    {previewUrl && (
                        <button onClick={() => { setPreviewUrl(null); fileInputRef.current!.value=''; }} className="w-full py-2 border border-red-900/50 text-red-400 text-xs rounded-lg hover:bg-red-900/20 transition">
                            <Trash size={12} className="inline mr-1"/> Remove Image
                        </button>
                    )}
                 </div>
             )}

             {/* CONTENT - GENERATE */}
             {activeTab === 'generate' && (
                 <div className="flex flex-col gap-4">
                    <textarea 
                        value={prompt} 
                        onChange={e => setPrompt(e.target.value)} 
                        className="w-full h-24 bg-[#0f1115] border border-gray-700 rounded-xl p-3 text-sm text-white resize-none focus:border-blue-500 outline-none" 
                        placeholder="Describe your visual idea..." 
                    />
                    
                    <div className="grid grid-cols-2 gap-3">
                        <div onClick={() => setModelType('standard')} className={`p-3 rounded-xl border-2 cursor-pointer transition ${modelType === 'standard' ? 'border-blue-500 bg-blue-500/10' : 'border-gray-700 bg-gray-900'}`}>
                            <div className="flex justify-between mb-1"><Zap size={16} className="text-blue-400"/><span className="text-[10px] bg-gray-800 px-1.5 rounded text-gray-300">2 Cr</span></div>
                            <div className="font-bold text-sm text-white">Standard</div>
                        </div>
                        <div onClick={() => setModelType('premium')} className={`p-3 rounded-xl border-2 cursor-pointer transition ${modelType === 'premium' ? 'border-purple-500 bg-purple-500/10' : 'border-gray-700 bg-gray-900'}`}>
                            <div className="flex justify-between mb-1"><Crown size={16} className="text-purple-400"/><span className="text-[10px] bg-gray-800 px-1.5 rounded text-gray-300">20 Cr</span></div>
                            <div className="font-bold text-sm text-white">Premium</div>
                        </div>
                    </div>

                    {/* AI Styles */}
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Style</label>
                        <div className="grid grid-cols-2 gap-2">
                            {AI_STYLES.map(s => (
                                <button key={s.id} onClick={() => setSelectedAiStyle(s.id)} className={`p-2 text-xs border rounded-lg text-left truncate ${selectedAiStyle === s.id ? 'border-blue-500 bg-blue-900/20 text-white' : 'border-gray-700 text-gray-400'}`}>
                                    {s.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <button onClick={handleGenerate} disabled={isGenerating} className="w-full py-3 bg-blue-600 rounded-xl text-white font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2 hover:bg-blue-500 transition">
                        {isGenerating ? <><Loader className="animate-spin" size={16}/> Working...</> : "Generate Image"}
                    </button>
                 </div>
             )}

             {error && <div className="mt-4 p-3 bg-red-900/20 border border-red-800/50 rounded-lg flex items-center gap-2 text-red-400 text-xs"><AlertCircle size={14}/> {error}</div>}
        </div>

        {/* RIGHT: Preview */}
        <div className="w-full md:w-1/2 bg-black flex flex-col items-center justify-center p-6 relative">
            <button onClick={onClose} className="absolute top-4 right-4 p-2 text-gray-500 hover:text-white"><X size={20}/></button>
            
            {previewUrl ? (
                <div className="flex flex-col items-center w-full gap-4 animate-in fade-in zoom-in-95">
                    <img 
                        src={previewUrl} 
                        alt="Preview" 
                        className="max-h-[400px] max-w-full rounded-lg shadow-2xl object-contain border border-gray-800" 
                    />
                    <div className="flex gap-2 w-full max-w-xs">
                        <button 
                            onClick={handleUseImage} 
                            disabled={isProcessing} 
                            className="flex-1 bg-green-600 hover:bg-green-500 py-3 rounded-lg text-white font-bold text-sm shadow-lg flex items-center justify-center gap-2 transition"
                        >
                            {isProcessing ? <Loader className="animate-spin" size={16}/> : "Use Image"}
                        </button>
                    </div>
                </div>
            ) : (
                <div className="text-gray-600 text-sm flex flex-col items-center">
                    <ImageIcon className="mb-2 opacity-20 w-12 h-12" /> 
                    No image selected
                </div>
            )}
        </div>
      </div>
    </div>
  );
}
