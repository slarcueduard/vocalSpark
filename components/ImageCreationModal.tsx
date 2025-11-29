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
];

export function ImageCreationModal({ onClose, onSelectImage, initialPrompt = '' }: ImageCreationModalProps) {
  const { checkCredits, credits, brandProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<'generate' | 'upload'>('upload');
  
  const [prompt, setPrompt] = useState(initialPrompt);
  const [modelType, setModelType] = useState<'standard' | 'premium'>('standard');
  const [selectedAiStyle, setSelectedAiStyle] = useState<string>('none');
  
  // Loading States
  const [isGenerating, setIsGenerating] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false); // Pt Canvas/Upload
  
  const [applyLogo, setApplyLogo] = useState(false);

  const [uploadedImageBlob, setUploadedImageBlob] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [selectedPhotoFilter, setSelectedPhotoFilter] = useState<string>('normal');
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentCost = modelType === 'standard' ? 2 : 20;
  const canAfford = checkCredits(currentCost);

  // Cleanup la unmount
  useEffect(() => {
      return () => {
          if (uploadedImageBlob) URL.revokeObjectURL(uploadedImageBlob);
      }
  }, [uploadedImageBlob]);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    if (!canAfford) { setError(`Not enough credits.`); return; }

    setIsGenerating(true);
    setError(null);
    // Nu ștergem imaginea veche imediat ca să nu avem flash, o înlocuim la succes

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
    setError(null);
  };

  const handleUseImage = async () => {
    const target = activeTab === 'upload' ? uploadedImageBlob : resultImage;
    if (!target) return;

    // 1. Fast Path: Fără procesare
    const noProcessingNeeded = (selectedPhotoFilter === 'normal') && !(applyLogo && brandProfile?.logoUrl);
    if (noProcessingNeeded) {
        onSelectImage(target);
        onClose();
        return;
    }

    // 2. Safe Processing
    setIsProcessing(true);
    try {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = target;
        await new Promise((r, j) => { img.onload = r; img.onerror = j; });

        const canvas = document.createElement('canvas');
        // Resize masiv pt siguranță
        const MAX_W = 1024;
        let w = img.width;
        let h = img.height;
        if (w > MAX_W) { h = Math.round(h * (MAX_W/w)); w = MAX_W; }

        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');

        if (ctx) {
            // Filtru
            ctx.filter = PHOTO_FILTERS.find(f => f.id === selectedPhotoFilter)?.filter || 'none';
            ctx.drawImage(img, 0, 0, w, h);

            // Logo
            if (applyLogo && brandProfile?.logoUrl) {
                ctx.filter = 'none';
                const logoImg = new Image();
                logoImg.crossOrigin = "anonymous";
                logoImg.src = brandProfile.logoUrl;
                await new Promise(r => { logoImg.onload = r; logoImg.onerror = r; }); // Nu dăm reject, doar continuăm fără logo
                
                const lw = w * 0.2;
                const lh = logoImg.height * (lw / logoImg.width);
                ctx.drawImage(logoImg, w - lw - 20, h - lh - 20, lw, lh);
            }

            canvas.toBlob(blob => {
                if (blob) {
                    onSelectImage(URL.createObjectURL(blob));
                    onClose();
                }
                setIsProcessing(false);
            }, 'image/jpeg', 0.8);
        }
    } catch (e) {
        console.error(e);
        onSelectImage(target); // Fallback la original
        onClose();
        setIsProcessing(false);
    }
  };

  const previewSrc = activeTab === 'generate' ? resultImage : uploadedImageBlob;
  const activeFilterStyle = PHOTO_FILTERS.find(f => f.id === selectedPhotoFilter)?.filter || 'none';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-5xl bg-[#0f1115] border border-gray-800 rounded-2xl overflow-hidden flex flex-col md:flex-row h-[85vh] shadow-2xl">
        
        <div className="w-full md:w-1/2 p-6 flex flex-col bg-[#161b22] border-r border-gray-800 overflow-y-auto">
             <div className="flex justify-between items-center mb-6">
                <button onClick={onClose} className="flex items-center gap-2 text-gray-400 hover:text-white text-sm font-medium"><ArrowLeft size={16} /> Back</button>
                {activeTab === 'generate' && <div className="bg-gray-800 px-3 py-1 rounded-full border border-gray-700 text-xs text-white font-bold">Credits: {credits}</div>}
             </div>

             <div className="flex p-1 bg-gray-900 rounded-xl mb-6 border border-gray-800">
                 <button onClick={() => setActiveTab('upload')} className={`flex-1 py-2 text-sm font-medium rounded-lg flex items-center justify-center gap-2 ${activeTab === 'upload' ? 'bg-blue-600 text-white' : 'text-gray-400'}`}><Upload size={14} /> Upload</button>
                 <button onClick={() => setActiveTab('generate')} className={`flex-1 py-2 text-sm font-medium rounded-lg flex items-center justify-center gap-2 ${activeTab === 'generate' ? 'bg-blue-600 text-white' : 'text-gray-400'}`}><Sparkles size={14} /> Generate</button>
             </div>

             {/* CONTENT */}
             {activeTab === 'generate' ? (
                 <>
                    <textarea value={prompt} onChange={e => setPrompt(e.target.value)} className="w-full h-24 bg-[#0f1115] border border-gray-700 rounded-xl p-3 text-sm text-white mb-4 resize-none" placeholder="Describe image..." />
                    <div className="grid grid-cols-2 gap-3 mb-6">
                        <div onClick={() => setModelType('standard')} className={`p-3 rounded-xl border-2 cursor-pointer ${modelType === 'standard' ? 'border-blue-500 bg-blue-500/10' : 'border-gray-700 bg-gray-900'}`}>
                            <div className="flex justify-between mb-1"><Zap size={16} className="text-blue-400"/><span className="text-[10px] bg-gray-800 px-1.5 rounded text-gray-300">2 Cr</span></div>
                            <div className="font-bold text-sm text-white">Standard</div>
                        </div>
                        <div onClick={() => setModelType('premium')} className={`p-3 rounded-xl border-2 cursor-pointer ${modelType === 'premium' ? 'border-purple-500 bg-purple-500/10' : 'border-gray-700 bg-gray-900'}`}>
                            <div className="flex justify-between mb-1"><Crown size={16} className="text-purple-400"/><span className="text-[10px] bg-gray-800 px-1.5 rounded text-gray-300">20 Cr</span></div>
                            <div className="font-bold text-sm text-white">Premium</div>
                        </div>
                    </div>
                    <button onClick={handleGenerate} disabled={isGenerating} className="w-full py-3 bg-blue-600 rounded-xl text-white font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2">
                        {isGenerating ? <><Loader className="animate-spin" size={16}/> Working...</> : "Generate Image"}
                    </button>
                 </>
             ) : (
                 <>
                    {!uploadedImageBlob ? (
                        <div onClick={() => fileInputRef.current?.click()} className="h-48 border-2 border-dashed border-gray-700 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-gray-500">
                            <ImageIcon className="text-gray-500 mb-2" size={32} />
                            <span className="text-sm text-gray-400">Click to upload</span>
                            <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" hidden />
                        </div>
                    ) : (
                        <div className="animate-in fade-in">
                            <div className="grid grid-cols-4 gap-2 mb-4">
                                {PHOTO_FILTERS.map(f => (
                                    <button key={f.id} onClick={() => setSelectedPhotoFilter(f.id)} className={`p-2 rounded-lg border text-[10px] ${selectedPhotoFilter === f.id ? 'border-blue-500 text-white' : 'border-gray-700 text-gray-400'}`}>{f.label}</button>
                                ))}
                            </div>
                            <button onClick={() => { setUploadedImageBlob(null); fileInputRef.current!.value=''; }} className="w-full py-2 border border-red-900/50 text-red-400 text-xs rounded-lg">Remove</button>
                        </div>
                    )}
                 </>
             )}

             {brandProfile?.logoUrl && (
                 <div className="mt-6 flex items-center justify-between bg-gray-800/50 p-3 rounded-xl border border-gray-700">
                     <span className="text-xs text-gray-300 font-bold">Apply Brand Logo</span>
                     <input type="checkbox" checked={applyLogo} onChange={e => setApplyLogo(e.target.checked)} />
                 </div>
             )}
             
             {error && <div className="mt-4 text-red-400 text-xs">{error}</div>}
        </div>

        {/* RIGHT: Preview */}
        <div className="w-full md:w-1/2 bg-black flex flex-col items-center justify-center p-6 relative">
            <button onClick={onClose} className="absolute top-4 right-4 p-2 text-gray-500 hover:text-white"><X size={20}/></button>
            {previewSrc ? (
                <div className="flex flex-col items-center w-full gap-4">
                    <img src={previewSrc} alt="Preview" style={{ filter: activeTab === 'upload' ? activeFilterStyle : 'none' }} className="max-h-[400px] max-w-full rounded-lg shadow-2xl object-contain" />
                    <div className="flex gap-2 w-full max-w-xs">
                        <button onClick={handleUseImage} disabled={isProcessing} className="flex-1 bg-green-600 py-3 rounded-lg text-white font-bold text-sm shadow-lg flex items-center justify-center gap-2">
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
