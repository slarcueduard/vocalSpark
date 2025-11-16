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

export const ENHANCEMENT_STYLES = [
  { value: 'Subtle Enhance', label: 'Subtle Enhance' },
  { value: 'Portrait Pop', label: 'Portrait Pop' },
  { value: 'Vibrant Scenery', label: 'Vibrant Scenery' },
  { value: 'Product Pro', label: 'Product Pro' },
];

export const ARTISTIC_STYLES = [
  { value: 'Cyberpunk', label: 'Cyberpunk' },
  { value: 'Vintage Film', label: 'Vintage Film' },
  { value: 'Watercolor Painting', label: 'Watercolor' },
  { value: 'Pixar Animation', label: 'Pixar Animation' },
  { value: 'Fantasy Art', label: 'Fantasy Art' },
  { value: 'Gothic Noir', label: 'Gothic Noir' },
  { value: 'Pop Art', label: 'Pop Art' },
  { value: 'Minimalist Line Art', label: 'Line Art' },
];
