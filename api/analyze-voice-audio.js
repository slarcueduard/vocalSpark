
import { IncomingForm } from 'formidable';
import fs from 'fs';
import OpenAI from 'openai';

export const config = {
    api: {
        bodyParser: false, // Disabling Next.js body parser to handle FormData
    },
};

export default async function handler(req, res) {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

    const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
    });

    try {
        const form = new IncomingForm();

        const [fields, files] = await new Promise((resolve, reject) => {
            form.parse(req, (err, fields, files) => {
                if (err) reject(err);
                resolve([fields, files]);
            });
        });

        const audioFile = files.audio?.[0];
        if (!audioFile) {
            return res.status(400).json({ error: "No audio file uploaded" });
        }

        console.log("🎙️ Received audio:", audioFile.filepath, audioFile.size);

        // 1. Transcribe with Whisper
        const transcription = await openai.audio.transcriptions.create({
            file: fs.createReadStream(audioFile.filepath),
            model: "whisper-1",
        });

        const transcriptText = transcription.text;
        console.log("📝 Transcript:", transcriptText.substring(0, 100) + "...");

        if (transcriptText.length < 50) {
            return res.status(400).json({ error: "Audio was too short or unclear. Please record at least 30 seconds." });
        }

        // 2. Analyze Voice DNA (Recycling Logic from Text Analysis)
        const prompt = `
        ROLE: You are an expert Linguistic Analyst specializing in Brand Voice.
        TASK: Analyze this TRANSCRIPT of a user's SPEECH to create a Brand Voice Profile.
        
        INPUT TRANSCRIPT: "${transcriptText.substring(0, 4000)}"
        
        ANALYSIS INSTRUCTIONS:
        - Since this is speech, focus on the NATURAL RHYTHM and CADENCE.
        - Identify vocabulary complexity (Simple vs. Jargon).
        - Detect tonality (Enthusiastic vs. Calm vs. Authoritative).
        
        OUTPUT FORMAT (JSON ONLY):
        {
          "niche": "Primary topic detected (e.g. Marketing, Fitness)",
          "audience": "Target audience implied",
          "tone_score": number 0-100 (0=casual, 100=formal),
          "emoji_score": number 0-100 (0=minimal, 100=heavy - infer from energy),
          "length_score": number 0-100 (0=short punchy, 100=long detailed - infer from sentence length),
          "voice_description": "2-sentence style instruction. Example: 'Write in short, punchy sentences. Use confident, direct language with occasional rhetorical questions.'",
          "suggested_hashtags": ["#tag1", "#tag2", "#tag3"]
        }
        `;

        const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { role: "system", content: "You are a Voice DNA Analyst. Return valid JSON only." },
                { role: "user", content: prompt }
            ],
            response_format: { type: "json_object" }
        });

        let analysis = JSON.parse(completion.choices[0].message.content);

        // Cleanup temp file
        // fs.unlinkSync(audioFile.filepath); // Vercel handles this automatically mostly, but good practice if persistent fs

        return res.status(200).json({
            transcript: transcriptText,
            analysis: analysis
        });

    } catch (error) {
        console.error("Audio Analysis Error:", error);
        return res.status(500).json({ error: error.message || "Failed to analyze audio." });
    }
}
