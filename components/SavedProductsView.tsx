import React, { useState, useEffect } from 'react';
import type { GeneratedProduct } from '../types';
import { Icon } from './Icon';

interface SavedProductsViewProps {
  onBack: () => void;
}

export const SavedProductsView: React.FC<SavedProductsViewProps> = ({ onBack }) => {
  const [products, setProducts] = useState<GeneratedProduct[]>([]);

  useEffect(() => {
    try {
      const savedProductsRaw = localStorage.getItem('savedShopifyProducts');
      const savedProducts: GeneratedProduct[] = savedProductsRaw ? JSON.parse(savedProductsRaw) : [];
      setProducts(savedProducts);
    } catch (e) {
      console.error("Failed to load products from local storage", e);
    }
  }, []);

  const handleDelete = (productId: string) => {
    const updatedProducts = products.filter(p => p.id !== productId);
    setProducts(updatedProducts);
    localStorage.setItem('savedShopifyProducts', JSON.stringify(updatedProducts));
  };
  
  const handleClearAll = () => {
    if (window.confirm("Are you sure you want to delete all saved products? This action cannot be undone.")) {
        setProducts([]);
        localStorage.removeItem('savedShopifyProducts');
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-4 md:p-8">
      <div className="flex justify-between items-center mb-6">
        <button onClick={onBack} className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 font-semibold">
          <Icon name="arrow-left" className="w-5 h-5" />
          Back to Generator
        </button>
        {products.length > 0 && (
            <button onClick={handleClearAll} className="flex items-center gap-2 px-4 py-2 bg-red-800 text-white font-semibold rounded-lg shadow-md hover:bg-red-700 transition-all duration-200">
                <Icon name="trash" className="w-5 h-5" />
                Clear All
            </button>
        )}
      </div>

      <h2 className="text-3xl font-bold text-white mb-8">Saved Products</h2>

      {products.length === 0 ? (
        <div className="text-center py-16 bg-gray-800 rounded-lg">
          <Icon name="archive" className="w-16 h-16 mx-auto text-gray-500" />
          <h3 className="mt-4 text-xl font-semibold text-gray-300">No Saved Products Yet</h3>
          <p className="mt-2 text-gray-500">Generate a product listing and click "Save Product" to see it here.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {products.map((product) => (
            <div key={product.id} className="bg-gray-800 rounded-lg shadow-lg p-4 flex flex-col md:flex-row gap-6 relative group">
              <img src={product.imageUrl} alt={product.productName} className="w-full md:w-32 md:h-32 object-cover rounded-md flex-shrink-0" />
              <div className="flex-grow">
                <h3 className="text-xl font-bold text-white">{product.productName}</h3>
                <p className="text-sm text-gray-400 mt-1">{product.productType} - {product.suggestedPrice}</p>
                <p className="mt-2 text-gray-300 text-sm leading-relaxed">{product.shortDescription}</p>
              </div>
              <button 
                onClick={() => handleDelete(product.id!)} 
                className="absolute top-3 right-3 p-2 bg-gray-700 rounded-full text-gray-400 hover:bg-red-600 hover:text-white transition-all duration-200 opacity-0 group-hover:opacity-100"
                aria-label="Delete product"
              >
                <Icon name="trash" className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};