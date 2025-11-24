// api/generate-text.js - VARIANTĂ FĂRĂ SDK (Direct FETCH)

export default async function handler(req, res) {
  // 1. Configurare CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const { prompt } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) throw new Error("GEMINI_API_KEY is missing");

    // 2. Construim URL-ul manual pentru Gemini 1.5 Flash
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    // 3. Facem cererea direct (ca un browser)
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt || "Hello AI" }]
        }]
      })
    });

    const data = await response.json();

    // 4. Verificăm erorile venite de la Google
    if (!response.ok) {
      console.error("Google API Error:", JSON.stringify(data, null, 2));
      
      // Dacă e 404 aici, e 100% de la Cheie/Proiect
      throw new Error(data.error?.message || `Google API Error: ${response.status}`);
    }

    // 5. Extragem textul
    const output = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!output) throw new Error("No content generated.");

    return res.status(200).json({ output });

  } catch (error) {
    console.error("Server Error:", error);
    return res.status(500).json({ error: error.message });
  }
}
