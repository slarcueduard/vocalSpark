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

// --- HELPER: Extract JSON ---
function extractJsonArray(text: string): any[] {
    try { return JSON.parse(text); } 
    catch (e) {
        const start = text.indexOf('[');
        const end = text.lastIndexOf(']');
        if (start !== -1 && end !== -1) {
            try { return JSON.parse(text.substring(start, end + 1)); } catch (e2) {}
        }
        try { if (text.trim().startsWith('{')) return [JSON.parse(text)]; } catch (e3) {}
        throw new Error("AI response format error.");
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
// --- 2. IMAGINI ---
export async function generateImageForPost(postText: string, isPremium: boolean = false): Promise<string> {
    try {
        // Scurtăm promptul dacă e prea lung, ca să nu confuze modelele
        const imagePrompt = postText.length > 300 ? `Editorial photo: ${postText.substring(0, 300)}` : postText;

        // Backend-ul se ocupă acum de tot (DALL-E sau Flux) și returnează Base64
        const data = await safeFetch('/api/generate-image', { 
            prompt: imagePrompt,
            isPremium: isPremium 
        });
        
        return data.imageUrl; // Este un string "data:image/png;base64,..." care merge direct

    } catch (e) {
        console.error("Image Gen Failed:", e);
        throw e; 
    }
}

// --- 3. TEXT (UPDATED WITH REAL-TIME) ---
// ... (restul fișierului rămâne la fel, modificăm doar funcția de text)

// --- 3. TEXT (Prin Backend - Generare Postări) ---
export async function generateSocialMediaPosts(
  topic: string, 
  tone: Tone, 
  postCount: number, 
  language: string, 
  brandVoice: string, 
  brandProfile?: BrandProfile, 
  imageBase64?: string, 
  imageMimeType?: string,
  objective: PostObjective = 'engagement',
  useRealTime: boolean = false // <--- Parametru NOU
): Promise<Omit<Post, 'id' | 'imageUrl' | 'isGeneratingImage' | 'adaptedContent'>[]> {
    
    let contextString = '';
    if (brandProfile) {
        contextString = `
        BRAND VOICE DNA: ${brandProfile.voiceDNA}
        TARGET AUDIENCE: ${brandProfile.description}
        FIXED HASHTAGS: ${brandProfile.fixedHashtags || ''}
        `;
    } else if (brandVoice) {
        contextString = `BRAND VOICE: ${brandVoice}`;
    }

    // Instrucțiuni obiective (scurtat pt claritate, poți păstra versiunea lungă dinainte)
    const objectiveInstructions: Record<string, string> = {
        engagement: "Goal: Questions & Debate.",
        sales: "Goal: Conversion (AIDA).",
        education: "Goal: Value & Tips.",
        viral: "Goal: Shock & Shareability.",
        traffic: "Goal: Clicks to Bio."
    };

    let prompt = `
    ROLE: Social Media Expert.
    GOAL: ${objectiveInstructions[objective] || "Engagement"}
    TASK: Write ${postCount} post(s) about: "${topic}".
    TONE: ${tone}.
    FORMAT: Return ONLY a raw JSON Array: [{"content": "..."}]
    `;

    try {
        const data = await safeFetch('/api/generate-text', { 
            prompt, 
            brandContext: contextString, 
            language: brandProfile?.language || language || 'English',
            imageBase64, 
            imageMimeType,
            objective,
            useRealTime // <--- TRIMITEM LA BACKEND
        });

        const parsed = extractJsonArray(data.output);
        if(Array.isArray(parsed)) return parsed.map((p: any) => ({ content: p.content || p }));
        return [];

    } catch (e: any) {
        console.error("Text Generation Logic Error:", e);
        return [{ content: `⚠️ Error: ${e.message}` }];
    }
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

export async function analyzeBrandVoice(sampleText: string): Promise<string> {
    try {
        const data = await safeFetch('/api/generate-text', { prompt: `Analyze tone: "${sampleText}"` });
        return data.output;
    } catch(e) { return ""; }
}
