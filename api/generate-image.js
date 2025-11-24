import { verifyUserAndCredits, deductCredits } from './_utils.js';

export default async function handler(req, res) {
  // Configurare CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  try {
    // 1. Verificăm creditele (Costă 1 credit)
    // Asigură-te că funcția verify returnează userRef valid
    const { userRef } = await verifyUserAndCredits(req, 1);

    const { prompt, style } = req.body;

    if (!prompt) {
        return res.status(400).json({ error: "Prompt is required" });
    }

    // 2. Construim URL-ul
    const finalPrompt = style && style !== 'none' ? `${prompt}, ${style} style, high quality, detailed` : `${prompt}, high quality, detailed`;
    const cleanPrompt = encodeURIComponent(finalPrompt);
    const seed = Math.floor(Math.random() * 1000000);
    
    // Folosim Flux (calitate foarte bună)
    const imageUrl = `https://image.pollinations.ai/prompt/${cleanPrompt}?width=1024&height=1024&nologo=true&seed=${seed}&model=flux`;

    // NOTA: Pollinations nu returnează JSON, ci direct imaginea dacă o apelezi cu GET.
    // Dar aici doar construim URL-ul pentru frontend.
    // Frontend-ul va pune acest URL într-un tag <img src={imageUrl} />

    // 3. Scădem creditul
    await deductCredits(userRef, 1);

    res.status(200).json({ imageUrl });

  } catch (error) {
    console.error("Generate Image Error:", error);
    res.status(500).json({ error: error.message || "Image generation failed" });
  }
}
