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
        let enhancedPrompt = prompt;
        if (brandColors?.length) enhancedPrompt += ` Colors: ${brandColors.join(', ')}.`;

        const response = await openai.images.generate({
          model: "dall-e-3",
          prompt: enhancedPrompt,
          n: 1,
          size: "1024x1024",
          quality: "standard",
          response_format: "b64_json" // Base64 direct
        });
        
        imageUrl = `data:image/png;base64,${response.data[0].b64_json}`;

    } else {
        // --- STANDARD (Pollinations - Stabil) ---
        // Curățăm promptul și îl codăm URL safe
        const safePrompt = encodeURIComponent(prompt.substring(0, 500));
        const seed = Math.floor(Math.random() * 100000);
        
        // Construim URL-ul Pollinations
        const pollinationUrl = `https://image.pollinations.ai/prompt/${safePrompt}?width=1024&height=1024&seed=${seed}&model=flux&nologo=true`;

        // Descărcăm imaginea pe server și o trimitem ca Base64 pentru a evita erorile de Canvas/CORS în frontend
        const imageResponse = await fetch(pollinationUrl);
        if (!imageResponse.ok) throw new Error("Standard generation failed");
        
        const arrayBuffer = await imageResponse.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        imageUrl = `data:image/jpeg;base64,${buffer.toString('base64')}`;
    }

    await deductCredits(userRef, COST);

    return res.status(200).json({ imageUrl });

  } catch (error) {
    console.error("Image Gen Error:", error);
    return res.status(500).json({ error: error.message || "Failed to generate image" });
  }
}
