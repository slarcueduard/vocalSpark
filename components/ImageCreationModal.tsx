import React, { useState, useRef, useEffect } from 'react';
import { 
  X, Sparkles, Zap, Crown, Download, AlertCircle, ArrowLeft, Upload, 
  Image as ImageIcon, Palette, Trash, SlidersHorizontal, Loader
} from 'lucide-react';
import { generateImageForPost } from '../services/geminiService';
import { useAuth } from '../contexts/AuthContext';

interface ImageCreationModalProps {
  onClose: () => void;
  onSelectImage: (imageUrl: string) => void;
  initialPrompt?: string;
}

const AI_STYLES = [
  { id: 'none', label: 'Natural / Raw', description: 'No filters. Just your prompt.', promptSuffix: '', isExclusive: false },
  { id: 'velocity', label: 'Velocity Dark', description: 'Cyberpunk, Neon, Moody', promptSuffix: ', dark moody cyberpunk aesthetic, neon blue and purple lighting, high contrast, John Wick style, cinematic atmosphere, sharp focus, 8k', isExclusive: true },
  { id: 'lifestyle', label: 'Lifestyle', description: 'Natural, Influencer', promptSuffix: ', authentic lifestyle photography, shot on iPhone 15 Pro, natural sunlight, candid moment', isExclusive: false },
  { id: 'studio', label: 'Studio Pro', description: 'Clean, Product', promptSuffix: ', professional studio photography, neutral background, softbox lighting, 85mm lens, 4k', isExclusive: false },
  { id: 'realism', label: 'Hyper Realism', description: 'Raw, Detailed', promptSuffix: ', award winning photography, highly detailed texture, natural lighting, unedited look, raw file', isExclusive: false },
  { id: 'minimalist', label: 'Minimalist', description: 'Clean, Apple style', promptSuffix: ', minimalist aesthetic, apple design style, white background, soft shadows, clean lines', isExclusive: false },
  { id: 'corporate', label: 'Corporate', description: 'Office, Professional', promptSuffix: ', corporate modern office environment, professional atmosphere, linkedin style', isExclusive: false }
];

const PHOTO_FILTERS = [
  { id: 'normal', label: 'Original', filter: 'none' },
  { id: 'studio', label: 'Studio Crisp', filter: 'contrast(1.1) brightness(1.05) saturate(1.1)' },
  { id: 'noir', label: 'Noir B&W', filter: 'grayscale(100%) contrast(1.2) brightness(0.9)' },
  { id: 'vivid', label: 'Vivid Pop', filter: 'saturate(1.5) contrast(1.1)' },
  { id: 'warm', label: 'Golden Hour', filter: 'sepia(0.3) saturate(1.2) brightness(1.05)' },
  { id: 'cool', label: 'Cool Breeze', filter: 'hue-rotate(10deg) contrast(0.9) brightness(1.1)' },
  { id: 'soft', label: 'Soft Matte', filter: 'contrast(0.9) brightness(1.1) saturate(0.8)' },
];

