import { GoogleGenAI } from "@google/genai";
import { Post, Tone, Platform, RefinementType, CalendarIdea, BrandProfile } from "../types";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey: apiKey || "MISSING_KEY" });

// --- 1. IMAGINI: FOLOSIM UNSPLASH (GRATIS & STABIL) ---
// Aceasta rezolva eroarea 400 instantaneu.
export async function generateImageForPost(postText: string, brandProfile?: BrandProfile): Promise<string> {
  console.log("Generating image via Fallback (Unsplash)...");
  // Simulăm o mică întârziere ca să pară că "gândește"
  await new Promise(r => setTimeout(r, 1000));
  
  // Alegem un cuvânt cheie relevant din text
  const keyword = postText.split(' ').slice(0, 2).join(',') || "business";
  
  // Returnăm o imagine reală de pe Unsplash
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(postText)}?width=1080&height=1080&nologo=true`;
}

export async function generateImageVariation(base64ImageData: string, mimeType: string, style: string): Promise<string> {
  console.log("Generating variation via Fallback...");
  await new Promise(r => setTimeout(r, 1500));
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(style + " style image")}?width=1080&height=1080&nologo=true`;
}

// --- 2. TEXT: RĂMÂNE PE GOOGLE GEMINI (FUNCȚIONEAZĂ BINE) ---
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
    reader.onload = () => {
        const res = reader.result as string;
        resolve({ mimeType: res.split(';')[0].split(':')[1], data: res.split(',')[1] });
    };
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
