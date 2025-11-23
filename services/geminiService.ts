
import { GoogleGenAI, Modality, Type } from "@google/genai";
import { Post, Tone, Platform, RefinementType, CalendarIdea, BrandProfile } from "../types";

// In this environment we must use process.env.API_KEY
// On Vercel, ensure this environment variable is set in Settings -> Environment Variables
const rawApiKey = process.env.API_KEY || "";

// Sanitization: Remove double quotes, single quotes, and extra whitespace
// This fixes issues where users accidentally copy the key with quotes around it
// CRITICAL FIX: Use the Vite specific environment variable
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

if (!apiKey) {
  console.error("CRITICAL ERROR: API Key is missing. Check Vercel Environment Variables.");
  throw new Error("API Key is missing");
}

const genAI = new GoogleGenerativeAI(apiKey);

const isKeyValid = apiKey && apiKey.length > 10 && apiKey !== "MISSING_KEY";

if (!isKeyValid) {
  console.error("CRITICAL: Missing or invalid API_KEY. Please add VITE_GEMINI_API_KEY to your Vercel Environment Variables. Current value length:", apiKey?.length);
} else {
  // Safe log to confirm key is loaded (only showing first 4 chars)
  console.log(`Gemini API Key loaded: ${apiKey.substring(0, 4)}...`);
}

// Initialize with a fallback to prevent immediate crash, but methods will throw clear errors
const ai = new GoogleGenAI({ apiKey: isKeyValid ? apiKey : "MISSING_KEY" });

