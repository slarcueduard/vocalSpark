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
    const { prompt, brandContext, language, platform, objective, useRealTime, isRemix, remixFormats, isCampaign, postCount, isFollowUp, parentContent, isReply, isAnalysis, isHookGen, isNicheHooks, isHookRewrite, hookText, customHookPrompt, brandTone, profileData } = req.body; // Added isNicheHooks, profileData

    // 1. CALCUL COST
    let count = 1;
    if (isCampaign) count = postCount || 3;
    if (isRemix && remixFormats) count = remixFormats.length;
    // Follow-up, Analysis is single cost (1)

    const COST = useRealTime ? 10 : (1 * count);

    const { userRef, userData } = await verifyUserAndCredits(req, COST);
    const tier = userData.subscriptionTier || 'trial';

    // 2. MODEL SELECTION
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
    OUTPUT FORMAT: You must return a valid JSON OBJECT.`;

    let userMessage = prompt;

    if (isAnalysis) {
      systemPrompt = `You are an Expert Content Analyst.
        TASK: Analyze text to extract style, tone, and patterns.
        OUTPUT: JSON ONLY. No markdown. No conversational text.`;
      // We leave userMessage as the detailed prompt provided by the client
    } else if (isHookGen) {
      systemPrompt = `You are a viral copywriting expert specializing in "Stop Rate" optimization for social media.
      YOUR GOAL: Rewrite the OPENING LINE (The Hook) of the provided post to maximize attention retention.
      
      FRAMEWORKS:
      1. 🔴 Negative/Warning: Focus on a mistake/myth.
      2. ❓ Curiosity Gap: Create an information gap.
      3. 🔢 List/Data: Start with a number/promise.
      4. 🛡️ Vulnerable/Story: Start in the middle of a moment.
      5. 🥊 Contrarian: Challenge a popular belief.
      
      CONSTRAINTS:
      - Length: UNDER 20 words per hook.
      - Tone: ${brandTone || 'Professional'}. matching the user's voice.
      - Integrity: Must flow logically into the content. No clickbait lie.
      - No Emojis at start (unless vital).
      
      OUTPUT FORMAT (STRICT JSON):
      {
        "hooks": [
          { "type": "negative", "label": "🔴 The Warning", "text": "..." },
          { "type": "curiosity", "label": "❓ Curiosity Gap", "text": "..." },
          { "type": "data", "label": "🔢 The Data/List", "text": "..." },
          { "type": "story", "label": "🛡️ Personal Story", "text": "..." },
          { "type": "contrarian", "label": "🥊 The Contrarian", "text": "..." }
        ]
      }`;
      userMessage = `Original Content: ${prompt}`;

      if (customHookPrompt) {
        systemPrompt = `You are a viral copywriting expert.
          YOUR GOAL: Generate 3 UNIQUE HOOK variations for the provided content based STRICTLY on the user's instruction.
          
          USER INSTRUCTION: "${customHookPrompt}"
          
          CONSTRAINTS:
          - Length: UNDER 20 words per hook.
          - Output: JSON with 'hooks' array.
          
          OUTPUT FORMAT:
          {
            "hooks": [
              { "type": "custom", "label": "✨ Custom Idea 1", "text": "..." },
              { "type": "custom", "label": "✨ Custom Idea 2", "text": "..." },
              { "type": "custom", "label": "✨ Custom Idea 3", "text": "..." }
            ]
          }`;
      }
    } else if (isNicheHooks) {
      const { industry, targetAudience, voiceDNA } = profileData || {};
      systemPrompt = `You are a specialized content strategist for the "${industry || 'General'}" industry.
      YOUR GOAL: Generate 3 HIGH-CONVERTING HOOKS tailored specifically for:
      - Audience: ${targetAudience || 'General Audience'}
      - Voice/Style: ${voiceDNA || 'Professional'}
      - Tone: ${brandTone || 'Professional'}
      
      These hooks should be "Plug-and-Play" templates or specific opening lines that the user can use for their niche.
      
      OUTPUT FORMAT (STRICT JSON):
       {
        "hooks": [
          { "type": "niche", "label": "🎯 Niche Specific", "text": "..." },
          { "type": "pain_point", "label": "😫 Pain Point", "text": "..." },
          { "type": "insider", "label": "🤫 Insider Secret", "text": "..." }
        ]
      }`;
      userMessage = `Generate 3 viral hooks for my brand profile.`;
    } else if (isHookRewrite) {
      systemPrompt = `You are a viral editor.
       TASK: Rewrite the provided content to START with the provided HOOK data.
       GOAL: Ensure the rest of the post flows logically from this new hook.
       CONSTRAINTS:
       - The FIRST LINE must be the provided hook (or very similar).
       - Keep the original core message, facts, and value.
       - Do NOT delete the main points. Just smooth the transition.
       - Tone: ${brandTone || 'Professional'}.
       - Output: JSON with 'content' key.
       `;
      userMessage = `HOOK: ${hookText}\n\nORIGINAL CONTENT: ${prompt}`;
    } else if (isRemix) {
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
    } else if (isReply) {
      const { useEmojis, question, link } = req.body.replyOptions || {};
      systemPrompt += `
        TASK: Write a reply to the provided content.
        CRITICAL: MATCH THE TONE AND VOICE OF THE BRAND CONTEXT EXACTLY.
        `;

      if (useEmojis) systemPrompt += `\nINSTRUCTION: Use relevant emojis to make the reply engaging and friendly.`;
      if (question === true || question === 'true') {
        systemPrompt += `\nINSTRUCTION: End the reply with an engaging question relevant to the context to encourage further conversation.`;
      } else if (typeof question === 'string' && question.length > 0) {
        systemPrompt += `\nINSTRUCTION: End the reply with this specific question: "${question}"`;
      } else {
        systemPrompt += `\nCONSTRAINT: Do NOT ask a question. End the reply with a statement.`;
      }
      if (link) systemPrompt += `\nINSTRUCTION: Seamlessly include this link in the reply: "${link}"`;

      systemPrompt += `\nCONSTRAINT: Do NOT include any hashtags (#). This is a direct reply.`;
      systemPrompt += `\nSTRUCTURE: { "posts": [{"content": "The reply text..."}] }`;
      userMessage = `Original Content to Reply to: ${prompt}`;
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
