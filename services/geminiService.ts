import { GoogleGenAI } from "@google/genai";
import { Post, Tone, Platform, RefinementType, CalendarIdea, BrandProfile } from "../types";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
// Initializare safe
const ai = new GoogleGenAI({ apiKey: apiKey || "MISSING_KEY" });

// --- 1. GENERARE IMAGINI (Pollinations - Gratis & Stabil) ---
export async function generateImageForPost(postText: string, brandProfile?: BrandProfile): Promise<string> {
  console.log("Generating image via Fallback...");
  await new Promise(r => setTimeout(r, 1000));
  
  const cleanPrompt = encodeURIComponent(postText.substring(0, 100));
  const seed = Math.floor(Math.random() * 1000);
  return `https://image.pollinations.ai/prompt/${cleanPrompt}?width=1080&height=1080&nologo=true&seed=${seed}`;
}

export async function generateImageVariation(base64ImageData: string, mimeType: string, style: string): Promise<string> {
  console.log("Generating variation via Fallback...");
  await new Promise(r => setTimeout(r, 1500));
  
  const cleanStyle = encodeURIComponent(style + " style artistic image");
  const seed = Math.floor(Math.random() * 1000);
  return `https://image.pollinations.ai/prompt/${cleanStyle}?width=1080&height=1080&nologo=true&seed=${seed}`;
}

// --- 2. LOGO OVERLAY (Aceasta este funcția care LIPSEA) ---
export type LogoPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

export async function overlayLogoOnImage(
  mainImageUrl: string, 
  logoUrl: string, 
  position: LogoPosition = 'top-left',
  removeBg: boolean = false
): Promise<string> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const mainImg = new Image();
    const logoImg = new Image();

    mainImg.crossOrigin = "Anonymous";
    logoImg.crossOrigin = "Anonymous";

    mainImg.onload = () => {
      canvas.width = mainImg.width;
      canvas.height = mainImg.height;
      ctx?.drawImage(mainImg, 0, 0);

      logoImg.onload = () => {
        if (ctx) {
          const logoWidth = canvas.width * 0.20;
          const scaleFactor = logoWidth / logoImg.width;
          const logoHeight = logoImg.height * scaleFactor;
          const padding = canvas.width * 0.05;
          let x = padding;
          let y = padding;

          switch (position) {
              case 'top-left': x = padding; y = padding; break;
              case 'top-right': x = canvas.width - logoWidth - padding; y = padding; break;
              case 'bottom-left': x = padding; y = canvas.height - logoHeight - padding; break;
              case 'bottom-right': x = canvas.width - logoWidth - padding; y = canvas.height - logoHeight - padding; break;
          }
          ctx.shadowColor = "rgba(0,0,0,0.5)";
          ctx.shadowBlur = 15;
          ctx.drawImage(logoImg, x, y, logoWidth, logoHeight);
          resolve(canvas.toDataURL('image/png'));
        }
      };
      logoImg.onerror = (e) => reject(e);
      logoImg.src = logoUrl;
    };
    mainImg.onerror = (e) => reject(e);
    mainImg.src = mainImageUrl;
  });
}

// --- 3. TEXT (Google Gemini) ---
export async function generateSocialMediaPosts(
  topic: string,
  tone: Tone,
  postCount: number,
  language: string,
  brandVoice: string,
  brandProfile?: BrandProfile
): Promise<Omit<Post, 'id' | 'imageUrl' | 'isGeneratingImage' | 'adaptedContent'>[]> {
  if (!apiKey) throw new Error("API Key missing");
  
  const model = 'gemini-2.0-flash';
  let prompt = `Generate ${postCount} social media posts about "${topic}". Tone: ${tone}. Language: ${language}. Return ONLY a JSON array with objects containing a 'content' field.`;
  
  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    
    const parsed = JSON.parse(response.text() || "[]");
    if(Array.isArray(parsed)) return parsed.map((p: any) => ({ content: p.content || p }));
    return [];
  } catch (e) {
    console.error("Text generation failed", e);
    throw new Error("Failed to generate text.");
  }
}

export function fileToBase64(file: File): Promise<{mimeType: string, data: string}> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve({ mimeType: (reader.result as string).split(';')[0].split(':')[1], data: (reader.result as string).split(',')[1] });
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function adaptPostForPlatform(originalContent: string, platform: Platform): Promise<string> {
  const response = await ai.models.generateContent({ model: 'gemini-2.0-flash', contents: `Adapt for ${platform}: ${originalContent}` });
  return response.text() || "";
}

export async function refinePostContent(content: string, type: RefinementType): Promise<string> {
  const response = await ai.models.generateContent({ model: 'gemini-2.0-flash', contents: `Refine (${type}): ${content}` });
  return response.text() || "";
}

export async function analyzeBrandVoice(sampleText: string): Promise<string> {
    const response = await ai.models.generateContent({ model: 'gemini-2.0-flash', contents: `Analyze voice: ${sampleText}` });
    return response.text() || "";
}
