import React, { useState, useRef, useEffect } from 'react';
import type { GeneratedProduct } from '../types';
import { Icon } from './Icon';
import { editProductImage, transcribeAudio } from '../services/geminiService';

interface ResultViewProps {
  product: GeneratedProduct;
  onBack: () => void;
}

const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64data = reader.result as string;
        // remove data:audio/webm;base64, prefix
        resolve(base64data.split(',')[1]);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
};

const CopyableField: React.FC<{ label: string; value: string; isMarkdown?: boolean; className?: string }> = ({ label, value, isMarkdown, className }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className={`mb-6 ${className}`}>
            <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-semibold text-gray-300">{label}</h3>
                <button onClick={handleCopy} className="text-gray-400 hover:text-white transition-colors text-sm flex items-center gap-1">
                    <Icon name="copy" className="w-4 h-4" />
                    {copied ? 'Copied!' : 'Copy'}
                </button>
            </div>
            {isMarkdown ? (
                 <pre className="whitespace-pre-wrap bg-gray-900 p-4 rounded-md text-gray-200 font-sans text-sm">{value}</pre>
            ) : (
                <p className="bg-gray-900 p-4 rounded-md text-gray-200">{value}</p>
            )}
        </div>
    );
};

export const ResultView: React.FC<ResultViewProps> = ({ product, onBack }) => {
  const [currentImageUrl, setCurrentImageUrl] = useState(product.imageUrl);
  const [isRemixing, setIsRemixing] = useState(false);
  const [remixPrompt, setRemixPrompt] = useState('');
  const [error, setError] = useState<string | null>(null);

  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const [isSaved, setIsSaved] = useState(false);

  // Auto-save remix prompt to local storage
  useEffect(() => {
    // Load saved prompt on mount
    const savedPrompt = localStorage.getItem('remixPromptAutoSave');
    if (savedPrompt) {
      setRemixPrompt(savedPrompt);
    }
    // Clear saved prompt on unmount
    return () => {
      localStorage.removeItem('remixPromptAutoSave');
    };
  }, []);

  // Save prompt to local storage on change
  useEffect(() => {
    if (remixPrompt) {
      localStorage.setItem('remixPromptAutoSave', remixPrompt);
    } else {
      // If user clears input, remove from storage
      localStorage.removeItem('remixPromptAutoSave');
    }
  }, [remixPrompt]);


  const handleRemix = async () => {
    if (!remixPrompt.trim()) return;
    setIsRemixing(true);
    setError(null);
    try {
      const newImageUrl = await editProductImage(currentImageUrl, remixPrompt);
      setCurrentImageUrl(newImageUrl);
      setRemixPrompt(''); // Clear prompt on success, which also clears localStorage via useEffect
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to edit image.');
    } finally {
      setIsRemixing(false);
    }
  };

  const handleStartRecording = async () => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.addEventListener("dataavailable", event => {
            audioChunksRef.current.push(event.data);
        });

        mediaRecorder.addEventListener("stop", async () => {
            setIsTranscribing(true);
            setError(null);
            const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
            try {
                const audioBase64 = await blobToBase64(audioBlob);
                const transcribedText = await transcribeAudio(audioBase64, 'audio/webm');
                setRemixPrompt(transcribedText);
            } catch (err) {
                 setError(err instanceof Error ? err.message : 'Failed to transcribe audio.');
            } finally {
                setIsTranscribing(false);
            }
        });

        mediaRecorder.start();
        setIsRecording(true);
    } catch (err) {
        setError("Microphone access was denied. Please allow access in your browser settings.");
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
        setIsRecording(false);
    }
  };

  const handleMicButtonClick = () => {
    if (isRecording) {
        handleStopRecording();
    } else {
        handleStartRecording();
    }
  };
  
  const handleSave = () => {
    try {
      const savedProductsRaw = localStorage.getItem('savedShopifyProducts');
      const savedProducts: GeneratedProduct[] = savedProductsRaw ? JSON.parse(savedProductsRaw) : [];
      
      const productToSave = { ...product, id: `prod_${Date.now()}`, imageUrl: currentImageUrl };

      savedProducts.unshift(productToSave);
      
      localStorage.setItem('savedShopifyProducts', JSON.stringify(savedProducts));
      
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    } catch (e) {
      console.error("Failed to save product to local storage", e);
      setError("Failed to save product. Local storage might be full or disabled.");
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-4 md:p-8">
       <div className="flex justify-between items-center mb-6">
            <button onClick={onBack} className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 font-semibold">
                <Icon name="arrow-left" className="w-5 h-5" />
                Back to Products
            </button>
            <button 
                onClick={handleSave}
                disabled={isSaved}
                className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-white font-semibold rounded-lg shadow-md hover:bg-gray-600 transition-all duration-200 disabled:opacity-70 disabled:bg-green-600"
            >
                <Icon name="bookmark" className="w-5 h-5" />
                {isSaved ? 'Saved!' : 'Save Product'}
            </button>
       </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Image & Remix */}
        <div className="flex flex-col">
           <h2 className="text-3xl font-bold text-white mb-4 lg:hidden">{product.productName}</h2>
           <div className="aspect-square bg-gray-800 rounded-lg overflow-hidden shadow-lg relative">
                <img src={currentImageUrl} alt={product.productName} className="w-full h-full object-cover" />
                 {(isRemixing || isTranscribing) && (
                    <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center">
                        <div className="w-12 h-12 border-2 border-dashed rounded-full animate-spin border-cyan-400"></div>
                        <span className="absolute text-sm text-white">{isTranscribing ? 'Transcribing...' : 'Remixing...'}</span>
                    </div>
                )}
           </div>
           
           {/* Remix Controls */}
           <div className="mt-4 p-4 bg-gray-800 rounded-lg">
                <h3 className="text-md font-semibold text-gray-200 mb-2">Remix Image</h3>
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={remixPrompt}
                        onChange={(e) => setRemixPrompt(e.target.value)}
                        placeholder="e.g., Make the background blue"
                        className="flex-grow bg-gray-900 border border-gray-700 text-white rounded-md px-3 py-2 focus:ring-cyan-500 focus:border-cyan-500"
                        disabled={isRemixing || isRecording}
                    />
                     <button
                        onClick={handleMicButtonClick}
                        className={`px-3 py-2 rounded-md transition-colors ${isRecording ? 'bg-red-600 hover:bg-red-700' : 'bg-cyan-600 hover:bg-cyan-700'} disabled:opacity-50`}
                        disabled={isRemixing || isTranscribing}
                    >
                        <Icon name="microphone" className="w-5 h-5 text-white" />
                    </button>
                    <button
                        onClick={handleRemix}
                        className="px-4 py-2 bg-cyan-600 text-white font-semibold rounded-lg shadow-md hover:bg-cyan-700 transition-all duration-200 disabled:opacity-50"
                        disabled={isRemixing || !remixPrompt || isRecording}
                    >
                       Remix
                    </button>
                </div>
                {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
           </div>


           <div className="mt-4">
                <h3 className="text-lg font-semibold text-gray-300 mb-2">Tags</h3>
                <div className="flex flex-wrap gap-2">
                    {product.tags.map(tag => (
                        <span key={tag} className="bg-gray-700 text-gray-300 text-xs font-medium px-2.5 py-1 rounded-full">{tag}</span>
                    ))}
                </div>
           </div>
        </div>

        {/* Right Column: Details */}
        <div>
            <h2 className="text-3xl font-bold text-white mb-6 hidden lg:block">{product.productName}</h2>
            <CopyableField label="Product Type" value={product.productType} />
            <CopyableField label="Suggested Price" value={product.suggestedPrice} />
            <CopyableField label="Short Description" value={product.shortDescription} />
            <CopyableField label="Long Description" value={product.longDescription} isMarkdown />

            {product.marketContext && (
              <div className="mt-2 pt-6 border-t border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-300 mb-2">Current Market Context</h3>
                  <p className="bg-gray-900 p-4 rounded-md text-gray-200 text-sm">{product.marketContext}</p>
                  
                  {product.sources && product.sources.length > 0 && (
                      <div className="mt-4">
                          <h4 className="text-md font-semibold text-gray-400 mb-2">Sources:</h4>
                          <ul className="list-disc list-inside space-y-1 pl-1">
                              {product.sources.map((source, index) => (
                                  <li key={index}>
                                      <a 
                                          href={source.uri} 
                                          target="_blank" 
                                          rel="noopener noreferrer" 
                                          className="text-cyan-400 hover:underline text-sm"
                                          title={source.uri}
                                      >
                                          {source.title}
                                      </a>
                                  </li>
                              ))}
                          </ul>
                      </div>
                  )}
              </div>
            )}
        </div>
      </div>
    </div>
  );
};