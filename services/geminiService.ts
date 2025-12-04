import { Post, Tone, Platform, RefinementType, BrandProfile, PostObjective } from "../types";
import { auth } from "./firebase"; 

// --- HELPER: Auth Headers ---
async function getAuthHeader() {
    const user = auth.currentUser;
    if (!user) return {}; 
    const token = await user.getIdToken();
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
}

// --- HELPER: Fetch Sigur ---
async function safeFetch(url: string, body: any) {
    const headers = await getAuthHeader();
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: headers as any,
            body: JSON.stringify(body)
        });
        const text = await response.text();
        let data;
        try { data = JSON.parse(text); } 
        catch (e) { throw new Error(`Server Error (${response.status}): Invalid response.`); }

        if (!response.ok) throw new Error(data.error || `API Error: ${response.statusText}`);
        return data;
    } catch (error: any) {
        console.error(`Fetch failed for ${url}:`, error);
        throw error;
    }
}

// --- HELPER: Extract JSON (Robust) ---
function extractJsonArray(text: string): any[] {
    try {
        // 1. Curățăm Markdown-ul (```json ... ```)
        let cleanText = text.replace(/```json|```/g, '').trim();
        
        // 2. Încercăm parsare directă
        let parsed = JSON.parse(cleanText);

        // 3. Dacă a returnat un obiect care conține "posts" (format comun OpenAI)
        if (parsed.posts && Array.isArray(parsed.posts)) {
            return parsed.posts;
        }

        // 4. Dacă e un singur obiect, îl punem într-un array
        if (!Array.isArray(parsed)) {
            return [parsed];
        }

        return parsed;
    } catch (e) {
        // 5. Fallback agresiv: Căutăm primul [ și ultimul ]
        const start = text.indexOf('[');
        const end = text.lastIndexOf(']');
        if (start !== -1 && end !== -1) {
            try {
                return JSON.parse(text.substring(start, end + 1));
            } catch (e2) {}
        }
        
        // 6. Fallback obiect simplu
        const objStart = text.indexOf('{');
        const objEnd = text.lastIndexOf('}');
        if (objStart !== -1 && objEnd !== -1) {
             try {
                return [JSON.parse(text.substring(objStart, objEnd + 1))];
            } catch (e3) {}
        }

        console.error("JSON Parse Error. Raw text:", text);
        throw new Error("AI response format error. Could not parse JSON.");
    }
}

// --- 1. ANALIZĂ BRAND ---
export async function autoGenerateBrandProfile(rawContent: string): Promise<BrandProfile> {
    try {
        const prompt = `ACT AS: Brand Strategist. ANALYZE: "${rawContent.substring(0, 3000)}". RETURN JSON: { "industry": "...", "language": "...", "voiceDNA": "...", "description": "...", "fixedHashtags": "..." }`;
        const data = await safeFetch('/api/generate-text', { prompt });
        const cleanJson = data.output.replace(/```json|```/g, '').trim();
        const parsed = JSON.parse(cleanJson);
        return {
            industry: parsed.industry || '',
            language: parsed.language || 'English',
            voiceDNA: parsed.voiceDNA || '',
            description: parsed.description || '',
            fixedHashtags: parsed.fixedHashtags || '',
            brandColors: ['#3B82F6', '#8B5CF6', '#FFFFFF'],
            logoUrl: null
        };
    } catch (e) { throw new Error("Analysis failed."); }
}

// --- 2. IMAGINI ---
export async function generateImageForPost(
    postText: string, 
    isPremium: boolean = false, 
    topicContext: string = '', 
    brandColors: string[] = []
): Promise<string> {
    try {
        const imagePrompt = postText.length > 200 ? `Editorial photo: ${postText.substring(0, 200)}` : postText;

        const data = await safeFetch('/api/generate-image', { 
            prompt: imagePrompt,
            isPremium: isPremium,
            topic: topicContext,
            brandColors: brandColors
        });
        
        const imageUrl = data.imageUrl;

        if (isPremium && imageUrl.startsWith('http')) {
            try {
                const proxyRes = await fetch(`/api/proxy-image?url=${encodeURIComponent(imageUrl)}`);
                if (!proxyRes.ok) return imageUrl;
                const blob = await proxyRes.blob();
                return new Promise(r => {
                    const reader = new FileReader();
                    reader.onload = () => r(reader.result as string);
                    reader.readAsDataURL(blob);
                });
            } catch (err) { return imageUrl; }
        }
        return imageUrl;
    } catch (e) {
        console.error("Image Gen Failed:", e);
        throw e; 
    }
}

