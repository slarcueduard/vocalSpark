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
    
    let finalImageUrl = "";

    if (isPremium) {
        // --- PREMIUM (DALL-E 3) ---
        let enhancedPrompt = prompt;
        try {
             const enhancement = await openai.chat.completions.create({
                messages: [
                    { role: "system", content: "Rewrite this image prompt to be photorealistic, highly detailed, and artistic. Keep it concise." },
                    { role: "user", content: prompt }
                ],
                model: "gpt-4o-mini",
            });
            enhancedPrompt = enhancement.choices[0].message.content;
        } catch (e) {}

        const response = await openai.images.generate({
          model: "dall-e-3",
          prompt: enhancedPrompt,
          n: 1,
          size: "1024x1024",
          quality: "standard",
        });
        
        // Proxy prin server pentru a evita CORS
        const tempUrl = response.data[0].url;
        const imageResponse = await fetch(tempUrl);
        const arrayBuffer = await imageResponse.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        finalImageUrl = `data:image/png;base64,${buffer.toString('base64')}`;

    } else {
        // --- STANDARD (Pollinations) ---
        // FIX: Folosim un prompt mult mai simplu și modelul 'flux' standard care e cel mai stabil
        // Eliminăm orice caracter care nu e literă/cifră pentru a nu sparge URL-ul
        const safePrompt = prompt.replace(/[^a-zA-Z0-9 ,]/g, '');
        const cleanPrompt = encodeURIComponent(safePrompt);
        const seed = Math.floor(Math.random() * 1000000);
        
        // URL simplificat care merge 100%
        finalImageUrl = `https://image.pollinations.ai/prompt/${cleanPrompt}?width=1024&height=1024&seed=${seed}&model=flux&nologo=true`;
    }

    await deductCredits(userRef, COST);

    return res.status(200).json({ imageUrl: finalImageUrl });

  } catch (error) {
    console.error("Image Gen Error:", error);
    return res.status(500).json({ error: error.message || "Failed to generate image" });
  }
}
