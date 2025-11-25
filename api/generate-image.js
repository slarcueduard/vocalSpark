import OpenAI from 'openai';
import { verifyUserAndCredits, deductCredits } from './_utils.js';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { prompt, isPremium } = req.body;
    
    // --- LISTA DE PREȚURI ---
    // Premium (DALL-E 3) = 20 Credite
    // Standard (Pollinations) = 2 Credite
    const COST = isPremium ? 20 : 2; 

    // 1. Verificăm creditele
    const { userRef } = await verifyUserAndCredits(req, COST);
    
    let imageUrl = "";

    if (isPremium) {
        // --- PREMIUM: DALL-E 3 (OpenAI) ---
        // Calitate maximă, prompt respectat cu strictețe. Durează 10-15 sec.
        const response = await openai.images.generate({
          model: "dall-e-3",
          prompt: prompt,
          n: 1,
          size: "1024x1024",
          quality: "standard",
        });
        imageUrl = response.data[0].url;
    } else {
        // --- STANDARD: Pollinations (Flux) ---
        // Generare instantanee (Client side feeling), calitate bună, gratis.
        const cleanPrompt = encodeURIComponent(prompt);
        const seed = Math.floor(Math.random() * 100000);
        // Parametrul 'nologo=true' și 'model=flux' sunt esențiale
        imageUrl = `https://image.pollinations.ai/prompt/${cleanPrompt}?width=1080&height=1080&seed=${seed}&model=flux&nologo=true`;
    }

    // 2. Scădem creditele
    await deductCredits(userRef, COST);

    return res.status(200).json({ imageUrl, cost: COST });

  } catch (error) {
    console.error("Image Error:", error);
    return res.status(500).json({ error: error.message || "Failed to generate image" });
  }
}
