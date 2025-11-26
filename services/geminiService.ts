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

// --- 2. IMAGINI (REPARAT STANDARD) ---
export async function generateImageForPost(postText: string, isPremium: boolean = false): Promise<string> {
    try {
        const imagePrompt = postText.length > 200 ? `Editorial photo: ${postText.substring(0, 200)}` : postText;

        // 1. Cerem URL-ul de la backend
        const data = await safeFetch('/api/generate-image', { 
            prompt: imagePrompt,
            isPremium: isPremium 
        });
        
        const imageUrl = data.imageUrl;

        // 2. LOGICA HIBRIDĂ:
        // Dacă e Premium (DALL-E), URL-ul expiră și are CORS -> TREBUIE PROXY.
        // Dacă e Standard (Pollinations), URL-ul e public -> NU FOLOSIM PROXY (E mai rapid).
        
        if (isPremium && imageUrl.startsWith('http')) {
            try {
                // Folosim un endpoint simplu de proxy (dacă l-ai creat) sau încercăm direct
                // Notă: Dacă api/generate-image returnează deja Base64 (ceea ce am setat anterior pt premium), acest IF nu se execută.
                // Dar dacă backend-ul returnează URL DALL-E, aici îl convertim.
                const proxyRes = await fetch(`/api/proxy-image?url=${encodeURIComponent(imageUrl)}`);
                if (!proxyRes.ok) return imageUrl; // Fallback
                const blob = await proxyRes.blob();
                return new Promise(r => {
                    const reader = new FileReader();
                    reader.onload = () => r(reader.result as string);
                    reader.readAsDataURL(blob);
                });
            } catch (err) { return imageUrl; }
        }

        // Standard Image -> Returnăm direct URL-ul (Pollinations merge direct în <img>)
        return imageUrl;

    } catch (e) {
        console.error("Image Gen Failed:", e);
        throw e; 
    }
}

// --- 3. TEXT ---
export async function generateSocialMediaPosts(
  topic: string, tone: Tone, postCount: number, language: string, brandVoice: string, brandProfile?: BrandProfile, imageBase64?: string, imageMimeType?: string, objective: PostObjective = 'engagement'
): Promise<Omit<Post, 'id' | 'imageUrl' | 'isGeneratingImage' | 'adaptedContent'>[]> {
    
    let contextString = '';
    if (brandProfile) {
        contextString = `VOICE: ${brandProfile.voiceDNA}. AUDIENCE: ${brandProfile.description}. HASHTAGS: ${brandProfile.fixedHashtags}`;
    }

    const objectivesMap: Record<string, string> = {
        engagement: "Goal: Comments & Debate.",
        sales: "Goal: Conversion (AIDA).",
        education: "Goal: Teach/Value.",
        viral: "Goal: Maximum Reach/Shock.",
        traffic: "Goal: Clicks to Bio."
    };

    const prompt = `
    ROLE: Social Media Expert.
    GOAL: ${objectivesMap[objective] || "Engagement"}
    TOPIC: "${topic}"
    TONE: ${tone}.
    
    FORMAT: Return ONLY a JSON Array: [{"content": "..."}]
    `;

    try {
        const data = await safeFetch('/api/generate-text', { 
            prompt, 
            brandContext: contextString, 
            language: brandProfile?.language || language || 'English',
            imageBase64, 
            imageMimeType 
        });
        const parsed = extractJsonArray(data.output);
        return Array.isArray(parsed) ? parsed.map((p: any) => ({ content: p.content || p })) : [];
    } catch (e: any) {
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
