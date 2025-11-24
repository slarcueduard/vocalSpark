import { GoogleGenerativeAI } from "@google/generative-ai";
import { verifyUserAndCredits } from './_utils.js';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    // 1. Verificăm creditele
    // (Poți comenta linia asta temporar dacă vrei să testezi fără să consumi credite)
    // await verifyUserAndCredits(req, 0); 

    const { prompt, imageBase64, imageMimeType } = req.body;

    // LISTA DE MODELE DE ÎNCERCAT (În ordinea preferinței)
    const modelsToTry = [
        "gemini-1.5-flash",        // Ideal
        "gemini-1.5-flash-001",    // Versiune fixă
        "gemini-1.5-pro",          // Mai deștept
        "gemini-pro"               // Clasic (Doar text, dar merge sigur)
    ];

    let finalResponse = null;
    let lastError = null;

    // Încercăm modelele pe rând
    for (const modelName of modelsToTry) {
        try {
            console.log(`Attempting model: ${modelName}`);
            const model = genAI.getGenerativeModel({ model: modelName });
            
            let result;
            // Dacă avem imagine și modelul nu e 'gemini-pro' (care e text-only)
            if (imageBase64 && imageMimeType && !modelName.includes('gemini-pro')) {
                result = await model.generateContent([
                    { inlineData: { data: imageBase64, mimeType: imageMimeType } },
                    prompt
                ]);
            } else {
                result = await model.generateContent(prompt);
            }

            const response = await result.response;
            finalResponse = response.text();
            
            // Dacă am ajuns aici, a mers! Ieșim din buclă.
            break; 
        } catch (e) {
            console.warn(`Model ${modelName} failed: ${e.message}`);
            lastError = e;
            // Continuăm la următorul model din listă
        }
    }

    if (!finalResponse) {
        throw new Error(`All AI models failed. Last error: ${lastError?.message}`);
    }

    return res.status(200).json({ output: finalResponse });

  } catch (error) {
    console.error("API Fatal Error:", error);
    return res.status(500).json({ error: error.message || "Internal Server Error" });
  }
}
