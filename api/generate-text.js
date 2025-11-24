import { GoogleGenerativeAI } from "@google/generative-ai";
import { verifyUserAndCredits } from './_utils.js';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export default async function handler(req, res) {
  // Configurare CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    // await verifyUserAndCredits(req, 0); 

    const { prompt, imageBase64, imageMimeType } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY lipsește din Environment Variables");
    }

    // --- LISTA ACTUALIZATĂ ȘI SIMPLIFICATĂ ---
    // Scoatem versiunile specifice (ex: 1.0-pro) care dau 404
    const modelsToTry = [
        "gemini-1.5-flash", // Cel mai rapid și ieftin
        "gemini-1.5-pro",   // Cel mai deștept
        "gemini-pro"        // Versiunea veche, dar stabilă (fallback)
    ];

    let finalResponse = null;
    let errors = [];

    // Încercăm modelele pe rând
    for (const modelName of modelsToTry) {
        try {
            console.log(`Trying model: ${modelName}...`);
            const model = genAI.getGenerativeModel({ model: modelName });
            
            let result;
            
            if (imageBase64 && imageMimeType) {
                // Dacă modelul curent nu suportă imagini (gemini-pro vechi), dăm eroare intenționat ca să treacă la altul
                if (modelName === 'gemini-pro') throw new Error("Modelul gemini-pro nu suportă imagini");

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
            
            if (finalResponse) {
                console.log(`Success with ${modelName}`);
                break; 
            }
        } catch (e) {
            console.warn(`Failed ${modelName}: ${e.message}`);
            errors.push(`${modelName}: ${e.message}`);
        }
    }

    if (!finalResponse) {
        // Returnăm toate erorile ca să știm exact ce s-a întâmplat
        throw new Error(`All models failed. Details: ${JSON.stringify(errors)}`);
    }

    return res.status(200).json({ output: finalResponse });

  } catch (error) {
    console.error("API Fatal Error:", error);
    return res.status(500).json({ error: error.message || "Internal Server Error" });
  }
}
