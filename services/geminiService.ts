import { GoogleGenAI, Modality, Type } from "@google/genai";
import { Post, Tone, Platform, RefinementType, CalendarIdea, BrandProfile } from "../types";

// 1. Configurare API Key
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
// Fallback init
const ai = new GoogleGenAI({ apiKey: apiKey || "MISSING_KEY" });

const checkApiKey = () => {
    if (!apiKey || apiKey === "MISSING_KEY") {
        throw new Error("API Key is missing. Check Settings.");
    }
};

// --- HELPER: Unsplash Fallback (Pentru când AI-ul eșuează) ---
function getFallbackImage(keyword: string): string {
    // Folosim Unsplash Source pentru imagini relevante instant
    const cleanKeyword = keyword.split(' ').slice(0, 2).join(','); // Luăm primele 2 cuvinte
    return `https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000&auto=format&fit=crop&text=${encodeURIComponent(keyword)}`;
    // SAU mai dinamic:
    // return `https://source.unsplash.com/1080x1080/?${encodeURIComponent(keyword)}`;
    // Notă: source.unsplash.com e deprecated uneori, folosim un placeholder solid sau o logică mai bună dacă ai un API Unsplash.
    // Pentru acum, folosim un serviciu placeholder robust:
    return `https://placehold.co/1080x1080/1a1a1a/FFF?text=${encodeURIComponent(keyword)}`;
}

export function fileToBase64(file: File): Promise<{mimeType: string, data: string}> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const mimeType = result.split(';')[0].split(':')[1];
      const data = result.split(',')[1];
      resolve({ mimeType, data });
    };
    reader.onerror = error => reject(error);
    reader.readAsDataURL(file);
  });
}

// --- VISION (Descrie imaginea) ---
async function describeImage(base64ImageData: string, mimeType: string): Promise<string> {
  const model = 'gemini-1.5-flash'; 
  const prompt = "Describe the main subject and style of this image in 10 words.";
  try {
    const visionAi = new GoogleGenAI({ apiKey: apiKey || "" });
    const response = await visionAi.models.generateContent({
      model: model,
      contents: [{ parts: [{ inlineData: { data: base64ImageData, mimeType: mimeType } }, { text: prompt }] }]
    });
    return response.text() || "abstract art";
  } catch (e) {
    return "abstract image";
  }
}

// --- GENERARE IMAGINE CU FALLBACK ---
export async function generateImageForPost(postText: string, brandProfile?: BrandProfile): Promise<string> {
  checkApiKey();
  const model = 'gemini-2.0-flash-exp'; 
  const prompt = `Generate a social media image: "${postText}". No text inside.`;

  try {
    const response = await ai.models.generateContent({
        model: model,
        contents: { parts: [{ text: prompt }] },
        config: { responseModalities: [Modality.IMAGE] },
    });

    const candidate = response.candidates?.[0];
    if (candidate?.content?.parts?.[0]?.inlineData) {
        return `data:image/png;base64,${candidate.content.parts[0].inlineData.data}`;
    }
    throw new Error("No image data.");

  } catch (error) {
    console.warn("AI Image Generation failed (likely region lock). Using fallback.", error);
    // FALLBACK: Returnează o imagine placeholder relevantă
    return `https://placehold.co/1080x1080/222/00FF94?text=${encodeURIComponent(postText.substring(0, 20))}`;
  }
}

export async function generateImageVariation(base64ImageData: string, mimeType: string, style: string): Promise<string> {
  checkApiKey();
  
  // 1. Descriem imaginea
  const description = await describeImage(base64ImageData, mimeType);
  
  // 2. Încercăm să generăm
  const model = 'gemini-2.0-flash-exp'; 
  const prompt = `Create an image of ${description} in ${style} style.`;
  
  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: { parts: [{ text: prompt }] },
      config: { responseModalities: [Modality.IMAGE] },
    });

    const candidate = response.candidates?.[0];
    if (candidate?.content?.parts?.[0]?.inlineData) {
        return `data:image/png;base64,${candidate.content.parts[0].inlineData.data}`;
    }
    throw new Error("No image data.");

  } catch (error) {
    console.warn("AI Variation failed. Using fallback.");
    // Fallback pentru variații
    return `https://placehold.co/1080x1080/111/6366F1?text=${encodeURIComponent(style + " Filter")}`;
  }
}

// --- TEXT GENERATION (Stabil) ---
export async function generateSocialMediaPosts(
  topic: string,
  tone: Tone,
  postCount: number,
  language: string,
  brandVoice: string,
  brandProfile?: BrandProfile
): Promise<Omit<Post, 'id' | 'imageUrl' | 'isGeneratingImage' | 'adaptedContent'>[]> {
  checkApiKey();
  const model = 'gemini-2.0-flash'; 
  
  let prompt = `Generate ${postCount} posts about "${topic}". Tone: ${tone}. Language: ${language}. Return pure JSON array of objects with 'content' field.`;
  
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
    console.error(e);
    throw new Error("Failed text generation");
  }
}

// Helper functions (nemodificate, doar exportate)
export async function adaptPostForPlatform(originalContent: string, platform: Platform): Promise<string> {
  const model = 'gemini-2.0-flash';
  const response = await ai.models.generateContent({ model, contents: `Adapt for ${platform}: ${originalContent}` });
  return response.text() || "";
}

export async function refinePostContent(content: string, type: RefinementType): Promise<string> {
  const model = 'gemini-2.0-flash';
  const response = await ai.models.generateContent({ model, contents: `Refine (${type}): ${content}` });
  return response.text() || "";
}

export async function analyzeBrandVoice(sampleText: string): Promise<string> {
    const model = 'gemini-2.0-flash';
    const response = await ai.models.generateContent({ model, contents: `Analyze voice: ${sampleText}` });
    return response.text() || "";
}
