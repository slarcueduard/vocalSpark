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

export type AppMode = 'creator' | 'business' | 'remix';
export type SubscriptionTier = 'trial' | 'creator' | 'pro' | 'agency';
export type RefinementType = 'makeShorter' | 'addEmojis' | 'askQuestion' | 'formal';
export type PostObjective = 'engagement' | 'sales' | 'education' | 'viral' | 'traffic';
export type GenerationType = 'single' | 'campaign' | 'remix';

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
  scheduledDate?: any;
  isPublished?: boolean;
  generationType?: GenerationType; 
  type?: string; 
  isSaved?: boolean;
}

export interface UserProfile {
  uid: string;
  email: string | null;
  subscriptionTier: SubscriptionTier;
  subscriptionStatus: 'active' | 'expired' | 'cancelled' | 'lifetime';
  trialStartDate?: any;
  credits: number; 
  imageCount?: number; 
  createdAt?: any;
  isFounder?: boolean;
}

// --- PRICING CONFIGURATION ---
export interface PlanConfig {
  id: SubscriptionTier;
  name: string;
  price: number;
  credits: number;
  label: string;
  features: string[]; // Lista scurtă (ce se vede imediat)
  detailedFeatures: string[]; // Lista extinsă (la expand)
  highlight?: boolean;
}

export const PLANS: Record<SubscriptionTier, PlanConfig> = {
  trial: {
    id: 'trial',
    name: 'Free Trial',
    price: 0,
    credits: 150,
    label: '5 Days Free',
    features: ['150 Credits', 'GPT-4o Experience', 'Standard Images', '1 Brand Voice'],
    detailedFeatures: []
  },
  creator: {
    id: 'creator',
    name: 'Creator',
    price: 4.99,
    credits: 600,
    label: 'Starter',
    features: [
      '600 Credits / mo',
      'Standard AI Images (Unlimited Speed)',
      'Platform Optimizer',
      '1 Brand Voice Profile',
      'GPT-4o Mini (Fast)'
    ],
    detailedFeatures: [
      'Ideal for Side-Hustlers',
      'Remix Content (Basic)',
      'Standard Support',
      'No Watermark',
      'Cancel Anytime'
    ]
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: 11.99,
    credits: 2000,
    label: 'Growth',
    highlight: true,
    features: [
      '2,000 Credits / mo',
      'Real-Time News (Perplexity)',
      'Premium DALL-E 3 Images',
      '3 Brand Voice Profiles',
      'GPT-4o Intelligence'
    ],
    detailedFeatures: [
      'Best for Influencers',
      'Competitor Analysis',
      'Advanced Remix Modes (Threads/Scripts)',
      'Priority GPU Processing',
      'New Features Early Access'
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
    ],
    detailedFeatures: [
      'Best for SMM & Agencies',
      'Content Calendar Strategy',
      'Commercial Rights Included',
      'Dedicated Support Line',
      'Team Features (Coming Soon)'
    ]
  }
};
