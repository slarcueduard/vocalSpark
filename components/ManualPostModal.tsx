import React, { useState, useRef } from 'react';
import { X, Image as ImageIcon, Check } from 'lucide-react';
import { Loader } from './Loader';

interface ManualPostModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (content: string, image: string | null) => Promise<void>;
}

export const ManualPostModal: React.FC<ManualPostModalProps> = ({ isOpen, onClose, onSave }) => {
    const [content, setContent] = useState('');
    const [image, setImage] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!isOpen) return null;

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = async () => {
        if (!content.trim() && !image) return;

        setIsSaving(true);
        try {
            await onSave(content, image);
            setContent('');
            setImage(null);
            onClose();
        } catch (error) {
            console.error("Failed to save manual post:", error);
            alert("Failed to save post. Please try again.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#161b22] border border-gray-800 rounded-2xl w-full max-w-lg shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between p-4 border-b border-gray-800">
                    <h3 className="font-bold text-white text-lg">Create Manual Post</h3>
                    <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-full text-gray-400 hover:text-white transition">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-4 space-y-4">
                    <div>
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="Write your post content here..."
                            className="w-full h-40 bg-[#0d1117] border border-gray-700 rounded-xl p-4 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none"
                            autoFocus
                        />
                    </div>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm text-gray-300 transition"
                        >
                            <ImageIcon size={16} />
                            {image ? 'Change Image' : 'Add Image'}
                        </button>
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={handleImageUpload}
                        />
                        {image && (
                            <div className="relative group">
                                <img src={image} alt="Preview" className="w-10 h-10 rounded object-cover border border-gray-700" />
                                <button
                                    onClick={() => setImage(null)}
                                    className="absolute -top-1 -right-1 bg-red-500 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition"
                                >
                                    <X size={10} className="text-white" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-4 border-t border-gray-800 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving || (!content.trim() && !image)}
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {isSaving ? <Loader size={16} /> : <Check size={16} />}
                        Save Post
                    </button>
                </div>
            </div>
        </div>
    );
};
