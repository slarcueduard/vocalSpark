import { GoogleGenerativeAI } from "@google/generative-ai";
import { verifyUserAndCredits } from './_utils.js';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  try {
    // 1. Verificăm userul (Cost 0 credite pentru text, sau poți pune 1 dacă vrei)
    await verifyUserAndCredits(req, 0); 

    const { prompt, systemInstruction } = req.body;

    // 2. Apelăm Google AI (Server-side - aici avem acces la modele mai bune)
    // Folosim 1.5 Flash pentru viteză
    const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash",
        systemInstruction: systemInstruction 
    });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    res.status(200).json({ output: text });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
}
