import OpenAI from 'openai';
import { verifyUserAndCredits, deductCredits } from './_utils.js';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    // 1. Verificăm Userul și Creditele
    const { userRef, userData } = await verifyUserAndCredits(req, 1);

    const { prompt, brandContext, language, platform, objective } = req.body;

    // 2. LOGICA DE MODEL (STRATEGIA DE UPGRADE)
    const tier = userData.subscriptionTier || 'trial';
    
    // Trial primește BEST quality ca să fie convins. Pro/Agency la fel.
    // Creator primește varianta standard.
    const useBestModel = tier === 'trial' || tier === 'pro' || tier === 'agency';
    const aiModel = useBestModel ? "gpt-4o" : "gpt-4o-mini";

    console.log(`Generare text pentru user [${tier}]. Folosim model: ${aiModel}`);

    // 3. Construim Prompt-ul
    const targetLanguage = language || 'English';
    
    let systemPrompt = `You are an expert Social Media Manager. 
    CRITICAL INSTRUCTION: You MUST write the content STRICTLY in ${targetLanguage}. 
    Do NOT use English unless it is a specific technical term.`;

    // Diferențiere de calitate în Prompt
    if (useBestModel) {
        systemPrompt += ` Use sophisticated vocabulary, varied sentence structures, and high emotional intelligence. Avoid generic AI phrases. Be specific, actionable, and human-sounding.`;
    } else {
        systemPrompt += ` Generate engaging content. Keep it simple.`;
    }

    if (platform) {
      systemPrompt += `\nOptimize specifically for ${platform}.`;
    }

    if (brandContext) {
      systemPrompt += `\n\nAdopt this Brand Voice: ${brandContext}`;
    }
    
    if (objective) {
       systemPrompt += `\nGOAL: ${objective.toUpperCase()}.`;
    }

    // 4. Apelăm OpenAI
    const completion = await openai.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt }
      ],
      model: aiModel, 
      temperature: 0.7,
    });

    const output = completion.choices[0].message.content;

    // 5. Notificare pentru Userii Basic (Optional, dar bun pentru marketing)
    // Putem adăuga un flag în răspuns ca frontend-ul să știe să arate un "Upsell Tip"
    const showUpgradeTip = !useBestModel;

    // 6. Scădem creditul
    await deductCredits(userRef, 1);

    return res.status(200).json({ 
        output, 
        meta: {
            model: aiModel,
            showUpgradeTip
        }
    });

  } catch (error) {
    console.error("OpenAI Text Error:", error);
    return res.status(500).json({ error: error.message || "Failed to generate text" });
  }
}
