import React, { useState, useRef, useEffect } from 'react';
import { 
  X, Sparkles, Zap, Crown, ArrowLeft, Upload, 
  Image as ImageIcon, Palette, Trash, SlidersHorizontal, Loader, AlertCircle
} from 'lucide-react';
import { generateImageForPost } from '../services/geminiService';
import { useAuth } from '../contexts/AuthContext';

interface ImageCreationModalProps {
  onClose: () => void;
  onSelectImage: (imageUrl: string) => void;
  initialPrompt?: string;
}

const AI_STYLES = [
  { id: 'none', label: 'Natural', description: 'No filters.', promptSuffix: '', isExclusive: false },
  { id: 'velocity', label: 'Velocity', description: 'Cyberpunk Neon', promptSuffix: ', dark moody cyberpunk aesthetic, neon lighting, high contrast, 8k', isExclusive: true },
  { id: 'lifestyle', label: 'Lifestyle', description: 'Influencer', promptSuffix: ', authentic lifestyle photography, natural sunlight, candid moment', isExclusive: false },
  { id: 'studio', label: 'Studio', description: 'Product', promptSuffix: ', professional studio photography, neutral background, softbox lighting', isExclusive: false },
  { id: 'realism', label: 'Realism', description: 'Raw Photo', promptSuffix: ', award winning photography, highly detailed texture, natural lighting', isExclusive: false },
];

const PHOTO_FILTERS = [
  { id: 'normal', label: 'Original', filter: 'none' },
  { id: 'bw', label: 'B&W', filter: 'grayscale(100%)' },
  { id: 'vivid', label: 'Vivid', filter: 'saturate(1.5) contrast(1.1)' },
  { id: 'warm', label: 'Warm', filter: 'sepia(0.2) saturate(1.1)' },
  { id: 'cool', label: 'Cool', filter: 'hue-rotate(10deg)' },
];