export function ImageCreationModal({ onClose, onSelectImage, initialPrompt = '' }: ImageCreationModalProps) {
  const { checkCredits, credits, brandProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<'generate' | 'upload'>('upload'); // Default pe Upload
  
  const [prompt, setPrompt] = useState(initialPrompt);
  const [modelType, setModelType] = useState<'standard' | 'premium'>('standard');
  const [selectedAiStyle, setSelectedAiStyle] = useState<string>('none');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [applyLogo, setApplyLogo] = useState(false);

  // Folosim Blob URLs pentru preview ca să nu ocupăm RAM
  const [uploadedImageBlob, setUploadedImageBlob] = useState<string | null>(null);
  const [selectedPhotoFilter, setSelectedPhotoFilter] = useState<string>('normal');
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const COST_STANDARD = 2;
  const COST_PREMIUM = 20;
  const currentCost = modelType === 'standard' ? COST_STANDARD : COST_PREMIUM;
  const canAfford = checkCredits(currentCost);

  // Cleanup memory
  useEffect(() => {
      return () => {
          if (uploadedImageBlob) URL.revokeObjectURL(uploadedImageBlob);
          // resultImage poate fi extern (URL) sau blob, încercăm revoke doar dacă e blob
          if (resultImage && resultImage.startsWith('blob:')) URL.revokeObjectURL(resultImage);
      }
  }, [uploadedImageBlob, resultImage]);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    if (!canAfford) { setError(`Not enough credits.`); return; }

    setIsGenerating(true);
    setError(null);
    
    try {
      const styleObj = AI_STYLES.find(s => s.id === selectedAiStyle);
      const finalPrompt = styleObj ? `${prompt}${styleObj.promptSuffix}` : prompt;
      
      const imageUrl = await generateImageForPost(
          finalPrompt, 
          modelType === 'premium',
          initialPrompt, 
          brandProfile?.brandColors || []
      );

      setResultImage(imageUrl);
      if (activeTab === 'upload') setActiveTab('generate'); // Switch tab to see result
    } catch (err: any) {
      setError(err.message || "Failed to generate image.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) { setError("File too large (Max 15MB)"); return; }

    // CRITIC: Creăm un URL Blob imediat, nu citim fișierul în memorie cu FileReader
    const objectUrl = URL.createObjectURL(file);
    setUploadedImageBlob(objectUrl);
    
    setResultImage(null);
    setSelectedPhotoFilter('normal');
    setError(null);
  };

  // --- SAVE & PROCESS ---
  const applyFilterAndUse = async () => {
    const targetImage = activeTab === 'upload' ? uploadedImageBlob : resultImage;
    if (!targetImage) return;

    setIsProcessing(true);

    // Dacă nu avem modificări, trimitem direct (Super rapid)
    const needsProcessing = (activeTab === 'upload' && selectedPhotoFilter !== 'normal') || (applyLogo && brandProfile?.logoUrl);

    if (!needsProcessing) {
        onSelectImage(targetImage); // Trimitem URL-ul Blob
        onClose();
        setIsProcessing(false);
        return;
    }

    // Dacă avem filtre, procesăm pe Canvas
    try {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = targetImage;
        await new Promise((r) => { img.onload = r; });

        const canvas = document.createElement('canvas');
        // Redimensionăm la MAX 1080p pentru a preveni crash-ul
        const MAX_DIM = 1080;
        let w = img.width;
        let h = img.height;
        
        if (w > MAX_DIM || h > MAX_DIM) {
            const ratio = Math.min(MAX_DIM / w, MAX_DIM / h);
            w = Math.round(w * ratio);
            h = Math.round(h * ratio);
        }

        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');

        if (ctx) {
            // 1. Filtru
            if (activeTab === 'upload') {
                ctx.filter = PHOTO_FILTERS.find(f => f.id === selectedPhotoFilter)?.filter || 'none';
            }
            ctx.drawImage(img, 0, 0, w, h);

            // 2. Logo
            if (applyLogo && brandProfile?.logoUrl) {
                const logoImg = new Image();
                logoImg.crossOrigin = "anonymous";
                logoImg.src = brandProfile.logoUrl;
                try {
                    await new Promise((r, j) => { logoImg.onload = r; logoImg.onerror = j; });
                    ctx.filter = 'none';
                    const logoW = w * 0.20;
                    const scale = logoW / logoImg.width;
                    const logoH = logoImg.height * scale;
                    const pad = w * 0.05;
                    ctx.shadowColor = "rgba(0,0,0,0.5)"; ctx.shadowBlur = 5;
                    ctx.drawImage(logoImg, w - logoW - pad, h - logoH - pad, logoW, logoH);
                } catch (e) {}
            }

            // 3. EXPORT BLOB (JPEG 85%) - Foarte eficient
            canvas.toBlob((blob) => {
                if (blob) {
                    const newUrl = URL.createObjectURL(blob);
                    onSelectImage(newUrl);
                    onClose();
                }
            }, 'image/jpeg', 0.85);
        }
    } catch (error) {
        console.error("Processing error:", error);
        // Fallback
        onSelectImage(targetImage);
        onClose();
    } finally {
        // setIsProcessing(false); 
    }
  };

  const previewImageSrc = activeTab === 'generate' ? resultImage : uploadedImageBlob;
  const activePhotoFilterStyle = PHOTO_FILTERS.find(f => f.id === selectedPhotoFilter)?.filter || 'none';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-6xl bg-[#0f1115] border border-gray-800 rounded-2xl overflow-hidden flex flex-col md:flex-row h-[85vh] shadow-2xl">
        
        {/* LEFT: Controls */}
        <div className="w-full md:w-1/2 p-6 flex flex-col border-r border-gray-800 bg-[#161b22] overflow-y-auto custom-scrollbar">
          <div className="flex justify-between items-center mb-6">
            <button onClick={onClose} className="flex items-center gap-2 text-gray-400 hover:text-white text-sm font-medium">
                <ArrowLeft size={16} /> Back
            </button>
            {activeTab === 'generate' && (
                <div className="bg-gray-800 px-3 py-1 rounded-full border border-gray-700 text-xs text-gray-300">
                    Credits: <span className={canAfford ? "text-white font-bold" : "text-red-400 font-bold"}>{credits}</span>
                </div>
            )}
          </div>

          <div className="flex p-1 bg-gray-900 rounded-xl mb-6 border border-gray-800 sticky top-0 z-10">
               <button onClick={() => setActiveTab('upload')} className={`flex-1 py-2 text-sm font-medium rounded-lg flex items-center justify-center gap-2 transition ${activeTab === 'upload' ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}>
                  <Upload size={14} /> Upload
              </button>
              <button onClick={() => setActiveTab('generate')} className={`flex-1 py-2 text-sm font-medium rounded-lg flex items-center justify-center gap-2 transition ${activeTab === 'generate' ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}>
                  <Sparkles size={14} /> AI Generate
              </button>
          </div>

          {brandProfile?.logoUrl && (
              <div className="mb-6 bg-gray-800/50 border border-gray-700 p-3 rounded-xl flex justify-between items-center">
                  <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-white rounded-md p-1 flex items-center justify-center overflow-hidden">
                          <img src={brandProfile.logoUrl} alt="Brand Logo" className="w-full h-full object-contain" />
                      </div>
                      <div>
                          <p className="text-xs font-bold text-white">Apply Brand Logo</p>
                          <p className="text-[10px] text-gray-400">Watermark bottom-right</p>
                      </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" checked={applyLogo} onChange={e => setApplyLogo(e.target.checked)} className="sr-only peer" />
                      <div className="w-9 h-5 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-500"></div>
                  </label>
              </div>
          )}

          {activeTab === 'generate' && (
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

                <div className="grid grid-cols-2 gap-3 mb-6">
                    <div onClick={() => setModelType('standard')} className={`cursor-pointer p-3 rounded-xl border-2 transition ${modelType === 'standard' ? 'border-blue-500 bg-blue-500/10' : 'border-gray-700 bg-gray-900'}`}>
                        <div className="flex justify-between mb-1"><Zap size={16} className="text-blue-400" /><span className="text-[10px] bg-gray-800 px-1.5 rounded text-gray-300">{COST_STANDARD} Cr</span></div>
                        <div className="font-bold text-sm text-white">Standard</div>
                    </div>
                    <div onClick={() => setModelType('premium')} className={`cursor-pointer p-3 rounded-xl border-2 transition ${modelType === 'premium' ? 'border-purple-500 bg-purple-500/10' : 'border-gray-700 bg-gray-900'}`}>
                        <div className="flex justify-between mb-1"><Crown size={16} className="text-purple-400" /><span className="text-[10px] bg-gray-800 px-1.5 rounded text-gray-300">{COST_PREMIUM} Cr</span></div>
                        <div className="font-bold text-sm text-white">Premium</div>
                    </div>
                </div>

                <div className="mb-6">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <Palette size={12} /> AI Style
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                        {AI_STYLES.map((style) => (
                            <button
                                key={style.id}
                                onClick={() => setSelectedAiStyle(style.id)}
                                className={`relative p-3 rounded-lg border text-left transition-all ${selectedAiStyle === style.id ? (style.isExclusive ? 'border-blue-400 bg-gradient-to-r from-blue-900/40 to-purple-900/40' : 'border-gray-400 bg-gray-800') : 'border-gray-800 bg-[#0f1115] hover:border-gray-600'}`}
                            >
                                {style.isExclusive && <span className="absolute top-0 right-0 text-[8px] font-bold bg-blue-600 text-white px-1.5 py-0.5 rounded-bl-lg rounded-tr-lg">VELOCITY</span>}
                                <div className={`text-xs font-bold mb-0.5 ${selectedAiStyle === style.id ? 'text-white' : 'text-gray-300'}`}>{style.label}</div>
                                <div className="text-[10px] text-gray-500 leading-tight truncate">{style.description}</div>
                            </button>
                        ))}
                    </div>
                </div>

                <button onClick={handleGenerate} disabled={isGenerating || !prompt || !canAfford} className={`w-full py-3 mt-auto rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg ${isGenerating ? 'bg-gray-700' : 'bg-gradient-to-r from-blue-600 to-blue-500 hover:scale-[1.02]'} text-white transition disabled:opacity-50 disabled:scale-100`}>
                    {isGenerating ? "Creating Magic..." : `Generate Image (${currentCost} Cr)`}
                </button>
            </>
          )}

          {activeTab === 'upload' && (
            <>
                {!uploadedImageBlob ? (
                    <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-gray-700 rounded-xl bg-[#0f1115] hover:border-gray-500 transition cursor-pointer group" onClick={() => fileInputRef.current?.click()}>
                        <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" hidden />
                        <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition">
                            <ImageIcon size={32} className="text-gray-400" />
                        </div>
                        <p className="text-white font-medium mb-1">Click to upload</p>
                        <p className="text-xs text-gray-500">JPG, PNG (Max 15MB)</p>
                    </div>
                ) : (
                    <div className="animate-in fade-in">
                        <div className="flex justify-between items-center mb-4">
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                                <SlidersHorizontal size={12} /> Photo Filters
                            </label>
                            <button onClick={() => { setUploadedImageBlob(null); fileInputRef.current!.value = ''; }} className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1">
                                <Trash size={12} /> Remove
                            </button>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
                            {PHOTO_FILTERS.map((filter) => (
                                <button
                                    key={filter.id}
                                    onClick={() => setSelectedPhotoFilter(filter.id)}
                                    className={`p-2 rounded-lg border text-center transition-all ${selectedPhotoFilter === filter.id ? 'border-blue-500 bg-blue-500/20 text-white' : 'border-gray-800 bg-[#0f1115] text-gray-400 hover:border-gray-600'}`}
                                >
                                    <div className="text-xs font-bold">{filter.label}</div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </>
          )}

          {error && <div className="mt-4 p-3 bg-red-900/20 border border-red-800/50 rounded-lg flex items-center gap-2 text-red-400 text-xs"><AlertCircle size={14}/> {error}</div>}
        </div>

        {/* RIGHT: Preview */}
        <div className="w-full md:w-1/2 bg-[#050505] flex flex-col items-center justify-center p-6 relative">
            <button onClick={onClose} className="absolute top-4 right-4 p-2 text-gray-500 hover:text-white z-10"><X size={20}/></button>
            
            {previewImageSrc ? (
                <div className="flex flex-col items-center w-full h-full justify-center gap-4 animate-in fade-in relative">
                    <button onClick={() => { if (activeTab === 'generate') setResultImage(null); else setUploadedImageBlob(null); }} className="absolute top-4 left-4 p-2 bg-red-500/20 hover:bg-red-500 text-red-400 hover:text-white rounded-full border border-red-500/50 transition z-10" title="Delete Image"><Trash size={16} /></button>
                    
                    <div className="relative max-h-[500px] max-w-full rounded-lg shadow-2xl border border-gray-800 overflow-hidden">
                        <img 
                            key={previewImageSrc} // Force Refresh
                            src={previewImageSrc} 
                            alt="Preview" 
                            style={{ filter: activeTab === 'upload' ? activePhotoFilterStyle : 'none' }}
                            className="w-full h-full object-contain bg-black" 
                        />
                        {applyLogo && brandProfile?.logoUrl && (
                            <img src={brandProfile.logoUrl} alt="Logo" className="absolute bottom-4 right-4 w-[20%] object-contain drop-shadow-lg opacity-90 pointer-events-none"/>
                        )}
                    </div>

                    <div className="flex gap-3 w-full max-w-xs">
                        <button 
                            onClick={applyFilterAndUse} 
                            disabled={isProcessing}
                            className="flex-1 bg-green-600 hover:bg-green-500 text-white py-3 rounded-lg text-sm font-bold shadow-lg flex items-center justify-center gap-2"
                        >
                            {isProcessing ? <Loader className="animate-spin" size={16}/> : "Use Image"}
                        </button>
                        <a href={previewImageSrc} download="image.jpg" className="p-3 bg-gray-800 text-white rounded-lg border border-gray-700 hover:bg-gray-700"><Download size={20}/></a>
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