// --- 3. TEXT (Generare Postări & Campanii & Remix) ---
// ...
export async function generateSocialMediaPosts(
  topic: string, tone: Tone, postCount: number, language: string, brandVoice: string, brandProfile?: BrandProfile, imageBase64?: string, imageMimeType?: string, objective: PostObjective = 'engagement', useRealTime: boolean = false, isCampaign: boolean = false, isRemix: boolean = false, remixFormats: string[] = []
): Promise<any[]> {
    
    let contextString = '';
    if (brandProfile) {
        contextString = `VOICE: ${brandProfile.voiceDNA}. AUDIENCE: ${brandProfile.description}. HASHTAGS: ${brandProfile.fixedHashtags}`;
    }

    try {
        const data = await safeFetch('/api/generate-text', { 
            prompt: topic, 
            brandContext: contextString, 
            language: brandProfile?.language || language || 'English',
            imageBase64, imageMimeType, objective, useRealTime,
            isCampaign, postCount, isRemix, remixFormats 
        });

        const parsed = extractJsonArray(data.output);
        
        if(Array.isArray(parsed)) {
            return parsed.map((p: any) => {
                // AICI ESTE FIX-UL: Căutăm conținutul oriunde ar fi
                let content = p.content || p.post || p.text || p.body || p;
                if (typeof content !== 'string') content = JSON.stringify(content);

                return { 
                    content: content,
                    type: p.type || 'post', 
                    platform: p.platform || 'Generic'
                };
            });
        }
        return [];

    } catch (e: any) {
        return [{ content: `⚠️ Error: ${e.message}`, type: 'error' }];
    }
// ...
}

// --- ADAPTERS ---
export async function adaptPostForPlatform(originalContent: string, platform: Platform): Promise<string> {
    try {
        const data = await safeFetch('/api/generate-text', { 
            prompt: `Adapt for ${platform}: "${originalContent}"` 
        });
        return data.output;
    } catch(e) { return originalContent; }
}

export async function refinePostContent(content: string, type: RefinementType): Promise<string> {
    try {
        const data = await safeFetch('/api/generate-text', { prompt: `Rewrite (${type}): "${content}"` });
        return data.output;
    } catch(e) { return content; }
}

// --- BRAND ANALYSIS SERVICE ---

// --- BRAND ANALYSIS SERVICE ---

export const analyzeBrandVoice = async (content: string, mode: 'personal' | 'influencer' = 'personal') => {
  if (!content || content.length < 10) {
    throw new Error("Content is too short. Please paste at least one full post.");
  }

  const taskDescription = mode === 'influencer' 
    ? "You are a Ghostwriter for top tier creators. Your task is to REVERSE ENGINEER the writing style of this influencer so we can clone it."
    : "You are a Brand Strategist. Your task is to analyze this brand's existing content to build a consistent voice profile.";

  const prompt = `
    ${taskDescription}
    
    CONTENT SAMPLE TO ANALYZE:
    "${content.slice(0, 2000)}"

    Extract the "Voice DNA" into a raw JSON object with this exact structure:
    {
      "niche": "Specific niche (e.g. SaaS Marketing, Crypto Trading)",
      "audience": "Target audience (e.g. Solopreneurs, Gen Z)",
      "tone_score": number 0-100 (0=Casual/Funny, 100=Formal/Corporate),
      "emoji_score": number 0-100 (0=None, 100=Heavy usage),
      "length_score": number 0-100 (0=Short/Punchy, 100=Long/Storytelling),
      "voice_description": "Detailed instruction for an AI on how to write like this person. Include sentence structure, formatting habits, and vocabulary."
    }
    
    Return ONLY valid JSON.
  `;

  try {
    // Asigura-te ca variabila 'model' este accesibila aici. 
    // Daca e definita sus in fisier, e ok. Daca nu, decomenteaza linia de mai jos:
    // const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const result = await model.generateContent(prompt); 
    const response = await result.response;
    const text = response.text();
    const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    return JSON.parse(cleanedText);
  } catch (error) {
    console.error("Error analyzing brand voice:", error);
    // Fallback
    return {
      niche: "General",
      audience: "General Audience",
      tone_score: 50,
      emoji_score: 50,
      length_score: 50,
      voice_description: "Professional, engaging, and clear."
    };
  }
};
