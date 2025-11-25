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
// ... (celelalte interfețe rămân la fel)

export interface BrandProfile {
  industry: string;
  customIndustry?: string;
  description: string;
  voiceDNA: string;
  language: string; // <--- CÂMP NOU
  websiteUrl?: string;
  socialUrl?: string;
}

// ... (restul fișierului)
// --- TYPES ---
export type AppMode = 'creator' | 'business';

// Updated Subscription Tiers (Trebuie să coincidă cu ce e în PricingModal)
export type SubscriptionTier = 'trial' | 'creator' | 'pro' | 'agency';

// ... (restul enum-urilor rămân la fel)

// ȘTERGEM ViralHook și punem PostObjective
export type PostObjective = 
  | 'engagement' 
  | 'sales' 
  | 'education' 
  | 'viral' 
  | 'traffic';

// ... (Interfețele UserProfile, BrandProfile etc. rămân la fel)

export type RefinementType = 'makeShorter' | 'addEmojis' | 'askQuestion';

// --- INTERFACES ---

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
  trialStartDate?: any;
  credits: number; 
  imageCount?: number; 
  createdAt?: any;
}

export interface CalendarIdea {
  day: number;
  idea: string;
  postType: string;
  hashtags: string;
}

// --- CONFIGURATION & PLANS (Aceasta este partea care lipsea!) ---
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
    features: ['150 Credits', 'Standard Images', 'Basic Text Gen', '1 Brand Voice']
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
      'Platform Optimizer (IG, LI, X)',
      '1 Brand Voice Profile',
      'Viral Hook Templates'
    ]
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: 11.99,
    credits: 2500,
    label: 'Growth',
    highlight: true,
    features: [
      '2,500 Credits / mo',
      'Premium DALL-E 3 Images',
      '3 Brand Voice Profiles',
      'Carousel Wizard (Coming Soon)',
      'Competitor Rewrite'
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
      'Bulk Content Generation',
      'Unlimited Brand Voices',
      'Logo Injection on Images',
      'Priority Support'
    ]
  }
};
