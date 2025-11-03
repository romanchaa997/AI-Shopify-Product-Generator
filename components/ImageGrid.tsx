import React from 'react';
import type { ProductIdea } from '../types';
import { Icon } from './Icon';

interface ProductCardProps {
  idea: ProductIdea;
  onSelect: () => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ idea, onSelect }) => {
  return (
    <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden flex flex-col group transition-all duration-300 hover:shadow-cyan-500/20 hover:-translate-y-1">
      <div className="p-6 flex-grow">
        <h3 className="text-xl font-bold text-white">{idea.name}</h3>
        <p className="mt-2 text-gray-400 text-sm leading-relaxed">{idea.description}</p>
      </div>
      <div className="p-6 bg-gray-900/50">
        <button
          onClick={onSelect}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-cyan-600 text-white font-semibold rounded-lg shadow-md hover:bg-cyan-700 transition-all duration-200 group-hover:bg-cyan-500"
        >
          <Icon name="sparkles" className="w-5 h-5" />
          Generate Listing
        </button>
      </div>
    </div>
  );
};
