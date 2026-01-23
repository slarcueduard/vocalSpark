
export default function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Check keys (masking them for security)
    const geminiKey = process.env.GEMINI_API_KEY;
    const perplexityKey = process.env.PERPLEXITY_API_KEY;

    const gemini = geminiKey
        ? `✅ FOUND (Starting with: ${geminiKey.substring(0, 4)}...)`
        : "❌ MISSING (Server cannot see GEMINI_API_KEY)";

    const perplexity = perplexityKey
        ? `✅ FOUND (Starting with: ${perplexityKey.substring(0, 4)}...)`
        : "❌ MISSING (Server cannot see PERPLEXITY_API_KEY)";

    console.log("--- KEY DIAGNOSIS ---");
    console.log("Gemini:", gemini);
    console.log("Perplexity:", perplexity);
    console.log("---------------------");

    res.status(200).json({
        status: "Diagnostic Run",
        gemini: gemini,
        perplexity: perplexity,
        instruction: "If MISSING, ensure .env.local is in the ROOT folder (same as package.json) and you restarted 'vercel dev'."
    });
}
