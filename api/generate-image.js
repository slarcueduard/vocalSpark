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
    const COST = isPremium ? 20 : 2; 

    const { userRef } = await verifyUserAndCredits(req, COST);
    
    let tempImageUrl = "";

    // --- 1. GENERARE URL ---
    if (isPremium) {
        // DALL-E 3
        const response = await openai.images.generate({
          model: "dall-e-3",
          prompt: prompt,
          n: 1,
          size: "1024x1024",
          quality: "standard",
        });
        tempImageUrl = response.data[0].url;
    } else {
        // Pollinations
        const cleanPrompt = encodeURIComponent(prompt.replace(/[^a-zA-Z0-9 ,]/g, ''));
        const seed = Math.floor(Math.random() * 10000);
        tempImageUrl = `https://image.pollinations.ai/prompt/${cleanPrompt}?width=1024&height=1024&seed=${seed}&model=flux-realism&nologo=true`;
    }

    // --- 2. PROXY IMAGINE (FIX CORS) ---
    // Descărcăm imaginea pe server ca să nu avem erori în browser
    const imageResponse = await fetch(tempImageUrl);
    if (!imageResponse.ok) throw new Error("Failed to fetch generated image form provider");
    
    const arrayBuffer = await imageResponse.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Image = `data:image/png;base64,${buffer.toString('base64')}`;

    // 3. Scădem banii doar dacă totul a mers
    await deductCredits(userRef, COST);

    // Returnăm imaginea direct ca date, nu ca link extern
    return res.status(200).json({ imageUrl: base64Image });

  } catch (error) {
    console.error("Image Gen Error:", error);
    return res.status(500).json({ error: error.message || "Failed to generate image" });
  }
}
