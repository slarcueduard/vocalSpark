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

// --- AM UNIFICAT AICI CELE DOUA DECLARATII ---
// Am schimbat 'id' in 'value' ca sa mearga cu <select>-ul din App.tsx
export const OBJECTIVES = [
  { 
    value: 'engagement', 
    label: '💬 Engagement / Viral', 
    description: 'Ask questions & start conversations.',
    icon: MessageCircle 
  },
  { 
    value: 'sales', 
    label: '💰 Sales / Conversion', 
    description: 'Persuade users to buy or sign up.',
    icon: ShoppingBag 
  },
  { 
    value: 'awareness', 
    label: '📣 Brand Awareness', 
    description: 'Short, punchy & shareable content.',
    icon: Zap 
  },
  { 
    value: 'educational', 
    label: '📚 Value / How-to', 
    description: 'Build trust with tips & guides.',
    icon: BookOpen 
  },
  { 
    value: 'traffic', // Era 'storytelling' inainte, am lasat traffic daca vrei clicks, sau poti pune storytelling
    label: '🔗 Get Clicks / Traffic', 
    description: 'Drive traffic to your link/bio.',
    icon: MousePointerClick 
  }
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

// --- VELOCITY VIBES (Harvey, Wick, Wolf, Moody) ---
export const SUCCESS_MESSAGES = [
  "Boom. Deal closed. 💼", 
  "Clean. Efficient. Dangerous. 🔫", 
  "Sell me this pen? I just wrote the ad for it. 💰", 
  "That's how winning is done. 🍸", 
  "Content so sharp it cuts. 🔪", 
  "Money never sleeps, neither does this AI. 📈", 
  "Executed perfectly. 🎯", 
  "Charming, isn't it? 😉", 
  "Now go make them an offer they can't refuse.",
  "Lunch is for wimps. Post this instead.",
  "A masterpiece. Now monetize it."
];

export const getRandomVibe = () => {
  return SUCCESS_MESSAGES[Math.floor(Math.random() * SUCCESS_MESSAGES.length)];
};
