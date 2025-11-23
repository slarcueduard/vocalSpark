import { Platform, Tone } from './types';

export const PLATFORMS = [
  { value: Platform.Instagram, label: 'Instagram' },
  { value: Platform.TikTok, label: 'TikTok' },
  { value: Platform.Facebook, label: 'Facebook' },
  { value: Platform.X, label: 'X (Twitter)' },
];

export const TONES = [
  { value: Tone.Professional, label: 'Professional' },
  { value: Tone.Casual, label: 'Casual' },
  { value: Tone.Humorous, label: 'Humorous' },
  { value: Tone.Inspirational, label: 'Inspirational' },
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