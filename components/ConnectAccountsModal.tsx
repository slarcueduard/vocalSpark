
import React, { useState, useCallback } from 'react';
import { fileToBase64, generateImageVariation } from '../services/geminiService';
import { ARTISTIC_STYLES, ENHANCEMENT_STYLES } from '../constants';
import { CloseIcon, ImageIcon, SparklesIcon, DownloadIcon, UserPlusIcon, CheckCircleIcon } from './Icons';
import { Loader } from './Loader';

interface ConnectAccountsModalProps {
  onClose: () => void;
  onCreatePostsFromImages: (imageUrls: string[]) => void;
}

type Stage = 'upload' | 'select_style' | 'generating' | 'results';

export const ConnectAccountsModal: React.FC<ConnectAccountsModalProps> = ({ onClose, onCreatePostsFromImages }) => {
  const [stage, setStage] = useState<Stage>('upload');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [finalSelectedImages, setFinalSelectedImages] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setStage('select_style');
      setError(null);
    }
  };

  const handleStyleToggle = (style: string) => {
    setSelectedStyles(prev => {
      if (prev.includes(style)) {
        return prev.filter(s => s !== style);
      }
      if (prev.length < 3) {
        return [...prev, style];
      }
      return prev;
    });
  };

  const handleGenerate = useCallback(async () => {
    if (!uploadedFile || selectedStyles.length !== 3) return;

    setStage('generating');
    setError(null);
    setGeneratedImages([]);
    setFinalSelectedImages([]);

    try {
      const { mimeType, data } = await fileToBase64(uploadedFile);
      
      const promises = selectedStyles.map(style => 
        generateImageVariation(data, mimeType, style)
      );

      const results = await Promise.all(promises);
      setGeneratedImages(results);
      setStage('results');
    } catch (err) {
      console.error(err);
      setError('Failed to generate image variations. Please try again.');
      setStage('select_style');
    }
  }, [uploadedFile, selectedStyles]);

  const handleStartOver = () => {
    setStage('upload');
    setUploadedFile(null);
    setPreviewUrl(null);
    setSelectedStyles([]);
    setGeneratedImages([]);
    setFinalSelectedImages([]);
    setError(null);
  };

  const handleImageSelection = (imgSrc: string) => {
    setFinalSelectedImages(prev => {
      if (prev.includes(imgSrc)) {
        return prev.filter(url => url !== imgSrc);
      }
      return [...prev, imgSrc];
    });
  };

  const handleCreatePosts = () => {
    if (finalSelectedImages.length === 0) return;
    onCreatePostsFromImages(finalSelectedImages);
    onClose();
  };

  const renderContent = () => {
    switch (stage) {
      case 'upload':
        return (
          <div className="text-center">
            <ImageIcon className="w-16 h-16 mx-auto text-brand-text-secondary mb-4" />
            <h3 className="text-lg font-semibold mb-2">Upload Your Photo</h3>
            <p className="text-brand-text-secondary text-sm mb-4">Upload a photo to transform it with AI.</p>
            <input type="file" id="image-upload-input" accept="image/*" onChange={handleFileChange} className="hidden" />
            <label htmlFor="image-upload-input" className="cursor-pointer bg-brand-secondary text-white font-bold py-2 px-4 rounded-md hover:bg-opacity-90 transition-transform transform hover:scale-105">
              Choose File
            </label>
          </div>
        );
      
      case 'select_style':
        return (
          <div>
            <h3 className="text-lg font-semibold mb-2 text-center">Select 3 Styles to Apply</h3>
            <p className="text-center text-brand-text-secondary text-sm mb-4">Mix and match or choose from one category.</p>
            {previewUrl && <img src={previewUrl} alt="Preview" className="w-40 h-40 rounded-lg object-cover mx-auto mb-6 border-2 border-gray-600" />}
            
            <div className="space-y-5">
              <div>
                <h4 className="font-semibold text-brand-text mb-3 text-center">Natural Enhancements</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {ENHANCEMENT_STYLES.map(({ value, label }) => {
                    const isSelected = selectedStyles.includes(value);
                    return (
                      <button 
                        key={value} 
                        onClick={() => handleStyleToggle(value)}
                        className={`p-3 text-sm rounded-lg border-2 transition-all h-full ${isSelected ? 'bg-brand-primary border-brand-primary text-brand-bg-dark font-semibold scale-105' : 'bg-gray-800 border-gray-600 text-brand-text hover:border-gray-500 hover:bg-gray-700'}`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
               <div>
                <h4 className="font-semibold text-brand-text mb-3 text-center">Artistic Styles</h4>
                <div className="grid grid-cols-4 gap-3">
                  {ARTISTIC_STYLES.map(({ value, label }) => {
                    const isSelected = selectedStyles.includes(value);
                    return (
                      <button 
                        key={value} 
                        onClick={() => handleStyleToggle(value)}
                        className={`p-2 text-sm rounded-lg border-2 transition-all ${isSelected ? 'bg-brand-primary border-brand-primary text-brand-bg-dark font-semibold scale-105' : 'bg-gray-800 border-gray-600 text-brand-text hover:border-gray-500 hover:bg-gray-700'}`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
            
            {error && <p className="text-red-400 text-sm text-center my-4">{error}</p>}
            <button 
              onClick={handleGenerate}
              disabled={selectedStyles.length !== 3}
              className="w-full bg-brand-primary text-brand-bg-dark font-bold py-3 px-4 rounded-md hover:bg-opacity-90 transition-transform transform hover:scale-105 disabled:bg-gray-500 disabled:scale-100 flex items-center justify-center gap-2 mt-6"
            >
              <SparklesIcon className="w-5 h-5" />
              <span>Generate 3 Variations ({selectedStyles.length}/3)</span>
            </button>
          </div>
        );

      case 'generating':
        return (
          <div className="flex flex-col items-center justify-center h-64">
            <Loader size="lg" />
            <p className="text-brand-text-secondary mt-4">AI is creating magic...</p>
          </div>
        );

      case 'results':
        return (
          <div>
            <h3 className="text-lg font-semibold text-center">Your AI Variations</h3>
            <p className="text-center text-sm text-brand-text-secondary mb-4">Select the images you want to create posts with.</p>
            <div className="grid grid-cols-3 gap-4 mb-6">
              {generatedImages.map((imgSrc, index) => {
                const isSelected = finalSelectedImages.includes(imgSrc);
                return (
                  <div key={index} className="group relative cursor-pointer" onClick={() => handleImageSelection(imgSrc)}>
                    <img 
                      src={imgSrc} 
                      alt={`Variation ${index + 1}`} 
                      className={`w-full h-auto rounded-lg object-cover transition-all duration-200 border-4 ${isSelected ? 'border-brand-primary scale-95' : 'border-transparent'}`}
                    />
                    {isSelected && (
                      <div className="absolute top-2 right-2 bg-brand-primary rounded-full text-brand-bg-dark">
                        <CheckCircleIcon className="w-6 h-6" />
                      </div>
                    )}
                    <div className="absolute bottom-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <a
                        href={imgSrc}
                        download={`variation-${selectedStyles[index].toLowerCase().replace(' ','-')}.png`}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-brand-bg-dark/80 text-white p-2 rounded-full hover:bg-brand-primary transition"
                        title="Download Image"
                      >
                        <DownloadIcon className="w-5 h-5" />
                      </a>
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={handleStartOver}
                className="w-1/2 bg-brand-bg-dark text-brand-text-secondary font-bold py-3 px-4 rounded-md hover:bg-gray-700/80 transition"
              >
                Start Over
              </button>
              <button
                onClick={handleCreatePosts}
                disabled={finalSelectedImages.length === 0}
                className="w-1/2 bg-brand-secondary text-white font-bold py-3 px-4 rounded-md hover:bg-opacity-90 transition-transform transform hover:scale-105 disabled:bg-gray-500 disabled:scale-100 flex items-center justify-center gap-2"
              >
                <UserPlusIcon className="w-5 h-5" />
                <span>Create {finalSelectedImages.length > 0 ? `${finalSelectedImages.length} ` : ''}Post{finalSelectedImages.length === 1 ? '' : 's'}</span>
              </button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" aria-modal="true">
      <div className="bg-brand-bg-light rounded-2xl shadow-2xl border border-gray-700 w-full max-w-2xl max-h-[90vh] flex flex-col">
        <header className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-xl font-bold text-brand-text flex items-center gap-2">
            <UserPlusIcon className="w-6 h-6 text-brand-secondary" />
            AI Image Studio
          </h2>
          <button onClick={onClose} className="text-brand-text-secondary hover:text-white transition">
            <CloseIcon className="w-6 h-6" />
          </button>
        </header>
        <div className="p-6 overflow-y-auto">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};
