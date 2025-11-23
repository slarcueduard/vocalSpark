import { GoogleGenAI } from "@google/genai";
import { Post, Tone, Platform, RefinementType, CalendarIdea, BrandProfile } from "../types";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey: apiKey || "MISSING_KEY" });

// --- IMAGINI (Pollinations) ---
export async function generateImageForPost(postText: string): Promise<string> {
  console.log("Generating image...");
  await new Promise(r => setTimeout(r, 1000));
  const cleanPrompt = encodeURIComponent(postText.substring(0, 100));
  const seed = Math.floor(Math.random() * 1000);
  return `https://image.pollinations.ai/prompt/${cleanPrompt}?width=1080&height=1080&nologo=true&seed=${seed}`;
}

export async function generateImageVariation(base64ImageData: string, mimeType: string, style: string): Promise<string> {
  await new Promise(r => setTimeout(r, 1500));
  const cleanStyle = encodeURIComponent(style + " artistic style");
  const seed = Math.floor(Math.random() * 1000);
  return `https://image.pollinations.ai/prompt/${cleanStyle}?width=1080&height=1080&nologo=true&seed=${seed}`;
}

// --- LOGO ---
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

// --- TEXT GENERATION (GEMINI 1.5 PRO - CEL MAI AVANSAT) ---
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
  
  if (!apiKey) return [{ content: "API Key Missing. Check Vercel Settings." }];
  
  // Folosim PRO pentru calitate maximă
  const model = 'gemini-1.5-pro';
  
  let userPrompt = `
  ACT AS: Expert Copywriter.
  TASK: Write ${postCount} posts about: "${topic}".
  TONE: ${tone}.
  LANGUAGE: ${language}.
  RETURN JSON ARRAY: [{ "content": "..." }]
  `;

  if (brandVoice) userPrompt += `\nSTYLE: ${brandVoice}`;

  try {
    const parts: any[] = [];
    if (imageBase64 && imageMimeType) {
        parts.push({ inlineData: { data: imageBase64, mimeType: imageMimeType } });
        userPrompt += `\nCONTEXT: Describe the image provided in the post.`;
    }
    parts.push({ text: userPrompt });

    const response = await ai.models.generateContent({
      model,
      contents: [{ parts }],
      config: { responseMimeType: "application/json" }
    });
    
    const text = response.text();
    if (!text) throw new Error("Empty response from Google AI");

    const parsed = JSON.parse(text.replace(/```json|```/g, '').trim());
    if(Array.isArray(parsed)) return parsed.map((p: any) => ({ content: p.content || p }));
    return [];

  } catch (e: any) {
    console.error("Full Error:", e);
    // Returnăm mesajul REAL de eroare în UI ca să vedem ce se întâmplă
    const errorMsg = e.message || JSON.stringify(e);
    return [{ content: `Google AI Error: ${errorMsg}` }];
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
  const response = await ai.models.generateContent({ model: 'gemini-1.5-pro', contents: `Adapt for ${platform}:\n"${originalContent}"` });
  return response.text() || "";
}

export async function refinePostContent(content: string, type: RefinementType): Promise<string> {
  const response = await ai.models.generateContent({ model: 'gemini-1.5-pro', contents: `Refine (${type}): "${content}"` });
  return response.text() || "";
}

export async function analyzeBrandVoice(sampleText: string): Promise<string> {
    const response = await ai.models.generateContent({ model: 'gemini-1.5-pro', contents: `Analyze style: "${sampleText}"` });
    return response.text() || "";
}
