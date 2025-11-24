import { verifyUserAndCredits, deductCredits } from './_utils.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  try {
    // 1. Verificăm creditele
    const { userRef } = await verifyUserAndCredits(req, 1);

    const { prompt, style } = req.body;

    // 2. Generăm imaginea (Pollinations - Stabil & Rapid)
    // Nu folosim Google aici pentru a evita erorile 400/404/500
    const finalPrompt = style ? `${prompt} in ${style} style` : prompt;
    const cleanPrompt = encodeURIComponent(finalPrompt.substring(0, 200));
    const seed = Math.floor(Math.random() * 100000);
    
    // Modelul 'flux' dă rezultate foarte bune
    const imageUrl = `https://image.pollinations.ai/prompt/${cleanPrompt}?width=1080&height=1080&nologo=true&seed=${seed}&model=flux`;

    // 3. Scădem creditul
    await deductCredits(userRef, 1);

    res.status(200).json({ imageUrl });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message || "Image generation failed" });
  }
}
