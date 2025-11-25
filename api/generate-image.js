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
    
    // Cost: 15 credite pt DALL-E (Premium), 2 credite pt Pollinations (Standard)
    const COST = isPremium ? 15 : 2; 

    const { userRef } = await verifyUserAndCredits(req, COST);
    let imageUrl = "";

    if (isPremium) {
        // OpenAI DALL-E 3
        const response = await openai.images.generate({
          model: "dall-e-3",
          prompt: prompt,
          n: 1,
          size: "1024x1024",
          quality: "standard",
        });
        imageUrl = response.data[0].url;
    } else {
        // Pollinations (Gratis pt tine, rapid pt user)
        const cleanPrompt = encodeURIComponent(prompt);
        const seed = Math.floor(Math.random() * 10000);
        imageUrl = `https://image.pollinations.ai/prompt/${cleanPrompt}?width=1024&height=1024&seed=${seed}&model=flux&nologo=true`;
    }

    await deductCredits(userRef, COST);

    return res.status(200).json({ imageUrl });

  } catch (error) {
    console.error("Image Error:", error);
    return res.status(500).json({ error: error.message || "Failed to generate image" });
  }
}
