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
        let cleanText = text.replace(/```json|```/g, '').trim();
        let parsed = JSON.parse(cleanText);

        // Daca AI-ul returneaza un obiect cu cheia "posts"
        if (parsed.posts && Array.isArray(parsed.posts)) return parsed.posts;
        // Daca AI-ul returneaza direct array
        if (Array.isArray(parsed)) return parsed;
        // Daca e un singur obiect, il facem array
        return [parsed];
    } catch (e) {
        // Fallback: incercam sa gasim array-ul in text
        const start = text.indexOf('[');
        const end = text.lastIndexOf(']');
        if (start !== -1 && end !== -1) {
            try { return JSON.parse(text.substring(start, end + 1)); } catch (e2) {}
        }
        console.error("JSON Parse Error:", text);
        throw new Error("AI response format error.");
    }
}

// --- 1. GENERARE TEXT (POSTĂRI / CAMPANII / REMIX) ---
export async function generateSocialMediaPosts(
  topic: string, tone: Tone, postCount: number, language: string, brandVoice: string, brandProfile?: BrandProfile, imageBase64?: string, imageMimeType?: string, objective: PostObjective = 'engagement', useRealTime: boolean = false, isCampaign: boolean = false, isRemix: boolean = false, remixFormats: string[] = []
): Promise<any[]> {
    
    // 1. BRAND CONTEXT
    let brandContext = '';
    if (brandProfile) {
        brandContext = `
        BRAND IDENTITY:
        - Voice: ${brandProfile.voiceDNA || brandVoice}
        - Audience: ${brandProfile.targetAudience}
        - Keywords/Hashtags: ${brandProfile.fixedHashtags || ''}
        `;
    }

    // 2. LOGICA STRICTA PENTRU NUMARUL DE POSTARI
    let specificInstructions = "";
    
    if (isCampaign) {
        specificInstructions = `
        TASK: Generate a **CAMPAIGN SEQUENCE** of exactly ${postCount} posts.
        GOAL: ${objective.toUpperCase()}.
        TOPIC: "${topic}".
        
        STRUCTURE:
        - Post 1: The Hook/Teaser (Attention)
        - Middle Posts (2 to ${postCount-1}): Value/Education/Trust
        - Last Post (${postCount}): Sales/Conversion/Call to Action
        
        CRITICAL: You MUST return a JSON ARRAY with EXACTLY ${postCount} objects.
        `;
    } else if (isRemix) {
        specificInstructions = `
        TASK: Remix content into ${remixFormats.length} distinct formats: ${remixFormats.join(', ')}.
        SOURCE: "${topic}".
        CRITICAL: Return exactly ${remixFormats.length} objects.
        `;
    } else {
        specificInstructions = `
        TASK: Generate ${postCount} distinct variations of a viral post.
        TOPIC: "${topic}".
        GOAL: ${objective.toUpperCase()}.
        CRITICAL: Return exactly ${postCount} objects.
        `;
    }

    // 3. SYSTEM PROMPT (Strict Output Format)
    const systemPrompt = `
    You are a Viral Social Media AI. Write in ${language}.
    Be concise. No corporate fluff.
    
    ${brandContext}
    
    ${specificInstructions}
    
    OUTPUT FORMAT (STRICT JSON ARRAY):
    [
      { "platform": "Platform Name", "content": "Post 1 content..." },
      { "platform": "Platform Name", "content": "Post 2 content..." }
      ... (ensure there are exactly ${isRemix ? remixFormats.length : postCount} items)
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
        return [{ content: `⚠️ Error: ${e.message}`, type: 'error' }];
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
