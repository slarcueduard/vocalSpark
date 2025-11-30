import { Post, Tone, Platform, RefinementType, BrandProfile, PostObjective } from "../types";
import { auth } from "./firebase"; 

// ==========================================
// 1. HELPERS (Funcții Ajutătoare)
// ==========================================

// Obține token-ul userului curent pentru a securiza apelul către backend
async function getAuthHeader() {
    const user = auth.currentUser;
    if (!user) return {}; 
    const token = await user.getIdToken();
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
}

// Wrapper peste 'fetch' care gestionează erorile de rețea și parsarea JSON
async function safeFetch(url: string, body: any) {
    const headers = await getAuthHeader();
    
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: headers as any,
            body: JSON.stringify(body)
        });

        const text = await response.text();
        
        // Încercăm să parsam răspunsul. Dacă nu e JSON valid, backend-ul a crăpat.
        let data;
        try {
            data = JSON.parse(text);
        } catch (e) {
            console.error("Server Raw Response (Not JSON):", text);
            throw new Error(`Server Error (${response.status}): Invalid response format.`);
        }

        // Dacă serverul a răspuns cu eroare (ex: 403, 500), aruncăm eroarea mai departe
        if (!response.ok) {
            throw new Error(data.error || `API Error: ${response.statusText}`);
        }

        return data;

    } catch (error: any) {
        console.error(`Fetch failed for ${url}:`, error);
        throw error;
    }
}

// Curăță textul primit de la AI pentru a extrage doar JSON-ul (chiar dacă AI-ul pune markdown ```json)
function extractJsonArray(text: string): any[] {
    try {
        // Încercare directă
        return JSON.parse(text);
    } catch (e) {
        // Dacă eșuează, căutăm blocuri de cod sau array-uri în text
        const start = text.indexOf('[');
        const end = text.lastIndexOf(']');
        
        if (start !== -1 && end !== -1) {
            try {
                return JSON.parse(text.substring(start, end + 1));
            } catch (e2) { /* Continuăm */ }
        }
        
        // Poate a returnat un singur obiect, nu o listă
        try {
             if (text.trim().startsWith('{')) {
                 return [JSON.parse(text)];
             }
        } catch (e3) {}
        
        // Dacă ajungem aici, AI-ul a returnat ceva stricat
        throw new Error("AI response format error. The AI output was not valid JSON.");
    }
}

// ==========================================
// 2. FUNCȚII PRINCIPALE (AI Features)
// ==========================================

// Analizează un text pentru a extrage Brand Identity (Niche, Voice, Audience)
export async function autoGenerateBrandProfile(rawContent: string): Promise<BrandProfile> {
    try {
        const prompt = `ACT AS: Brand Strategist. ANALYZE: "${rawContent.substring(0, 3000)}". RETURN JSON: { "industry": "...", "language": "...", "voiceDNA": "...", "description": "...", "fixedHashtags": "..." }`;
        const data = await safeFetch('/api/generate-text', { prompt });
        
        // Curățăm markdown-ul dacă există
        const cleanJson = data.output.replace(/```json|```/g, '').trim();
        const parsed = JSON.parse(cleanJson);
        
        return {
            industry: parsed.industry || '',
            language: parsed.language || 'English',
            voiceDNA: parsed.voiceDNA || '',
            description: parsed.description || '',
            fixedHashtags: parsed.fixedHashtags || '',
            brandColors: ['#3B82F6', '#8B5CF6', '#FFFFFF'], // Culori default
            logoUrl: null
        };
    } catch (e) {
        throw new Error("Analysis failed. Try shorter content.");
    }
}

// Generează Imaginile (Standard sau Premium)
export async function generateImageForPost(
    postText: string, 
    isPremium: boolean = false, 
    topicContext: string = '', 
    brandColors: string[] = []
): Promise<string> {
    try {
        // Scurtăm promptul pentru eficiență
        const imagePrompt = postText.length > 200 ? `Editorial photo: ${postText.substring(0, 200)}` : postText;

        // Apelăm backend-ul
        const data = await safeFetch('/api/generate-image', { 
            prompt: imagePrompt,
            isPremium: isPremium,
            topic: topicContext,
            brandColors: brandColors
        });
        
        const imageUrl = data.imageUrl;

        // PROXY LOGIC: Dacă e DALL-E (Premium) și primim URL, îl trecem prin proxy 
        // pentru a evita erorile CORS în Canvas. (Dacă backend-ul dă deja Base64, sărim peste asta)
        if (isPremium && imageUrl.startsWith('http')) {
            try {
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
        
        return imageUrl;
    } catch (e) {
        console.error("Image Gen Failed:", e);
        throw e; 
    }
}

// Generează Text (Postări, Campanii, Remix)
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
  useRealTime: boolean = false,
  isCampaign: boolean = false, 
  isRemix: boolean = false,
  remixFormats: string[] = []
): Promise<any[]> { // Returnează un array de obiecte
    
    // Construim Contextul Brandului
    let contextString = '';
    if (brandProfile) {
        contextString = `VOICE: ${brandProfile.voiceDNA}. AUDIENCE: ${brandProfile.description}. HASHTAGS: ${brandProfile.fixedHashtags}`;
    } else if (brandVoice) {
        contextString = `BRAND VOICE: ${brandVoice}`;
    }

    // Prompt simplu aici (logica grea e în backend)
    const prompt = topic; 

    try {
        // Apelăm backend-ul cu TOȚI parametrii
        const data = await safeFetch('/api/generate-text', { 
            prompt, 
            brandContext: contextString, 
            language: brandProfile?.language || language || 'English',
            imageBase64, 
            imageMimeType,
            objective,
            useRealTime,
            isCampaign, 
            postCount,   
            isRemix,      
            remixFormats 
        });

        // Backend-ul returnează un string JSON în data.output
        const parsed = extractJsonArray(data.output);
        
        // Normalizăm răspunsul
        if(Array.isArray(parsed)) {
            return parsed.map((p: any) => ({ 
                content: p.content,
                // Backend-ul poate returna "type": "script" sau "thread"
                type: p.type || 'post', 
                platform: p.platform || 'Generic'
            }));
        }
        return [];

    } catch (e: any) {
        // Returnăm un post de eroare ca să vadă userul ce s-a întâmplat
        return [{ content: `⚠️ Error: ${e.message}`, type: 'error' }];
    }
}

// --- Adapters (Funcții utilitare pentru modificări rapide) ---

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
