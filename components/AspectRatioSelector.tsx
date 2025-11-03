import React from 'react';
import { PRODUCT_IDEAS } from '../constants';
import type { ProductIdea } from '../types';
import { ProductCard } from './ImageGrid';

interface ProductListProps {
  onSelectProduct: (idea: ProductIdea) => void;
}

export const ProductList: React.FC<ProductListProps> = ({ onSelectProduct }) => {
  return (
    <div className="w-full max-w-4xl mx-auto">
        <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">AI Shopify Product Generator</h2>
            <p className="mt-4 text-lg text-gray-400">Select a product idea below. Our AI will craft a complete Shopify listing, including descriptions, pricing, and a unique mockup image.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {PRODUCT_IDEAS.map((idea) => (
                <ProductCard key={idea.id} idea={idea} onSelect={() => onSelectProduct(idea)} />
            ))}
        </div>
    </div>
  );
};
