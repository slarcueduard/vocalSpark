import OpenAI from 'openai';
import { verifyUserAndCredits, deductCredits } from './_utils.js';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req, res) {
  // CORS Configuration
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { prompt, isPremium } = req.body;
    const COST = isPremium ? 20 : 2; 

    const { userRef } = await verifyUserAndCredits(req, COST);
    
    let finalImageUrl = "";

    // --- LOGICA HIBRIDĂ ---
    if (isPremium) {
        // >>> PREMIUM (DALL-E 3) - TRECE PRIN PROXY (Backend) <<<
        // DALL-E are URL-uri care expiră și reguli CORS stricte, deci trebuie procesat de server.
        
        // 1. Îmbunătățire Prompt cu GPT-4o
        let enhancedPrompt = prompt;
        try {
             const enhancement = await openai.chat.completions.create({
                messages: [
                    { role: "system", content: "Rewrite this image prompt to be photorealistic and highly detailed." },
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
        
        const tempUrl = response.data[0].url;

        // Download și conversie la Base64 pe server
        const imageResponse = await fetch(tempUrl);
        const arrayBuffer = await imageResponse.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        finalImageUrl = `data:image/png;base64,${buffer.toString('base64')}`;

    } else {
        // >>> STANDARD (Pollinations) - DIRECT URL (Fără Proxy) <<<
        // Pollinations permite hotlinking. Trimitem URL-ul direct browserului.
        // Asta rezolvă eroarea 504 Gateway Timeout!
        
        const cleanPrompt = encodeURIComponent(prompt.replace(/[^a-zA-Z0-9 ,]/g, ''));
        const seed = Math.floor(Math.random() * 10000);
        finalImageUrl = `https://image.pollinations.ai/prompt/${cleanPrompt}?width=1024&height=1024&seed=${seed}&model=flux-realism&nologo=true`;
    }

    // 3. Scădem banii
    await deductCredits(userRef, COST);

    return res.status(200).json({ imageUrl: finalImageUrl });

  } catch (error) {
    console.error("Image Gen Error:", error);
    return res.status(500).json({ error: error.message || "Failed to generate image" });
  }
}
