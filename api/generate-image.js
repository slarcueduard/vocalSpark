import OpenAI from 'openai';
import { verifyUserAndCredits, deductCredits } from './_utils.js';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const HF_TOKEN = process.env.HUGGING_FACE_TOKEN;

// --- URL ACTUALIZAT (FIX PENTRU EROAREA 410) ---
const HF_MODEL_URL = "https://router.huggingface.co/hf-inference/models/black-forest-labs/FLUX.1-schnell";

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { prompt, isPremium, brandColors } = req.body;
    
    // Costuri: Premium 20 cr, Standard 2 cr
    const COST = isPremium ? 20 : 2; 

    const { userRef } = await verifyUserAndCredits(req, COST);
    
    let finalImageBase64 = "";

    if (isPremium) {
        // --- PREMIUM (DALL-E 3) ---
        console.log("Generating Premium Image (DALL-E 3)...");
        
        let enhancedPrompt = prompt;
        if (brandColors && brandColors.length > 0) {
            enhancedPrompt += ` Use a color palette inspired by: ${brandColors.join(', ')}.`;
        }

        const response = await openai.images.generate({
          model: "dall-e-3",
          prompt: enhancedPrompt,
          n: 1,
          size: "1024x1024",
          quality: "standard",
          response_format: "b64_json"
        });
        
        finalImageBase64 = `data:image/png;base64,${response.data[0].b64_json}`;

    } else {
        // --- STANDARD (Hugging Face - FLUX.1 Schnell) ---
        console.log("Generating Standard Image (Flux Schnell)...");
        
        if (!HF_TOKEN) {
            throw new Error("Hugging Face Token missing in Vercel Config.");
        }

        const response = await fetch(HF_MODEL_URL, {
            headers: {
                Authorization: `Bearer ${HF_TOKEN}`,
                "Content-Type": "application/json",
            },
            method: "POST",
            body: JSON.stringify({ inputs: prompt }),
        });

        if (!response.ok) {
            const err = await response.text();
            console.error("Hugging Face Error Response:", err);
            throw new Error(`Hugging Face Error: ${response.status} - ${err}`);
        }

        // Hugging Face returnează imaginea ca Blob (binary)
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        finalImageBase64 = `data:image/jpeg;base64,${buffer.toString('base64')}`;
    }

    // Scădem creditele doar dacă a reușit
    await deductCredits(userRef, COST);

    // Returnăm imaginea
    return res.status(200).json({ imageUrl: finalImageBase64 });

  } catch (error) {
    console.error("Image Gen Error:", error);
    
    const message = error.message.includes("503") 
        ? "AI Model is warming up. Please try again in 10 seconds." 
        : error.message || "Failed to generate image";
        
    return res.status(500).json({ error: message });
  }
}