export function ImageCreationModal({ onClose, onSelectImage, initialPrompt = '' }: ImageCreationModalProps) {
  const { checkCredits, credits, brandProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<'generate' | 'upload'>('upload');
  
  const [prompt, setPrompt] = useState(initialPrompt);
  const [modelType, setModelType] = useState<'standard' | 'premium'>('standard');
  const [selectedAiStyle, setSelectedAiStyle] = useState<string>('none');
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [applyLogo, setApplyLogo] = useState(false);

  const [uploadedImageBlob, setUploadedImageBlob] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [selectedPhotoFilter, setSelectedPhotoFilter] = useState<string>('normal');
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentCost = modelType === 'standard' ? 2 : 20;
  const canAfford = checkCredits(currentCost);

  // Cleanup Memory
  useEffect(() => {
      return () => {
          if (uploadedImageBlob) URL.revokeObjectURL(uploadedImageBlob);
          if (resultImage && resultImage.startsWith('blob:')) URL.revokeObjectURL(resultImage);
      }
  }, [uploadedImageBlob, resultImage]);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    if (!canAfford) { setError(`Not enough credits.`); return; }

    setIsGenerating(true);
    setError(null);
    if (activeTab === 'upload') setResultImage(null);

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
      if (activeTab === 'upload') setActiveTab('generate');
    } catch (err: any) {
      setError("Failed to generate image.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) { setError("File too large (Max 15MB)"); return; }

    const objectUrl = URL.createObjectURL(file);
    setUploadedImageBlob(objectUrl);
    setResultImage(null);
    setSelectedPhotoFilter('normal');
    setError(null);
  };

  const handleUseImage = async () => {
    const target = activeTab === 'upload' ? uploadedImageBlob : resultImage;
    if (!target) return;

    // 1. FAST PATH (No Processing)
    const needsFilter = activeTab === 'upload' && selectedPhotoFilter !== 'normal';
    const needsLogo = applyLogo && brandProfile?.logoUrl;

    if (!needsFilter && !needsLogo) {
        onSelectImage(target);
        onClose();
        return;
    }

    // 2. PROCESS PATH (Canvas)
    setIsProcessing(true);
    try {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = target;
        
        await new Promise((resolve, reject) => { 
            img.onload = resolve; 
            img.onerror = () => reject(new Error("Load failed"));
        });

        const canvas = document.createElement('canvas');
        const MAX_DIM = 1080; // Resize to prevent crash
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
            // Apply Filter
            if (needsFilter) {
                ctx.filter = PHOTO_FILTERS.find(f => f.id === selectedPhotoFilter)?.filter || 'none';
            }
            ctx.drawImage(img, 0, 0, w, h);

            // Apply Logo
            if (needsLogo && brandProfile?.logoUrl) {
                ctx.filter = 'none';
                const logoImg = new Image();
                logoImg.crossOrigin = "anonymous";
                logoImg.src = brandProfile.logoUrl;
                try {
                    await new Promise((r) => { logoImg.onload = r; logoImg.onerror = () => r(null); });
                    
                    const logoW = w * 0.2;
                    const scale = logoW / logoImg.width;
                    const logoH = logoImg.height * scale;
                    const pad = w * 0.05;
                    
                    ctx.shadowColor = "rgba(0,0,0,0.5)"; ctx.shadowBlur = 5;
                    ctx.drawImage(logoImg, w - logoW - pad, h - logoH - pad, logoW, logoH);
                } catch (e) {}
            }

            // Export as JPEG 80%
            canvas.toBlob((blob) => {
                if (blob) {
                    const newUrl = URL.createObjectURL(blob);
                    onSelectImage(newUrl);
                    onClose();
                }
                setIsProcessing(false);
            }, 'image/jpeg', 0.8);
        }
    } catch (error) {
        console.error("Processing error:", error);
        onSelectImage(target); // Fallback
        onClose();
        setIsProcessing(false);
    }
  };

  const previewSrc = activeTab === 'generate' ? resultImage : uploadedImageBlob;
  const activeFilterStyle = PHOTO_FILTERS.find(f => f.id === selectedPhotoFilter)?.filter || 'none';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-5xl bg-[#0f1115] border border-gray-800 rounded-2xl overflow-hidden flex flex-col md:flex-row h-[85vh] shadow-2xl">
        
        {/* LEFT */}
        <div className="w-full md:w-1/2 p-6 flex flex-col bg-[#161b22] border-r border-gray-800 overflow-y-auto">
             <div className="flex justify-between items-center mb-6">
                <button onClick={onClose} className="flex items-center gap-2 text-gray-400 hover:text-white text-sm font-medium"><ArrowLeft size={16} /> Back</button>
                {activeTab === 'generate' && <div className="bg-gray-800 px-3 py-1 rounded-full border border-gray-700 text-xs text-white font-bold">Credits: {credits}</div>}
             </div>

             <div className="flex p-1 bg-gray-900 rounded-xl mb-6 border border-gray-800 sticky top-0 z-10">
                 <button onClick={() => setActiveTab('upload')} className={`flex-1 py-2 text-sm font-medium rounded-lg flex items-center justify-center gap-2 transition ${activeTab === 'upload' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}><Upload size={14} /> Upload</button>
                 <button onClick={() => setActiveTab('generate')} className={`flex-1 py-2 text-sm font-medium rounded-lg flex items-center justify-center gap-2 transition ${activeTab === 'generate' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}><Sparkles size={14} /> Generate</button>
             </div>

             {/* GENERATE TAB */}
             {activeTab === 'generate' && (
                 <>
                    <textarea value={prompt} onChange={e => setPrompt(e.target.value)} className="w-full h-24 bg-[#0f1115] border border-gray-700 rounded-xl p-3 text-sm text-white mb-4 resize-none" placeholder="Describe image..." />
                    <div className="grid grid-cols-2 gap-3 mb-6">
                        <div onClick={() => setModelType('standard')} className={`p-3 rounded-xl border-2 cursor-pointer transition ${modelType === 'standard' ? 'border-blue-500 bg-blue-500/10' : 'border-gray-700 bg-gray-900'}`}>
                            <div className="flex justify-between mb-1"><Zap size={16} className="text-blue-400"/><span className="text-[10px] bg-gray-800 px-1.5 rounded text-gray-300">2 Cr</span></div>
                            <div className="font-bold text-sm text-white">Standard</div>
                        </div>
                        <div onClick={() => setModelType('premium')} className={`p-3 rounded-xl border-2 cursor-pointer transition ${modelType === 'premium' ? 'border-purple-500 bg-purple-500/10' : 'border-gray-700 bg-gray-900'}`}>
                            <div className="flex justify-between mb-1"><Crown size={16} className="text-purple-400"/><span className="text-[10px] bg-gray-800 px-1.5 rounded text-gray-300">20 Cr</span></div>
                            <div className="font-bold text-sm text-white">Premium</div>
                        </div>
                    </div>
                    <button onClick={handleGenerate} disabled={isGenerating} className="w-full py-3 bg-blue-600 rounded-xl text-white font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2 transition hover:bg-blue-500">
                        {isGenerating ? <><Loader className="animate-spin" size={16}/> Generating...</> : "Generate Image"}
                    </button>
                 </>
             )}

             {/* UPLOAD TAB */}
             {activeTab === 'upload' && (
                 <>
                    {!uploadedImageBlob ? (
                        <div onClick={() => fileInputRef.current?.click()} className="h-48 border-2 border-dashed border-gray-700 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-gray-500 hover:bg-gray-800/50 transition group">
                            <ImageIcon className="text-gray-500 mb-2 group-hover:scale-110 transition" size={32} />
                            <span className="text-sm text-gray-400">Click to upload</span>
                            <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" hidden />
                        </div>
                    ) : (
                        <div className="animate-in fade-in">
                            <div className="flex justify-between items-center mb-4">
                                <label className="text-xs font-bold text-gray-500 uppercase">Filters</label>
                                <button onClick={() => { setUploadedImageBlob(null); fileInputRef.current!.value=''; }} className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1"><Trash size={12} /> Remove</button>
                            </div>
                            <div className="grid grid-cols-3 gap-2 mb-4">
                                {PHOTO_FILTERS.map(f => (
                                    <button key={f.id} onClick={() => setSelectedPhotoFilter(f.id)} className={`p-2 rounded-lg border text-[10px] font-bold transition ${selectedPhotoFilter === f.id ? 'border-blue-500 text-white bg-blue-500/20' : 'border-gray-700 text-gray-400 hover:border-gray-500'}`}>{f.label}</button>
                                ))}
                            </div>
                        </div>
                    )}
                 </>
             )}

             {brandProfile?.logoUrl && (
                 <div className="mt-6 flex items-center justify-between bg-gray-800/50 p-3 rounded-xl border border-gray-700">
                     <span className="text-xs text-gray-300 font-bold flex items-center gap-2">
                         <img src={brandProfile.logoUrl} className="w-6 h-6 object-contain bg-white rounded p-0.5"/> Apply Logo
                     </span>
                     <input type="checkbox" checked={applyLogo} onChange={e => setApplyLogo(e.target.checked)} className="accent-blue-500 h-4 w-4"/>
                 </div>
             )}
             
             {error && <div className="mt-4 p-3 bg-red-900/20 border border-red-800/50 rounded-lg flex items-center gap-2 text-red-400 text-xs"><AlertCircle size={14}/> {error}</div>}
        </div>

        {/* RIGHT: Preview */}
        <div className="w-full md:w-1/2 bg-black flex flex-col items-center justify-center p-6 relative">
            <button onClick={onClose} className="absolute top-4 right-4 p-2 text-gray-500 hover:text-white z-10"><X size={20}/></button>
            {previewSrc ? (
                <div className="flex flex-col items-center w-full gap-4 animate-in zoom-in-95 duration-300">
                    <img 
                        src={previewSrc} 
                        alt="Preview" 
                        style={{ filter: activeTab === 'upload' ? activePhotoFilterStyle : 'none' }} 
                        className="max-h-[400px] max-w-full rounded-lg shadow-2xl object-contain border border-gray-800" 
                    />
                    <div className="flex gap-2 w-full max-w-xs">
                        <button onClick={handleUseImage} disabled={isProcessing} className="flex-1 bg-green-600 hover:bg-green-500 py-3 rounded-lg text-white font-bold text-sm shadow-lg flex items-center justify-center gap-2 transition transform active:scale-95">
                            {isProcessing ? <Loader className="animate-spin" size={16}/> : "Use Image"}
                        </button>
                    </div>
                </div>
            ) : (
                <div className="text-gray-600 text-sm flex flex-col items-center"><Sparkles className="mb-2 opacity-50" /> Preview Area</div>
            )}
        </div>
      </div>
    </div>
  );
}
