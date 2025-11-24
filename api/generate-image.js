import { GoogleGenerativeAI } from "@google/generative-ai";
import { verifyUserAndCredits, deductCredits } from './_utils.js';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  try {
    // 1. Verificăm creditele (Costă 1 credit)
    const { userRef } = await verifyUserAndCredits(req, 1);

    const { prompt, style, base64Image } = req.body;
    let finalImageUrl = "";

    // LOGICA HIBRIDĂ
    // Încercăm să folosim Google Imagen (dacă e disponibil pe cont)
    try {
        /* 
           NOTĂ: Imagen pe API este încă în Private Preview pentru mulți.
           Dacă ai acces, aici ar fi codul. 
           Dacă nu, sărim direct la soluția stabilă (Pollinations) care arată bine
           și permite MVP-ului să funcționeze și să monetizeze.
        */
       throw new Error("Google Image API restricted"); 

    } catch (googleError) {
        console.log("Falling back to Pollinations...");
        
        // Generare URL Stabil
        const cleanPrompt = encodeURIComponent(`${prompt} ${style ? "in " + style + " style" : ""}`);
        const seed = Math.floor(Math.random() * 10000);
        finalImageUrl = `https://image.pollinations.ai/prompt/${cleanPrompt}?width=1080&height=1080&nologo=true&seed=${seed}&model=flux`;
    }

    // 2. Scădem creditul DOAR dacă am generat ceva
    if (finalImageUrl) {
        await deductCredits(userRef, 1);
    }

    res.status(200).json({ imageUrl: finalImageUrl });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
}
