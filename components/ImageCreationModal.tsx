import React, { useState, useRef, useEffect } from 'react';
// 1. Importăm doar iconițele din Icons
import { XIcon, MagicWandIcon, ImageIcon, SparklesIcon, CheckCircleIcon } from './Icons';
// 2. Importăm Loader-ul din fișierul lui dedicat
import { Loader } from './Loader'; 
import { generateImageForPost, generateImageVariation } from '../services/geminiService';

interface ImageCreationModalProps {
  onClose: () => void;
  onSelectImage: (imageUrl: string) => void;
  initialPrompt?: string;
}

// 1. FILTRE INSTANT (Local)
const INSTANT_FILTERS = [
  { name: 'Original', filter: 'none' },
  { name: 'B & W', filter: 'grayscale(100%)' },
  { name: 'Vintage', filter: 'sepia(50%) contrast(85%) brightness(110%)' },
  { name: 'Vivid', filter: 'saturate(150%) contrast(110%)' },
  { name: 'Dramatic', filter: 'contrast(125%) brightness(90%)' },
  { name: 'Soft', filter: 'brightness(110%) contrast(90%) saturate(90%)' },
];

// 2. AI STYLES (Server)
const AI_STYLES = [
  'Neon Noir', 'Cyberpunk', 'Pixar Animation', 'Fantasy Art', 
  'Gothic Noir', 'Pop Art', 'Product Pro', 'Watercolor'
];

