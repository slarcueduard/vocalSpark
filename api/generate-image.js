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
    
    let finalImageUrl = "";

    if (isPremium) {
        // --- PREMIUM (DALL-E 3) ---
        let enhancedPrompt = prompt;
        
        // Injectăm culorile de brand dacă există
        let colorInstruction = "";
        if (brandColors && brandColors.length > 0) {
            colorInstruction = ` Use a color palette inspired by: ${brandColors.join(', ')}.`;
        }

        try {
             const enhancement = await openai.chat.completions.create({
                messages: [
                    { role: "system", content: "Rewrite this image prompt to be photorealistic, highly detailed, and artistic. Keep it concise." },
                    { role: "user", content: prompt + colorInstruction }
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
        
        // Proxy prin server pentru DALL-E (CORS Fix)
        const tempUrl = response.data[0].url;
        const imageResponse = await fetch(tempUrl);
        const arrayBuffer = await imageResponse.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        finalImageUrl = `data:image/png;base64,${buffer.toString('base64')}`;

    } else {
        // --- STANDARD (Pollinations) ---
        // FIX: Folosim modelul 'flux' simplu (cel mai rapid și stabil)
        // Codăm promptul complet pentru a suporta spații și caractere speciale
        const encodedPrompt = encodeURIComponent(prompt);
        
        // Adăugăm un seed aleatoriu pentru a avea rezultate diferite la același prompt
        const seed = Math.floor(Math.random() * 1000000);
        
        // Construim URL-ul direct
        finalImageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&model=flux&nologo=true&seed=${seed}`;
    }

    await deductCredits(userRef, COST);

    return res.status(200).json({ imageUrl: finalImageUrl });

  } catch (error) {
    console.error("Image Gen Error:", error);
    return res.status(500).json({ error: error.message || "Failed to generate image" });
  }
}
