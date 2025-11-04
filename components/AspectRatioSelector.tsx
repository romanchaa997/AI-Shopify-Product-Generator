import React, { useState } from 'react';
import { PRODUCT_IDEAS } from '../constants';
import type { ProductIdea } from '../types';
import { ProductCard } from './ImageGrid';
import { Icon } from './Icon';
import { generateImagePrompt } from '../services/geminiService';
import { ProgressBar } from './ProgressBar';

interface ProductSelectionProps {
  onSelectProduct: (idea: ProductIdea) => void;
  isGenerating: boolean;
}

export const ProductSelection: React.FC<ProductSelectionProps> = ({ onSelectProduct, isGenerating }) => {
    const [customName, setCustomName] = useState('');
    const [customDescription, setCustomDescription] = useState('');
    const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleCustomSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!customName.trim() || !customDescription.trim()) return;

        setIsGeneratingPrompt(true);
        setError(null);
        try {
          const imagePrompt = await generateImagePrompt(customName, customDescription);
          const customIdea: ProductIdea = {
            id: `custom-${Date.now()}`,
            name: customName,
            description: customDescription,
            imagePrompt: imagePrompt,
          };
          onSelectProduct(customIdea);
        } catch (err) {
            console.error("Failed to generate image prompt:", err);
            setError(err instanceof Error ? err.message : 'Could not generate an idea. Please try again.');
            setIsGeneratingPrompt(false);
        }
    };

    if (isGenerating) {
        return <ProgressBar />;
    }

    return (
        <div className="w-full max-w-4xl mx-auto">
            <div className="text-center mb-12">
                <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">AI Shopify Product Generator</h2>
                <p className="mt-4 text-lg text-gray-400">Create a custom product idea or select a preset below. Our AI will craft a complete Shopify listing, including descriptions, pricing, and a unique mockup image.</p>
            </div>

            <div className="bg-gray-800 rounded-lg shadow-lg p-6 mb-12">
                <h3 className="text-xl font-bold text-white mb-4">Create a Custom Product</h3>
                <form onSubmit={handleCustomSubmit}>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="productName" className="block text-sm font-medium text-gray-300 mb-1">Product Name</label>
                            <input
                                type="text"
                                id="productName"
                                value={customName}
                                onChange={(e) => setCustomName(e.target.value)}
                                placeholder="e.g., Audityzer PRO"
                                className="w-full bg-gray-900 border border-gray-700 text-white rounded-md px-3 py-2 focus:ring-cyan-500 focus:border-cyan-500"
                                required
                                disabled={isGeneratingPrompt}
                            />
                        </div>
                        <div>
                             <label htmlFor="productDescription" className="block text-sm font-medium text-gray-300 mb-1">Product Description</label>
                            <textarea
                                id="productDescription"
                                value={customDescription}
                                onChange={(e) => setCustomDescription(e.target.value)}
                                placeholder="A brief description of what your product is and who it's for."
                                className="w-full bg-gray-900 border border-gray-700 text-white rounded-md px-3 py-2 focus:ring-cyan-500 focus:border-cyan-500"
                                rows={3}
                                required
                                disabled={isGeneratingPrompt}
                             />
                        </div>
                         <div>
                             <button type="submit" className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-cyan-600 text-white font-semibold rounded-lg shadow-md hover:bg-cyan-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed" disabled={isGeneratingPrompt}>
                                <Icon name="sparkles" className="w-5 h-5" />
                                {isGeneratingPrompt ? 'Generating Idea...' : 'Generate Listing'}
                            </button>
                         </div>
                    </div>
                    {error && <p className="text-red-400 text-sm mt-2 text-center">{error}</p>}
                </form>
            </div>

            <div className="text-center mb-8">
                <div className="relative">
                    <div className="absolute inset-0 flex items-center" aria-hidden="true">
                        <div className="w-full border-t border-gray-700" />
                    </div>
                    <div className="relative flex justify-center">
                        <span className="bg-gray-900 px-4 text-lg font-medium text-gray-400">Or Choose a Preset</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {PRODUCT_IDEAS.map((idea) => (
                    <ProductCard key={idea.id} idea={idea} onSelect={() => onSelectProduct(idea)} />
                ))}
            </div>
        </div>
      );
};