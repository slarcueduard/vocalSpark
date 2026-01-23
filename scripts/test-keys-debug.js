
export default function handler(req, res) {
    const openaiKey = process.env.OPENAI_API_KEY;
    const perplexityKey = process.env.PERPLEXITY_API_KEY;

    res.status(200).json({
        openai: openaiKey ? `Present (${openaiKey.substring(0, 5)}...)` : "Missing",
        perplexity: perplexityKey ? `Present (${perplexityKey.substring(0, 5)}...)` : "Missing",
        env_file_preview: "Check server logs if needed"
    });
}
