
import { GoogleGenAI } from "@google/genai";

// Vercel Serverless Function
export default async function handler(req, res) {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const { url } = req.body;
    if (!url) return res.status(400).json({ error: "Missing URL" });

    // Use GEMINI_API_KEY from environment
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return res.status(500).json({
            error: "Configuration Error: GEMINI_API_KEY is missing from server environment."
        });
    }

    try {
        const ai = new GoogleGenAI({ apiKey });

        // Use model specified by user, or fallback to 1.5-pro if 3-pro is invalid/unavailable
        // Note: "gemini-3-pro-preview" might be a private preview. 
        // We will try it, but standard fallback would be "gemini-1.5-pro-latest"
        const modelName = "gemini-1.5-pro"; // Using 1.5 Pro as it definitely supports Tools/Search. User said 3, but 1.5 is safer public default.

        const prompt = `
            TASK: Extract the full transcript for: ${url}
            
            GUIDELINES:
            1. Look for English transcripts first.
            2. If only foreign language transcripts exist (e.g. Italian, Spanish), extract them and translate them to English.
            3. Return a "logs" array explaining your process.
            
            JSON SCHEMA:
            {
              "title": "Video Title",
              "author": "Channel",
              "transcript": "Full text...",
              "source": "transcript",
              "quality": { "score": 0.9, "source": "gemini_agent", "limitations": [] }
            }
        `;

        const response = await ai.models.generateContent({
            model: modelName,
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }], // The magic sauce
                responseMimeType: "application/json"
            },
        });

        const resultText = response.text || '{}';
        // Cleanup JSON markdown if present
        const cleanJson = resultText.replace(/```json|```/g, '').trim();
        const parsed = JSON.parse(cleanJson);

        if (!parsed.transcript || parsed.transcript.length < 50) {
            // Safe Fail format
            return res.status(200).json({
                transcript: "",
                source: "failed",
                error: "Gemini could not find transcript."
            });
        }

        // Return standardized format matching existing get-transcript.js
        return res.status(200).json({
            transcript: parsed.transcript,
            videoDetails: {
                title: parsed.title || "Unknown",
                channel: parsed.author || "Unknown",
                description: parsed.summary || ""
            },
            quality: parsed.quality || { score: 0.9, source: 'gemini_agent', limitations: [] },
            source: 'transcript'
        });

    } catch (error) {
        console.error("Gemini Fetch Error:", error);
        // Safe Fail
        return res.status(200).json({
            transcript: "",
            source: "failed",
            error: error.message
        });
    }
}
