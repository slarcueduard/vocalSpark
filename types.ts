// src/types.ts

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

export type AppMode = 'creator' | 'business' | 'remix' | 'multi' | 'reply';
export type SubscriptionTier = 'trial' | 'pro' | 'agency';
export type RefinementType = 'makeShorter' | 'makeLonger' | 'professional' | 'casual' | 'addEmojis' | 'addHashtags' | 'askQuestion';
export type PostObjective = 'engagement' | 'sales' | 'education' | 'viral' | 'traffic';
export type ViralHook = 'Straight to the Point' | 'Storytime' | 'Controversial' | 'Behind the Scenes' | 'Myth vs Fact' | 'Transformation' | 'Unpopular Opinion' | 'Day in the Life' | 'Hack / Trick';
export type GenerationType = 'single' | 'campaign' | 'remix' | 'daily_post';
export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  subscriptionTier?: SubscriptionTier;
  credits?: number;
  trialStartDate?: string;
  trialEndDate?: string;
  subscriptionStatus?: 'active' | 'trial' | 'none';
  brandProfile?: BrandProfile;
}

export interface BrandProfile {
  name: string;
  industry: string;
  targetAudience: string;
  language: string;
  voiceDNA: string; // Aici stocăm analiza AI (Ton, Stil etc.)
  toneScore?: number;
  emojiScore?: number;
  lengthScore?: number;
  // Added fields to support BrandProfileModal and GeminiService
  description?: string;
  brandColors?: string[];
  logoUrl?: string | null;
  fixedHashtags?: string;
  links?: string[]; // Up to 2 URLs (website, social profiles, etc.)

  // Granular Preferences
  postLength?: 'short' | 'medium' | 'long';
  detailLevel?: 'minimal' | 'balanced' | 'deep';
  innovationFactor?: 'safe' | 'balanced' | 'unique';
  englishProficiency?: 'basic' | 'intermediate' | 'advanced' | 'native';
  customHooks?: string[]; // Manual/Custom generated hooks
  nicheHooks?: string[]; // Auto-generated hooks based on Voice DNA analysis

  // Founder Mode Fields
  enemy?: string; // What the brand is fighting against
  offer?: string; // What is being sold
  archetype?: 'Rebel' | 'Consultant' | 'Expert' | 'Builder'; // Brand Archetype

  savedTemplates?: { // Saved X-Ray DNA Structures
    id: string;
    name: string;
    structure: string;
    tone: string;
    hook: string;
  }[];
}

export interface TodayPostSettings {
  userId: string;
  brandDnaId: string;
  status: 'active' | 'paused';
  startDate: any;
  lastGeneratedAt: any | null;
  currentTopicThreadId: string | null;
}

export interface TopicThread {
  id: string;
  userId: string;
  brandDnaId: string;
  coreTopic: string;
  narrativeSummary: string;
  sequenceCount: number;
  createdAt: any;
  updatedAt: any;
}

export interface Post {
  id: string;
  content: string;
  imageUrl?: string | null;
  isGeneratingImage?: boolean;
  adaptedContent: Partial<Record<Platform, string>>;
  linkedEventId?: string;
  linkedEventTitle?: string;
  isLocked?: boolean;
  scheduledDate?: any;
  isPublished?: boolean;
  generationType?: GenerationType;
  type?: string;
  isSaved?: boolean;
  parentId?: string; // ID-ul postării originale pentru Follow-up
  platform?: string;
  imagePrompt?: string;
  createdAt?: any; // Firestore Timestamp
  topic?: string;
  xRayAnalysis?: {
    hook_type: string;
    tone_detected: string;
    structure_tag: string;
  };

  // Today's Post Fields
  threadId?: string;
  sequenceNumber?: number;
  userId?: string;
  authorId?: string;
  status?: string;
}

// --- CONFIGURATION & PLANS ---
export interface PlanConfig {
  id: SubscriptionTier;
  name: string;
  price: number;
  credits: number;
  label: string;
  features: string[];
  detailedFeatures: string[]; // Pentru butonul Extend
  highlight?: boolean;
}

export const PLANS: Record<SubscriptionTier, PlanConfig> = {
  trial: {
    id: 'trial',
    name: 'Pro Trial', // Nume nou
    price: 0,
    credits: 150, // Updated: More reasonable trial allocation
    label: '5 Days Full Access',
    features: [
      '1,000 Credits (5 Days)',
      'Full GPT-4o Intelligence',
      'Premium DALL-E 3 Images',
      'Remix Mode Unlocked',
      'Real-Time Data'
    ],
    detailedFeatures: [
      'No Credit Card Required',
      'Test all Agency features',
      'Auto-cancel after 5 days',
      'One-time use per user'
    ]
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: 12.99, // Updated: New entry-level price
    credits: 2000,
    label: 'Standard',
    highlight: true,
    features: [
      '2,000 Credits / mo',
      'Real-Time News (Perplexity)',
      'Premium DALL-E 3 Images',
      '2 Voice Profiles (General + 1 Custom)',
      'GPT-4o Intelligence (Max)'
    ],
    detailedFeatures: [
      'Competitor Analysis',
      'Advanced Remix Formats',
      'Priority GPU Processing',
      '25 Saves in Vault',
      'Early Access to Features'
    ]
  },
  agency: {
    id: 'agency',
    name: 'Agency',
    price: 29.99,
    credits: 5000, // Updated: Reduced from 7000
    label: 'Scale',
    features: [
      '5,000 Credits / mo', // Updated
      'Real-Time News (Perplexity)',
      'Bulk Content Generation',
      '6 Voice Profiles (General + 5 Custom)',
      'Logo Injection'
    ],
    detailedFeatures: [
      '100 Saves in Vault',
      'Commercial Rights Included',
      'Dedicated Account Manager',
      'Team Collaboration (Soon)',
      'API Access (Request)'
    ]
  }
};
