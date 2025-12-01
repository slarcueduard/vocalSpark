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
    const { prompt, brandContext, language, platform, objective, useRealTime, isRemix, remixFormats, isCampaign, postCount } = req.body;

    // 1. CALCUL COST
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

    // 3. PROMPT ENGINEERING
    const targetLanguage = language || 'English';
    
    let systemPrompt = `You are an expert Social Media Manager. 
    CRITICAL: Write strictly in ${targetLanguage}.
    OUTPUT FORMAT: You must return a valid JSON ARRAY of objects. Each object MUST have a "content" key.`;

    let userMessage = prompt;

    if (isRemix) {
        systemPrompt += `
        TASK: Repurpose content into: ${remixFormats?.join(', ')}.
        STRUCTURE: [{"platform": "Name", "content": "The text...", "type": "post"}]
        `;
        userMessage = `SOURCE: ${prompt}`;
    } else if (isCampaign) {
        systemPrompt += `
        TASK: Create a ${count}-post campaign.
        STRUCTURE: [{"content": "Post 1..."}, {"content": "Post 2..."}]
        `;
    } else {
        // SINGLE POST - AICI ERA PROBLEMA
        systemPrompt += `
        TASK: Write ONE high-impact post.
        GOAL: ${objective || 'Engagement'}.
        STRUCTURE: [{"content": "Write the post text here..."}]
        `;
        
        if (platform) systemPrompt += `\nPlatform: ${platform}`;
    }

    if (brandContext) systemPrompt += `\n\nBrand Voice: ${brandContext}`;

    // 4. EXECUȚIE
    const completion = await client.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage }
      ],
      model: model,
      temperature: 0.7,
      response_format: { type: "json_object" } // Forțăm JSON
    });

    const output = completion.choices[0].message.content;
    
    // 5. SCĂDERE CREDITE
    await deductCredits(userRef, COST);

    // Parsăm aici să fim siguri că e ok înainte de a trimite
    let jsonOutput;
    try {
        jsonOutput = JSON.parse(output);
        // OpenAI pune uneori array-ul într-o cheie gen "posts" sau "content"
        const finalData = jsonOutput.posts || jsonOutput.content || jsonOutput; 
        
        return res.status(200).json({ output: JSON.stringify(finalData) });
    } catch (e) {
        // Dacă nu e JSON, trimitem brut (frontend-ul va încerca să repare)
        return res.status(200).json({ output });
    }

  } catch (error) {
    console.error("Gen Error:", error);
    return res.status(500).json({ error: error.message });
  }
}
