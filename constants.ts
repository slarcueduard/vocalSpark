import { Platform, Tone, PostObjective } from './types';
import { MessageCircle, ShoppingBag, BookOpen, Zap, MousePointerClick } from 'lucide-react';

export const PLATFORMS = [
  { value: Platform.Instagram, label: 'Instagram' },
  { value: Platform.Facebook, label: 'Facebook' },
  { value: Platform.X, label: 'X (Twitter)' },
  { value: Platform.LinkedIn, label: 'LinkedIn' },
  { value: Platform.TikTok, label: 'TikTok Script' }
];
export const TONES = [
  { value: Tone.Inspirational, label: '✨ Inspirational' },
  { value: Tone.Professional, label: '👔 Professional' },
  { value: Tone.Humorous, label: '🤪 Humorous & Witty' },
  { value: Tone.Educational, label: '📚 Educational' },
  { value: Tone.Casual, label: '☕ Casual & Friendly' },
  { value: Tone.Urgent, label: '🔥 Urgent / FOMO' }
];

export const PERSON_STYLES = [
  { value: 'Face Retouch', label: 'Face Retouch' },
  { value: 'Sharpen Portrait', label: 'Sharpen Portrait' },
  { value: 'Portrait Pop', label: 'Portrait Pop' },
  { value: 'Studio Lighting', label: 'Studio Lighting' },
];

export const ENHANCEMENT_STYLES = [
  { value: 'Subtle Enhance', label: 'Subtle Enhance' },
  { value: 'Vibrant Scenery', label: 'Vibrant Scenery' },
  { value: 'Product Pro', label: 'Product Pro' },
];

export const ARTISTIC_STYLES = [
  { value: 'Neon Noir', label: 'Neon Noir (Wick Mode)' },
  { value: 'Cyberpunk', label: 'Cyberpunk' },
  { value: 'Vintage Film', label: 'Vintage Film' },
  { value: 'Watercolor Painting', label: 'Watercolor' },
  { value: 'Pixar Animation', label: 'Pixar Animation' },
  { value: 'Fantasy Art', label: 'Fantasy Art' },
  { value: 'Gothic Noir', label: 'Gothic Noir' },
  { value: 'Pop Art', label: 'Pop Art' },
  { value: 'Minimalist Line Art', label: 'Line Art' },
];

export const INDUSTRIES = [
  'Real Estate',
  'Tech / SaaS',
  'Hospitality (Hotel, Restaurant)',
  'E-commerce / Retail',
  'Health & Wellness',
  'Finance & Investing',
  'Marketing & Agency',
  'Education',
  'Other'
];

export const OBJECTIVES: { id: PostObjective; label: string; description: string; icon: any }[] = [
  { 
    id: 'engagement', 
    label: 'Get Comments', 
    description: 'Ask questions & start conversations.',
    icon: MessageCircle 
  },
  { 
    id: 'sales', 
    label: 'Sell Product', 
    description: 'Persuade users to buy or sign up.',
    icon: ShoppingBag 
  },
  { 
    id: 'education', 
    label: 'Teach Value', 
    description: 'Build trust with tips & guides.',
    icon: BookOpen 
  },
  { 
    id: 'viral', 
    label: 'Go Viral', 
    description: 'Short, punchy & shareable content.',
    icon: Zap 
  },
  { 
    id: 'traffic', 
    label: 'Get Clicks', 
    description: 'Drive traffic to your link/bio.',
    icon: MousePointerClick 
  }
];
