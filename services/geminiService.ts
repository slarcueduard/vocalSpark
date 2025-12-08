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
        // Curatam markdown
        let cleanText = text.replace(/```json|```/g, '').trim();
        // Curatam eventuale texte inainte/dupa JSON
        const firstBracket = cleanText.indexOf('[');
        const lastBracket = cleanText.lastIndexOf(']');
        
        if (firstBracket !== -1 && lastBracket !== -1) {
            cleanText = cleanText.substring(firstBracket, lastBracket + 1);
        }

        let parsed = JSON.parse(cleanText);

        // Tratare cazuri particulare de raspuns
        if (parsed.posts && Array.isArray(parsed.posts)) return parsed.posts;
        if (parsed.campaign && Array.isArray(parsed.campaign)) return parsed.campaign;
        if (Array.isArray(parsed)) return parsed;
        
        // Daca a returnat un singur obiect, il fortam intr-un array
        return [parsed];
    } catch (e) {
        console.error("JSON Parse Error. Raw text:", text);
        throw new Error("AI response format error.");
    }
}

// --- 1. GENERARE TEXT (POSTĂRI / CAMPANII / REMIX) ---
// --- 3. TEXT (Generare Postări & Campanii & Remix) ---
export async function generateSocialMediaPosts(
  topic: string, tone: Tone, postCount: number, language: string, brandVoice: string, brandProfile?: BrandProfile, imageBase64?: string, imageMimeType?: string, objective: PostObjective = 'engagement', useRealTime: boolean = false, isCampaign: boolean = false, isRemix: boolean = false, remixFormats: string[] = []
): Promise<any[]> {
    
    let brandContext = '';
    if (brandProfile) {
        brandContext = `
        Voice: ${brandProfile.voiceDNA || brandVoice || "Professional"}
        Audience: ${brandProfile.targetAudience || "General"}
        Hashtags: ${brandProfile.fixedHashtags || ''}
        `;
    }

    let specificInstructions = "";
    
    if (isCampaign) {
        // --- FIX 504: Cerem postari SCURTE pentru viteza ---
        specificInstructions = `
        TASK: Create a ${postCount}-part Campaign.
        TOPIC: "${topic}".
        GOAL: ${objective}.
        
        STRUCTURE (Return EXACTLY ${postCount} items):
        1. Hook/Teaser (Max 30 words)
        2-${postCount-1}. Value/Tips (Max 60 words each)
        ${postCount}. Sales/CTA (Max 40 words)
        
        Keep it punchy. Speed is priority.
        `;
    } else if (isRemix) {
        specificInstructions = `
        TASK: Remix into ${remixFormats.length} formats: ${remixFormats.join(', ')}.
        SOURCE: "${topic}".
        Keep each format concise and native to the platform.
        `;
    } else {
        specificInstructions = `
        TASK: Generate ${postCount} viral variations.
        TOPIC: "${topic}".
        GOAL: ${objective}.
        Max 60 words per post.
        `;
    }

    const systemPrompt = `
    You are an expert Social Media AI. Write in ${language}.
    CRITICAL: Be CONCISE. No fluff. No intros.
    
    ${brandContext}
    
    ${specificInstructions}
    
    OUTPUT MUST BE A VALID JSON ARRAY ONLY:
    [
      {
        "platform": "Platform Name",
        "content": "Post content...",
        "imagePrompt": "Visual description..."
      }
    ]
    `;

    try {
        const data = await safeFetch('/api/generate-text', { 
            prompt: systemPrompt, 
            brandContext: brandContext, 
            language: brandProfile?.language || language || 'English',
            imageBase64, imageMimeType, objective, useRealTime,
            isCampaign, postCount, isRemix, remixFormats 
        });

        const parsed = extractJsonArray(data.output);
        
        if(Array.isArray(parsed)) {
            // Validare lungime array
            if (isCampaign && parsed.length !== postCount) {
                console.warn(`AI returned ${parsed.length} posts, expected ${postCount}.`);
            }

            return parsed.map((p: any) => {
                let content = p.content || p.post || p.text || p.body || p;
                if (typeof content !== 'string') content = JSON.stringify(content);

                return { 
                    content: content,
                    type: p.type || (isCampaign ? 'campaign_post' : 'post'),
                    platform: p.platform || (isRemix ? 'Remix' : 'Generic')
                };
            });
        }
        return [];

    } catch (e: any) {
        // Logica de eroare mai clara
        console.error("Gemini Error:", e);
        return [{ content: `⚠️ Error: ${e.message}. Try generating fewer posts.`, type: 'error' }];
    }
}

// --- 2. GENERARE IMAGINI ---
export async function generateImageForPost(
    postText: string, 
    isPremium: boolean = false, 
    topicContext: string = '', 
    brandColors: string[] = []
): Promise<string> {
    
    // A. STANDARD (FLUX) - Client-side
    if (!isPremium) {
        const cleanPrompt = encodeURIComponent(`${postText} ${topicContext}`.slice(0, 500));
        return `https://image.pollinations.ai/prompt/${cleanPrompt}?nologo=true&seed=${Math.floor(Math.random() * 10000)}`;
    }

    // B. PREMIUM (DALL-E 3) - Server-side
    try {
        const imagePrompt = postText.length > 200 ? `Editorial photo: ${postText.substring(0, 200)}` : postText;

        const data = await safeFetch('/api/generate-image', { 
            prompt: imagePrompt,
            isPremium: true,
            topic: topicContext,
            brandColors: brandColors
        });
        
        const imageUrl = data.imageUrl;

        // Proxy DALL-E
        if (imageUrl.startsWith('http')) {
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
        console.error("Premium Image Gen Failed:", e);
        throw e; 
    }
}

// --- 3. ANALIZĂ BRAND ---
export const analyzeBrandVoice = async (content: string, mode: 'personal' | 'influencer' = 'personal') => {
  if (!content || content.length < 10) {
    throw new Error("Content is too short.");
  }

  const taskDescription = mode === 'influencer' 
    ? "You are a Ghostwriter. REVERSE ENGINEER the writing style."
    : "You are a Brand Strategist. Analyze this content.";

  const prompt = `
    ${taskDescription}
    CONTENT: "${content.substring(0, 3000)}"

    Extract "Voice DNA" into JSON:
    {
      "niche": "Industry (max 3 words)",
      "audience": "Target Audience (max 5 words)",
      "tone_score": number 0-100,
      "emoji_score": number 0-100,
      "length_score": number 0-100,
      "voice_description": "2-sentence style instruction."
    }
  `;

  try {
    const data = await safeFetch('/api/generate-text', { 
        prompt: prompt,
        postCount: 1, 
        isCampaign: false 
    });
    const cleanJson = data.output.replace(/```json|```/g, '').trim();
    return JSON.parse(cleanJson);
  } catch (error) {
    console.error("Error analyzing brand voice:", error);
    return {
      niche: "General",
      audience: "General Audience",
      tone_score: 50,
      emoji_score: 50,
      length_score: 50,
      voice_description: "Professional yet accessible."
    };
  }
};

// --- UTILS ---
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

export async function autoGenerateBrandProfile(rawContent: string): Promise<BrandProfile> {
    try {
        const analysis = await analyzeBrandVoice(rawContent, 'personal');
        return {
            industry: analysis.niche,
            language: 'English',
            voiceDNA: analysis.voice_description,
            description: analysis.audience,
            fixedHashtags: '',
            targetAudience: analysis.audience,
            brandColors: ['#3B82F6', '#8B5CF6', '#FFFFFF'],
            logoUrl: null
        };
    } catch (e) { throw new Error("Analysis failed."); }
}
