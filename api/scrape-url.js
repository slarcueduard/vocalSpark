
// Vercel Serverless Function (JavaScript) - Lightweight Fetch Version
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
        const { url } = req.body;

        if (!url) return res.status(400).json({ error: 'Missing URL' });

        const perplexityKey = process.env.PERPLEXITY_API_KEY;

        if (!perplexityKey) return res.status(500).json({ error: "Missing Perplexity API Key" });

        // --- SCRAPE CONTENT via PERPLEXITY (Fetch) ---
        console.log(`[Scrape URL API] Scraping: ${url}`);

        const response = await fetch('https://api.perplexity.ai/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${perplexityKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: "sonar-pro",
                messages: [
                    { role: "system", content: "You are a Web Scraper." },
                    {
                        role: "user", content: `
                        URL: ${url}
                        
                        TASK:
                        1. Visit the URL and extract the MAIN CONTENT (article text, social post text, etc.).
                        2. If it is a LinkedIn Post/Pulse, extract the full body text.
                        3. Identify the AUTHOR if possible.
                        4. Ignore navigation, ads, sidebars, and comments.

                        RETURN ONLY THE RAW EXTRACTED CONTENT. Do not include introductory text like "Here is the content".
                    ` }
                ],
                max_tokens: 4000
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("[Scrape URL API] Perplexity Error:", response.status, errorText);
            return res.status(response.status).json({ error: `Perplexity API Failed: ${errorText}` });
        }

        const data = await response.json();
        const scrapedContent = data.choices[0]?.message?.content || "";

        console.log(`[Scrape URL API] Scraped ${scrapedContent.length} chars`);

        if (scrapedContent.length < 50) {
            res.status(400).json({ error: "Content too short or could not be scraped." });
            return res.end();
        }

        res.status(200).json({
            url,
            content: scrapedContent
        });
        return res.end();

    } catch (error) {
        console.error("[Scrape URL API] Error:", error);
        res.status(500).json({ error: error.message || "Internal Server Error" });
        return res.end();
    }
}
