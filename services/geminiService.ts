import { GoogleGenerativeAI } from "@google/generative-ai";
import { Post, Tone, Platform, RefinementType, CalendarIdea, BrandProfile } from "../types";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey || "MISSING_KEY");

// --- 1. IMAGINI (Pollinations) ---
export async function generateImageForPost(postText: string, brandProfile?: BrandProfile): Promise<string> {
  await new Promise(r => setTimeout(r, 1000));
  const cleanPrompt = encodeURIComponent(postText.substring(0, 100));
  const seed = Math.floor(Math.random() * 1000);
  return `https://image.pollinations.ai/prompt/${cleanPrompt}?width=1080&height=1080&nologo=true&seed=${seed}&model=flux`;
}

export async function generateImageVariation(base64ImageData: string, mimeType: string, style: string): Promise<string> {
  await new Promise(r => setTimeout(r, 1500));
  const cleanStyle = encodeURIComponent(style + " artistic style");
  const seed = Math.floor(Math.random() * 1000);
  return `https://image.pollinations.ai/prompt/${cleanStyle}?width=1080&height=1080&nologo=true&seed=${seed}&model=flux`;
}

// --- 2. LOGO ---
export type LogoPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
export async function overlayLogoOnImage(mainImageUrl: string, logoUrl: string, position: LogoPosition = 'top-left', removeBg: boolean = false): Promise<string> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const mainImg = new Image();
    const logoImg = new Image();
    mainImg.crossOrigin = "Anonymous"; logoImg.crossOrigin = "Anonymous";
    mainImg.onload = () => {
      canvas.width = mainImg.width; canvas.height = mainImg.height;
      ctx?.drawImage(mainImg, 0, 0);
      logoImg.onload = () => {
        if (ctx) {
          const logoWidth = canvas.width * 0.20;
          const scaleFactor = logoWidth / logoImg.width;
          const logoHeight = logoImg.height * scaleFactor;
          const padding = canvas.width * 0.05;
          let x = padding, y = padding;
          switch (position) {
              case 'top-left': x = padding; y = padding; break;
              case 'top-right': x = canvas.width - logoWidth - padding; y = padding; break;
              case 'bottom-left': x = padding; y = canvas.height - logoHeight - padding; break;
              case 'bottom-right': x = canvas.width - logoWidth - padding; y = canvas.height - logoHeight - padding; break;
          }
          ctx.shadowColor = "rgba(0,0,0,0.5)"; ctx.shadowBlur = 15;
          ctx.drawImage(logoImg, x, y, logoWidth, logoHeight);
          resolve(canvas.toDataURL('image/png'));
        }
      };
      logoImg.src = logoUrl;
    };
    mainImg.src = mainImageUrl;
  });
}

// --- 3. TEXT (Gemini 1.5 Flash 001) ---
export async function generateSocialMediaPosts(
  topic: string,
  tone: Tone,
  postCount: number,
  language: string,
  brandVoice: string,
  brandProfile?: BrandProfile,
  imageBase64?: string,
  imageMimeType?: string
): Promise<Omit<Post, 'id' | 'imageUrl' | 'isGeneratingImage' | 'adaptedContent'>[]> {
  
  if (!apiKey) return [{ content: "API Key Missing." }];
  
  // Modelul Stabil
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-001" });
  
  let userPrompt = `
  TASK: Write ${postCount} posts about: "${topic}".
  TONE: ${tone}.
  LANGUAGE: ${language}.
  OUTPUT: JSON Array. [{"content": "..."}]
  `;

  if (brandVoice) userPrompt += `\nSTYLE: ${brandVoice}`;

  try {
    const parts: any[] = [];
    if (imageBase64 && imageMimeType) {
        parts.push({ inlineData: { data: imageBase64, mimeType: imageMimeType } });
        userPrompt += `\nCONTEXT: Describe the image.`;
    }
    parts.push({ text: userPrompt });

    const result = await model.generateContent(parts);
    const response = await result.response;
    let text = response.text();
    if (!text) return [];

    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(text);
    if(Array.isArray(parsed)) return parsed.map((p: any) => ({ content: p.content || p }));
    return [];

  } catch (e: any) {
    console.error("Text gen failed", e);
    return [{ content: `Error: ${e.message}` }];
  }
}

// --- HELPER FUNCTIONS ---
export function fileToBase64(file: File): Promise<{mimeType: string, data: string}> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve({ mimeType: (reader.result as string).split(';')[0].split(':')[1], data: (reader.result as string).split(',')[1] });
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function adaptPostForPlatform(originalContent: string, platform: Platform): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-001" });
    const result = await model.generateContent(`Adapt for ${platform}:\n"${originalContent}"`);
    return result.response.text();
  } catch (e) { return originalContent; }
}

export async function refinePostContent(content: string, type: RefinementType): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-001" });
    const result = await model.generateContent(`Rewrite (${type}): "${content}"`);
    return result.response.text();
  } catch (e) { return content; }
}

// CRITIC: Această funcție lipsea sau era scrisă greșit și cauza eroarea de build
export async function analyzeBrandVoice(sampleText: string): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-001" });
    const result = await model.generateContent(`Analyze style: "${sampleText}"`);
    return result.response.text();
  } catch (e) { return ""; }
}
