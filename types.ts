// src/types.ts

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

export type SubscriptionTier = 'trial' | 'creator' | 'pro' | 'agency';

export type RefinementType = 'makeShorter' | 'addEmojis' | 'askQuestion' | 'formal';

export type PostObjective = 
  | 'engagement' 
  | 'sales' 
  | 'education' 
  | 'viral' 
  | 'traffic';

// --- INTERFACES ---

export interface BrandProfile {
  industry: string;
  customIndustry?: string;
  description: string;
  voiceDNA: string; 
  language: string;
  websiteUrl?: string;
  socialUrl?: string;
  examplePosts?: string;
  fixedHashtags?: string;
  brandColors?: string[]; 
  logoUrl?: string | null;
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
  trialStartDate?: any;
  credits: number; 
  imageCount?: number; 
  createdAt?: any;
}

// --- CONFIGURATION & PLANS ---
export interface PlanConfig {
  id: SubscriptionTier;
  name: string;
  price: number;
  credits: number;
  label: string;
  features: string[];
  highlight?: boolean;
}

export const PLANS: Record<SubscriptionTier, PlanConfig> = {
  trial: {
    id: 'trial',
    name: 'Free Trial',
    price: 0,
    credits: 150,
    label: '5 Days Free',
    features: ['150 Credits', 'GPT-4o Intelligence', 'Standard Images', '1 Brand Voice']
  },
  creator: {
    id: 'creator',
    name: 'Creator',
    price: 4.99,
    credits: 600,
    label: 'Starter',
    features: [
      '600 Credits / mo',
      'Standard AI Images (Fast)',
      'Platform Optimizer',
      '1 Brand Voice Profile',
      'Access to GPT-4o Mini'
    ]
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: 11.99,
    credits: 2000, // ROI OPTIMIZAT (Era 2500)
    label: 'Growth',
    highlight: true,
    features: [
      '2,000 Credits / mo',
      'Real-Time News (Perplexity)',
      'Premium DALL-E 3 Images',
      '3 Brand Voice Profiles',
      'GPT-4o Intelligence'
    ]
  },
  agency: {
    id: 'agency',
    name: 'Agency',
    price: 29.99,
    credits: 7000,
    label: 'Scale',
    features: [
      '7,000 Credits / mo',
      'Real-Time News (Perplexity)',
      'Bulk Content Generation',
      'Unlimited Brand Voices',
      'Logo Injection'
    ]
  }
};
