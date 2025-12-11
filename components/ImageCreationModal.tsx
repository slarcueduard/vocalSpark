import React, { useState, useRef, useEffect } from 'react';
import {
    X, Sparkles, Zap, Crown, AlertCircle, ArrowLeft, Upload,
    Image as ImageIcon, Trash, Loader2, Lock
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
    const { checkCredits, userProfile, brandProfile } = useAuth();

    const [activeTab, setActiveTab] = useState<'generate' | 'upload'>('upload');
    const [prompt, setPrompt] = useState(initialPrompt || '');
    const [modelType, setModelType] = useState<'standard' | 'premium'>('standard');
    const [selectedAiStyle, setSelectedAiStyle] = useState<string>('none');

    const [isGenerating, setIsGenerating] = useState(false);
    const [isImageLoading, setIsImageLoading] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    const [applyLogo, setApplyLogo] = useState(false);
    const [uploadedImageBlob, setUploadedImageBlob] = useState<string | null>(null);
    const [resultImage, setResultImage] = useState<string | null>(null);
    const [selectedPhotoFilter, setSelectedPhotoFilter] = useState<string>('normal');
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const currentCost = modelType === 'standard' ? 2 : 20;
    const canUsePremium = userProfile?.subscriptionTier === 'pro' || userProfile?.subscriptionTier === 'agency';

    // Cleanup for uploaded blobs
    useEffect(() => {
        return () => {
            if (uploadedImageBlob) {
                try { URL.revokeObjectURL(uploadedImageBlob); } catch (e) { }
            }
        }
    }, [uploadedImageBlob]);

    const handleGenerate = async () => {
        if (!prompt.trim()) return;

        if (!checkCredits(currentCost)) {
            setError(`Not enough credits. You need ${currentCost} Cr.`);
            return;
        }

        setIsGenerating(true);
        setIsImageLoading(true);
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
            console.error(err);
            setError("Failed to generate image.");
            setIsImageLoading(false);
        } finally {
            setIsGenerating(false);
            setTimeout(() => setIsImageLoading(false), 12000);
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 15 * 1024 * 1024) { setError("File too large (Max 15MB)"); return; }

        try {
            const objectUrl = URL.createObjectURL(file);
            setUploadedImageBlob(objectUrl);
            setResultImage(null);
            setError(null);
        } catch (err) {
            setError("Failed to load file");
        }
    };

    const handleUseImage = async () => {
        const target = activeTab === 'upload' ? uploadedImageBlob : resultImage;
        if (!target) return;

        setIsProcessing(true);
        try {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.src = target;

            await new Promise((r, j) => {
                img.onload = r;
                img.onerror = (e) => j("Failed to load image for processing");
            });

            const canvas = document.createElement('canvas');
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
                // Filters
                if (activeTab === 'upload' && selectedPhotoFilter !== 'normal') {
                    ctx.filter = PHOTO_FILTERS.find(f => f.id === selectedPhotoFilter)?.filter || 'none';
                }
                ctx.drawImage(img, 0, 0, w, h);

                // Logo
                if (applyLogo && brandProfile?.logoUrl) {
                    ctx.filter = 'none';
                    const logoImg = new Image();
                    logoImg.crossOrigin = "anonymous";
                    logoImg.src = brandProfile.logoUrl;
                    await new Promise(r => { logoImg.onload = r; logoImg.onerror = r; });

                    const logoW = w * 0.2;
                    const scale = logoW / logoImg.width;
                    const logoH = logoImg.height * scale;
                    const pad = w * 0.05;

                    ctx.shadowColor = "rgba(0,0,0,0.5)";
                    ctx.shadowBlur = 5;
                    ctx.drawImage(logoImg, w - logoW - pad, h - logoH - pad, logoW, logoH);
                }

                const base64Url = canvas.toDataURL('image/jpeg', 0.85);
                onSelectImage(base64Url);
                onClose();
            }
        } catch (error) {
            console.error("Processing error:", error);
            // Fallback for tainted canvas
            onSelectImage(target);
            onClose();
        } finally {
            setIsProcessing(false);
        }
    };

    const previewSrc = activeTab === 'generate' ? resultImage : uploadedImageBlob;
    const activeFilterStyle = PHOTO_FILTERS.find(f => f.id === selectedPhotoFilter)?.filter || 'none';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in">
            <div className="w-full max-w-5xl bg-[#0f1115] border border-gray-800 rounded-2xl overflow-hidden flex flex-col md:flex-row h-[85vh] shadow-2xl">

                {/* LEFT: Controls */}
                <div className="w-full md:w-1/2 p-6 flex flex-col bg-[#161b22] border-r border-gray-800 overflow-y-auto custom-scrollbar">
                    <div className="flex justify-between items-center mb-6">
                        <button onClick={onClose} className="flex items-center gap-2 text-gray-400 hover:text-white text-sm font-medium"><ArrowLeft size={16} /> Back</button>
                        {activeTab === 'generate' && (
                            <div className="bg-gray-800 px-3 py-1 rounded-full border border-gray-700 text-xs text-white font-bold flex items-center gap-1">
                                <Zap size={12} className="text-yellow-400" /> Credits: {userProfile?.credits ?? 0}
                            </div>
                        )}
                    </div>

                    <div className="flex p-1 bg-gray-900 rounded-xl mb-6 border border-gray-800">
                        <button onClick={() => setActiveTab('upload')} className={`flex-1 py-2 text-sm font-medium rounded-lg flex items-center justify-center gap-2 ${activeTab === 'upload' ? 'bg-blue-600 text-white' : 'text-gray-400'}`}><Upload size={14} /> Upload</button>
                        <button onClick={() => setActiveTab('generate')} className={`flex-1 py-2 text-sm font-medium rounded-lg flex items-center justify-center gap-2 ${activeTab === 'generate' ? 'bg-blue-600 text-white' : 'text-gray-400'}`}><Sparkles size={14} /> Generate</button>
                    </div>

                    {activeTab === 'generate' ? (
                        <>
                            <textarea
                                value={prompt}
                                onChange={e => setPrompt(e.target.value)}
                                className="w-full h-24 bg-[#0f1115] border border-gray-700 rounded-xl p-3 text-sm text-white mb-4 resize-none focus:border-blue-500 outline-none"
                                placeholder="Describe image..."
                            />
                            <div className="grid grid-cols-2 gap-3 mb-6">
                                <div onClick={() => setModelType('standard')} className={`p-3 rounded-xl border-2 cursor-pointer transition ${modelType === 'standard' ? 'border-blue-500 bg-blue-500/10' : 'border-gray-700 bg-gray-900'}`}>
                                    <div className="flex justify-between mb-1"><Zap size={16} className="text-blue-400" /><span className="text-[10px] bg-gray-800 px-1.5 rounded text-gray-300">2 Cr</span></div>
                                    <div className="font-bold text-sm text-white">Standard</div>
                                </div>
                                <div
                                    onClick={() => {
                                        if (canUsePremium) setModelType('premium');
                                        else alert("Upgrade to PRO for DALL-E 3 images.");
                                    }}
                                    className={`p-3 rounded-xl border-2 cursor-pointer transition ${modelType === 'premium' ? 'border-purple-500 bg-purple-500/10' : 'border-gray-700 bg-gray-900'} ${!canUsePremium ? 'opacity-50' : ''}`}
                                >
                                    <div className="flex justify-between mb-1"><Crown size={16} className="text-purple-400" /><span className="text-[10px] bg-gray-800 px-1.5 rounded text-gray-300">20 Cr</span></div>
                                    <div className="font-bold text-sm text-white flex items-center gap-1">Premium {!canUsePremium && <Lock size={12} />}</div>
                                </div>
                            </div>
                            <div className="mb-6">
                                <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Style</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {AI_STYLES.map(s => (
                                        <button key={s.id} onClick={() => setSelectedAiStyle(s.id)} className={`p-2 text-xs border rounded-lg text-left truncate ${selectedAiStyle === s.id ? 'border-blue-500 bg-blue-900/20 text-white' : 'border-gray-700 text-gray-400'}`}>{s.label}</button>
                                    ))}
                                </div>
                            </div>
                            <button onClick={handleGenerate} disabled={isGenerating} className="w-full py-3 bg-blue-600 rounded-xl text-white font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2 hover:bg-blue-500 transition shadow-lg">
                                {isGenerating ? <><Loader2 className="animate-spin" size={16} /> Generating...</> : "Generate Image"}
                            </button>
                        </>
                    ) : (
                        <>
                            {!uploadedImageBlob ? (
                                <div onClick={() => fileInputRef.current?.click()} className="h-48 border-2 border-dashed border-gray-700 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-gray-500 transition">
                                    <ImageIcon className="text-gray-500 mb-2" size={32} />
                                    <span className="text-sm text-gray-400">Click to upload</span>
                                    <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" hidden />
                                </div>
                            ) : (
                                <div className="animate-in fade-in">
                                    <div className="flex justify-between items-center mb-4">
                                        <label className="text-xs font-bold text-gray-500 uppercase">Filters</label>
                                        <button onClick={() => { setUploadedImageBlob(null); if (fileInputRef.current) fileInputRef.current.value = ''; }} className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1"><Trash size={12} /> Remove</button>
                                    </div>
                                    <div className="grid grid-cols-4 gap-2 mb-4">
                                        {PHOTO_FILTERS.map(f => (
                                            <button key={f.id} onClick={() => setSelectedPhotoFilter(f.id)} className={`p-2 rounded-lg border text-[10px] ${selectedPhotoFilter === f.id ? 'border-blue-500 text-white' : 'border-gray-700 text-gray-400'}`}>{f.label}</button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    {/* Logo Toggle */}
                    {brandProfile?.logoUrl && (
                        <div className="mt-6 flex items-center justify-between bg-gray-800/50 p-3 rounded-xl border border-gray-700">
                            <div className="flex items-center gap-2">
                                <img src={brandProfile.logoUrl} className="w-6 h-6 object-contain" alt="Brand Logo" />
                                <span className="text-xs text-gray-300 font-bold">Apply Brand Logo</span>
                            </div>
                            <input type="checkbox" checked={applyLogo} onChange={e => setApplyLogo(e.target.checked)} className="accent-blue-600 w-4 h-4" />
                        </div>
                    )}

                    {error && <div className="mt-4 p-3 bg-red-900/20 border border-red-500/50 rounded-lg text-red-400 text-xs flex items-center gap-2"><AlertCircle size={14} /> {error}</div>}
                </div>

                {/* RIGHT: Preview (Cu Loader Vizual) */}
                <div className="w-full md:w-1/2 bg-black flex flex-col items-center justify-center p-6 relative">
                    <button onClick={onClose} className="absolute top-4 right-4 p-2 text-gray-500 hover:text-white z-10 bg-black/50 rounded-full"><X size={20} /></button>

                    {/* LOADER PENTRU IMAGINE */}
                    {isImageLoading && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black z-20 pointer-events-none">
                            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                            <p className="text-blue-400 font-bold animate-pulse tracking-widest">CREATING VISUAL...</p>
                            <p className="text-xs text-gray-500 mt-2">Standard: ~3s | Premium: ~12s</p>
                        </div>
                    )}

                    {previewSrc ? (
                        <div className="flex flex-col items-center w-full gap-4 animate-in zoom-in-95">
                            <img
                                src={previewSrc}
                                alt="Preview"
                                onLoad={() => setIsImageLoading(false)}
                                onError={() => setIsImageLoading(false)}
                                style={{ filter: activeTab === 'upload' ? activeFilterStyle : 'none' }}
                                className="max-h-[450px] max-w-full rounded-lg shadow-2xl object-contain border border-gray-800"
                            />
                            <div className="flex gap-2 w-full max-w-xs">
                                <button onClick={handleUseImage} disabled={isProcessing || isImageLoading} className="flex-1 bg-green-600 hover:bg-green-500 py-3 rounded-lg text-white font-bold text-sm shadow-lg flex items-center justify-center gap-2 transition">
                                    {isProcessing ? <Loader2 className="animate-spin" size={16} /> : "Use Image"}
                                </button>
                            </div>
                        </div>
                    ) : (
                        !isImageLoading && (
                            <div className="text-gray-600 text-sm flex flex-col items-center">
                                <ImageIcon size={48} className="mx-auto mb-4 opacity-30" />
                                <p>Preview Area</p>
                            </div>
                        )
                    )}
                </div>
            </div>
        </div>
    );
}
