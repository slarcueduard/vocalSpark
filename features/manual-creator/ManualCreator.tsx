import React, { useState, useCallback } from 'react';

interface ManualCreatorProps {
    onCreatePost: (content: string, imageUrl: string | null) => void;
}

const ManualCreator: React.FC<ManualCreatorProps> = ({ onCreatePost }) => {
    const [manualContent, setManualContent] = useState('');
    const [manualImage, setManualImage] = useState<File | null>(null);
    const [manualImagePreview, setManualImagePreview] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleManualImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setManualImage(file);
            setManualImagePreview(URL.createObjectURL(file));
        } else {
            setManualImage(null);
            setManualImagePreview(null);
        }
    };

    const handleSubmit = useCallback((e: React.FormEvent) => {
        e.preventDefault();
        if (!manualContent.trim() && !manualImage) {
            setError('Please provide content or an image for your post.');
            return;
        }
        setError(null);
        onCreatePost(manualContent, manualImagePreview);
        
        // Reset form
        setManualContent('');
        setManualImage(null);
        setManualImagePreview(null);
        const fileInput = document.getElementById('manual-image-upload') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
    }, [manualContent, manualImage, manualImagePreview, onCreatePost]);

    return (
        <>
            <h2 className="text-xl font-semibold mb-1 text-center">Create your post manually</h2>
            <p className="text-brand-text-secondary mb-6 text-center">Write your content and upload your own media.</p>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="manual-content" className="block text-sm font-medium mb-2">Post Content</label>
                    <textarea
                        id="manual-content"
                        value={manualContent}
                        onChange={(e) => setManualContent(e.target.value)}
                        rows={5}
                        placeholder="What's on your mind?"
                        className="w-full bg-brand-bg-dark border border-gray-600 rounded-md px-3 py-2 focus:ring-2 focus:ring-brand-primary focus:outline-none transition"
                    ></textarea>
                </div>
                <div>
                    <label htmlFor="manual-image-upload" className="block text-sm font-medium mb-2">Upload Image (Optional)</label>
                    <div className="flex items-center gap-4">
                        <input
                            id="manual-image-upload"
                            type="file"
                            accept="image/*"
                            onChange={handleManualImageChange}
                            className="block w-full text-sm text-brand-text-secondary file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand-secondary file:text-brand-bg-dark hover:file:bg-brand-secondary/80"
                        />
                        {manualImagePreview && <img src={manualImagePreview} alt="Preview" className="w-16 h-16 rounded-md object-cover" />}
                    </div>
                </div>
                {error && <p className="text-red-400 text-sm">{error}</p>}
                <button
                    type="submit"
                    className="w-full bg-brand-secondary text-white font-bold py-2 px-4 rounded-md hover:bg-opacity-90 transition-transform transform hover:scale-105"
                >
                    Create Post
                </button>
            </form>
        </>
    );
};

export default ManualCreator;