// Helper to throw clear error if key is missing
const checkApiKey = () => {
    if (!isKeyValid) {
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

export type LogoPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

// Client-side function to overlay a logo on an image
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

    // Handle CORS for external images if necessary, though base64 is preferred
    mainImg.crossOrigin = "Anonymous";
    logoImg.crossOrigin = "Anonymous";

    mainImg.onload = () => {
      canvas.width = mainImg.width;
      canvas.height = mainImg.height;

      // Draw Main Image
      ctx?.drawImage(mainImg, 0, 0);

      logoImg.onload = () => {
        if (ctx) {
          // Calculate logo size (e.g., 20% of main image width)
          const logoWidth = canvas.width * 0.20;
          const scaleFactor = logoWidth / logoImg.width;
          const logoHeight = logoImg.height * scaleFactor;

          // Padding
          const padding = canvas.width * 0.05;
          let x = padding;
          let y = padding;

          switch (position) {
              case 'top-left':
                  x = padding;
                  y = padding;
                  break;
              case 'top-right':
                  x = canvas.width - logoWidth - padding;
                  y = padding;
                  break;
              case 'bottom-left':
                  x = padding;
                  y = canvas.height - logoHeight - padding;
                  break;
              case 'bottom-right':
                  x = canvas.width - logoWidth - padding;
                  y = canvas.height - logoHeight - padding;
                  break;
          }

          // Optional: Create a temporary canvas to process the logo transparency
          const tempCanvas = document.createElement('canvas');
          tempCanvas.width = logoWidth;
          tempCanvas.height = logoHeight;
          const tempCtx = tempCanvas.getContext('2d');
          
          if (tempCtx) {
            tempCtx.drawImage(logoImg, 0, 0, logoWidth, logoHeight);

            if (removeBg) {
                const imageData = tempCtx.getImageData(0, 0, logoWidth, logoHeight);
                const data = imageData.data;
                // Simple heuristic: make near-white pixels transparent
                for (let i = 0; i < data.length; i += 4) {
                    const r = data[i];
                    const g = data[i + 1];
                    const b = data[i + 2];
                    // If pixel is very light (white background)
                    if (r > 230 && g > 230 && b > 230) {
                        data[i + 3] = 0; // Set alpha to 0
                    }
                }
                tempCtx.putImageData(imageData, 0, 0);
            }

            // Draw processed logo onto main canvas
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

// NEW: Analyze Brand Voice DNA
export async function analyzeBrandVoice(sampleText: string): Promise<string> {
    checkApiKey();
    const model = 'gemini-2.5-flash';
    const prompt = `
    Analyze the writing style, tone, emoji usage, sentence length, and unique quirks of the following social media posts.
    The goal is to create a "Voice Profile" that allows an AI to mimic this person exactly.
    
    RETURN ONLY a concise, instructional paragraph starting with "Voice DNA:". 
    Do not describe the content of the posts (e.g., don't say "The user talks about hiking"). Focus only on HOW they write.
    
    Example Output: 
    Voice DNA: Witty and sarcastic. Uses lowercase often for aesthetic. Loves the ✨ emoji. Short, punchy sentences. Asks rhetorical questions.
    
    Sample Posts to Analyze:
    "${sampleText}"
    `;

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
  const model = 'gemini-2.5-flash'; 
  
  let systemInstruction = `You are an expert social media manager.`;
  
  // Inject Brand Profile into System Instruction
  if (brandProfile) {
    const industry = brandProfile.industry === 'Other' ? brandProfile.customIndustry : brandProfile.industry;
    systemInstruction += `\n\nBRAND PROFILE CONTEXT:
    You are the social media voice for a brand in the "${industry}" industry.
    
    1. BRAND IDENTITY:
       - Website: ${brandProfile.websiteUrl}
       - Business Context: ${brandProfile.description}
    `;

    // CRITICAL: USE VOICE DNA IF AVAILABLE
    if (brandProfile.voiceDNA) {
        systemInstruction += `\n\n2. *** VOICE DNA (STRICTLY MIMIC THIS) ***:
        ${brandProfile.voiceDNA}
        
        Instruction: Your output must sound EXACTLY like the Voice DNA described above. 
        Ignore the generic 'Tone' setting if it contradicts the Voice DNA.
        `;
    } else {
        systemInstruction += `\n\n2. WRITING STYLE:
        - Reference Style Source: ${brandProfile.socialUrl}
        - Mimic the tone, emoji usage, sentence structure, and vocabulary complexity found in the reference source.
        `;
    }
  }

  let prompt = `Generate ${postCount} engaging and versatile social media posts about "${topic}".
The posts should form a cohesive campaign and be suitable for various platforms like Instagram, TikTok, Facebook, and X (Twitter).
The desired tone is ${tone}.
Ensure each post is concise and includes relevant hashtags.`;

  if (language && language.toLowerCase() !== 'english') {
    prompt += `\nThe posts must be written in ${language}.`;
  }

  if (brandVoice.trim()) {
    prompt += `\nMatch this specific brand voice style: "${brandVoice}".`;
  }

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          description: `A list of ${postCount} social media posts.`,
          items: {
            type: Type.OBJECT,
            properties: {
              content: {
                type: Type.STRING,
                description: "The text content of the social media post."
              },
            },
            required: ["content"],
          },
        },
      },
    });

    if (!response.text) {
        throw new Error("Empty response from AI");
    }

    const parsedResponse = JSON.parse(response.text) as { content: string }[]; 
    return parsedResponse.map(p => ({ content: p.content }));

  } catch (error) {
    console.error("Error generating social media posts:", error);
    throw new Error("Failed to generate posts from AI.");
  }
}

export async function generateImageForPost(postText: string, brandProfile?: BrandProfile): Promise<string> {
  checkApiKey();
  const model = 'gemini-2.5-flash-image';
  
  let styleContext = "";
  if (brandProfile) {
      const industry = brandProfile.industry === 'Other' ? brandProfile.customIndustry : brandProfile.industry;
      styleContext = `The image should reflect a ${industry} aesthetic. Use a color palette and visual style suitable for a modern ${industry} brand described as: ${brandProfile.description}.`;
  }

  const prompt = `Create a vibrant, high-quality, and visually appealing image that is highly relevant for a social media post with the following text. 
  ${styleContext}
  The image should be eye-catching and suitable for platforms like Instagram. Do not include any text in the image. 
  Post text: "${postText}"`;

  try {
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
    // Safety check: sometimes content is null if blocked
    if (candidate?.content?.parts && candidate.content.parts.length > 0) {
        for (const part of candidate.content.parts) {
            if (part.inlineData) {
                const base64ImageBytes: string = part.inlineData.data;
                return `data:image/png;base64,${base64ImageBytes}`;
            }
        }
    }
    
    console.warn("No image generated. Response dump:", JSON.stringify(response, null, 2));
    throw new Error("No image data found. The request might have been blocked by safety filters.");

  } catch (error) {
    console.error("Error generating image:", error);
    throw new Error("Failed to generate image from AI.");
  }
}


const getPlatformAdaptationPrompt = (originalContent: string, platform: Platform): string => {
  const basePrompt = `You are a social media expert. Adapt the following post for ${platform}. Your response must only contain the adapted text, with no extra commentary or labels.`;
  
  const platformInstructions: Record<Platform, string> = {
    [Platform.X]: "Keep it concise and punchy, under 280 characters. Use 2-3 highly relevant hashtags.",
    [Platform.Instagram]: "Make it an engaging Instagram caption. Use relevant emojis and slightly more descriptive language. Include a strong call-to-action and a block of 5-7 relevant hashtags at the end.",
    [Platform.Facebook]: "Write it as a Facebook post. It can be slightly longer and more conversational. Structure it with good spacing for readability. Encourage comments and shares by asking a question.",
    [Platform.TikTok]: "Transform this into a TikTok video idea or script. The response should be formatted as a caption. Make the caption short, catchy, and include 3-4 trending or relevant hashtags. Suggest on-screen text if applicable.",
    [Platform.LinkedIn]: "Write a professional, insightful, and value-driven LinkedIn post. Focus on industry relevance, professional growth, or business impact. Use a conversational but professional tone. Include 3-4 relevant hashtags at the end."
  };

  return `${basePrompt} ${platformInstructions[platform]}\n\nOriginal post:\n"${originalContent}"`;
};

export async function adaptPostForPlatform(originalContent: string, platform: Platform): Promise<string> {
  checkApiKey();
  const model = 'gemini-2.5-flash';
  const prompt = getPlatformAdaptationPrompt(originalContent, platform);

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });
    // FIX: SDK v1+ uses .text property
    return response.text || "";
  } catch (error) {
    console.error(`Error adapting post for ${platform}:`, error);
    throw new Error(`Failed to adapt post for ${platform}.`);
  }
}

