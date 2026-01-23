import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req, res) {
    // 1. CORS & Methods
    res.setHeader('Access-Control-Allow-Origin', '*'); // Or restrict to your domain in prod
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const { topic, voiceId } = req.body;

        // 2. Security: Input Validation
        if (!topic || typeof topic !== 'string' || topic.length > 100) {
            return res.status(400).json({ error: 'Invalid topic (max 100 chars)' });
        }

        // 3. Security: Whitelisted Voices Only (Prevent Prompt Injection)
        const VOICE_PROMPTS = {
            'gary': `You are Gary Vaynerchuk. 
               TONE: High energy, abrasive, direct, "no excuses", hustle-culture. 
               KEYWORDS: Execution, Patience, Cloud, Dirt, Legacy, 14 hours.
               TASK: Write a SHORT, punchy social media post (under 280 chars) about "${topic}".
               CONSTRAINT: Use caps lock for emphasis. End with #Hustle. Keep it tweet-length.`,

            'simon': `You are Simon Sinek.
                TONE: Inspirational, calm, philosophical, focused on "The Why" and leadership.
                KEYWORDS: Trust, Safety, Leaders, Infinite Game, Inspiration.
                TASK: Write a short, thoughtful social media post (under 50 words) about "${topic}".
                CONSTRAINT: Focus on the human element, not the metrics. Keep it concise.`,

            'gpt': `You are a standard, generic AI assistant (Classic ChatGPT).
              TONE: Polite, robotic, neutral, structured, boring.
              KEYWORDS: Furthermore, Additionally, In conclusion, Crucial.
              TASK: Write a structured explanation of "${topic}".
              CONSTRAINT: Use bullet points. Sound artificial.`
        };

        const systemPrompt = VOICE_PROMPTS[voiceId];

        if (!systemPrompt) {
            return res.status(400).json({ error: 'Invalid voice ID' });
        }

        // 4. Call OpenAI (Flash Model)
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini", // Flash model
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: `Topic: ${topic}` }
            ],
            max_tokens: 150, // Strict limit for demo
            temperature: 0.8
        });

        const output = completion.choices[0].message.content;

        return res.status(200).json({ content: output });

    } catch (error) {
        console.error("Demo Gen Error:", error);
        return res.status(500).json({ error: 'Generation failed' });
    }
}
