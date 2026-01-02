import OpenAI from 'openai';
import { verifyUserAndCredits, deductCredits } from './_utils.js';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { prompt, isPremium, brandColors } = req.body;
    const COST = isPremium ? 20 : 2;

    const { userRef } = await verifyUserAndCredits(req, COST);

    let imageUrl = "";

    if (isPremium) {
      // --- PREMIUM (DALL-E 3) ---
      // Aici așteptăm, că e DALL-E și merită
      let enhancedPrompt = prompt;
      // Removed brand color injection to prevent DALL-E 3 from rendering color palettes/swatches on the image.
      // if (brandColors?.length) enhancedPrompt += ...

      const response = await openai.images.generate({
        model: "dall-e-3",
        prompt: enhancedPrompt,
        n: 1,
        size: "1024x1024",
        quality: "standard",
        response_format: "b64_json"
      });

      imageUrl = `data:image/png;base64,${response.data[0].b64_json}`;

    } else {
      // --- STANDARD (DALL-E 2) ---
      // Replacing deprecated Pollinations with DALL-E 2 (Reliable, fast, affordable)
      const response = await openai.images.generate({
        model: "dall-e-2",
        prompt: prompt.substring(0, 400), // DALL-E 2 limit
        n: 1,
        size: "512x512",
        response_format: "b64_json"
      });

      imageUrl = `data:image/png;base64,${response.data[0].b64_json}`;
    }

    // Scădem creditele
    await deductCredits(userRef, COST);

    return res.status(200).json({ imageUrl });

  } catch (error) {
    console.error("Image Gen Error:", error);
    return res.status(500).json({ error: error.message || "Failed to generate image" });
  }
}
