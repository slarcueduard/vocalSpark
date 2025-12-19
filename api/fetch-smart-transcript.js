
// Google GenAI - Disabled
import OpenAI from 'openai';

// Vercel Serverless Function
export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    try {
        const { url } = req.body || {};
        if (!url) return res.status(400).json({ error: "Missing URL in body" });

        const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
        const perplexityKey = process.env.PERPLEXITY_API_KEY;
        const openaiKey = process.env.OPENAI_API_KEY;

        let transcriptData = null;
        let usedSource = 'none';
        let errorLog = [];

        // --- STRATEGY 1: PERPLEXITY (Online Deep Research - PRIMARY) ---
        if (perplexityKey) {
            try {
                console.log("Attempting Perplexity Agent (Primary)...");
                const pplx = new OpenAI({ apiKey: perplexityKey, baseURL: 'https://api.perplexity.ai' });

                const response = await pplx.chat.completions.create({
                    model: "sonar-pro", // Faster, prevents Vercel timeouts
                    messages: [
                        { role: "system", content: "You are a Deep Research Agent. Your task is to find the content of a YouTube video." },
                        {
                            role: "user", content: `
                    VIDEO URL: ${url}

                    TASK:
                    1.  Search for the transcript, captions, or summary.
                    2.  If you find the verbatim transcript, return it.
                    3.  If you CANNOT find the verbatim transcript, generate a **HIGHLY DETAILED SUMMARY** (minimum 1000 words).
                    4.  **NEVER REFUSE**: Do NOT return "I cannot find the transcript". Return the best possible summary.

                    RETURN FORMAT (JSON ONLY):
                    {
                        "title": "Video Title",
                        "transcript": "Full transcript OR Detailed Summary here...",
                        "summary": "Brief overview",
                        "is_summary": boolean
                    }
                    ` }
                    ],
                    max_tokens: 4000
                });

                if (!response.choices || !response.choices[0] || !response.choices[0].message) {
                    throw new Error("Invalid API Response Structure");
                }

                const content = response.choices[0].message.content || "";

                // CLEANUP: Remove <think>...</think> blocks and Markdown fences
                let cleanContent = content.replace(/<think>[\s\S]*?<\/think>/g, '')
                    .replace(/```json/g, '')
                    .replace(/```/g, '')
                    .trim();

                // JSON EXTRACTOR: Find first { and last }
                const firstBrace = cleanContent.indexOf('{');
                const lastBrace = cleanContent.lastIndexOf('}');

                if (firstBrace !== -1 && lastBrace !== -1) {
                    cleanContent = cleanContent.substring(firstBrace, lastBrace + 1);
                }

                let json = null;
                try {
                    json = JSON.parse(cleanContent);
                } catch (e) {
                    // If JSON fails but we have a long text, assume it's a direct summary
                    if (cleanContent.length > 200) {
                        console.log("Perplexity returned raw text. Using as summary.");
                        json = {
                            transcript: cleanContent,
                            title: "Video Summary",
                            summary: cleanContent.substring(0, 150) + "...",
                            is_summary: true
                        };
                    }
                }

                // Field Normalization: If transcript is empty but summary is long, use summary
                if (json && (!json.transcript || json.transcript.length < 50) && json.summary && json.summary.length > 100) {
                    console.log("Perplexity: Using summary as transcript.");
                    json.transcript = json.summary;
                    json.is_summary = true;
                }

                if (json && json.transcript && json.transcript.length > 50) {
                    // VALIDATION: Check for "Laziness" or "Refusal"
                    const lowerText = json.transcript.toLowerCase();
                    const refusalPhrases = [
                        "cannot find", "unable to find", "not available", "no transcript found",
                        "sorry", "apologize", "does not contain information", "provide a summary instead"
                    ];

                    // Block short refusals. Allow long essays even if they have disclaimer phrases.
                    const isRefusal = refusalPhrases.some(phrase => lowerText.includes(phrase)) && lowerText.length < 400;

                    if (isRefusal) {
                        errorLog.push(`Perplexity: Refusal detected: ${json.transcript}`);
                    } else {
                        transcriptData = json;
                        usedSource = 'perplexity_agent';
                        if (json.is_summary) usedSource = 'perplexity_summary';
                    }
                } else {
                    errorLog.push(`Perplexity: Valid JSON but content too short. Content: ${cleanContent.substring(0, 100)}...`);
                }
            } catch (e) {
                console.warn("Perplexity Failed:", e.message);
                errorLog.push(`Perplexity Error: ${e.message}`);
            }
        } else {
            errorLog.push("Perplexity: Skipped (No Key)");
        }

        // --- STRATEGY 3: OPENAI (Summary Fallback) ---
        if (!transcriptData && openaiKey) {
            try {
                console.log("Attempting OpenAI Fallback...");
                const openai = new OpenAI({ apiKey: openaiKey });
                // OpenAI cannot browse, acts as last resort if user posts text manually? No, here we just fail safely.
                errorLog.push("OpenAI: Skipped (Cannot browse/scrape YouTube directly).");
            } catch (e) {
                errorLog.push(`OpenAI: ${e.message}`);
            }
        }

        if (transcriptData) {
            return res.status(200).json({
                transcript: transcriptData.transcript,
                videoDetails: {
                    title: transcriptData.title || "Unknown",
                    channel: "Unknown",
                    description: transcriptData.summary || ""
                },
                quality: { score: 0.8, source: usedSource, limitations: [] },
                source: 'transcript'
            });
        }

        // FAILED
        return res.status(200).json({
            transcript: "",
            source: "failed",
            error: `All Agents Failed. ${errorLog.join(' | ')}`
        });

    } catch (error) {
        console.error("Critical Error:", error);
        return res.status(500).json({ error: `Server Error: ${error.message}`, source: 'failed' });
    }
}
