import { GoogleGenAI } from "@google/genai";
import { Post, Tone, Platform, RefinementType, CalendarIdea, BrandProfile } from "../types";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey: apiKey || "MISSING_KEY" });

// --- 1. GENERARE IMAGINI (Pollinations) ---
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

// --- 3. GENERARE TEXT PROFESIONALĂ (Multimodal + Copywriting) ---
export async function generateSocialMediaPosts(
  topic: string,
  tone: Tone,
  postCount: number,
  language: string,
  brandVoice: string,
  brandProfile?: BrandProfile,
  imageBase64?: string, // Primim poza
  imageMimeType?: string
): Promise<Omit<Post, 'id' | 'imageUrl' | 'isGeneratingImage' | 'adaptedContent'>[]> {
  
  if (!apiKey) throw new Error("API Key missing");
  
  // Folosim Gemini 1.5 Flash pentru că știe să "vadă" poze și să scrie text bun
  const model = 'gemini-1.5-flash';
  
  // Construim un Prompt Avansat
  let userPrompt = `
  ACT AS: A world-class Social Media Copywriter.
  TASK: Write ${postCount} engaging social media posts.
  
  CONTEXT / TOPIC: "${topic}"
  TONE: ${tone}
  LANGUAGE: ${language}
  
  INSTRUCTIONS:
  1. Make it engaging. Hook the reader in the first sentence.
  2. Use appropriate emojis (but don't overdo it).
  3. Include 3-5 relevant hashtags at the end.
  4. RETURN ONLY RAW JSON. No markdown formatting.
  
  FORMAT:
  [
    { "content": "Post text here..." },
    { "content": "Second post text here..." }
  ]
  `;

  if (brandVoice) userPrompt += `\nIMPORTANT: Mimic this specific writing style: "${brandVoice}"`;

  try {
    const parts: any[] = [];
    
    // Dacă avem poză, o punem prima în mesaj
    if (imageBase64 && imageMimeType) {
        parts.push({
            inlineData: {
                data: imageBase64,
                mimeType: imageMimeType
            }
        });
        userPrompt += `\n\nVISUAL CONTEXT: I have attached an image. Your post MUST be relevant to this specific image. Describe what you see naturally in the caption.`;
    }

    // Adăugăm textul
    parts.push({ text: userPrompt });

    const response = await ai.models.generateContent({
      model,
      contents: [{ parts }],
      config: { responseMimeType: "application/json" }
    });
    
    const text = response.text();
    if (!text) return [];
    
    const parsed = JSON.parse(text);
    if(Array.isArray(parsed)) return parsed.map((p: any) => ({ content: p.content || p }));
    return [];
  } catch (e) {
    console.error("Text generation failed", e);
    throw new Error("Failed to generate text.");
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
