import OpenAI from 'openai';
import { verifyUserAndCredits, deductCredits } from './_utils.js';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req, res) {
  // CORS Setup
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const {
      userInput,
      goal,
      platforms,
      brandProfile
    } = req.body;

    // 1. COST CALCULATION: 5 Credits for a comprehensive campaign plan
    const COST = 5;
    const { userRef } = await verifyUserAndCredits(req, COST);

    // 2. MODEL SELECTION
    const model = "gpt-4o";

    // 3. CONSTRUCT SYSTEM PROMPT
    const systemPrompt = `You are a Senior Product Designer and AI Strategist building a "Founder Mode" campaign.
    
    ### CORE PHILOSOPHY (THE ANTI-ROBOT PROTOCOL)
    1.  **NO FLUFF:** Never use corporate filler words like "delve", "landscape", "unlock potential", "game-changer", "transformative".
    2.  **HOOK FIRST:** Every piece of content must start with a Scroll-Stopping Hook based on conflict, curiosity, or value.
    3.  **WRITE LIKE A HUMAN:** Use sentence fragments. Vary sentence length. Use the user's specific vocabulary quirks (defined in Tone of Voice).
    4.  **STRATEGY OVER VOLUME:** Do not generate content just to fill space. Every post must have a specific psychological goal (Trust, Authority, or Conversion).

    ### INPUT CONTEXT
    1.  **BRAND DNA:**
        * *Target Audience:* ${brandProfile.targetAudience || 'General Founders'}
        * *The Enemy:* "${brandProfile.enemy || 'Status Quo'}" (What we fight against)
        * *Tone of Voice:* ${brandProfile.voiceDNA || 'Professional'} + Archetype: ${brandProfile.archetype || 'Expert'}
        * *Key Preferences:* Length: ${brandProfile.postLength || 'Medium'}, Detail: ${brandProfile.detailLevel || 'Balanced'}, English Level: ${brandProfile.englishProficiency || 'Native'}
        * *The Offer:* "${brandProfile.offer || 'Our Product'}"
    2.  **CAMPAIGN GOAL:** ${goal.toUpperCase()}
    3.  **RAW INPUT:** "${userInput}"
    4.  **PLATFORMS:** ${platforms.join(', ')}

    ### CAMPAIGN MODES & BEHAVIORS
    Match the output style to the GOAL:

    * **HYPE (LAUNCH) 🚀**
        * *Style:* Short, punchy, mysterious. High energy but not "salesy".
        * *Focus:* "Something big is coming", "We fixed the problem everyone ignores".
        * *CTA:* Waitlist / Early Access.

    * **STORY (BUILDING IN PUBLIC) 🏗️**
        * *Style:* Vulnerable, narrative, "Hero's Journey". Use "I", not "We".
        * *Focus:* The struggle, the mistake, the epiphany.
        * *CTA:* Engagement (Comment / Follow).

    * **VALUE (EDUCATIONAL) 🧠**
        * *Style:* Analytical, "How-To", Step-by-Step.
        * *Focus:* actionable value. Give away the secrets.
        * *CTA:* Save this post / Newsletter signup.

    * **SALES (HARD SELL) 💰**
        * *Style:* Direct, problem-agitation-solution, logical, urgent.
        * *Focus:* Results, Case Studies, ROI.
        * *CTA:* Buy Now / Start Trial.

    ### TASK
    Generate a 3-Day Campaign Plan (JSON).
    Include an "Execution Guide" that gives specific advice for the selected platforms (${platforms.join(', ')}) and general engagement hacks.
    
    ### OUTPUT FORMAT (STRICT JSON):
      "campaign_title": "Short, punchy title for internal dashboard (e.g. 'Operation Blackout')",
      "strategy_summary": "1 sentence explaining the angle (e.g. 'Using the enemy concept to drive waitlist signups').",
      "explanation": "A short paragraph explaining the narrative arc of this campaign. Why this sequence? What is the psychology behind it? (Max 50 words)",
      "tracking_KPIs": ["Metric 1 (e.g. Waitlist Signups)", "Metric 2 (e.g. Comments from VCs)"],
      "execution_guide": {
          "platform_strategy": [
              { "platform": "Name of platform", "advice": "Specific best practice for this campaign on this platform." }
          ],
          "engagement_tips": ["Actionable tip 1", "Actionable tip 2"]
      },
      "days": [
        {
          "day": 1,
          "theme": "The Hook/Announcement",
          "posts": [
            {
              "platform": "LinkedIn",
              "content": "Full post text...",
              "media_suggestion": "Screenshot of X or selfie...",
              "hook_analysis": "Why this hook works..."
            }
          ]
        },
        {
            "day": 2,
            "theme": "The Education/Proof",
            "posts": [...]
        },
        {
            "day": 3,
            "theme": "The Close/CTA",
            "posts": [...]
        }
      ]
    }
    `;

    // 4. EXECUTE REQUEST
    const completion = await openai.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: "Generate the Founder Mode campaign plan now." }
      ],
      model: model,
      temperature: 0.7,
      response_format: { type: "json_object" }
    });

    const output = completion.choices[0].message.content;

    // 5. DEDUCT CREDITS
    await deductCredits(userRef, COST);

    // 6. PARSE & RETURN
    const jsonOutput = JSON.parse(output);
    return res.status(200).json(jsonOutput);

  } catch (error) {
    console.error("Founder Mode Error:", error);
    return res.status(500).json({ error: error.message || "Failed to generate campaign." });
  }
}