export async function refinePostContent(content: string, type: RefinementType): Promise<string> {
  checkApiKey();
  const model = 'gemini-2.5-flash';
  let prompt: string;

  switch (type) {
    case 'makeShorter':
      prompt = `You are a social media copy editor. Make the following post more concise and punchy. Return only the revised text.\n\nOriginal Post:\n"${content}"`;
      break;
    case 'addEmojis':
      prompt = `You are a social media copy editor. Add relevant emojis to the following post to make it more engaging. CRITICAL: You must not change or rephrase the original text. Only insert emojis where appropriate. Return only the revised text with emojis.\n\nOriginal Post:\n"${content}"`;
      break;
    case 'askQuestion':
      prompt = `You are a social media copy editor. Append an engaging question to the end of the following post. The question must be related to the content. CRITICAL: Do not change the original text. Return the original text followed by the new question.\n\nOriginal Post:\n"${content}"`;
      break;
    default:
      throw new Error(`Unknown refinement type: ${type}`);
  }

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });
    // FIX: SDK v1+ uses .text property
    return response.text || "";
  } catch (error) {
    console.error(`Error refining post for type ${type}:`, error);
    throw new Error(`Failed to refine post.`);
  }
}

export async function generateContentCalendar(
  topic: string,
  audience: string,
  duration: '1 Week' | '2 Weeks' | '1 Month'
): Promise<CalendarIdea[]> {
  checkApiKey();
  const model = 'gemini-2.5-flash';
  const numDays = duration === '1 Week' ? 7 : duration === '2 Weeks' ? 14 : 30;

  const prompt = `You are an expert social media strategist. Create a ${duration} content calendar for the topic "${topic}", targeting "${audience}".
Provide a list of ${numDays} daily post ideas.
For each day, provide a creative post idea, a suggested post type (e.g., 'Educational Tip', 'Question', 'Myth Busting', 'Success Story', 'Behind the Scenes'), and a string of 3-4 relevant hashtags.`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          description: `A list of ${numDays} content calendar ideas.`,
          items: {
            type: Type.OBJECT,
            properties: {
              day: { type: Type.NUMBER, description: "The day number in the calendar." },
              idea: { type: Type.STRING, description: "The specific post idea for the day." },
              postType: { type: Type.STRING, description: "The type of post (e.g., 'Tip', 'Question')." },
              hashtags: { type: Type.STRING, description: "A string of relevant hashtags, starting with #." },
            },
            required: ["day", "idea", "postType", "hashtags"],
          },
        },
      },
    });

    // FIX: SDK v1+ uses .text property
    return JSON.parse(response.text) as CalendarIdea[];

  } catch (error) {
    console.error("Error generating content calendar:", error);
    throw new Error("Failed to generate content calendar.");
  }
}

