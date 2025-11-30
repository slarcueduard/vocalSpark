import OpenAI from 'openai';
import { verifyUserAndCredits, deductCredits } from './_utils.js';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const perplexity = new OpenAI({
  apiKey: process.env.PERPLEXITY_API_KEY,
  baseURL: 'https://api.perplexity.ai'
});

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { prompt, brandContext, language, platform, objective, useRealTime, isCampaign, isRemix, remixFormats, postCount } = req.body;

    // 1. CALCUL COST
    // Single = 1
    // Campaign = postCount
    // Remix = Câte formate sunt selectate
    // RealTime = 10 (Flat fee)
    let count = 1;
    if (isCampaign) count = postCount || 3;
    if (isRemix && remixFormats) count = remixFormats.length;

    const COST = useRealTime ? 10 : (1 * count);
    
    const { userRef, userData } = await verifyUserAndCredits(req, COST);
    const tier = userData.subscriptionTier || 'trial';

    // 2. SELECTIE MODEL
    let client = openai;
    let model = "gpt-4o-mini"; 

    if (useRealTime) {
        if (tier === 'creator' || tier === 'trial') return res.status(403).json({ error: "Real-Time is PRO." });
        client = perplexity;
        model = "sonar-reasoning-pro";
    } else if (tier === 'trial' || tier === 'pro' || tier === 'agency') {
        model = "gpt-4o";
    }

    // 3. PROMPT ENGINEERING (STRATEGIA)
    const targetLanguage = language || 'English';
    
    let systemPrompt = `You are an elite Social Media Strategist.
    LANGUAGE: Write STRICTLY in ${targetLanguage}.
    
    INPUT CONTEXT:
    Brand Voice: ${brandContext || 'Professional but engaging'}
    Goal: ${objective || 'Engagement'}
    `;

    if (useRealTime) systemPrompt += `\nSOURCE: Use real-time data from TODAY.`;

    // --- LOGICA PE MODURI ---
    
    if (isRemix) {
        // === MOD REMIX (REPURPOSING) ===
        systemPrompt += `
        TASK: Repurpose the user's input content into these specific formats: ${remixFormats.join(', ')}.
        
        FORMAT DEFINITIONS:
        - "LinkedIn Post": Storytelling text, professional tone. No slides.
        - "Twitter Thread": A series of short tweets (max 280 chars). Split by double newlines.
        - "Newsletter Email": Subject line + Body. Rich text.
        - "TikTok Script": Return a JSON object with "slides" array. Each slide has "visualPrompt" (for AI image gen), "overlayText", and "voiceover".
        - "Instagram Carousel": Return a JSON object with "slides" array. Each slide has "visualPrompt" (for AI image gen) and "caption".
        - "Facebook Story": Short, punchy text + 1 visual prompt.

        OUTPUT: Return a JSON Array with ${count} objects. Each object must have:
        {
            "platform": "The Format Name",
            "content": "The text content or script",
            "type": "text" | "script" | "carousel" | "thread",
            "slides": [] (ONLY if type is script/carousel)
        }
        `;
    
    } else if (isCampaign) {
        // === MOD CAMPANIE ===
        systemPrompt += `
        TASK: Create a ${count}-part Content Series (Calendar) about: "${prompt}".
        STRATEGY: Create a cohesive sequence (Teaser -> Value -> Sales -> Proof).
        OUTPUT: Return a JSON Array with exactly ${count} post objects.
        `;
    
    } else {
        // === MOD SINGLE (STRICT) ===
        systemPrompt += `
        TASK: Write EXACTLY ONE high-impact post about: "${prompt}".
        PLATFORM: ${platform}.
        OUTPUT: Return a JSON Array with EXACTLY 1 object. Do NOT generate variations.
        `;
    }

    // 4. EXECUȚIE
    const completion = await client.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt }
      ],
      model: model,
      temperature: 0.7,
    });

    const output = completion.choices[0].message.content;

    await deductCredits(userRef, COST);
    return res.status(200).json({ output });

  } catch (error) {
    console.error("Gen Error:", error);
    return res.status(500).json({ error: error.message });
  }
}
