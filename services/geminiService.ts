import { Post, Tone, Platform, RefinementType, BrandProfile, PostObjective } from "../types";
import { auth } from "./firebase"; 

// --- HELPER: Obține tokenul de securitate ---
async function getAuthHeader() {
    const user = auth.currentUser;
    if (!user) return {}; 
    const token = await user.getIdToken();
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
}

// --- HELPER CRITIC: Fetch Sigur ---
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
        try {
            data = JSON.parse(text);
        } catch (e) {
            console.error("Server Raw Response (Not JSON):", text);
            throw new Error(`Server Error (${response.status}): Invalid response format.`);
        }

        if (!response.ok) {
            throw new Error(data.error || `API Error: ${response.statusText}`);
        }

        return data;

    } catch (error: any) {
        console.error(`Fetch failed for ${url}:`, error);
        throw error;
    }
}

// --- HELPER: Extragere JSON din textul AI ---
function extractJsonArray(text: string): any[] {
    try {
        return JSON.parse(text);
    } catch (e) {
        const firstBracket = text.indexOf('[');
        const lastBracket = text.lastIndexOf(']');
        
        if (firstBracket !== -1 && lastBracket !== -1) {
            const jsonStr = text.substring(firstBracket, lastBracket + 1);
            try {
                return JSON.parse(jsonStr);
            } catch (innerE) {
                console.error("Failed to parse extracted JSON string:", jsonStr);
            }
        }
        try {
             if (text.trim().startsWith('{')) {
                 return [JSON.parse(text)];
             }
        } catch (e2) {}
        
        throw new Error("AI did not return a valid JSON list.");
    }
}

// --- 1. ANALIZĂ BRAND ---
export async function analyzeBrandStyleFromPosts(pastPosts: string): Promise<string> {
    try {
        const prompt = `
        ACT AS: Expert Copywriter & Brand Strategist.
        TASK: Analyze these sample social media posts provided by the user.
        OUTPUT: A concise "Voice DNA" description (max 50 words) summarizing the Tone, Structure, and Vocabulary.
        
        USER POSTS:
        "${pastPosts}"

        RETURN ONLY THE DESCRIPTION.
        `;

        const data = await safeFetch('/api/generate-text', { prompt });
        return data.output;
    } catch (e) {
        console.error("Analysis failed", e);
        return "Professional, engaging, and direct.";
    }
}

// --- 2. IMAGINI (Prin Backend) ---
export async function generateImageForPost(postText: string, isPremium: boolean = false): Promise<string> {
    try {
        const imagePrompt = postText.length > 200 ? `Editorial photo representing: ${postText.substring(0, 200)}` : postText;

        const data = await safeFetch('/api/generate-image', { 
            prompt: imagePrompt,
            isPremium: isPremium 
        });
        
        return data.imageUrl;

    } catch (e) {
        console.error("Image Generation Failed:", e);
        throw e; 
    }
}

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
  objective: PostObjective = 'engagement'
): Promise<Omit<Post, 'id' | 'imageUrl' | 'isGeneratingImage' | 'adaptedContent'>[]> {
    
    // Construim contextul complex din profilul brandului
    let contextString = '';
    
    // AICI ERA EROAREA: Parantezele sunt acum corecte
    if (brandProfile) {
        contextString = `
        BRAND VOICE DNA: ${brandProfile.voiceDNA}
        TARGET AUDIENCE: ${brandProfile.description}
        
        HASHTAG STRATEGY:
        1. ALWAYS append these fixed hashtags: ${brandProfile.fixedHashtags || ''}
        2. ADDITIONALLY, generate 3-5 NEW, relevant, trending hashtags based on the specific post topic.
        3. Place all hashtags at the very end of the post.
        `;
    } else if (brandVoice) {
        contextString = `BRAND VOICE: ${brandVoice}`;
    }

    // Instrucțiuni specifice pentru obiectiv
    const objectiveInstructions: Record<string, string> = {
        engagement: "Focus on asking questions and sparking debate. Use a relatable hook.",
        sales: "Use AIDA framework. Focus on benefits and a strong CTA.",
        education: "Use bullet points or steps. Provide clear value.",
        viral: "Keep it short, punchy, and controversial. Maximize shareability.",
        traffic: "Create a curiosity gap. Direct them to the link."
    };

    let prompt = `
    ROLE: Expert Social Media Manager.
    GOAL: ${objectiveInstructions[objective] || "Engagement"}
    TASK: Write ${postCount} post(s) about: "${topic}".
    TONE: ${tone}.
    
    CRITICAL: You MUST include both the fixed hashtags (if any) AND 3-5 new generated hashtags relevant to the content.
    
    FORMAT: Return ONLY a raw JSON Array. Structure: [{"content": "Post text here..."}]
    `;

    try {
        const data = await safeFetch('/api/generate-text', { 
            prompt, 
            brandContext: contextString, // Trimitem contextul complet
            language: brandProfile?.language || language || 'English',
            imageBase64, 
            imageMimeType 
        });

        const parsed = extractJsonArray(data.output);
        
        if(Array.isArray(parsed)) {
            return parsed.map((p: any) => ({ content: p.content || p }));
        }
        return [];

    } catch (e: any) {
        console.error("Text Generation Logic Error:", e);
        return [{ content: `⚠️ Could not generate posts. Error: ${e.message}. Please try again.` }];
    }
}

// --- Helper Functions (Adapters) ---
export function fileToBase64(file: File): Promise<{mimeType: string, data: string}> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve({ mimeType: (reader.result as string).split(';')[0].split(':')[1], data: (reader.result as string).split(',')[1] });
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function adaptPostForPlatform(originalContent: string, platform: Platform): Promise<string> {
    try {
        const data = await safeFetch('/api/generate-text', { 
            prompt: `Adapt this post for ${platform}, optimizing formatting and hashtags: "${originalContent}"`,
            platform: platform 
        });
        return data.output;
    } catch(e) { return originalContent; }
}

export async function refinePostContent(content: string, type: RefinementType): Promise<string> {
    try {
        const promptMap: Record<string, string> = {
            'shorten': 'Shorten this post while keeping the impact:',
            'expand': 'Expand this post with more value:',
            'more-emojis': 'Add relevant emojis:',
            'formal': 'Rewrite to be more professional:'
        };
        const data = await safeFetch('/api/generate-text', { prompt: `${promptMap[type] || 'Rewrite:'} "${content}"` });
        return data.output;
    } catch(e) { return content; }
}

export async function analyzeBrandVoice(sampleText: string): Promise<string> {
    try {
        const data = await safeFetch('/api/generate-text', { prompt: `Analyze the tone, style, and vocabulary of this text. Describe the "Brand Voice" in 3 concise sentences: "${sampleText}"` });
        return data.output;
    } catch(e) { return ""; }
}
