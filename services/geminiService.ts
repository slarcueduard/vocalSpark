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

        if (parsed.posts && Array.isArray(parsed.posts)) return parsed.posts;
        if (!Array.isArray(parsed)) return [parsed];

        return parsed;
    } catch (e) {
        const start = text.indexOf('[');
        const end = text.lastIndexOf(']');
        if (start !== -1 && end !== -1) {
            try { return JSON.parse(text.substring(start, end + 1)); } catch (e2) {}
        }
        
        const objStart = text.indexOf('{');
        const objEnd = text.lastIndexOf('}');
        if (objStart !== -1 && objEnd !== -1) {
             try { return [JSON.parse(text.substring(objStart, objEnd + 1))]; } catch (e3) {}
        }

        console.error("JSON Parse Error. Raw text:", text);
        throw new Error("AI response format error. Could not parse JSON.");
    }
}

// --- 1. GENERARE TEXT (OPTIMIZAT: SPEED & PRIORITY) ---
export async function generateSocialMediaPosts(
  topic: string, tone: Tone, postCount: number, language: string, brandVoice: string, brandProfile?: BrandProfile, imageBase64?: string, imageMimeType?: string, objective: PostObjective = 'engagement', useRealTime: boolean = false, isCampaign: boolean = false, isRemix: boolean = false, remixFormats: string[] = []
): Promise<any[]> {
    
    // 1. CONTEXT BRAND (Style Modifier)
    let brandContext = '';
    if (brandProfile) {
        brandContext = `
        STYLE & TONE (Apply this flavor, but do NOT override the Topic):
        - Voice DNA: ${brandProfile.voiceDNA || brandVoice}
        - Target Audience: ${brandProfile.targetAudience}
        - Mandatory Hashtags: ${brandProfile.fixedHashtags || ''}
        `;
    }

    // 2. CONSTRUIREA TASK-ULUI (The Core Logic)
    let specificInstructions = "";
    
    if (isCampaign) {
        // STRATEGIE CAMPANIE: Teaser -> Value -> Sales (Concise & Impactful)
        specificInstructions = `
        TASK: Create a ${postCount}-part Content Campaign.
        GOAL: ${objective.toUpperCase()}.
        TOPIC: "${topic}" (This is PRIORITY #1).
        
        STRUCTURE (Speed & Impact):
        1. Post 1 (The Teaser): Short, mysterious, opens a loop. Max 280 chars.
        2. Post 2-${postCount-1} (The Value): Educational or Story. Solves a specific sub-problem.
        3. Post ${postCount} (The Close): Direct Call to Action. Sales focused.
        
        CRITICAL RULES:
        - NO fluff, NO intro sentences like "Here is a campaign".
        - Start directly with the Hook.
        - Keep sentences under 15 words.
        `;
    } else if (isRemix) {
        specificInstructions = `
        TASK: Repurpose content into exactly ${remixFormats.length} formats: ${remixFormats.join(', ')}.
        SOURCE TOPIC: "${topic}".
        GOAL: ${objective.toUpperCase()}.
        
        For each format, adapt the layout perfectly (e.g. LinkedIn = Line breaks, Twitter = Threads).
        `;
    } else {
        // SINGLE POST (Viral Structure)
        specificInstructions = `
        TASK: Write ${postCount} distinct variations of a viral post.
        TOPIC: "${topic}" (PRIORITY #1).
        GOAL: ${objective.toUpperCase()}.
        TONE: ${tone}.
        
        FRAMEWORK: Use the "Hook - Value - CTA" framework.
        - Hook: Grabs attention immediately.
        - Value: Delivers on the promise.
        - CTA: Tells them what to do next.
        `;
    }

    // 3. REGULI GENERALE (Speed Optimization)
    const systemPrompt = `
    You are a world-class Copywriter.
    
    HIERARCHY OF IMPORTANCE:
    1. USER TOPIC (What to say) - Most Important.
    2. BRAND VOICE (How to say it) - Important.
    
    WRITING RULES (For Speed & Quality):
    - Write in ${language}.
    - Be CONCISE. Delete all fluff.
    - No corporate jargon (e.g. "delve", "landscape", "tapestry").
    - Use emojis sparingly unless specified in Brand Voice.
    - Formatting: Use line breaks for readability.
    
    ${brandContext}
    
    ${specificInstructions}
    
    OUTPUT FORMAT:
    Return ONLY a raw JSON array. No markdown.
    [
      {
        "platform": "Platform Name",
        "content": "The post text...",
        "imagePrompt": "Detailed visual description for AI image generator..."
      }
    ]
    `;

    try {
        const data = await safeFetch('/api/generate-text', { 
            prompt: systemPrompt, // Trimitem totul compactat
            // Parametrii individuali sunt trimisi ca fallback pentru backend-uri care ii folosesc separat
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
                    platform: p.platform || 'Generic'
                };
            });
        }
        return [];

    } catch (e: any) {
        return [{ content: `⚠️ Error: ${e.message}`, type: 'error' }];
    }
}

// --- 2. GENERARE IMAGINI (STANDARD CLIENT-SIDE + PREMIUM SERVER-SIDE) ---
export async function generateImageForPost(
    postText: string, 
    isPremium: boolean = false, 
    topicContext: string = '', 
    brandColors: string[] = []
): Promise<string> {
    
    // A. STANDARD (FLUX) - Generare Directa Client-Side
    if (!isPremium) {
        const cleanPrompt = encodeURIComponent(`${postText} ${topicContext}`.slice(0, 500));
        // Adaugam un seed random ca sa fie diferita mereu
        return `https://image.pollinations.ai/prompt/${cleanPrompt}?nologo=true&seed=${Math.floor(Math.random() * 10000)}`;
    }

    // B. PREMIUM (DALL-E 3) - Trece prin Server
    try {
        const imagePrompt = postText.length > 200 ? `Editorial photo: ${postText.substring(0, 200)}` : postText;

        const data = await safeFetch('/api/generate-image', { 
            prompt: imagePrompt,
            isPremium: true,
            topic: topicContext,
            brandColors: brandColors
        });
        
        const imageUrl = data.imageUrl;

        // Proxy DALL-E (optional, pentru a evita expirarea linkurilor)
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

// --- 3. ANALIZĂ BRAND (UNIFICAT) ---
export const analyzeBrandVoice = async (content: string, mode: 'personal' | 'influencer' = 'personal') => {
  if (!content || content.length < 10) {
    throw new Error("Content is too short.");
  }

  const taskDescription = mode === 'influencer' 
    ? "You are a Ghostwriter. REVERSE ENGINEER the writing style of this influencer to clone it."
    : "You are a Brand Strategist. Analyze this content to build a Brand Voice profile.";

  const prompt = `
    ${taskDescription}
    
    CONTENT SAMPLE: "${content.substring(0, 3000)}"

    Extract "Voice DNA" into this JSON structure (return ONLY JSON):
    {
      "niche": "Industry (max 3 words)",
      "audience": "Target Audience (max 5 words)",
      "tone_score": number 0-100 (0=Casual, 100=Formal),
      "emoji_score": number 0-100 (0=None, 100=Heavy),
      "length_score": number 0-100 (0=Short, 100=Long),
      "voice_description": "2-sentence instruction on how to write like this person."
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