export async function generateImageVariation(
  base64ImageData: string,
  mimeType: string,
  style: string
): Promise<string> {
  checkApiKey();
  const model = 'gemini-2.5-flash-image';
  let prompt: string;

  // Magic Edit Logic (if style describes an action)
  if (style.startsWith("Magic Edit:")) {
    const editInstruction = style.replace("Magic Edit:", "").trim();
    prompt = `Edit this image. Instruction: ${editInstruction}. Maintain the original subject and composition where possible, but apply the change.`;
  } else {
    // Standard Filter Logic
    switch (style) {
      case 'Face Retouch':
        prompt = "Professionally retouch the faces in this photo. Smooth the skin texture naturally, reduce blemishes, and brighten eyes slightly. Keep the person's identity and facial features exactly the same, just look like a better photo. Do not distort the face.";
        break;
      case 'Sharpen Portrait':
        prompt = "Sharpen this portrait image. enhance details in the eyes and hair, reduce noise/grain, and ensure the subject is in clear focus. Maintain a natural look.";
        break;
      case 'Studio Lighting':
        prompt = "Enhance the lighting on the people in this image to look like professional studio lighting. Soften shadows on faces, add rim lighting if appropriate to separate from background, and balance exposure.";
        break;
      case 'Subtle Enhance':
        prompt = "Perform a subtle, professional photo enhancement on this image. Improve lighting, sharpen details, and slightly smooth skin tones to make the subject look their best, while keeping the result natural and realistic. Do not change the composition or add artistic effects.";
        break;
      case 'Portrait Pop':
        prompt = "Perform a professional portrait enhancement. Focus on the subject. Improve lighting and create a soft, gentle background blur (bokeh effect) to make the subject stand out. The result should be natural and flattering.";
        break;
      case 'Vibrant Scenery':
        prompt = "Enhance this scenery photo. Boost the natural colors to make them more vivid, increase the overall clarity and sharpness of the landscape, and improve the lighting to make the scene look more dynamic and appealing. Do not add or remove elements, just enhance what is there.";
        break;
      case 'Product Pro':
        prompt = "Treat this as a professional product photograph. Enhance the image to make the main product stand out. Create clean, studio-like lighting, sharpen the product's details, and ensure the colors are accurate and appealing. The background should be clean and non-distracting. The final image should look like it's ready for an e-commerce website.";
        break;
      case 'Neon Noir':
        prompt = "Transform this image into a high-contrast Neon Noir aesthetic. Think 'John Wick' meets Cyberpunk. Deep blacks, wet rainy streets or dark sleek interiors, with intense neon lighting (purple, blue, hot pink) reflecting off surfaces. Make it look cinematic, dangerous, and sexy. Hyper-realistic, 8k resolution.";
        break;
      default:
        prompt = `Recreate this image in a ${style} style. Preserve the main subject and composition, but transform the artistic style completely.`;
    }
  }
  
  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [
          {
            inlineData: {
              data: base64ImageData,
              mimeType: mimeType,
            },
          },
          { text: prompt },
        ],
      },
      config: {
        responseModalities: [Modality.IMAGE],
      },
    });

    const candidate = response.candidates?.[0];
    
    // Check for safety blocks or empty content
    if (!candidate || !candidate.content || !candidate.content.parts || candidate.content.parts.length === 0) {
       console.warn(`Safety Block or Empty Response for style ${style}. Response dump:`, JSON.stringify(response, null, 2));
       throw new Error(`AI model could not generate variation for '${style}'. The image might trigger safety filters.`);
    }

    for (const part of candidate.content.parts) {
        if (part.inlineData) {
            const base64ImageBytes: string = part.inlineData.data;
            return `data:image/png;base64,${base64ImageBytes}`;
        }
    }
    
    throw new Error("No image data found in response parts.");

  } catch (error) {
    console.error(`Error generating image variation for style ${style}:`, error);
    // Rethrow with user-friendly message if possible, or original
    if (error instanceof Error) {
        throw error;
    }
    throw new Error(`Failed to generate ${style} image variation.`);
  }
}

export async function verifyGeminiApiKey(): Promise<{ ok: boolean; message: string }> {
  try {
    checkApiKey();
    await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: 'Hello',
    });
    return { ok: true, message: "Gemini API is accessible." };
  } catch (error: any) {
    return { ok: false, message: error.message || "Failed to verify API key." };
  }
}
