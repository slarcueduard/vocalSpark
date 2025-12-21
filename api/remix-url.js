
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
        const { url, platforms, tone, language } = req.body;

        if (!url) return res.status(400).json({ error: 'Missing URL' });

        const perplexityKey = process.env.PERPLEXITY_API_KEY;
        const openaiKey = process.env.OPENAI_API_KEY;

        if (!perplexityKey) return res.status(500).json({ error: "Missing Perplexity API Key" });
        if (!openaiKey) return res.status(500).json({ error: "Missing OpenAI API Key" });

        // --- 1. SCRAPE CONTENT via PERPLEXITY ---
        console.log(`[Remix URL API] Scraping: ${url}`);

        const pplx = new OpenAI({ apiKey: perplexityKey, baseURL: 'https://api.perplexity.ai' });

        const scrapeResponse = await pplx.chat.completions.create({
            model: "sonar-pro",
            messages: [
                { role: "system", content: "You are a Web Scraper and Content Analyst." },
                {
                    role: "user", content: `
                    URL: ${url}
                    
                    TASK:
                    1. Visit the URL and extract the MAIN CONTENT (article text, social post text, etc.).
                    2. Identify the AUTHOR and KEY CONTEXT (date, engagement, sentiment).
                    3. If it's a Tweet/Post, extract the full text and any quoted text.
                    4. Ignore navigation, ads, and sidebars.

                    RETURN ONLY THE RAW EXTRACTED CONTENT. Do not say "Here is the content". Just the content.
                ` }
            ],
            max_tokens: 4000
        });

        const scrapedContent = scrapeResponse.choices[0].message.content || "";
        console.log(`[Remix URL API] Scraped ${scrapedContent.length} chars`);

        if (scrapedContent.length < 50) {
            throw new Error("Failed to scrape content (too short).");
        }

        // --- 2. GENERATE POSTS via OPENAI ---
        const openai = new OpenAI({ apiKey: openaiKey });

        // Truncate to avoid token limits if Perplexity returns huge text
        const cleanText = scrapedContent.substring(0, 12000);

        const prompt = `
        ROLE: Social Media Strategist.
        TASK: Remix this scraped content into social media posts.
        SOURCE URL: ${url}
        SOURCE CONTENT: "${cleanText}"
        
        PLATFORMS: ${platforms ? platforms.join(', ') : 'LinkedIn, X'}
        TONE: ${tone || 'professional'}
        LANGUAGE: ${language || 'English'}

        INSTRUCTIONS:
        - Analyze the source content carefully.
        - Create native posts for each requested platform.
        - LinkedIn: Professional insights, structural depth.
        - X (Twitter): Punchy, threads if complex, engaging.
        - Instagram/Facebook: Visual descriptions if needed, engaging captions.
        
        OUTPUT JSON STRUCTURE:
        {
            "analysis": { 
                "main_idea": "Summary of the source", 
                "key_takeaways": ["Point 1", "Point 2"], 
                "author": "Author Name (if found)" 
            },
            "posts": [ 
                { "platform": "linkedin", "content": "..." }, 
                { "platform": "x", "content": "..." } 
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

        return res.status(200).json({
            url,
            scraped_content_meta: { chars: cleanText.length },
            analysis: finalData.analysis || {},
            posts: finalData.posts || []
        });

    } catch (error) {
        console.error("[Remix URL API] Error:", error);
        return res.status(500).json({ error: error.message || "Internal Server Error" });
    }
}
