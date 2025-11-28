import OpenAI from 'openai';
import { verifyUserAndCredits, deductCredits } from './_utils.js';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
// Fallback URL pentru Standard (dacă HuggingFace nu răspunde, folosim Pollinations)
const POLLINATIONS_URL = "https://image.pollinations.ai/prompt";

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    // Primim și 'topic' acum pentru context
    const { prompt, isPremium, brandColors, topic } = req.body;
    const COST = isPremium ? 20 : 2; 

    const { userRef } = await verifyUserAndCredits(req, COST);
    
    let finalImageUrl = "";

    if (isPremium) {
        // --- PREMIUM (DALL-E 3) ---
        
        // 1. CONSTRUIRE "SUPER PROMPT" CU PRIORITĂȚI
        // Folosim GPT-4o-mini să rescrie promptul respectând regulile tale stricte
        let systemInstruction = `
        You are an expert AI Art Prompt Engineer for DALL-E 3.
        Your goal is to write ONE concise, highly detailed visual description.
        
        PRIORITY RULES:
        1. HIGH PRIORITY: The specific User Image Prompt provided. This is the core subject.
        2. MEDIUM PRIORITY: The Content Topic ("${topic || ''}"). Use this only to add context if the user prompt is vague.
        3. LOW PRIORITY: Brand Colors (${brandColors ? brandColors.join(', ') : 'None'}). Use these subtly for lighting or accents.
        4. IGNORE: Any non-visual brand info (like 'Target Audience' or 'Tone').
        
        OUTPUT: A single paragraph describing the image visually (lighting, camera angle, subject).
        `;

        let enhancedPrompt = prompt;
        try {
             const enhancement = await openai.chat.completions.create({
                messages: [
                    { role: "system", content: systemInstruction },
                    { role: "user", content: prompt }
                ],
                model: "gpt-4o-mini",
            });
            enhancedPrompt = enhancement.choices[0].message.content;
        } catch (e) {
            console.warn("Prompt enhancement failed, using original.");
        }

        // 2. GENERARE
        const response = await openai.images.generate({
          model: "dall-e-3",
          prompt: enhancedPrompt,
          n: 1,
          size: "1024x1024",
          quality: "standard",
        });
        
        // 3. PROXY (Fix CORS)
        const tempUrl = response.data[0].url;
        const imageResponse = await fetch(tempUrl);
        const arrayBuffer = await imageResponse.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        finalImageUrl = `data:image/png;base64,${buffer.toString('base64')}`;

    } else {
        // --- STANDARD (Pollinations - Varianta Stabilă) ---
        // Aici combinăm manual textul pentru că nu avem "Brain" intermediar
        let comboPrompt = prompt;
        if (topic && prompt.length < 20) comboPrompt += ` related to ${topic}`;
        
        // Curățăm promptul
        const safePrompt = encodeURIComponent(comboPrompt.replace(/[^a-zA-Z0-9 ,]/g, ''));
        const seed = Math.floor(Math.random() * 1000000);
        finalImageUrl = `${POLLINATIONS_URL}/${safePrompt}?width=1024&height=1024&seed=${seed}&model=flux&nologo=true`;
    }

    await deductCredits(userRef, COST);

    return res.status(200).json({ imageUrl: finalImageUrl });

  } catch (error) {
    console.error("Image Gen Error:", error);
    return res.status(500).json({ error: error.message || "Failed to generate image" });
  }
}
