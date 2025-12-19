
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';

// Manual .env parser
const env = fs.readFileSync('.env', 'utf-8');
const envVars = {};
env.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
        envVars[key.trim()] = value.trim();
    }
});

async function testPerplexity() {
    const perplexityKey = envVars.PERPLEXITY_API_KEY || process.env.PERPLEXITY_API_KEY;
    if (!perplexityKey) {
        console.error("No Perplexity Key found!");
        return;
    }

    const pplx = new OpenAI({ apiKey: perplexityKey, baseURL: 'https://api.perplexity.ai' });
    const url = "https://www.youtube.com/watch?v=w_Cy2qPHi5c";

    console.log("Testing Perplexity with URL:", url);

    try {
        const response = await pplx.chat.completions.create({
            model: "sonar-pro",
            messages: [
                { role: "system", content: "You are an expert Content Extractor. Your Goal: Extract the verbatim transcript or a highly detailed 1500-word summary of the video content." },
                {
                    role: "user", content: `
                VIDEO URL: ${url}

                CRITICAL INSTRUCTIONS:
                1.  **SEARCH**: aggressively search for the transcript, captions, or detailed blog posts/reviews about this specific video.
                2.  **TRANSCRIPT FOUND**: If found, return the verbatim text.
                3.  **NO TRANSCRIPT?**: If the verbatim transcript is missing, you MUST generate a **COMPREHENSIVE, DEEP-DIVE SUMMARY** (minimum 1000 words) based on the video description, comments, and any search results found.
                4.  **NEVER REFUSE**: Do NOT return "I cannot find the transcript". Instead, return the best possible summary you can construct.
                
                RETURN FORMAT (JSON ONLY):
                {
                    "title": "Video Title",
                    "transcript": "The full transcript text OR your detailed 1000-word summary...",
                    "summary": "A short 2-sentence overview",
                    "is_summary": boolean
                }
                ` }
            ],
            max_tokens: 4000
        });

        console.log("\n--- RAW RESPONSE ---\n");
        console.log(response.choices[0].message.content);

    } catch (e) {
        console.error("Error:", e);
    }
}

testPerplexity();
