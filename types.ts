
export enum Platform {
  Instagram = 'Instagram',
  TikTok = 'TikTok',
  Facebook = 'Facebook',
  X = 'X',
  LinkedIn = 'LinkedIn'
}

export enum Tone {
  Professional = 'Professional',
  Casual = 'Casual',
  Humorous = 'Humorous',
  Inspirational = 'Inspirational',
  Controversial = 'Controversial',
  Empathetic = 'Empathetic'
}

export type AppMode = 'creator' | 'business';

export type ViralHook = 
    | 'Storytime' 
    | 'Controversial' 
    | 'Behind the Scenes' 
    | 'Myth vs Fact' 
    | 'Transformation'
    | 'Unpopular Opinion'
    | 'Day in the Life'
    | 'Hack / Trick'
    | 'Straight to the Point';

export interface Post {
  id: string;
  content: string; // The original generated content
  adaptedContent: Partial<Record<Platform, string>>;
  imageUrl: string | null;
  isGeneratingImage: boolean;
  isLocked?: boolean; // For the "Keep" functionality
}

export type RefinementType = 'makeShorter' | 'addEmojis' | 'askQuestion';

export interface CalendarIdea {
  day: number;
  idea: string;
  postType: string;
  hashtags: string;
}

export interface BrandProfile {
  industry: string;
  customIndustry?: string;
  websiteUrl: string;
  socialUrl: string;
  description: string;
  logoUrl?: string; // New field for logo asset
  voiceDNA?: string; // The analyzed style instructions
  examplePosts?: string; // The raw text used for training
}

// Represents the user's data stored in Firestore
export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  trialStartDate: string; // ISO string format
  trialEndDate: string; // ISO string format
  subscriptionStatus: 'none' | 'trial' | 'active';
  brandProfile?: BrandProfile;
}
