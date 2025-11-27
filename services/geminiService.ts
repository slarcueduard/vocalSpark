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
// ... (celelalte importuri)

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
  useRealTime: boolean = false
): Promise<Omit<Post, 'id' | 'imageUrl' | 'isGeneratingImage' | 'adaptedContent'>[]> {
    
    // 1. CONSTRUIREA "MEMORIEI" DE BRAND (Context Complet)
    let contextString = '';
    
    if (brandProfile) {
        contextString = `
        === BRAND IDENTITY PROFILE ===
        You are writing for a specific brand. You must strictly adhere to the following identity:
        
        1. NICHE / INDUSTRY: ${brandProfile.industry}
        
        2. TARGET AUDIENCE: ${brandProfile.description}
        
        3. VOICE DNA (Tone & Personality): ${brandProfile.voiceDNA}
        
        4. MANDATORY HASHTAGS: ${brandProfile.fixedHashtags || 'None'} (Append these to the end of the post).
        
        ${brandProfile.examplePosts ? `5. STYLE REFERENCE (Mimic the sentence structure and formatting of these examples):
        """
        ${brandProfile.examplePosts.substring(0, 1500)}
        """` : ''}
        ==============================
        `;
    } else if (brandVoice) {
        contextString = `BRAND VOICE: ${brandVoice}`;
    }

    // ... (restul rămâne la fel) ...

    const objectivesMap: Record<string, string> = {
        engagement: "Goal: Ask questions, spark debate, get comments.",
        sales: "Goal: Conversion (AIDA framework). Focus on pain points and solution.",
        education: "Goal: Teach/Value. Use bullet points and clear steps.",
        viral: "Goal: Maximum Reach. Short, punchy, shocking or relatable.",
        traffic: "Goal: Clicks. Create a curiosity gap pointing to the link in bio."
    };

    let prompt = `
    ROLE: Expert Social Media Manager.
    GOAL: ${objectivesMap[objective] || "Engagement"}
    TASK: Write ${postCount} post(s) about: "${topic}".
    TONE: ${tone}.
    
    FORMAT: Return ONLY a raw JSON Array: [{"content": "..."}]
    `;

    try {
        const data = await safeFetch('/api/generate-text', { 
            prompt, 
            brandContext: contextString, // Trimitem Super-Contextul
            language: brandProfile?.language || language || 'English',
            imageBase64, 
            imageMimeType,
            objective,
            useRealTime
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

// ... (celelalte importuri și funcții rămân la fel)

// --- HELPER: LOGO OVERLAY (Adaugă Logo pe Imagine) ---
export async function overlayLogoOnImage(mainImageUrl: string, logoUrl: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const mainImg = new Image();
        const logoImg = new Image();
        
        // Setări CORS pentru a evita erorile de securitate la imagini externe
        mainImg.crossOrigin = "Anonymous"; 
        logoImg.crossOrigin = "Anonymous";
        
        mainImg.onload = () => {
          // Setăm dimensiunea canvas-ului la fel ca imaginea generată
          canvas.width = mainImg.width; 
          canvas.height = mainImg.height;
          
          // 1. Desenăm imaginea principală
          ctx?.drawImage(mainImg, 0, 0);
          
          logoImg.onload = () => {
            if (ctx) {
              // 2. Calculăm dimensiunea logo-ului (ex: 15% din lățimea imaginii)
              const logoWidth = canvas.width * 0.15;
              const scaleFactor = logoWidth / logoImg.width;
              const logoHeight = logoImg.height * scaleFactor;
              
              // 3. Poziționare (Colțul Dreapta-Jos cu margine)
              const padding = canvas.width * 0.05;
              const x = canvas.width - logoWidth - padding;
              const y = canvas.height - logoHeight - padding;
              
              // 4. Adăugăm o mică umbră pentru vizibilitate
              ctx.shadowColor = "rgba(0,0,0,0.5)"; 
              ctx.shadowBlur = 10;
              
              // 5. Desenăm logo-ul
              ctx.drawImage(logoImg, x, y, logoWidth, logoHeight);
              
              // 6. Returnăm noua imagine ca Base64
              resolve(canvas.toDataURL('image/png'));
            }
          };
          logoImg.src = logoUrl;
        };
        
        mainImg.onerror = (e) => reject(e);
        logoImg.onerror = (e) => reject(e);
        
        mainImg.src = mainImageUrl;
    });
}
