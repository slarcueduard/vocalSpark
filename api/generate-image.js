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
        // Aici avem nevoie de Base64 pentru că URL-ul expiră
        console.log("Generating Premium...");
        let enhancedPrompt = prompt;
        if (brandColors?.length) enhancedPrompt += ` Colors: ${brandColors.join(', ')}.`;

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
        // --- STANDARD (Pollinations) ---
        // NU descărcăm pe server (evităm Timeout 504). Trimitem URL direct.
        // Frontend-ul îl va afișa în <img> instant.
        console.log("Generating Standard (URL Only)...");
        
        const safePrompt = encodeURIComponent(prompt.replace(/[^a-zA-Z0-9 ,]/g, ''));
        const seed = Math.floor(Math.random() * 100000);
        
        // Folosim modelul 'flux' simplu, e cel mai rapid
        imageUrl = `https://image.pollinations.ai/prompt/${safePrompt}?width=1024&height=1024&seed=${seed}&model=flux&nologo=true`;
    }

    await deductCredits(userRef, COST);

    return res.status(200).json({ imageUrl });

  } catch (error) {
    console.error("Image Gen Error:", error);
    return res.status(500).json({ error: error.message });
  }
}
