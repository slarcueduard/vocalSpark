import { GoogleGenAI, Modality, Type } from "@google/genai";
import { Post, Tone, Platform, RefinementType } from "../types";

// VITE CHANGE: We use import.meta.env.VITE_... instead of process.env
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

if (!apiKey) {
  console.error("Missing VITE_GEMINI_API_KEY. Please check your .env file or Vercel settings.");
}

const ai = new GoogleGenAI({ apiKey: apiKey || "MISSING_KEY" });

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

export async function generateSocialMediaPosts(
  topic: string,
  tone: Tone,
  postCount: number,
  language: string,
  brandVoice: string,
): Promise<Omit<Post, 'id' | 'imageUrl' | 'isGeneratingImage' | 'adaptedContent'>[]> {
  const model = 'gemini-2.0-flash'; // Updated to standard model name, verify if '2.5' exists in your region
  
  let prompt = `You are an expert social media manager. Generate ${postCount} engaging and versatile social media posts about "${topic}".
The posts should form a cohesive campaign and be suitable for various platforms like Instagram, TikTok, Facebook, and X (Twitter).
The desired tone is ${tone}.
Ensure each post is concise and includes relevant hashtags.`;

  if (language && language.toLowerCase() !== 'english') {
    prompt += `\nThe posts must be written in ${language}.`;
  }

  if (brandVoice.trim()) {
    prompt += `\nIt is crucial to match the following brand voice and style: "${brandVoice}". Analyze its tone, sentence structure, and vocabulary, and apply it to all generated posts.`;
  }

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
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

    // Defensive coding: check if response exists
    if (!response.text) {
        throw new Error("Empty response from AI");
    }

    const parsedResponse = JSON.parse(response.text()) as { content: string }[]; // .text() is usually a function in newer SDKs
    return parsedResponse.map(p => ({ content: p.content }));

  } catch (error) {
    console.error("Error generating social media posts:", error);
    throw new Error("Failed to generate posts from AI.");
  }
}

export async function generateImageForPost(postText: string): Promise<string> {
  const model = 'gemini-2.0-flash'; // Ensure model name is correct for image generation
  const prompt = `Create a vibrant, high-quality, and visually appealing image that is highly relevant for a social media post with the following text. The image should be eye-catching and suitable for platforms like Instagram. Do not include any text in the image. Post text: "${postText}"`;

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

    // Fixed access pattern for newer SDKs
    if (response.candidates && response.candidates[0].content.parts) {
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                const base64ImageBytes: string = part.inlineData.data;
                return `data:image/png;base64,${base64ImageBytes}`;
            }
        }
    }
    throw new Error("No image data found in response.");

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
    [Platform.TikTok]: "Transform this into a TikTok video idea or script. The response should be formatted as a caption. Make the caption short, catchy, and include 3-4 trending or relevant hashtags. Suggest on-screen text if applicable."
  };

  return `${basePrompt} ${platformInstructions[platform]}\n\nOriginal post:\n"${originalContent}"`;
};

export async function adaptPostForPlatform(originalContent: string, platform: Platform): Promise<string> {
  const model = 'gemini-2.0-flash';
  const prompt = getPlatformAdaptationPrompt(originalContent, platform);

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });
    return response.text() || "";
  } catch (error) {
    console.error(`Error adapting post for ${platform}:`, error);
    throw new Error(`Failed to adapt post for ${platform}.`);
  }
}

export async function refinePostContent(content: string, type: RefinementType): Promise<string> {
  const model = 'gemini-2.0-flash';
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
    return response.text() || "";
  } catch (error) {
    console.error(`Error refining post for type ${type}:`, error);
    throw new Error(`Failed to refine post.`);
  }
}

export async function generateImageVariation(
  base64ImageData: string,
  mimeType: string,
  style: string
): Promise<string> {
  const model = 'gemini-2.0-flash';
  let prompt: string;

  switch (style) {
    case 'Subtle Enhance':
      prompt = "Perform a subtle, professional photo enhancement on this image. Improve lighting, sharpen details, and slightly smooth skin tones to make the subject look their best, while keeping the result natural and realistic. Do not change the composition or add artistic effects.";
      break;
    case 'Portrait Pop':
      prompt = "Perform a professional portrait enhancement. Focus on the main person in the image. Subtly enhance facial features, improve lighting on the subject, and create a soft, gentle background blur (bokeh effect) to make the person stand out. The result should be natural and flattering.";
      break;
    case 'Vibrant Scenery':
      prompt = "Enhance this scenery photo. Boost the natural colors to make them more vivid, increase the overall clarity and sharpness of the landscape, and improve the lighting to make the scene look more dynamic and appealing. Do not add or remove elements, just enhance what is there.";
      break;
    case 'Product Pro':
      prompt = "Treat this as a professional product photograph. Enhance the image to make the main product stand out. Create clean, studio-like lighting, sharpen the product's details, and ensure the colors are accurate and appealing. The background should be clean and non-distracting. The final image should look like it's ready for an e-commerce website.";
      break;
    default:
      prompt = `Recreate this image in a ${style} style. Preserve the main subject and composition, but transform the artistic style completely.`;
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

    if (response.candidates && response.candidates[0].content.parts) {
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                const base64ImageBytes: string = part.inlineData.data;
                return `data:image/png;base64,${base64ImageBytes}`;
            }
        }
    }
    throw new Error("No image data found in response for variation.");

  } catch (error) {
    console.error(`Error generating image variation for style ${style}:`, error);
    throw new Error(`Failed to generate ${style} image variation from AI.`);
  }
}
