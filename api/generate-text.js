import { GoogleGenerativeAI } from "@google/generative-ai";

// Folosim cheia de pe server (fără VITE_)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export default async function handler(req, res) {
  // Permitem doar POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { prompt, imageBase64, imageMimeType } = req.body;

    // AICI ESTE FIX-UL: Folosim modelul 'gemini-1.5-flash' pe server
    // Pe server nu avem restricțiile din browser, deci merge perfect.
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    let result;
    
    // Suport Multimodal (Text + Imagine)
    if (imageBase64 && imageMimeType) {
        const imageData = {
            inlineData: {
                data: imageBase64,
                mimeType: imageMimeType
            }
        };
        result = await model.generateContent([imageData, prompt]);
    } else {
        // Doar text
        result = await model.generateContent(prompt);
    }

    const response = await result.response;
    const text = response.text();

    return res.status(200).json({ output: text });

  } catch (error) {
    console.error("API Error:", error);
    return res.status(500).json({ error: error.message || "Internal Server Error" });
  }
}
