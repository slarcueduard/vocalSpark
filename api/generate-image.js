import OpenAI from 'openai';
import { verifyUserAndCredits, deductCredits } from './_utils.js';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req, res) {
  // Setăm timeout-ul mai mare pentru această funcție specifică (Node.js helper)
  // Deși vercel.json controlează limita hard, asta ajută la configurarea internă
  
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { prompt, isPremium } = req.body;
    const COST = isPremium ? 20 : 2; 

    const { userRef } = await verifyUserAndCredits(req, COST);
    
    let imageUrl = "";

    if (isPremium) {
        // --- PREMIUM (DALL-E 3) ---
        // OPTIMIZARE: Nu mai folosim GPT-4o pentru rescriere prompt ca să câștigăm timp
        // Trimitem promptul direct sau cu o minimă modificare string
        const finalPrompt = `Photorealistic, highly detailed: ${prompt}`;

        const response = await openai.images.generate({
          model: "dall-e-3",
          prompt: finalPrompt,
          n: 1,
          size: "1024x1024",
          quality: "standard",
        });
        
        // CRITIC: Returnăm URL-ul direct! Nu îl descărcăm aici.
        // Descărcarea o facem în frontend prin proxy dacă e nevoie.
        imageUrl = response.data[0].url;

    } else {
        // --- STANDARD (Pollinations) ---
        const safePrompt = prompt.replace(/[^a-zA-Z0-9 ,]/g, '');
        const cleanPrompt = encodeURIComponent(safePrompt);
        const seed = Math.floor(Math.random() * 1000000);
        imageUrl = `https://image.pollinations.ai/prompt/${cleanPrompt}?width=1024&height=1024&seed=${seed}&model=flux-realism&nologo=true`;
    }

    // Scădem creditele
    await deductCredits(userRef, COST);

    return res.status(200).json({ imageUrl });

  } catch (error) {
    console.error("Image Gen Error:", error);
    // Mesaj mai clar pentru erori
    return res.status(500).json({ error: error.message || "Image generation timed out or failed." });
  }
}
