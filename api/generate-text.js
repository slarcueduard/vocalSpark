import OpenAI from 'openai';
import { verifyUserAndCredits, deductCredits } from './_utils.js';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req, res) {
  // CORS Configuration
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    // 1. Verify Credits (Cost: 1 Credit for Text)
    const { userRef } = await verifyUserAndCredits(req, 1);

    const { prompt, brandContext, platform } = req.body;

    // --- THE WOW FACTOR: SMART SYSTEM PROMPT ---
    let systemPrompt = "You are an expert Social Media Manager. Generate engaging, viral content.";
    
    // If user has a Brand Profile (Creator/Pro/Agency), we inject it here
    if (brandContext) {
      systemPrompt += `\n\nCRITICAL INSTRUCTION: Adopt the following Brand Voice strictly:\n${brandContext}`;
    }

    // Platform optimization
    if (platform) {
      systemPrompt += `\n\nOptimize specifically for ${platform} (hashtags, formatting, length).`;
    }

    // 2. Call OpenAI
    const completion = await openai.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt }
      ],
      model: "gpt-4o-mini", // Fast, Cheap, Smart
      temperature: 0.7,
    });

    const output = completion.choices[0].message.content;

    // 3. Deduct Credits
    await deductCredits(userRef, 1);

    return res.status(200).json({ output });

  } catch (error) {
    console.error("OpenAI Text Error:", error);
    return res.status(500).json({ error: error.message || "Failed to generate text" });
  }
   const { prompt, brandContext, platform, language } = req.body; // <--- Primim language

    let systemPrompt = "You are an expert Social Media Manager. Generate engaging, viral content.";
    
    // REGULA DE AUR: Limba
    // Dacă primim limba din frontend, o forțăm. Dacă nu, default English.
    const targetLanguage = language || 'English';
    systemPrompt += `\n\nIMPORTANT: You MUST write the content strictly in ${targetLanguage}.`;

    if (brandContext) {
      systemPrompt += `\n\nAdopt this Brand Voice: ${brandContext}`;
    }
}
