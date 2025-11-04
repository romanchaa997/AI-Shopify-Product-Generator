export interface ProductIdea {
  id: string;
  name: string;
  description: string;
  imagePrompt: string;
}

export interface GeneratedProduct {
  id?: string;
  productName: string;
  productType: string;
  shortDescription: string;
  longDescription: string;
  suggestedPrice: string;
  tags: string[];
  imageUrl: string;
  marketContext: string;
  sources: Array<{ uri: string; title: string; }>;
}

export interface CryptoAsset {
  id: string;
  name: string;
  symbol: string;
  pqcStatus: 'Migrated' | 'Pending' | 'Vulnerable';
}