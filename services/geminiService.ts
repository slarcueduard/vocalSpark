import { GoogleGenAI } from "@google/genai";
import { Post, Tone, Platform, RefinementType, CalendarIdea, BrandProfile } from "../types";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey: apiKey || "MISSING_KEY" });

// --- 1. IMAGINI: POLLINATIONS (GRATIS & STABIL) ---
export async function generateImageForPost(postText: string, brandProfile?: BrandProfile): Promise<string> {
  console.log("Generating image via Fallback...");
  await new Promise(r => setTimeout(r, 1000));
  
  const cleanPrompt = encodeURIComponent(postText.substring(0, 100));
  const seed = Math.floor(Math.random() * 1000);
  // Folosim flux pentru calitate mai bună
  return `https://image.pollinations.ai/prompt/${cleanPrompt}?width=1080&height=1080&nologo=true&seed=${seed}&model=flux`;
}

export async function generateImageVariation(base64ImageData: string, mimeType: string, style: string): Promise<string> {
  console.log("Generating variation via Fallback...");
  await new Promise(r => setTimeout(r, 1500));
  
  const cleanStyle = encodeURIComponent(style + " artistic style");
  const seed = Math.floor(Math.random() * 1000);
  return `https://image.pollinations.ai/prompt/${cleanStyle}?width=1080&height=1080&nologo=true&seed=${seed}&model=flux`;
}

// --- 2. LOGO OVERLAY ---
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

// --- 3. GENERARE TEXT (GEMINI 2.0 FLASH EXP) ---
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
  
  if (!apiKey) throw new Error("API Key missing");
  
  // FIX: Folosim modelul 2.0 Experimental care merge sigur cu acest SDK
  const model = 'gemini-2.0-flash-exp';
  
  let userPrompt = `
  ACT AS: Expert Social Media Manager.
  TASK: Write ${postCount} engaging posts about: "${topic}".
  TONE: ${tone}.
  LANGUAGE: ${language}.
  
  OUTPUT FORMAT: Pure JSON Array. No markdown. No backticks.
  Example: [{"content": "Post text 1"}, {"content": "Post text 2"}]
  `;

  if (brandVoice) userPrompt += `\nSTYLE: ${brandVoice}`;

  try {
    const parts: any[] = [];
    
    if (imageBase64 && imageMimeType) {
        parts.push({
            inlineData: {
                data: imageBase64,
                mimeType: imageMimeType
            }
        });
        userPrompt += `\nCONTEXT: Describe the attached image in the post context.`;
    }

    parts.push({ text: userPrompt });

    const response = await ai.models.generateContent({
      model,
      contents: [{ parts }],
      config: { responseMimeType: "application/json" }
    });
    
    let text = response.text();
    if (!text) return [];

    text = text.replace(/```json|```/g, '').trim();
    
    const parsed = JSON.parse(text);
    
    if(Array.isArray(parsed)) {
        return parsed.map((p: any) => ({ content: p.content || p }));
    }
    return [];

  } catch (e) {
    console.error("Text generation failed", e);
    // Mesaj de eroare prietenos în UI în loc de crash
    return [{ content: `API Error: Could not generate text. Please check your API Key or try again later.` }];
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
  // FIX: Folosim 2.0 Flash Exp și aici
  const model = 'gemini-2.0-flash-exp';
  try {
    const response = await ai.models.generateContent({ model, contents: `Adapt this post for ${platform}. Keep it engaging:\n"${originalContent}"` });
    return response.text() || "";
  } catch (e) { return originalContent; }
}

export async function refinePostContent(content: string, type: RefinementType): Promise<string> {
  const model = 'gemini-2.0-flash-exp';
  try {
    const response = await ai.models.generateContent({ model, contents: `Rewrite this post. Goal: ${type}.\nPost: "${content}"` });
    return response.text() || "";
  } catch (e) { return content; }
}

export async function analyzeBrandVoice(sampleText: string): Promise<string> {
    const model = 'gemini-2.0-flash-exp';
    try {
        const response = await ai.models.generateContent({ model, contents: `Analyze the writing style of this text: "${sampleText}"` });
        return response.text() || "";
    } catch (e) { return "Could not analyze."; }
}
