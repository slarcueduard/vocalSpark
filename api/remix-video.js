
import { YoutubeTranscript } from 'youtube-transcript';
import OpenAI from 'openai';

// Vercel Serverless Function (JavaScript)
export default async function handler(req, res) {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { url, platforms, tone, language, mock } = req.body;

        // --- MOCK MODE (Debug) ---
        if (mock) {
            console.log("[Remix API] MOCK MODE ACTIVE");
            return res.status(200).json({
                video: { url, id: "mock_video" },
                transcript_meta: { source: "mock", chars: 500 },
                analysis: { main_idea: "This is a MOCK response for testing.", key_takeaways: ["Fact 1", "Fact 2"], keywords: ["test"] },
                posts: platforms.map(p => ({ platform: p, content: `[MOCK POST] This is a test post for ${p}.` }))
            });
        }

        if (!url) return res.status(400).json({ error: 'Missing YouTube URL' });

        // --- TIMEOUT PROTECTION CONSTANTS ---
        const TIMEOUT_MS = 25000; // Increased to 25s for multi-post generation

        const openaiKey = process.env.OPENAI_API_KEY;
        if (!openaiKey) return res.status(500).json({ error: "Missing OpenAI API Key" });

        // WRAP PROCESS IN A PROMISE
        const pipelinePromise = (async () => {
            console.log(`[Remix API] Fetching transcript for: ${url}`);

            let fullText = "";
            let transcriptSource = "youtube-transcript";

            // --- 1. TRY STANDARD TRANSCRIPT FETCH ---
            try {
                let list = null;
                try { list = await YoutubeTranscript.fetchTranscript(url, { lang: 'en' }); } catch (e) { }
                if (!list || list.length === 0) {
                    try { list = await YoutubeTranscript.fetchTranscript(url, { lang: 'ro' }); } catch (e) { }
                }
                if (!list || list.length === 0) {
                    try { list = await YoutubeTranscript.fetchTranscript(url); } catch (e) { }
                }
                if (list && list.length > 0) {
                    fullText = list.map(t => t.text).join(' ');
                }
            } catch (e) { console.warn("Standard fetch failed"); }

            // --- 2. FALLBACK TO PERPLEXITY ---
            if (!fullText || fullText.length < 50) {
                const perplexityKey = process.env.PERPLEXITY_API_KEY;
                if (perplexityKey) {
                    console.log("Attempting Perplexity Fallback...");
                    try {
                        const pplx = new OpenAI({ apiKey: perplexityKey, baseURL: 'https://api.perplexity.ai' });
                        const pplxResponse = await pplx.chat.completions.create({
                            model: "sonar-pro",
                            messages: [
                                { role: "system", content: "Extract transcript or summary." },
                                { role: "user", content: `URL: ${url}. Return content only.` }
                            ]
                        });
                        const content = pplxResponse.choices[0].message.content;
                        if (content && content.length > 200) {
                            fullText = content;
                            transcriptSource = "perplexity-fallback";
                        }
                    } catch (e) { console.error("Perplexity fail:", e.message); }
                }
            }

            if (!fullText || fullText.length < 50) {
                throw new Error("Could not fetch transcript.");
            }

            // --- 3. ONE-SHOT PROCESSING (Fastest Possible) ---
            const openai = new OpenAI({ apiKey: openaiKey });
            const cleanText = fullText.substring(0, 15000); // HARD CAP for speed

            const targetPlatforms = platforms && platforms.length > 0 ? platforms.join(', ') : 'LinkedIn, X';

            const prompt = `
            ROLE: Social Media Strategist.
            TASK: Create grounded posts based on this text.
            INPUT: "${cleanText}"
            URL: ${url}
            PLATFORMS TO GENERATE: ${targetPlatforms}
            TONE: ${tone || 'professional'}
            LANGUAGE: ${language || 'English'}

            CRITICAL INSTRUCTION:
            You MUST generate exactly one post for EACH platform listed in "PLATFORMS TO GENERATE".
            Do not skip any platforms.

            OUTPUT JSON:
            {
                "analysis": { "main_idea": "...", "key_takeaways": ["..."], "keywords": ["..."] },
                "posts": [ 
                    { "platform": "PLATFORM_NAME", "content": "..." }
                    // ... Ensure there is an entry for every requested platform
                ]
            }
            `;

            const completion = await openai.chat.completions.create({
                model: "gpt-4o",
                messages: [
                    { role: "system", content: "Return valid JSON only." },
                    { role: "user", content: prompt }
                ],
                response_format: { type: "json_object" }
            });

            const finalData = JSON.parse(completion.choices[0].message.content || "{}");
            return {
                video: { url, id: "processed_video" },
                transcript_meta: { source: transcriptSource, chars: cleanText.length },
                analysis: finalData.analysis || {},
                posts: finalData.posts || []
            };
        })();

        // RACE CONDITION: Pipeline vs Timeout
        const timeoutPromise = new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    timeout: true,
                    video: { url, id: "timeout_rescue" },
                    analysis: { main_idea: "Processing took too long, showing quick draft.", key_takeaways: [], keywords: [] },
                    posts: [{ platform: "System", content: "⚠️ The analysis timed out (video too long). Please try a shorter video or upgrade plan." }]
                });
            }, TIMEOUT_MS);
        });

        const result = await Promise.race([pipelinePromise, timeoutPromise]);

        if (result.timeout) {
            console.warn("[Remix API] Request Timed Out - Sending Rescue Response");
            // Still 200 OK so frontend doesn't crash
            return res.status(200).json(result);
        }

        return res.status(200).json(result);

    } catch (error) {
        console.error("[Remix API] Critical Error:", error);
        return res.status(500).json({ error: error.message || "Internal Server Error" });
    }
}
