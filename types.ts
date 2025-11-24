// --- ENUMS ---
export enum Platform {
  Instagram = 'Instagram',
  Facebook = 'Facebook',
  X = 'X (Twitter)',
  LinkedIn = 'LinkedIn',
  TikTok = 'TikTok'
}

export enum Tone {
  Inspirational = 'Inspirational',
  Professional = 'Professional',
  Humorous = 'Humorous',
  Educational = 'Educational',
  Casual = 'Casual',
  Urgent = 'Urgent'
}

// --- TYPES ---
export type AppMode = 'creator' | 'business';

export type ViralHook = 
  | 'Straight to the Point'
  | 'Storytime' 
  | 'Controversial' 
  | 'Behind the Scenes' 
  | 'Myth vs Fact' 
  | 'Transformation'
  | 'Unpopular Opinion'
  | 'Day in the Life'
  | 'Hack / Trick';

export type RefinementType = 'makeShorter' | 'addEmojis' | 'askQuestion';

export type SubscriptionTier = 'trial' | 'creator' | 'business';

// --- INTERFACES ---

// Aceasta este interfața care lipsea și dădea eroare
export interface BrandProfile {
  industry: string;
  customIndustry?: string;
  description: string;
  voiceDNA: string;
  websiteUrl?: string;
  socialUrl?: string;
}

export interface Post {
  id: string;
  content: string;
  imageUrl?: string | null;
  isGeneratingImage?: boolean;
  adaptedContent: Partial<Record<Platform, string>>;
  isLocked?: boolean;
}

export interface UserProfile {
  uid: string;
  email: string | null;
  subscriptionTier: SubscriptionTier;
  subscriptionStatus: 'active' | 'expired' | 'cancelled';
  trialStartDate: any; // Firestore Timestamp
  imageCount: number;
  imageLimit: number;
  createdAt?: any;
}

export interface CalendarIdea {
  day: number;
  idea: string;
  postType: string;
  hashtags: string;
}
