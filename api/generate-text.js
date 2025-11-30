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
    const { prompt, brandContext, language, platform, objective, useRealTime, isCampaign, postCount } = req.body;
// ... (în interiorul try, după extragerea body-ului)

    const { 
        prompt, // În modul Remix, aici va veni "Source Content"
        brandContext, 
        language, 
        // ... altele
        isRemix, // <--- Parametru nou
        remixFormats // Array ex: ['LinkedIn', 'Twitter']
    } = req.body;

    // ...

    if (isRemix) {
        systemPrompt += `
        TASK: REPURPOSE CONTENT.
        You are an expert Content Strategist.
        Take the provided SOURCE CONTENT and rewrite it into the following formats: ${remixFormats.join(', ')}.
        
        RULES:
        - Maintain the core message but adapt the tone for each platform.
        - Extract the key value points.
        - If creating a Thread, split it logically.
        - If creating a TikTok Script, include visual cues.
        
        FORMAT: Return a raw JSON Array:
        [
            { "platform": "LinkedIn", "content": "..." },
            { "platform": "TikTok Script", "content": "..." }
        ]
        `;
        
        // Pentru Remix, prompt-ul userului este sursa
        // Modificăm mesajul trimis la AI
        // systemPrompt rămâne system
        // user message devine: "SOURCE CONTENT:\n" + prompt
    } 
    // ... (restul logicii else if isCampaign etc.)

    // La final, apelul către AI:
    const userMessageContent = isRemix ? `SOURCE CONTENT:\n${prompt}` : prompt;

    const completion = await client.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessageContent } // Aici folosim variabila nouă
      ],
      // ...
    // 1. CALCULĂM COSTUL
    // Dacă e Campanie: 1 credit per post.
    // Dacă e Real-Time: 10 credite (fix, indiferent de nr de posturi pt că facem 1 singur search mare)
    let count = isCampaign ? (postCount || 3) : 1;
    let COST = useRealTime ? 10 : (1 * count);

    const { userRef, userData } = await verifyUserAndCredits(req, COST);
    const tier = userData.subscriptionTier || 'trial';

    // 2. PROTECȚII & LIMITE
    if (useRealTime && (tier === 'creator' || tier === 'trial')) {
        return res.status(403).json({ error: "Real-Time Search is a PRO feature." });
    }
    
    // Limite Campanie per Tier
    const maxPosts = tier === 'agency' ? 30 : (tier === 'pro' ? 7 : 3);
    if (isCampaign && count > maxPosts) {
        count = maxPosts; // Limităm silențios la maximul abonamentului
    }

    // 3. CLIENT & MODEL
    let client = openai;
    let model = "gpt-4o-mini"; // Default

    if (useRealTime) {
        client = perplexity;
        model = "sonar-reasoning-pro";
    } else {
        // Trial/Pro/Agency primesc GPT-4o pentru calitate maximă
        if (tier !== 'creator') model = "gpt-4o";
    }

    console.log(`Generating [${tier}]. Campaign: ${isCampaign} (${count}). Model: ${model}. Cost: ${COST}`);

    // 4. PROMPT ENGINEERING
    const targetLanguage = language || 'English';
    
    let systemPrompt = `You are an expert Social Media Manager. 
    CRITICAL INSTRUCTION: Write strictly in ${targetLanguage}.`;

    if (useRealTime) {
        systemPrompt += ` Use real-time data from TODAY.`;
    }

    // --- LOGICĂ CAMPANIE VS SINGLE ---
    if (isCampaign) {
        systemPrompt += `
        TASK: Create a ${count}-part Content Calendar based on the user's topic.
        STRATEGY: Create a mix of content types (Educational, Promotional, Engagement, Storytelling).
        Each post must be distinct but connected to the main theme.
        
        FORMAT: Return a raw JSON Array with ${count} objects. Structure: 
        [{"content": "Post 1 text..."}, {"content": "Post 2 text..."}]
        `;
    } else {
        systemPrompt += `
        TASK: Write a single high-impact post.
        GOAL: ${objective ? objective.toUpperCase() : "ENGAGEMENT"}.
        FORMAT: Return a raw JSON Array with 1 object.
        `;
    }

    if (brandContext) systemPrompt += `\n\nAdopt this Brand Voice: ${brandContext}`;
    if (platform) systemPrompt += `\nOptimize format for: ${platform}.`;

    // 5. GENERARE
    const completion = await client.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt }
      ],
      model: model,
      temperature: 0.7,
    });

    const output = completion.choices[0].message.content;

    // 6. UPDATE CREDITE
    await deductCredits(userRef, COST);

    return res.status(200).json({ output });

  } catch (error) {
    console.error("Generation Error:", error);
    return res.status(500).json({ error: error.message || "Failed to generate content" });
  }
}
