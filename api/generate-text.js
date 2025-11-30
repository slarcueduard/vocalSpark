import OpenAI from 'openai';
import { verifyUserAndCredits, deductCredits } from './_utils.js';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const perplexity = new OpenAI({
  apiKey: process.env.PERPLEXITY_API_KEY || 'dummy', // Evităm crash dacă lipsește cheia local
  baseURL: 'https://api.perplexity.ai'
});

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { prompt, brandContext, language, platform, objective, useRealTime, isRemix, remixFormats } = req.body;

    // 1. Calcul Cost
    const COST = useRealTime ? 10 : 1;
    const { userRef, userData } = await verifyUserAndCredits(req, COST);
    const tier = userData.subscriptionTier || 'trial';

    // 2. Selecție Model
    let client = openai;
    let model = "gpt-4o-mini"; // Default
    let useJsonMode = true; // OpenAI suportă JSON mode nativ

    if (useRealTime) {
        if (tier === 'creator' || tier === 'trial') return res.status(403).json({ error: "Real-Time is PRO." });
        client = perplexity;
        model = "sonar-reasoning-pro";
        useJsonMode = false; // Perplexity nu suportă mereu json_object, ne bazăm pe prompt
    } else if (tier === 'trial' || tier === 'pro' || tier === 'agency') {
        model = "gpt-4o";
    }

    // 3. Construire Prompt
    const targetLanguage = language || 'English';
    let systemPrompt = `You are an expert Social Media Manager. 
    CRITICAL: Write strictly in ${targetLanguage}. 
    Output MUST be a valid JSON object with a "posts" array.`;

    let userMessage = prompt;

    // --- MOD REMIX ---
    if (isRemix) {
        systemPrompt += `
        TASK: REPURPOSE CONTENT.
        Rewrite the source content into these formats: ${remixFormats?.join(', ') || 'Social Post'}.
        
        JSON SCHEMA:
        {
          "posts": [
            {
              "platform": "Platform Name",
              "content": "The content here...",
              "type": "thread | script | post" 
            }
          ]
        }
        
        For Threads: Split content into numbered tweets separated by double newlines.
        For TikTok/Reels: Write a script with (Visual) and (Audio) cues.
        `;
        userMessage = `SOURCE CONTENT:\n${prompt}`;
    } 
    // --- MOD STANDARD ---
    else {
        systemPrompt += `
        TASK: Write social media content.
        JSON SCHEMA:
        {
          "posts": [
            { "content": "The post text..." }
          ]
        }
        `;
        
        if (useRealTime) systemPrompt += ` Use real-time data from TODAY.`;
        else if (model === 'gpt-4o') systemPrompt += ` Use sophisticated, human-like writing.`;

        if (brandContext) systemPrompt += `\n\nBrand Voice: ${brandContext}`;
        if (objective) systemPrompt += `\nGoal: ${objective}`;
        if (platform) systemPrompt += `\nPlatform: ${platform}`;
    }

    // 4. Apelare AI
    const completion = await client.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage }
      ],
      model: model,
      temperature: 0.7,
      // Activăm JSON mode doar pentru OpenAI ca să nu crape Perplexity
      response_format: useJsonMode ? { type: "json_object" } : undefined
    });

    const rawOutput = completion.choices[0].message.content;
    console.log("AI Output:", rawOutput.substring(0, 100) + "...");

    // 5. Curățare JSON (pentru Perplexity care poate fi vorbăreț)
    let jsonOutput;
    try {
        jsonOutput = JSON.parse(rawOutput);
    } catch (e) {
        // Încercăm să extragem JSON-ul dintr-un bloc ```json ... ```
        const match = rawOutput.match(/```json([\s\S]*?)```/) || rawOutput.match(/\{[\s\S]*\}/);
        if (match) {
            jsonOutput = JSON.parse(match[1] || match[0]);
        } else {
            throw new Error("AI did not return JSON");
        }
    }

    // Normalizăm structura pentru frontend (vrea un Array simplu sau obiect cu chei)
    const finalPosts = jsonOutput.posts || jsonOutput; 

    // 6. Scădere Credite
    await deductCredits(userRef, COST);

    // Trimitem JSON stringified ca să fie compatibil cu frontend-ul existent care face JSON.parse
    return res.status(200).json({ output: JSON.stringify(finalPosts) });

  } catch (error) {
    console.error("Backend Error:", error);
    return res.status(500).json({ error: error.message || "Internal Server Error" });
  }
}
