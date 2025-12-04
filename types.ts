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
  name: string;
  industry: string;
  targetAudience: string;
  language: string;
  voiceDNA: string; // Aici stocăm analiza AI (Ton, Stil etc.)
  // Opțional, poți adăuga și astea pentru viitor, dar nu e obligatoriu acum:
  // toneScore?: number;
  // logoUrl?: string;
  // brandColors?: string[];
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
    credits: 1000, // Upgrade masiv la 1000
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
      'GPT-4o Mini (Standard)'
    ],
    detailedFeatures: [
      'Ideal for solopreneurs',
      'No Watermark',
      'Basic Remixing',
      'Email Support',
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
      'GPT-4o Intelligence (Max)'
    ],
    detailedFeatures: [
      'Competitor Analysis',
      'Advanced Remix Formats',
      'Priority GPU Processing',
      'Unlimited History Vault',
      'Early Access to Features'
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
      'Strategic Content Calendar',
      'Commercial Rights Included',
      'Dedicated Account Manager',
      'Team Collaboration (Soon)',
      'API Access (Request)'
    ]
  }
};
