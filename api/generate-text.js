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
    const { prompt, brandContext, language, platform, objective, useRealTime, isRemix, remixFormats, isCampaign, postCount, isFollowUp, parentContent } = req.body;

    // 1. CALCUL COST
    let count = 1;
    if (isCampaign) count = postCount || 3;
    if (isRemix && remixFormats) count = remixFormats.length;
    // Follow-up is single post cost (1)

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
    OUTPUT FORMAT: You must return a valid JSON OBJECT with a "posts" key containing an array.`;

    let userMessage = prompt;

    if (isRemix) {
      systemPrompt += `
        TASK: Repurpose content into: ${remixFormats?.join(', ')}.
        STRUCTURE: { "posts": [{"platform": "Name", "content": "The text...", "type": "post"}] }
        `;
      userMessage = `SOURCE: ${prompt}`;
    } else if (isCampaign) {
      systemPrompt += `
        TASK: Create a ${count}-post campaign.
        STRUCTURE: { "posts": [{"content": "Post 1..."}, {"content": "Post 2..."}] }
        `;
    } else if (isFollowUp) {
      systemPrompt += `
        TASK: Write a logical follow-up/sequel to the provided SOURCE content.
        CRITICAL: MATCH THE TONE, VOICE, AND FORMAT OF THE SOURCE EXACTLY.
        Treat this as "Part 2" or a deep-dive response to the original.
        STRUCTURE: { "posts": [{"content": "Follow-up text..."}] }
        `;
      userMessage = `SOURCE: ${parentContent || prompt}`;
    } else {
      // SINGLE POST
      systemPrompt += `
        TASK: Write ONE high-impact post.
        GOAL: ${objective || 'Engagement'}.
        STRUCTURE: { "posts": [{"content": "Write the post text here..."}] }
        `;

      if (platform) systemPrompt += `\nPlatform: ${platform}`;
    }

    if (brandContext) systemPrompt += `\n\nBrand Voice: ${brandContext}`;

    // 4. EXECUȚIE
    const requestOptions = {
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage }
      ],
      model: model,
      temperature: 0.7
    };

    // ONLY add response_format for OpenAI models (gpt-4o, etc)
    // Perplexity (sonar-reasoning-pro) throws 400 if type is json_object without schema or at all
    if (!useRealTime) {
      requestOptions.response_format = { type: "json_object" };
    }

    const completion = await client.chat.completions.create(requestOptions);

    const output = completion.choices[0].message.content;

    // 5. SCĂDERE CREDITE
    await deductCredits(userRef, COST);

    // CLEANUP: Perplexity often wraps JSON in code blocks or adds "Here is the JSON"
    let cleanOutput = output.replace(/```json/g, '').replace(/```/g, '').trim();
    // Also remove any <think> blocks if reasoning model leaves them
    cleanOutput = cleanOutput.replace(/<think>[\s\S]*?<\/think>/g, '').trim();

    // Aggressive JSON Extractor: Find the first { and last }
    const firstBrace = cleanOutput.indexOf('{');
    const lastBrace = cleanOutput.lastIndexOf('}');

    if (firstBrace !== -1 && lastBrace !== -1) {
      cleanOutput = cleanOutput.substring(firstBrace, lastBrace + 1);
    }

    // Parsăm aici să fim siguri că e ok înainte de a trimite
    let jsonOutput;
    try {
      jsonOutput = JSON.parse(cleanOutput);
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
