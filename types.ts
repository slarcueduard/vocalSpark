export enum Platform {
  Instagram = 'Instagram',
  TikTok = 'TikTok',
  Facebook = 'Facebook',
  X = 'X',
}

export enum Tone {
  Professional = 'Professional',
  Casual = 'Casual',
  Humorous = 'Humorous',
  Inspirational = 'Inspirational',
}

export interface Post {
  id: string;
  content: string; // The original generated content
  adaptedContent: Partial<Record<Platform, string>>;
  imageUrl: string | null;
  isGeneratingImage: boolean;
}

export type RefinementType = 'makeShorter' | 'addEmojis' | 'askQuestion';
