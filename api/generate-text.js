import OpenAI from 'openai';
import { verifyUserAndCredits, deductCredits } from './_utils.js';

// Client OpenAI Standard
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Client Perplexity (Folosește SDK-ul OpenAI dar cu alt URL)
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
    const { prompt, brandContext, language, platform, objective, useRealTime } = req.body;

    // 1. CALCULĂM COSTUL
    // Real-Time (Perplexity) = 10 Credite (ROI Protection)
    // Text Standard = 1 Credit
    const COST = useRealTime ? 10 : 1;

    // 2. Verificăm Userul și Creditele
    const { userRef, userData } = await verifyUserAndCredits(req, COST);
    const tier = userData.subscriptionTier || 'trial';

    // 3. PROTECȚIE: Doar PRO și AGENCY au acces la Real-Time
    if (useRealTime && (tier === 'creator' || tier === 'trial')) {
        // Trial teoretic ar putea avea acces ca demo, dar pentru siguranță îl lăsăm doar pe Pro/Agency momentan
        // Dacă vrei și la trial, adaugă 'trial' în condiția de mai jos
        return res.status(403).json({ error: "Real-Time Search is a PRO feature. Please upgrade." });
    }

    // 4. SELECTĂM CLIENTUL ȘI MODELUL
    let client = openai;
    let model = "gpt-4o-mini"; // Default fallback
    
    if (useRealTime) {
        client = perplexity;
        model = "sonar-reasoning-pro"; // Cel mai bun model live de la Perplexity
    } else {
        // Logică OpenAI:
        // Trial, Pro, Agency -> GPT-4o (Best)
        // Creator -> GPT-4o-mini (Budget)
        if (tier === 'trial' || tier === 'pro' || tier === 'agency') {
            model = "gpt-4o";
        } else {
            model = "gpt-4o-mini";
        }
    }

    console.log(`Generating for [${tier}]. RealTime: ${useRealTime}. Model: ${model}. Cost: ${COST}`);

    // 5. CONSTRUIRE PROMPT
    const targetLanguage = language || 'English';
    
    let systemPrompt = `You are an expert Social Media Manager. 
    CRITICAL INSTRUCTION: You MUST write the content STRICTLY in ${targetLanguage}. 
    Do NOT use English unless it is a specific technical term.`;

    if (useRealTime) {
        systemPrompt += ` You have access to real-time internet data. Use specific numbers, prices, dates, and recent events from TODAY. Cite sources if relevant.`;
    } else {
        if (model === 'gpt-4o') {
             systemPrompt += ` Use sophisticated vocabulary, varied sentence structures, and high emotional intelligence. Avoid generic AI phrases like "Unlock your potential". Be specific, actionable, and human-sounding.`;
        } else {
             systemPrompt += ` Generate engaging content. Keep it simple and effective.`;
        }
    }

    if (brandContext) systemPrompt += `\n\nAdopt this Brand Voice: ${brandContext}`;
    if (objective) systemPrompt += `\nGOAL: ${objective.toUpperCase()}.`;
    if (platform) systemPrompt += `\nOptimize format for: ${platform}.`;

    // 6. APELARE API
    const completion = await client.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt }
      ],
      model: model,
      temperature: 0.7,
    });

    const output = completion.choices[0].message.content;

    // 7. SCĂDERE CREDITE
    await deductCredits(userRef, COST);

    return res.status(200).json({ output });

  } catch (error) {
    console.error("Generation Error:", error);
    return res.status(500).json({ error: error.message || "Failed to generate content" });
  }
}
