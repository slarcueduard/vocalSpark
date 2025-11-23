import { GoogleGenAI, Modality, Type } from "@google/genai";
import { Post, Tone, Platform, RefinementType, CalendarIdea, BrandProfile } from "../types";

// Setup API Key
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
if (!apiKey) console.error("CRITICAL ERROR: VITE_GEMINI_API_KEY missing.");

// Fallback init
const ai = new GoogleGenAI({ apiKey: apiKey || "MISSING_KEY" });

const checkApiKey = () => {
    if (!apiKey || apiKey === "MISSING_KEY") {
        throw new Error("API Key invalid. Check Settings.");
    }
};

// --- IMAGE GENERATION FIX (Folosim modelul experimental) ---
export async function generateImageForPost(postText: string, brandProfile?: BrandProfile): Promise<string> {
  checkApiKey();
  
  // Modelul EXPERIMENTAL este singurul care suportă Output Imagine direct acum
  const model = 'gemini-2.0-flash-exp'; 
  
  let styleContext = brandProfile ? `Style context: ${brandProfile.description}` : "";
  const prompt = `Generate a high-quality social media image. Subject: "${postText}". ${styleContext}. No text in the image.`;

  try {
    const response = await ai.models.generateContent({
        model: model,
        contents: { parts: [{ text: prompt }] },
        config: { 
            responseModalities: [Modality.IMAGE] // FORȚĂM MODUL IMAGINE
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
    throw new Error("AI did not return an image. It might be blocked by safety filters.");

  } catch (error) {
    console.error("Error generating image:", error);
    // Dacă e eroare 400, înseamnă că modelul nu suportă imagini în regiunea ta sau cheia e greșită
    throw new Error("Failed to generate image. Please try again later.");
  }
}

// --- RESTUL FUNCȚIILOR (Text, Calendar, etc) ---
// ... (Păstrează funcțiile generateSocialMediaPosts, overlayLogoOnImage, etc. din versiunea anterioară care mergeau bine pe Text)
// IMPORTANT: Pentru funcțiile de TEXT (generateSocialMediaPosts), folosește modelul 'gemini-2.0-flash' (fără exp), e mai stabil.

export async function generateSocialMediaPosts(
  topic: string,
  tone: Tone,
  postCount: number,
  language: string,
  brandVoice: string,
  brandProfile?: BrandProfile
): Promise<Omit<Post, 'id' | 'imageUrl' | 'isGeneratingImage' | 'adaptedContent'>[]> {
  checkApiKey();
  const model = 'gemini-2.0-flash'; // TEXT STABIL
  
  let prompt = `Generate ${postCount} posts about "${topic}". Tone: ${tone}.`;
  if(language) prompt += ` Language: ${language}.`;
  
  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    
    // Parse response...
    const parsed = JSON.parse(response.text() || "[]");
    // Dacă AI returnează array simplu de string-uri sau obiecte
    if(Array.isArray(parsed)) {
        return parsed.map((p: any) => ({ content: p.content || p })); 
    }
    return [];
  } catch (e) {
    console.error(e);
    throw new Error("Failed text generation");
  }
}

// ... Adaugă restul funcțiilor helper (adaptPost, refinePost) folosind 'gemini-2.0-flash'
