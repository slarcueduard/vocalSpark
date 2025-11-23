import { GoogleGenAI, Modality, Type } from "@google/genai";
import { Post, Tone, Platform, RefinementType, CalendarIdea, BrandProfile } from "../types";

// 1. Configurare API Key
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
if (!apiKey) console.error("CRITICAL ERROR: VITE_GEMINI_API_KEY is missing.");

// Inițializare (Fallback pentru a evita crash la start)
const ai = new GoogleGenAI({ apiKey: apiKey || "MISSING_KEY" });

const checkApiKey = () => {
    if (!apiKey || apiKey === "MISSING_KEY") {
        throw new Error("API Key is missing or invalid. Please check VITE_GEMINI_API_KEY.");
    }
};

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

// --- Helper: Descrie imaginea (Vision) ---
// Folosim un model STABIL (1.5 Flash) pentru a "vedea" poza
async function describeImage(base64ImageData: string, mimeType: string): Promise<string> {
  const model = 'gemini-1.5-flash'; 
  const prompt = "Describe this image in vivid detail. Focus on the subject, composition, lighting, and colors. Keep it under 50 words.";

  try {
    const visionAi = new GoogleGenAI({ apiKey: apiKey || "" });
    const response = await visionAi.models.generateContent({
      model: model,
      contents: [
        {
          parts: [
            { inlineData: { data: base64ImageData, mimeType: mimeType } },
            { text: prompt }
          ]
        }
      ]
    });
    return response.text() || "a photo of a subject";
  } catch (e) {
    console.warn("Failed to describe image, using fallback.", e);
    return "a generic photo";
  }
}

// --- FIX: Image Variation (Proces în 2 Pași) ---
export async function generateImageVariation(
  base64ImageData: string,
  mimeType: string,
  style: string
): Promise<string> {
  checkApiKey();
  
  // PASUL 1: AI-ul se uită la poză și o descrie (Vision)
  const imageDescription = await describeImage(base64ImageData, mimeType);
  
  // PASUL 2: AI-ul desenează o poză NOUĂ pe baza descrierii + stil (Text-to-Image)
  // Folosim modelul EXPERIMENTAL care știe să facă poze
  const model = 'gemini-2.0-flash-exp'; 
  
  let prompt = "";
  if (style.startsWith("Magic Edit:")) {
    const editInstruction = style.replace("Magic Edit:", "").trim();
    prompt = `Generate a high-quality image based on this description: "${imageDescription}". 
    Apply this specific edit: ${editInstruction}.
    Ensure the composition remains similar to the description.`;
  } else {
    prompt = `Generate a high-quality image.
    Subject Description: ${imageDescription}
    Artistic Style: ${style}
    Make sure the image matches the description but strictly follows the requested style.`;
  }
  
  try {
    // Aici trimitem DOAR text. Nu trimitem poza veche (inlineData), asta cauza eroarea 400.
    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [{ text: prompt }],
      },
      config: {
        responseModalities: [Modality.IMAGE],
      },
    });

    const candidate = response.candidates?.[0];
    if (candidate?.content?.parts) {
        for (const part of candidate.content.parts) {
            if (part.inlineData) {
                return `data:image/png;base64,${part.inlineData.data}`;
            }
        }
    }
    throw new Error("No image data found in response.");

  } catch (error) {
    console.error(`Error generating variation for ${style}:`, error);
    throw new Error(`Failed to generate variation. Ensure your API Key supports Image Generation.`);
  }
}

// --- Generate Image From Text ---
export async function generateImageForPost(postText: string, brandProfile?: BrandProfile): Promise<string> {
  checkApiKey();
  const model = 'gemini-2.0-flash-exp'; // Modelul experimental pentru imagini
  
  let styleContext = brandProfile ? `Style context: ${brandProfile.description}` : "";
  const prompt = `Generate a high-quality social media image. Subject: "${postText}". ${styleContext}. No text in the image.`;

  try {
    const response = await ai.models.generateContent({
        model: model,
        contents: { parts: [{ text: prompt }] },
        config: { responseModalities: [Modality.IMAGE] },
    });

    const candidate = response.candidates?.[0];
    if (candidate?.content?.parts) {
        for (const part of candidate.content.parts) {
            if (part.inlineData) {
                return `data:image/png;base64,${part.inlineData.data}`;
            }
        }
    }
    throw new Error("No image data found.");

  } catch (error) {
    console.error("Error generating image:", error);
    throw new Error("Failed to generate image from AI.");
  }
}

// --- Text Functions (Folosim modelul Stabil 2.0 Flash) ---

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
  
  let prompt = `Generate ${postCount} engaging social media posts about "${topic}". Tone: ${tone}.`;
  if(language) prompt += ` Language: ${language}.`;
  
  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    
    const parsed = JSON.parse(response.text() || "[]");
    if(Array.isArray(parsed)) {
        return parsed.map((p: any) => ({ content: p.content || p })); 
    }
    return [];
  } catch (e) {
    console.error(e);
    throw new Error("Failed text generation");
  }
}

// (Adaugă aici restul funcțiilor helper adaptPostForPlatform, refinePostContent exact ca înainte, folosind 'gemini-2.0-flash')
export async function adaptPostForPlatform(originalContent: string, platform: Platform): Promise<string> {
  checkApiKey();
  const model = 'gemini-2.0-flash';
  const prompt = `Adapt this post for ${platform}: "${originalContent}"`;
  try {
    const response = await ai.models.generateContent({ model, contents: prompt });
    return response.text() || "";
  } catch (error) {
    throw new Error(`Failed to adapt post.`);
  }
}

export async function refinePostContent(content: string, type: RefinementType): Promise<string> {
  checkApiKey();
  const model = 'gemini-2.0-flash';
  const prompt = `Refine this post (Type: ${type}): "${content}"`;
  try {
    const response = await ai.models.generateContent({ model, contents: prompt });
    return response.text() || "";
  } catch (error) {
    throw new Error(`Failed to refine post.`);
  }
}

export async function analyzeBrandVoice(sampleText: string): Promise<string> {
    checkApiKey();
    const model = 'gemini-2.0-flash';
    const prompt = `Analyze writing style: "${sampleText}"`;
    try {
        const response = await ai.models.generateContent({ model, contents: prompt });
        return response.text() || "";
    } catch (error) {
        throw new Error("Failed to analyze brand voice.");
    }
}
