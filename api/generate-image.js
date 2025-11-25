import OpenAI from 'openai';
import { verifyUserAndCredits, deductCredits } from './_utils.js';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { prompt, isPremium } = req.body;
    
    // Prețuri
    const COST = isPremium ? 20 : 2; 

    // 1. Verificăm banii
    const { userRef } = await verifyUserAndCredits(req, COST);
    
    let imageUrl = "";

    // --- PASUL SECRET: ÎMBUNĂTĂȚIRE PROMPT (Doar pt Premium) ---
    let finalPrompt = prompt;
    if (isPremium) {
        try {
            const enhancement = await openai.chat.completions.create({
                messages: [
                    { role: "system", content: "You are a DALL-E 3 Prompt Engineer. Rewrite the user's prompt to be highly detailed, artistic, and photorealistic. Keep it under 100 words. Return ONLY the prompt." },
                    { role: "user", content: prompt }
                ],
                model: "gpt-4o-mini",
            });
            finalPrompt = enhancement.choices[0].message.content;
            console.log("Original:", prompt);
            console.log("Enhanced:", finalPrompt);
        } catch (e) {
            console.warn("Prompt enhancement failed, using original.");
        }
    }

    if (isPremium) {
        // --- PREMIUM (DALL-E 3) ---
        const response = await openai.images.generate({
          model: "dall-e-3",
          prompt: finalPrompt, // Folosim promptul "tunat"
          n: 1,
          size: "1024x1024",
          quality: "standard",
        });
        imageUrl = response.data[0].url;
    } else {
        // --- STANDARD (Pollinations) ---
        // FIX: Curățăm promptul de caractere ciudate care sparg URL-ul
        const cleanPrompt = encodeURIComponent(prompt.replace(/[^a-zA-Z0-9 ,]/g, ''));
        const seed = Math.floor(Math.random() * 10000);
        // Folosim un model specific care e mai stabil (Flux-Realism)
        imageUrl = `https://image.pollinations.ai/prompt/${cleanPrompt}?width=1024&height=1024&seed=${seed}&model=flux-realism&nologo=true`;
    }

    // 2. Scădem banii
    await deductCredits(userRef, COST);

    return res.status(200).json({ imageUrl });

  } catch (error) {
    console.error("Image Gen Error:", error);
    return res.status(500).json({ error: error.message || "Failed to generate image" });
  }
}