const ImagePreview: React.FC<{ src: string; onSelect: () => void; filter?: string }> = ({ src, onSelect, filter }) => {
    const [loaded, setLoaded] = useState(false);
    
    return (
        <div onClick={onSelect} className="relative aspect-square bg-gray-800 rounded-xl overflow-hidden border-2 border-transparent hover:border-brand-primary cursor-pointer group transition-all">
            {!loaded && <div className="absolute inset-0 flex items-center justify-center"><Loader size="sm" /></div>}
            <img 
                src={src} 
                alt="Generated" 
                className={`w-full h-full object-cover transition-all duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
                style={{ filter: filter || 'none' }}
                onLoad={() => setLoaded(true)}
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                <button className="bg-brand-primary text-black text-xs font-bold px-3 py-1.5 rounded-lg transform translate-y-2 group-hover:translate-y-0 transition">
                    Select This
                </button>
            </div>
        </div>
    );
};

export const ImageCreationModal: React.FC<ImageCreationModalProps> = ({ onClose, onSelectImage, initialPrompt }) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'generate'>('upload');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>('none');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [prompt, setPrompt] = useState(initialPrompt || '');
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiResults, setAiResults] = useState<string[]>([]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const url = URL.createObjectURL(e.target.files[0]);
          setSelectedImage(url);
          setActiveTab('upload');
          setActiveFilter('none'); 
      }
  };

  const saveFilteredImage = () => {
      if (!selectedImage || !canvasRef.current) return;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.crossOrigin = "Anonymous";
      img.src = selectedImage;

      img.onload = () => {
          canvas.width = img.width;
          canvas.height = img.height;
          if (ctx) {
              ctx.filter = activeFilter;
              ctx.drawImage(img, 0, 0, img.width, img.height);
              const newDataUrl = canvas.toDataURL('image/png');
              onSelectImage(newDataUrl);
              onClose();
          }
      };
  };

  const handleGenerateAI = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setAiResults([]);
    try {
        const promises = [1, 2].map(() => generateImageForPost(prompt));
        const results = await Promise.all(promises);
        setAiResults(results);
    } catch (e) {
        console.error(e);
    } finally {
        setIsGenerating(false);
    }
  };

  const handleAiRemix = async (style: string) => {
      if (!selectedImage) return;
      setIsGenerating(true);
      try {
          const newImage = await generateImageVariation("placeholder", "image/png", style);
          setAiResults([newImage]);
          setActiveTab('generate');
      } catch (e) {
          console.error(e);
      } finally {
          setIsGenerating(false);
      }
  };

  return (
    <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4 backdrop-blur-md">
      <div className="bg-gray-900 w-full max-w-5xl h-[90vh] rounded-2xl border border-gray-700 flex flex-col overflow-hidden shadow-2xl">
        
        {/* Header */}
        <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-900">
            <div className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-brand-primary" />
                <h2 className="font-bold text-white tracking-wide">Visuals Studio</h2>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-white transition"><XIcon className="w-6 h-6" /></button>
        </div>

        <div className="flex-1 flex overflow-hidden">
            {/* SIDEBAR */}
            <div className="w-80 border-r border-gray-800 p-5 bg-gray-900 overflow-y-auto flex flex-col gap-6">
                <div className="flex bg-gray-800 p-1 rounded-lg">
                    <button onClick={() => setActiveTab('upload')} className={`flex-1 py-2 text-xs font-bold rounded-md transition ${activeTab === 'upload' ? 'bg-gray-700 text-white shadow' : 'text-gray-400 hover:text-gray-300'}`}>Edit & Filter</button>
                    <button onClick={() => setActiveTab('generate')} className={`flex-1 py-2 text-xs font-bold rounded-md transition ${activeTab === 'generate' ? 'bg-brand-primary text-black shadow' : 'text-gray-400 hover:text-gray-300'}`}>AI Generate</button>
                </div>

                {activeTab === 'upload' && (
                    <div className="space-y-6 animate-fadeIn">
                        <div className="relative group">
                            {!selectedImage ? (
                                <div className="border-2 border-dashed border-gray-700 rounded-xl h-40 flex flex-col items-center justify-center text-gray-500 hover:border-brand-primary hover:bg-brand-primary/5 transition cursor-pointer">
                                    <input type="file" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" />
                                    <ImageIcon className="w-8 h-8 mb-2 opacity-50" />
                                    <span className="text-xs font-bold uppercase tracking-wider">Upload Image</span>
                                </div>
                            ) : (
                                <div className="relative rounded-xl overflow-hidden border border-gray-600 bg-black h-48 flex items-center justify-center">
                                    <img src={selectedImage} alt="Preview" className="h-full w-full object-contain transition-all duration-300" style={{ filter: activeFilter }} />
                                    <canvas ref={canvasRef} className="hidden"></canvas>
                                    <button onClick={() => setSelectedImage(null)} className="absolute top-2 right-2 bg-black/60 text-white p-1.5 rounded-full hover:bg-red-600 transition"><XIcon className="w-3 h-3"/></button>
                                </div>
                            )}
                        </div>

                        {selectedImage && (
                            <>
                                <div>
                                    <h3 className="text-[10px] font-bold text-brand-primary uppercase tracking-widest mb-3">Instant Filters</h3>
                                    <div className="grid grid-cols-3 gap-2">
                                        {INSTANT_FILTERS.map(f => (
                                            <button key={f.name} onClick={() => setActiveFilter(f.filter)} className={`text-xs py-2 rounded border transition-all ${activeFilter === f.filter ? 'bg-white text-black border-white font-bold' : 'bg-gray-800 text-gray-400 border-gray-700 hover:border-gray-500'}`}>{f.name}</button>
                                        ))}
                                    </div>
                                </div>
                                <button onClick={saveFilteredImage} className="w-full py-3 bg-brand-secondary text-white font-bold rounded-xl hover:opacity-90 shadow-lg flex items-center justify-center gap-2"><CheckCircleIcon className="w-4 h-4" /> Use This Image</button>
                                <div className="h-px bg-gray-800 my-4"></div>
                                <div>
                                    <h3 className="text-[10px] font-bold text-purple-400 uppercase tracking-widest mb-3 flex items-center gap-2"><SparklesIcon className="w-3 h-3" /> AI Remix (Slow)</h3>
                                    <div className="grid grid-cols-2 gap-2">
                                        {AI_STYLES.map(style => (
                                            <button key={style} onClick={() => handleAiRemix(style)} disabled={isGenerating} className="text-xs text-left px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg hover:border-purple-500 hover:text-purple-400 transition truncate">{style}</button>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                )}

                {activeTab === 'generate' && (
                    <div className="space-y-4 animate-fadeIn">
                        <label className="block text-xs font-bold text-gray-400 uppercase">Describe your idea</label>
                        <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={5} placeholder="A futuristic city..." className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-sm focus:ring-2 focus:ring-brand-primary outline-none resize-none" />
                        <button onClick={handleGenerateAI} disabled={isGenerating || !prompt.trim()} className="w-full py-3 bg-gradient-to-r from-brand-primary to-blue-600 text-white font-bold rounded-xl hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg">
                            {isGenerating ? <Loader size="sm"/> : <MagicWandIcon className="w-4 h-4" />} {isGenerating ? 'Generating...' : 'Generate New'}
                        </button>
                    </div>
                )}
            </div>

            {/* MAIN CANVAS */}
            <div className="flex-1 bg-black relative flex flex-col">
                <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(#333 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
                <div className="flex-1 overflow-y-auto p-8 z-10">
                    {activeTab === 'upload' && !selectedImage && (
                        <div className="h-full flex flex-col items-center justify-center text-gray-600"><ImageIcon className="w-16 h-16 mb-4 opacity-20" /><p>Upload an image to start editing</p></div>
                    )}
                    {activeTab === 'generate' && (
                        <>
                            {isGenerating ? (
                                <div className="h-full flex flex-col items-center justify-center animate-pulse">
                                    <div className="w-16 h-16 border-4 border-brand-primary border-t-transparent rounded-full animate-spin mb-6"></div>
                                    <h3 className="text-xl font-bold text-white">Dreaming up pixels...</h3>
                                    <p className="text-gray-500 mt-2">This might take a moment.</p>
                                </div>
                            ) : aiResults.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {aiResults.map((url, idx) => <ImagePreview key={idx} src={url} onSelect={() => { onSelectImage(url); onClose(); }} />)}
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-gray-600"><SparklesIcon className="w-16 h-16 mb-4 opacity-20" /><p>Enter a prompt to generate new images</p></div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};
