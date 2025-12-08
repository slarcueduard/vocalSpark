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
        // 1. Curățăm Markdown-ul
        let cleanText = text.replace(/```json|```/g, '').trim();
        
        // 2. Extragem doar partea de array [...]
        const firstBracket = cleanText.indexOf('[');
        const lastBracket = cleanText.lastIndexOf(']');
        
        if (firstBracket !== -1 && lastBracket !== -1) {
            cleanText = cleanText.substring(firstBracket, lastBracket + 1);
        } else {
            // Dacă nu găsește [], poate e un singur obiect {}
            const firstBrace = cleanText.indexOf('{');
            const lastBrace = cleanText.lastIndexOf('}');
            if (firstBrace !== -1 && lastBrace !== -1) {
                const singleObj = JSON.parse(cleanText.substring(firstBrace, lastBrace + 1));
                // Verificăm dacă obiectul are o cheie "posts" sau "campaign"
                if (singleObj.posts && Array.isArray(singleObj.posts)) return singleObj.posts;
                return [singleObj];
            }
        }

        let parsed = JSON.parse(cleanText);

        if (Array.isArray(parsed)) return parsed;
        if (parsed.posts && Array.isArray(parsed.posts)) return parsed.posts;
        
        return [parsed];
    } catch (e) {
        console.error("JSON Parse Error. Raw text:", text);
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
        Voice Style: ${brandProfile.voiceDNA || brandVoice || "Professional"}
        Target Audience: ${brandProfile.targetAudience || "General"}
        Hashtags to include: ${brandProfile.fixedHashtags || ''}
        `;
    }

    // 2. CONSTRUIREA SCHELETULUI JSON (AICI ESTE FIX-UL)
    // Generăm un string de exemplu care are EXACT numărul de elemente cerut
    let jsonSkeleton = "";
    const targetCount = isRemix ? remixFormats.length : postCount;

    if (isCampaign) {
        // Pentru campanie, construim structura logica
        let items = [];
        for (let i = 1; i <= targetCount; i++) {
            let role = "Middle post (Value)";
            if (i === 1) role = "Teaser/Hook";
            if (i === targetCount) role = "Sales/CTA";
            
            items.push(`
            {
              "platform": "Generic",
              "content": "Write Post ${i} content here (${role}). Keep it concise.",
              "imagePrompt": "Image for Post ${i}"
            }`);
        }
        jsonSkeleton = `[\n${items.join(',\n')}\n]`;

    } else {
        // Pentru single/remix
        let items = [];
        for (let i = 1; i <= targetCount; i++) {
            items.push(`{ "platform": "Generic", "content": "Variation ${i}...", "imagePrompt": "..." }`);
        }
        jsonSkeleton = `[ ${items.join(', ')} ]`;
    }

    // 3. LOGICA TASK-ULUI
    let specificInstructions = "";
    
    if (isCampaign) {
        specificInstructions = `
        TASK: You are creating a **Sequential Content Campaign** of exactly ${targetCount} posts.
        TOPIC: "${topic}"
        GOAL: ${objective}
        
        It is VITAL that you return separate objects for each day of the campaign.
        Do NOT merge them into one text.
        `;
    } else if (isRemix) {
        specificInstructions = `
        TASK: Remix content into ${targetCount} formats: ${remixFormats.join(', ')}.
        SOURCE: "${topic}"
        `;
    } else {
        specificInstructions = `
        TASK: Generate ${targetCount} unique viral post variations.
        TOPIC: "${topic}"
        GOAL: ${objective}
        `;
    }

    const systemPrompt = `
    You are an expert Social Media AI. Write in ${language}.
    
    ${brandContext}
    
    ${specificInstructions}
    
    IMPORTANT: You must follow this EXACT JSON Structure format with ${targetCount} items:
    ${jsonSkeleton}
    
    Return ONLY valid JSON.
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
            // Validare extra: Dacă e campanie și avem doar 1 post, dar am cerut mai multe
            // AI-ul a "comasat" totul. Putem încerca să spargem manual textul dacă e cazul
            // Dar noua metodă cu Schelet JSON ar trebui să prevină asta.

            return parsed.map((p: any, index: number) => {
                let content = p.content || p.post || p.text || p.body || p;
                if (typeof content !== 'string') content = JSON.stringify(content);

                // Determinam tipul si platforma
                let type = 'post';
                if (isCampaign) type = 'campaign_post';
                if (isRemix) type = 'remix';

                let platform = p.platform || 'Generic';
                if (isRemix && remixFormats[index]) platform = remixFormats[index];

                return { 
                    content: content,
                    type: type,
                    platform: platform
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
