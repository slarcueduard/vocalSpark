import { GoogleGenAI, Modality, Type } from "@google/genai";
import { Post, Tone, Platform, RefinementType, CalendarIdea, BrandProfile } from "../types";

// 1. Get the API Key safely
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

// 2. Validate it immediately
if (!apiKey) {
  console.error("CRITICAL ERROR: VITE_GEMINI_API_KEY is missing. Check Vercel Settings.");
}

// 3. Initialize the AI
// We use a fallback string so the app doesn't crash on load
const ai = new GoogleGenAI({ apiKey: apiKey || "MISSING_KEY" });

// --- Helper Functions ---

const checkApiKey = () => {
    if (!apiKey || apiKey === "MISSING_KEY") {
        throw new Error("API Key is missing or invalid. Please check VITE_GEMINI_API_KEY in Vercel Settings.");
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

// --- Image Overlay Logic ---
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

          const tempCanvas = document.createElement('canvas');
          tempCanvas.width = logoWidth;
          tempCanvas.height = logoHeight;
          const tempCtx = tempCanvas.getContext('2d');
          
          if (tempCtx) {
            tempCtx.drawImage(logoImg, 0, 0, logoWidth, logoHeight);

            if (removeBg) {
                const imageData = tempCtx.getImageData(0, 0, logoWidth, logoHeight);
                const data = imageData.data;
                for (let i = 0; i < data.length; i += 4) {
                    const r = data[i];
                    const g = data[i + 1];
                    const b = data[i + 2];
                    if (r > 230 && g > 230 && b > 230) {
                        data[i + 3] = 0;
                    }
                }
                tempCtx.putImageData(imageData, 0, 0);
            }
            ctx.shadowColor = "rgba(0,0,0,0.5)";
            ctx.shadowBlur = 15;
            ctx.drawImage(tempCanvas, x, y);
          }
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

// --- AI Functions ---

export async function analyzeBrandVoice(sampleText: string): Promise<string> {
    checkApiKey();
    const model = 'gemini-2.0-flash';
    const prompt = `Analyze the writing style of these posts. Return a concise "Voice DNA" paragraph describing tone, emojis, and structure.\n\nSample:\n"${sampleText}"`;

    try {
        const response = await ai.models.generateContent({
            model,
            contents: prompt,
        });
        return response.text?.replace('Voice DNA:', '').trim() || "Friendly, professional, and engaging.";
    } catch (error) {
        console.error("Error analyzing brand voice:", error);
        throw new Error("Failed to analyze brand voice.");
    }
}

export async function generateSocialMediaPosts(
  topic: string,
  tone: Tone,
  postCount: number,
  language: string,
  brandVoice: string,
  brandProfile?: BrandProfile
): Promise<Omit<Post, 'id' | 'imageUrl' | 'isGeneratingImage' | 'adaptedContent'>[]> {
  checkApiKey();
  const model = 'gemini-2.0-flash'; // TEXT MODEL
  
  let systemInstruction = `You are an expert social media manager.`;
  
  if (brandProfile) {
    const industry = brandProfile.industry === 'Other' ? brandProfile.customIndustry : brandProfile.industry;
    systemInstruction += `\n\nBRAND PROFILE CONTEXT: Industry: ${industry}, Context: ${brandProfile.description}`;
    if (brandProfile.voiceDNA) {
        systemInstruction += `\n\nVOICE DNA: ${brandProfile.voiceDNA}`;
    }
  }

  let prompt = `Generate ${postCount} engaging social media posts about "${topic}". Tone: ${tone}. Language: ${language || 'English'}.`;
  if (brandVoice.trim()) prompt += `\nMatch this style: "${brandVoice}".`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              content: { type: Type.STRING },
            },
            required: ["content"],
          },
        },
      },
    });

    if (!response.text) throw new Error("Empty response from AI");
    const parsedResponse = JSON.parse(response.text()) as { content: string }[]; 
    return parsedResponse.map(p => ({ content: p.content }));

  } catch (error) {
    console.error("Error generating posts:", error);
    throw new Error("Failed to generate posts.");
  }
}

export async function generateImageForPost(postText: string, brandProfile?: BrandProfile): Promise<string> {
  checkApiKey();
  // CRITICAL FIX: Use the Experimental model for Image Generation
  const model = 'gemini-2.0-flash-exp'; 
  
  let styleContext = brandProfile ? `Style: ${brandProfile.description}` : "";
  const prompt = `Generate a high-quality social media image. No text in image. Subject: "${postText}". ${styleContext}`;

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

export async function adaptPostForPlatform(originalContent: string, platform: Platform): Promise<string> {
  checkApiKey();
  const model = 'gemini-2.0-flash'; // TEXT MODEL
  const prompt = `Adapt this post for ${platform}: "${originalContent}"`;

  try {
    const response = await ai.models.generateContent({ model, contents: prompt });
    return response.text() || "";
  } catch (error) {
    console.error(`Error adapting post:`, error);
    throw new Error(`Failed to adapt post.`);
  }
}

export async function refinePostContent(content: string, type: RefinementType): Promise<string> {
  checkApiKey();
  const model = 'gemini-2.0-flash'; // TEXT MODEL
  const prompt = `Refine this post (Type: ${type}): "${content}"`;

  try {
    const response = await ai.models.generateContent({ model, contents: prompt });
    return response.text() || "";
  } catch (error) {
    console.error(`Error refining post:`, error);
    throw new Error(`Failed to refine post.`);
  }
}

export async function generateContentCalendar(topic: string, audience: string, duration: string): Promise<CalendarIdea[]> {
  checkApiKey();
  const model = 'gemini-2.0-flash'; // TEXT MODEL
  const prompt = `Create a ${duration} content calendar for topic "${topic}". JSON format.`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    day: { type: Type.NUMBER },
                    idea: { type: Type.STRING },
                    postType: { type: Type.STRING },
                    hashtags: { type: Type.STRING }
                },
                required: ["day", "idea", "postType", "hashtags"]
            }
        }
      }
    });
    return JSON.parse(response.text()) as CalendarIdea[];
  } catch (error) {
    console.error("Error generating calendar:", error);
    throw new Error("Failed to generate calendar.");
  }
}

export async function generateImageVariation(base64ImageData: string, mimeType: string, style: string): Promise<string> {
  checkApiKey();
  // CRITICAL FIX: Use Experimental model for Image Variations
  const model = 'gemini-2.0-flash-exp'; 
  const prompt = `Edit/Recreate this image in style: ${style}`;
  
  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [
          { inlineData: { data: base64ImageData, mimeType: mimeType } },
          { text: prompt },
        ],
      },
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
    throw new Error("No image data found for variation.");

  } catch (error) {
    console.error(`Error generating variation:`, error);
    throw new Error(`Failed to generate variation.`);
  }
}

export async function verifyGeminiApiKey(): Promise<{ ok: boolean; message: string }> {
  try {
    checkApiKey();
    await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: 'Hello',
    });
    return { ok: true, message: "Gemini API is accessible." };
  } catch (error: any) {
    return { ok: false, message: error.message || "Failed to verify API key." };
  }
}
