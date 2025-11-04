import React, { useState, useCallback } from 'react';
import { generateProductListing } from './services/geminiService';
import type { ProductIdea, GeneratedProduct } from './types';
import { ProductSelection } from './components/AspectRatioSelector';
import { ResultView } from './components/FullScreenView';
import { SavedProductsView } from './components/SavedProductsView';
import { PQCReadinessView } from './components/PQCReadinessView';
import { Icon } from './components/Icon';
import { AuthControls } from './components/AuthControls';

type ViewState = 'list' | 'result' | 'saved' | 'pqc';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('list');
  const [generatedProduct, setGeneratedProduct] = useState<GeneratedProduct | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = useCallback(async (idea: ProductIdea) => {
    setIsGenerating(true);
    setError(null);
    setGeneratedProduct(null);

    try {
      const product = await generateProductListing(idea);
      setGeneratedProduct(product);
      setView('result');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      setView('list'); // Go back to list on error
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const handleBackToList = () => {
    setView('list');
    setGeneratedProduct(null);
  };

  const handleViewSaved = () => {
    setView('saved');
    setError(null);
  };

  const renderContent = () => {
    switch (view) {
      case 'result':
        return generatedProduct && <ResultView product={generatedProduct} onBack={handleBackToList} />;
      case 'saved':
        return <SavedProductsView onBack={handleBackToList} />;
      case 'pqc':
        return <PQCReadinessView onBack={handleBackToList} />;
      case 'list':
      default:
        return <ProductSelection onSelectProduct={handleGenerate} isGenerating={isGenerating} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
       <header className="text-center p-4 border-b border-gray-800 shadow-md bg-gray-900/80 backdrop-blur-sm sticky top-0 z-10 flex justify-between items-center">
        <div className="flex-1 text-left flex items-center gap-2">
           <button 
                onClick={handleViewSaved}
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-700/50 text-gray-300 font-semibold rounded-lg shadow-sm hover:bg-gray-700 transition-all duration-200"
                title="View Saved Products"
            >
                <Icon name="archive" className="w-5 h-5" />
                <span className="hidden sm:inline">Saved</span>
            </button>
            <button 
                onClick={() => setView('pqc')}
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-700/50 text-gray-300 font-semibold rounded-lg shadow-sm hover:bg-gray-700 transition-all duration-200"
                title="View PQC Readiness Audit"
            >
                <Icon name="shield-check" className="w-5 h-5" />
                <span className="hidden sm:inline">PQC Audit</span>
            </button>
        </div>
        <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">
          AI Shopify Product Generator
        </h1>
        <div className="flex-1 text-right">
            <AuthControls />
        </div>
      </header>

      <main className="flex-grow container mx-auto px-4 py-8 md:py-12 flex flex-col items-center justify-center">
        {error && !isGenerating && (
            <div className="w-full max-w-4xl mx-auto mb-4 text-center text-red-400 bg-red-900 bg-opacity-50 p-3 rounded-lg">
                <p><strong>Generation Failed:</strong> {error}</p>
                <p>Please try again. If the problem persists, check the console for more details.</p>
            </div>
        )}
        {renderContent()}
      </main>

      <footer className="w-full text-center p-4 mt-8 border-t border-gray-800 text-xs text-gray-500">
        <p>Built with the Gemini API. Images and text are AI-generated.</p>
        <div className="flex justify-center gap-4 mt-2">
            <a href="#" className="hover:text-cyan-400 transition-colors">Suggest a Feature</a>
            <span className="text-gray-700">|</span>
            <a href="#" className="hover:text-cyan-400 transition-colors">Support the Project</a>
             <span className="text-gray-700">|</span>
            <a href="#" className="hover:text-cyan-400 transition-colors">Privacy Note</a>
        </div>
      </footer>
    </div>
  );
};

export default App;