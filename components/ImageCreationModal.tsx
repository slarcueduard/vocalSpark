import React, { useState, useCallback } from 'react';
import { fileToBase64, generateImageVariation, generateImageForPost } from '../services/geminiService';
import { ARTISTIC_STYLES, ENHANCEMENT_STYLES, PERSON_STYLES } from '../constants';
import { CloseIcon, ImageIcon, SparklesIcon, CheckCircleIcon, UploadIcon, MagicWandIcon, DownloadIcon } from './Icons';
import { Loader } from './Loader';
import { useAuth } from '../contexts/AuthContext';

interface ImageCreationModalProps {
  onClose: () => void;
  onSelectImage: (imageUrl: string) => void;
  initialPrompt?: string;
}

type Tab = 'upload' | 'generate' | 'magic_edit';
type Stage = 'input' | 'processing' | 'results';

export const ImageCreationModal: React.FC<ImageCreationModalProps> = ({ onClose, onSelectImage, initialPrompt }) => {
  const { brandProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('upload');
  const [stage, setStage] = useState<Stage>('input');
  
  // Upload State
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  
  // Generate State
  const [prompt, setPrompt] = useState(initialPrompt || '');

  // Magic Edit State
  const [magicEditPrompt, setMagicEditPrompt] = useState('');

  // Results State
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setError(null);
    }
  };

  const handleStyleToggle = (style: string) => {
    setSelectedStyles(prev => {
      if (prev.includes(style)) return prev.filter(s => s !== style);
      if (prev.length < 3) return [...prev, style];
      return prev;
    });
  };

  const handleGenerateVariations = useCallback(async () => {
    if (!uploadedFile || selectedStyles.length === 0) {
        setError("Please upload an image and select at least one style.");
        return;
    }

    setStage('processing');
    setError(null);
    setGeneratedImages([]);

    try {
      const { mimeType, data } = await fileToBase64(uploadedFile);
      
      // Process variations individually so one failure doesn't stop the others
      const promises = selectedStyles.map(async style => {
          try {
              return await generateImageVariation(data, mimeType, style);
          } catch (err) {
              console.error(`Failed to generate ${style} variation:`, err);
              return null;
          }
      });

      const results = await Promise.all(promises);
      const successfulImages = results.filter(img => img !== null) as string[];

      if (successfulImages.length === 0) {
          throw new Error("All image variations failed. Please try a different image or style.");
      }

      setGeneratedImages(successfulImages);
      if (successfulImages.length < selectedStyles.length) {
           setError("Some variations couldn't be generated due to safety filters, but here are the successful ones.");
      }
      
      setStage('results');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to generate variations. Please try again.');
      setStage('input');
    }
  }, [uploadedFile, selectedStyles]);

  const handleMagicEdit = useCallback(async () => {
      if (!uploadedFile || !magicEditPrompt.trim()) {
          setError("Please upload an image and describe the change.");
          return;
      }
      setStage('processing');
      setError(null);
      
      try {
          const { mimeType, data } = await fileToBase64(uploadedFile);
          // Pass the magic edit prompt as a special style string that the service detects
          const result = await generateImageVariation(data, mimeType, `Magic Edit: ${magicEditPrompt}`);
          setGeneratedImages([result]);
          setStage('results');
      } catch (err: any) {
          console.error(err);
          setError(err.message || "Failed to edit image.");
          setStage('input');
      }

  }, [uploadedFile, magicEditPrompt]);

  const handleGenerateFromText = useCallback(async () => {
    if (!prompt.trim()) {
        setError("Please enter a prompt.");
        return;
    }

    setStage('processing');
    setError(null);
    setGeneratedImages([]);

    try {
        // Generate 3 unique calls to get variety
        // Using map to handle individual errors
        const promises = [1, 2, 3].map(async () => {
            try {
                return await generateImageForPost(prompt, brandProfile || undefined);
            } catch (e) {
                console.error(e);
                return null;
            }
        });
        
        const results = await Promise.all(promises);
        const successfulImages = results.filter(img => img !== null) as string[];

        if (successfulImages.length === 0) {
            throw new Error("Failed to generate images. Please refine your prompt.");
        }

        setGeneratedImages(successfulImages);
        setStage('results');
    } catch (err: any) {
        console.error(err);
        setError(err.message || 'Failed to generate images. Please try again.');
        setStage('input');
    }
  }, [prompt, brandProfile]);

  const handleSelect = (imgUrl: string) => {
      onSelectImage(imgUrl);
      onClose();
  };

  const renderUploadBox = () => (
      <div className="text-center">
        {previewUrl ? (
            <div className="relative inline-block group">
                <img src={previewUrl} alt="Preview" className="h-48 rounded-lg border border-gray-600 object-cover" />
                <button 
                    onClick={() => { setUploadedFile(null); setPreviewUrl(null); }}
                    className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1 shadow-lg text-white hover:bg-red-600"
                >
                    <CloseIcon className="w-4 h-4" />
                </button>
            </div>
        ) : (
            <div className="border-2 border-dashed border-gray-600 rounded-xl p-8 hover:border-brand-secondary hover:bg-brand-secondary/5 transition cursor-pointer relative">
                <input type="file" onChange={handleFileChange} accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" />
                <UploadIcon className="w-12 h-12 text-brand-text-secondary mx-auto mb-3" />
                <p className="text-sm font-medium">Click to upload an image</p>
                <p className="text-xs text-brand-text-secondary mt-1">We'll use this as a base for AI variations</p>
            </div>
        )}
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" aria-modal="true">
      <div className="bg-brand-bg-light rounded-2xl shadow-2xl border border-gray-700 w-full max-w-3xl max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <header className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-xl font-bold text-brand-text flex items-center gap-2">
            <ImageIcon className="w-6 h-6 text-brand-secondary" />
            Visuals Studio
          </h2>
          <button onClick={onClose} className="text-brand-text-secondary hover:text-white transition">
            <CloseIcon className="w-6 h-6" />
          </button>
        </header>

        {/* Tabs (Only visible in Input stage) */}
        {stage === 'input' && (
            <div className="flex border-b border-gray-700">
                <button
                    onClick={() => { setActiveTab('upload'); setError(null); }}
                    className={`flex-1 py-4 text-sm font-semibold transition-colors ${activeTab === 'upload' ? 'bg-brand-bg-light text-brand-secondary border-b-2 border-brand-secondary' : 'bg-brand-bg-dark/50 text-brand-text-secondary hover:bg-brand-bg-light'}`}
                >
                    Upload & Remix
                </button>
                <button
                    onClick={() => { setActiveTab('magic_edit'); setError(null); }}
                    className={`flex-1 py-4 text-sm font-semibold transition-colors ${activeTab === 'magic_edit' ? 'bg-brand-bg-light text-brand-secondary border-b-2 border-brand-secondary' : 'bg-brand-bg-dark/50 text-brand-text-secondary hover:bg-brand-bg-light'}`}
                >
                    Magic Edit
                </button>
                <button
                    onClick={() => { setActiveTab('generate'); setError(null); }}
                    className={`flex-1 py-4 text-sm font-semibold transition-colors ${activeTab === 'generate' ? 'bg-brand-bg-light text-brand-secondary border-b-2 border-brand-secondary' : 'bg-brand-bg-dark/50 text-brand-text-secondary hover:bg-brand-bg-light'}`}
                >
                    Generate with AI
                </button>
            </div>
        )}

        <div className="p-6 overflow-y-auto flex-grow">
            
            {/* STAGE: INPUT */}
            {stage === 'input' && activeTab === 'upload' && (
                <div className="space-y-6">
                    {renderUploadBox()}

                    {uploadedFile && (
                        <div className="animate-fadeIn space-y-5">
                             <div className="flex justify-between items-end">
                                <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider">Select up to 3 AI Filters</h3>
                                <p className="text-xs text-right text-gray-500">{selectedStyles.length} / 3 selected</p>
                             </div>
                             
                             {/* Category: Person & Portrait */}
                             <div>
                                <h4 className="text-xs font-semibold text-brand-primary mb-2 uppercase">Person & Portrait</h4>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    {PERSON_STYLES.map(style => (
                                        <button
                                            key={style.value}
                                            onClick={() => handleStyleToggle(style.value)}
                                            className={`p-3 text-xs rounded-lg border transition-all text-center ${selectedStyles.includes(style.value) ? 'bg-brand-primary border-brand-primary text-white font-bold' : 'bg-gray-800 border-gray-700 hover:border-gray-500 text-gray-300'}`}
                                        >
                                            {style.label}
                                        </button>
                                    ))}
                                </div>
                             </div>

                             {/* Category: General Enhancements */}
                             <div>
                                <h4 className="text-xs font-semibold text-gray-500 mb-2 uppercase">General Enhancements</h4>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    {ENHANCEMENT_STYLES.map(style => (
                                        <button
                                            key={style.value}
                                            onClick={() => handleStyleToggle(style.value)}
                                            className={`p-3 text-xs rounded-lg border transition-all text-center ${selectedStyles.includes(style.value) ? 'bg-brand-primary border-brand-primary text-white font-bold' : 'bg-gray-800 border-gray-700 hover:border-gray-500 text-gray-300'}`}
                                        >
                                            {style.label}
                                        </button>
                                    ))}
                                </div>
                             </div>

                             {/* Category: Artistic */}
                             <div>
                                <h4 className="text-xs font-semibold text-gray-500 mb-2 uppercase">Artistic Styles</h4>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    {ARTISTIC_STYLES.map(style => (
                                        <button
                                            key={style.value}
                                            onClick={() => handleStyleToggle(style.value)}
                                            className={`p-3 text-xs rounded-lg border transition-all text-center ${selectedStyles.includes(style.value) ? 'bg-brand-primary border-brand-primary text-white font-bold' : 'bg-gray-800 border-gray-700 hover:border-gray-500 text-gray-300'}`}
                                        >
                                            {style.label}
                                        </button>
                                    ))}
                                </div>
                             </div>

                             <button
                                onClick={handleGenerateVariations}
                                disabled={selectedStyles.length === 0}
                                className="w-full mt-6 bg-brand-secondary text-brand-bg-dark font-bold py-3 rounded-xl disabled:opacity-50 hover:opacity-90 transition flex items-center justify-center gap-2"
                             >
                                <MagicWandIcon className="w-5 h-5" />
                                <span>Generate Variations</span>
                             </button>
                        </div>
                    )}
                </div>
            )}

            {/* STAGE: MAGIC EDIT */}
            {stage === 'input' && activeTab === 'magic_edit' && (
                <div className="space-y-6">
                    {renderUploadBox()}
                    
                    {uploadedFile && (
                        <div className="animate-fadeIn">
                             <label className="block text-sm font-medium mb-2 text-gray-300">What do you want to change?</label>
                             <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={magicEditPrompt}
                                    onChange={(e) => setMagicEditPrompt(e.target.value)}
                                    placeholder="e.g. Change the background to a blue sky, Make it night time..."
                                    className="flex-grow bg-brand-bg-dark border border-gray-600 rounded-xl px-4 py-3 focus:ring-2 focus:ring-brand-primary outline-none"
                                />
                                <button
                                    onClick={handleMagicEdit}
                                    disabled={!magicEditPrompt.trim()}
                                    className="bg-brand-primary text-brand-bg-dark font-bold px-6 rounded-xl hover:opacity-90 transition disabled:opacity-50 whitespace-nowrap"
                                >
                                    Apply Edit
                                </button>
                             </div>
                             <p className="text-xs text-gray-500 mt-2">
                                Tip: Be specific. Try "Make the background transparent" or "Add a neon glow".
                             </p>
                        </div>
                    )}
                </div>
            )}

             {stage === 'input' && activeTab === 'generate' && (
                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium mb-2 text-gray-300">Describe the image you want</label>
                        <textarea
                            rows={4}
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="A futuristic workspace with neon lights, high resolution, cyberpunk style..."
                            className="w-full bg-brand-bg-dark border border-gray-600 rounded-xl p-4 focus:ring-2 focus:ring-brand-primary outline-none resize-none"
                        ></textarea>
                    </div>
                     <button
                        onClick={handleGenerateFromText}
                        disabled={!prompt.trim()}
                        className="w-full bg-brand-primary text-brand-bg-dark font-bold py-3 rounded-xl disabled:opacity-50 hover:opacity-90 transition flex items-center justify-center gap-2"
                    >
                        <SparklesIcon className="w-5 h-5" />
                        <span>Generate Images</span>
                    </button>
                </div>
            )}

            {/* STAGE: PROCESSING */}
            {stage === 'processing' && (
                <div className="h-full flex flex-col items-center justify-center min-h-[300px]">
                    <Loader size="lg" />
                    <h3 className="text-xl font-bold mt-6 mb-2">Creating Visuals...</h3>
                    <p className="text-brand-text-secondary text-sm">Applying AI magic to your request.</p>
                </div>
            )}

             {/* STAGE: RESULTS */}
             {stage === 'results' && (
                 <div>
                     <h3 className="text-lg font-bold mb-4 text-center">Select an Image</h3>
                     <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                         {generatedImages.map((img, idx) => (
                             <div key={idx} className="group relative aspect-square rounded-xl overflow-hidden border-2 border-gray-700 hover:border-brand-primary transition cursor-pointer" onClick={() => handleSelect(img)}>
                                 <img src={img} alt={`Result ${idx}`} className="w-full h-full object-cover" />
                                 <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                                     <button className="bg-brand-primary text-white px-4 py-2 rounded-full text-sm font-bold">Select</button>
                                 </div>
                             </div>
                         ))}
                     </div>
                     <button 
                        onClick={() => { setStage('input'); setGeneratedImages([]); }}
                        className="w-full mt-6 py-3 text-brand-text-secondary hover:text-white transition"
                    >
                        Start Over
                     </button>
                 </div>
             )}

             {error && (
                 <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm text-center">
                     {error}
                 </div>
             )}

        </div>
      </div>
    </div>
  );
};