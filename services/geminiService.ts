import { GoogleGenerativeAI } from "@google/generative-ai";
import { Post, Tone, Platform, RefinementType, CalendarIdea, BrandProfile } from "../types";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey || "MISSING_KEY");

// --- DIAGNOSTIC: Vezi în consolă ce modele ai disponibile ---
(async () => {
    if (!apiKey) return;
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        // Nu putem lista modelele direct din browser cu acest SDK din motive de securitate CORS uneori,
        // dar încercăm un ping simplu.
        console.log("Gemini Service Initialized. API Key present.");
    } catch (e) {
        console.error("Gemini Init Error:", e);
    }
})();

// --- 1. IMAGINI (Pollinations - Stabil) ---
export async function generateImageForPost(postText: string, brandProfile?: BrandProfile): Promise<string> {
  console.log("Fetching stock image...");
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

// --- 2. LOGO OVERLAY ---
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

// --- 3. GENERARE TEXT (STRATEGIE FALLBACK) ---
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

  let userPrompt = `
  ACT AS: Expert Social Media Manager.
  TASK: Write ${postCount} engaging posts about: "${topic}".
  TONE: ${tone}.
  LANGUAGE: ${language}.
  OUTPUT: JSON Array only. Example: [{"content": "..."}]
  `;
  if (brandVoice) userPrompt += `\nSTYLE: ${brandVoice}`;

  // Încercăm întâi modelul MODERN (vede imagini)
  try {
    console.log("Attempting Primary Model: gemini-1.5-flash");
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const parts: any[] = [];
    if (imageBase64 && imageMimeType) {
        parts.push({ inlineData: { data: imageBase64, mimeType: imageMimeType } });
        userPrompt += `\nCONTEXT: Describe the image provided.`;
    }
    parts.push({ text: userPrompt });

    const result = await model.generateContent(parts);
    const response = await result.response;
    return parseResponse(response.text());

  } catch (primaryError: any) {
    console.warn("Primary model failed (404/Error). Switching to FALLBACK model (gemini-pro).", primaryError);
    
    // Încercăm modelul CLASIC (doar text, fără imagini)
    try {
        const fallbackModel = genAI.getGenerativeModel({ model: "gemini-pro" });
        // Gemini Pro NU suportă imagini, deci trimitem doar textul
        const fallbackResult = await fallbackModel.generateContent(userPrompt);
        const fallbackResponse = await fallbackResult.response;
        return parseResponse(fallbackResponse.text());
    } catch (secondaryError: any) {
        console.error("All models failed.", secondaryError);
        return [{ content: `Generation failed. API Error: ${secondaryError.message || "Unknown"}` }];
    }
  }
}

// Helper pentru curățarea JSON-ului
function parseResponse(text: string): any[] {
    if (!text) return [];
    try {
        const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleanText);
        if(Array.isArray(parsed)) return parsed.map((p: any) => ({ content: p.content || p }));
        return [];
    } catch (e) {
        return [{ content: text }]; // Dacă nu e JSON, returnăm textul brut
    }
}

// --- HELPER FUNCTIONS (Fallback la gemini-pro dacă e nevoie) ---
async function runTextTask(prompt: string): Promise<string> {
    try {
        // Încercăm flash
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent(prompt);
        return result.response.text();
    } catch (e) {
        // Fallback la pro
        try {
            const model = genAI.getGenerativeModel({ model: "gemini-pro" });
            const result = await model.generateContent(prompt);
            return result.response.text();
        } catch (e2) {
            return "";
        }
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
  return runTextTask(`Adapt for ${platform}:\n"${originalContent}"`);
}

export async function refinePostContent(content: string, type: RefinementType): Promise<string> {
  return runTextTask(`Rewrite (${type}): "${content}"`);
}

export async function analyzeBrandVoice(sampleText: string): Promise<string> {
  return runTextTask(`Analyze style: "${sampleText}"`);
}
