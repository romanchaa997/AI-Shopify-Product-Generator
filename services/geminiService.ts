

import { GoogleGenAI, Type, Modality, GenerateContentResponse } from "@google/genai";
import type { ProductIdea, GeneratedProduct } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable is not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const productSchema = {
  type: Type.OBJECT,
  properties: {
    productName: { type: Type.STRING, description: 'The catchy and clear product name.' },
    productType: { type: Type.STRING, description: 'The product type (e.g., Digital, Service, Merchandise).' },
    shortDescription: { type: Type.STRING, description: 'A compelling one-sentence summary for the product.' },
    longDescription: { type: Type.STRING, description: 'A detailed product description, formatted with markdown (using headers, bold text, and bullet points) highlighting features, benefits, and target audience. Should be around 150-200 words.' },
    suggestedPrice: { type: Type.STRING, description: 'A suggested price range for the product, based on market analysis of similar products (e.g., $99, $49-$149).' },
    tags: {
      type: Type.ARRAY,
      description: 'An array of 5-7 relevant keywords or tags for Shopify.',
      items: { type: Type.STRING }
    },
  },
  required: ['productName', 'productType', 'shortDescription', 'longDescription', 'suggestedPrice', 'tags']
};

export async function generateImagePrompt(name: string, description: string): Promise<string> {
  const prompt = `You are an expert in creative direction for digital products. Based on the product name and description, create a concise, effective, and visually descriptive image prompt for an AI image generator (like Imagen or Midjourney). 
  The prompt should result in a clean, modern, professional image suitable for a tech-savvy audience, like a logo, icon, or illustration.
  Do not include any explanatory text, labels, or quotation marks. Output only the prompt itself.

  Product Name: "${name}"
  Product Description: "${description}"`;

  try {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });

    return response.text.trim();
  } catch (error) {
    console.error("Error generating image prompt:", error);
    throw new Error("The AI failed to create a concept for the product image.");
  }
}

async function generateProductText(idea: ProductIdea): Promise<Omit<GeneratedProduct, 'imageUrl' | 'marketContext' | 'sources'>> {
  const prompt = `
    You are an expert Shopify e-commerce copywriter specializing in digital products for developers and tech companies.
    Your task is to generate a compelling product listing for a Shopify store based on the following product idea.

    Product Idea Name: "${idea.name}"
    Product Idea Description: "${idea.description}"

    Generate the following fields, adhering to the provided JSON schema. Ensure the tone is professional, knowledgeable, and persuasive for a tech-savvy audience.
    - For the suggestedPrice, analyze the market for similar products and suggest a competitive price range.
    - For the longDescription, use markdown for formatting. It should clearly explain the product's features and MUST include a dedicated section that highlights the specific benefits and positive impact this product will have on its target audience.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-pro',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: productSchema,
    },
  });

  const jsonText = response.text.trim();
  const parsed = JSON.parse(jsonText);
  return parsed as Omit<GeneratedProduct, 'imageUrl' | 'marketContext' | 'sources'>;
}

async function generateProductImage(idea: ProductIdea): Promise<string> {
  const response = await ai.models.generateImages({
    model: 'imagen-4.0-generate-001',
    prompt: idea.imagePrompt,
    config: {
      numberOfImages: 1,
      outputMimeType: 'image/jpeg',
      aspectRatio: '1:1',
    },
  });

  if (response.generatedImages && response.generatedImages.length > 0) {
    return `data:image/jpeg;base64,${response.generatedImages[0].image.imageBytes}`;
  }
  throw new Error("Image generation failed to produce an image.");
}

async function generateMarketContext(idea: ProductIdea): Promise<{ marketContext: string, sources: Array<{ uri: string; title: string; }> }> {
  const prompt = `Based on recent search results, provide a brief, one-paragraph summary of the current market trends and relevance for a product like '${idea.name}'. Focus on why it's a timely product to launch now.`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }],
    },
  });

  const marketContext = response.text;
  const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

  const sources = chunks
    .map((chunk: any) => chunk.web)
    .filter((web: any) => web && web.uri)
    .map((web: any) => ({
      uri: web.uri,
      title: web.title || web.uri,
    }));

  return { marketContext, sources };
}


export async function generateProductListing(idea: ProductIdea): Promise<GeneratedProduct> {
  try {
    const textPromise = generateProductText(idea).catch(error => {
      console.error("Error during text generation:", error);
      throw new Error('The AI failed to generate the product description and details.');
    });
    
    const imagePromise = generateProductImage(idea).catch(error => {
      console.error("Error during image generation:", error);
      throw new Error('The AI failed to create the product mockup image.');
    });

    const marketPromise = generateMarketContext(idea).catch(error => {
      console.error("Error during market context generation:", error);
      throw new Error('The AI failed to analyze current market trends.');
    });
    
    const [textData, imageUrl, marketData] = await Promise.all([
      textPromise,
      imagePromise,
      marketPromise,
    ]);

    return { ...textData, imageUrl, ...marketData };

  } catch (error) {
    console.error("Error generating product listing:", error);
    // Re-throw the specific error from the failed promise
    if (error instanceof Error) {
        throw error;
    }
    throw new Error("An unknown error occurred during product generation.");
  }
}

export async function editProductImage(base64Image: string, prompt: string): Promise<string> {
  const imagePart = {
    inlineData: {
      data: base64Image.split(',')[1],
      mimeType: 'image/jpeg',
    },
  };
  const textPart = {
    text: prompt,
  };

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [imagePart, textPart],
    },
    config: {
      responseModalities: [Modality.IMAGE],
    },
  });

  for (const part of response.candidates?.[0].content.parts || []) {
    if (part.inlineData) {
      return `data:image/jpeg;base64,${part.inlineData.data}`;
    }
  }
  throw new Error("Image editing failed to produce a new image.");
}

export async function transcribeAudio(audioBase64: string, mimeType: string): Promise<string> {
  const audioPart = {
    inlineData: {
      mimeType,
      data: audioBase64,
    },
  };
  const textPart = {
    text: "Transcribe this audio.",
  };

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: { parts: [audioPart, textPart] },
  });

  return response.text;
}