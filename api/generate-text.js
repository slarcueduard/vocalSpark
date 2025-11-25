import OpenAI from 'openai';
import { verifyUserAndCredits, deductCredits } from './_utils.js';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req, res) {
  // Configurare CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    // 1. Verificăm creditele (Cost: 1 credit)
    const { userRef } = await verifyUserAndCredits(req, 1);

    const { prompt } = req.body;

    // 2. Apelăm OpenAI
    const completion = await openai.chat.completions.create({
      messages: [
        { role: "system", content: "You are an expert Social Media Manager. Generate engaging, viral content." },
        { role: "user", content: prompt }
      ],
      model: "gpt-4o-mini", // Rapid, ieftin și deștept
    });

    const output = completion.choices[0].message.content;

    // 3. Scădem creditele doar dacă a reușit
    await deductCredits(userRef, 1);

    return res.status(200).json({ output });

  } catch (error) {
    console.error("OpenAI Text Error:", error);
    return res.status(500).json({ error: error.message || "Failed to generate text" });
  }
}
