import { GoogleGenerativeAI } from "@google/generative-ai";
import { verifyUserAndCredits } from './_utils.js';

// Asigură-te că în .env (Vercel) ai variabila GEMINI_API_KEY
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export default async function handler(req, res) {
  // Configurare CORS (permite apeluri de pe frontend-ul tău)
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // 1. Verificăm creditele (decomentează când ești gata de producție)
    // await verifyUserAndCredits(req, 0); 

    const { prompt, imageBase64, imageMimeType } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is missing in environment variables.");
    }

    // Lista de modele: Prioritizăm flash (rapid/ieftin), fallback pe pro.
    const modelsToTry = [
        "gemini-1.5-flash",
        "gemini-1.5-pro",
        "gemini-1.0-pro" 
    ];

    let finalResponse = null;
    let lastError = null;

    for (const modelName of modelsToTry) {
        try {
            // Dacă avem imagine, sărim peste modelele care nu suportă imagini (ex: gemini-1.0-pro simplu uneori)
            // Totuși 1.5 suportă tot.
            const model = genAI.getGenerativeModel({ model: modelName });
            
            let result;
            
            // Logica pentru Imagine + Text vs Doar Text
            if (imageBase64 && imageMimeType) {
                // Conversie base64 curată (elimină header-ul data:image/...)
                const base64Data = imageBase64.includes('base64,') 
                    ? imageBase64.split('base64,')[1] 
                    : imageBase64;

                result = await model.generateContent([
                    { inlineData: { data: base64Data, mimeType: imageMimeType } },
                    prompt || "Describe this image"
                ]);
            } else {
                result = await model.generateContent(prompt);
            }

            const response = await result.response;
            finalResponse = response.text();
            
            if (finalResponse) break; // Succes!

        } catch (e) {
            console.warn(`Model ${modelName} failed: ${e.message}`);
            lastError = e;
        }
    }

    if (!finalResponse) {
        throw new Error(`AI Service Unavailable: ${lastError?.message}`);
    }

    return res.status(200).json({ output: finalResponse });

  } catch (error) {
    console.error("API Fatal Error:", error);
    return res.status(500).json({ error: error.message || "Internal Server Error" });
  }
}
