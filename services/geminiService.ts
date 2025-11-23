// --- Helper to get image description first (Vision) ---
async function describeImage(base64ImageData: string, mimeType: string): Promise<string> {
  const model = 'gemini-2.0-flash'; // Stable model is great at vision
  const prompt = "Describe this image in vivid detail. Focus on the subject, composition, lighting, and colors. Keep it under 50 words.";

  try {
    const response = await new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY || "" })
      .getGenerativeModel({ model })
      .generateContent({
        contents: [
            { role: 'user', parts: [
                { inlineData: { data: base64ImageData, mimeType: mimeType } },
                { text: prompt }
            ]}
        ]
      });
    return response.response.text();
  } catch (e) {
    console.warn("Failed to describe image, falling back to generic prompt.", e);
    return "a photo of a subject";
  }
}

// --- UPDATED: Generate Image Variation (The Two-Step Fix) ---
export async function generateImageVariation(
  base64ImageData: string,
  mimeType: string,
  style: string
): Promise<string> {
  checkApiKey();
  
  // Step 1: See the image (Vision)
  // We describe the image first so we can regenerate it with the new style
  const imageDescription = await describeImage(base64ImageData, mimeType);
  
  // Step 2: Draw the new image (Generation)
  // We use the experimental model which supports Image Generation
  const model = 'gemini-2.0-flash-exp'; 
  
  let prompt = "";
  // Magic Edit Logic vs Style Logic
  if (style.startsWith("Magic Edit:")) {
    const editInstruction = style.replace("Magic Edit:", "").trim();
    prompt = `Generate a high-quality image based on this description: "${imageDescription}". 
    Apply this specific edit: ${editInstruction}.
    Ensure the composition remains similar to the description.`;
  } else {
    // Style Logic
    const stylePrompts: Record<string, string> = {
        'Face Retouch': "Ensure professional studio lighting, smooth skin texture, and clear focus.",
        'Sharpen Portrait': "High resolution, sharp focus, detailed features, 8k photography.",
        'Studio Lighting': "Professional studio lighting, rim lighting, soft shadows, balanced exposure.",
        'Neon Noir': "Cyberpunk aesthetic, neon pink and blue lighting, dark rainy atmosphere, high contrast, cinematic.",
        'Fantasy Art': "Digital fantasy painting style, magical atmosphere, glowing effects, detailed brushwork.",
        'Cyberpunk': "Futuristic sci-fi style, high tech, neon lights, chrome details, urban dystopian background.",
        'Vintage Film': "Retro 35mm film aesthetic, grain, warm colors, nostalgic feel.",
        'Watercolor': "Watercolor painting style, soft edges, pastel colors, artistic paper texture.",
        'Pixar Animation': "3D animated movie style, cute features, bright lighting, smooth rendering.",
        'Pop Art': "Andy Warhol style, bold outlines, vibrant primary colors, comic book aesthetic.",
        'Gothic Noir': "Dark, mysterious, monochromatic or desaturated colors, dramatic shadows, victorian gothic vibe.",
        'Line Art': "Minimalist black and white line drawing, clean strokes, white background."
    };
    
    const specificStyle = stylePrompts[style] || `Apply the ${style} art style.`;
    
    prompt = `Generate a high-quality image.
    Subject Description: ${imageDescription}
    Artistic Style: ${specificStyle}
    Make sure the image matches the description but strictly follows the requested style.`;
  }
  
  try {
    const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY || "" });
    const response = await ai.getGenerativeModel({ 
        model: model,
        generationConfig: { responseModalities: ["IMAGE"] as any } // Force Image Mode
    }).generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });

    const candidate = response.response.candidates?.[0];
    if (candidate?.content?.parts) {
        for (const part of candidate.content.parts) {
            if (part.inlineData) {
                return `data:image/png;base64,${part.inlineData.data}`;
            }
        }
    }
    throw new Error("No image data returned.");

  } catch (error) {
    console.error(`Error generating variation for ${style}:`, error);
    throw new Error(`Failed to generate ${style} variation. Please try again.`);
  }
}

// --- UPDATED: Generate Image From Text (Ensure correct model) ---
export async function generateImageForPost(postText: string, brandProfile?: BrandProfile): Promise<string> {
  checkApiKey();
  const model = 'gemini-2.0-flash-exp'; // Only the EXP model does images right now
  
  let styleContext = brandProfile ? `Style context: ${brandProfile.description}` : "";
  const prompt = `Generate a high-quality social media image. Subject: "${postText}". ${styleContext}. No text in the image.`;

  try {
    const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY || "" });
    const response = await ai.getGenerativeModel({ 
        model: model,
        generationConfig: { responseModalities: ["IMAGE"] as any }
    }).generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }]
    });

    const candidate = response.response.candidates?.[0];
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
    throw new Error("Failed to generate image.");
  }
}
