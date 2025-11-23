import { GoogleGenAI } from "@google/genai";
import { Post, Tone, Platform, RefinementType, CalendarIdea, BrandProfile } from "../types";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
// Initializare safe
const ai = new GoogleGenAI({ apiKey: apiKey || "MISSING_KEY" });

// --- 1. GENERARE IMAGINI (Pollinations - Gratis & Stabil) ---
export async function generateImageForPost(postText: string, brandProfile?: BrandProfile): Promise<string> {
  console.log("Generating image via Fallback...");
  await new Promise(r => setTimeout(r, 1000)); // Efect vizual
  
  const cleanPrompt = encodeURIComponent(postText.substring(0, 100));
  const seed = Math.floor(Math.random() * 1000);
  // Folosim modelul 'flux' pentru calitate maximă
  return `https://image.pollinations.ai/prompt/${cleanPrompt}?width=1080&height=1080&nologo=true&seed=${seed}&model=flux`;
}

export async function generateImageVariation(base64ImageData: string, mimeType: string, style: string): Promise<string> {
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
      logoImg.src = logoUrl;
    };
    mainImg.src = mainImageUrl;
  });
}

// --- 3. GENERARE TEXT (GEMINI 1.5 FLASH - STABIL) ---
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
  
  // FIX: Folosim 'gemini-1.5-flash' care este stabil și nu dă 404
  const model = 'gemini-1.5-flash';
  
  let userPrompt = `
  ACT AS: Expert Social Media Manager.
  TASK: Write ${postCount} engaging posts about: "${topic}".
  TONE: ${tone}.
  LANGUAGE: ${language}.
  
  IMPORTANT: Return ONLY a JSON ARRAY of objects. Do not use markdown formatting.
  Example: [{"content": "Post 1..."}, {"content": "Post 2..."}]
  `;

  if (brandVoice) userPrompt += `\nSTYLE: ${brandVoice}`;

  try {
    const parts: any[] = [];
    
    // Adăugăm imaginea dacă există (Multimodal)
    if (imageBase64 && imageMimeType) {
        parts.push({
            inlineData: {
                data: imageBase64,
                mimeType: imageMimeType
            }
        });
        userPrompt += `\nCONTEXT: Look at the image attached. Describe it nicely in the post.`;
    }

    parts.push({ text: userPrompt });

    const response = await ai.models.generateContent({
      model,
      contents: [{ parts }],
      config: { responseMimeType: "application/json" }
    });
    
    let text = response.text();
    if (!text) return [];

    // Curățare JSON (pentru siguranță)
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    const parsed = JSON.parse(text);
    if(Array.isArray(parsed)) {
        return parsed.map((p: any) => ({ content: p.content || p }));
    }
    return [];

  } catch (e: any) {
    console.error("Text generation failed", e);
    const errorMsg = e.message || "Unknown Error";
    return [{ content: `Error generating text: ${errorMsg}. Please try again.` }];
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
  const model = 'gemini-1.5-flash';
  try {
    const response = await ai.models.generateContent({ model, contents: `Adapt for ${platform}:\n"${originalContent}"` });
    return response.text() || "";
  } catch (e) { return originalContent; }
}

export async function refinePostContent(content: string, type: RefinementType): Promise<string> {
  const model = 'gemini-1.5-flash';
  try {
    const response = await ai.models.generateContent({ model, contents: `Rewrite (${type}): "${content}"` });
    return response.text() || "";
  } catch (e) { return content; }
}

export async function analyzeBrandVoice(sampleText: string): Promise<string> {
    const model = 'gemini-1.5-flash';
    try {
        const response = await ai.models.generateContent({ model, contents: `Analyze style: "${sampleText}"` });
        return response.text() || "";
    } catch (e) { return ""; }
}
