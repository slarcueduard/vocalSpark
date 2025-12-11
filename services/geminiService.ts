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

        if (!response.ok) {
            // Daca serverul da timeout (504) sau eroare
            const errorText = await response.text();
            throw new Error(`Server Error (${response.status}): ${errorText || response.statusText}`);
        }

        const text = await response.text();
        try {
            return JSON.parse(text);
        } catch (e) {
            console.error("Invalid JSON response:", text);
            throw new Error("AI response was not valid JSON.");
        }
    } catch (error: any) {
        console.error(`Fetch failed for ${url}:`, error);
        throw error;
    }
}

// --- HELPER: Extract JSON (Robust) ---
function extractJsonArray(text: string): any[] {
    try {
        let cleanText = text.replace(/```json|```/g, '').trim();
        const firstBracket = cleanText.indexOf('[');
        const lastBracket = cleanText.lastIndexOf(']');

        if (firstBracket !== -1 && lastBracket !== -1) {
            cleanText = cleanText.substring(firstBracket, lastBracket + 1);
        }

        let parsed = JSON.parse(cleanText);

        if (parsed.posts && Array.isArray(parsed.posts)) return parsed.posts;
        if (Array.isArray(parsed)) return parsed;
        return [parsed];
    } catch (e) {
        console.error("JSON Parse Error:", text);
        // Returnam un array gol ca sa nu crape UI-ul, dar logam eroarea
        return [];
    }
}

// --- 1. GENERARE TEXT (POSTĂRI / CAMPANII / REMIX) ---
export async function generateSocialMediaPosts(
    topic: string, tone: Tone, postCount: number, language: string, brandVoice: string, brandProfile?: BrandProfile, imageBase64?: string, imageMimeType?: string, objective: PostObjective = 'engagement', useRealTime: boolean = false, isCampaign: boolean = false, isRemix: boolean = false, remixFormats: string[] = [], isFollowUp: boolean = false, parentContent: string = ""
): Promise<any[]> {

    // 1. BRAND CONTEXT (Scurt si la obiect)
    let brandContext = '';
    if (brandProfile) {
        brandContext = `
        Identity: ${brandProfile.voiceDNA || brandVoice || "Professional"}
        Audience: ${brandProfile.targetAudience || "General"}
        Keywords: ${brandProfile.fixedHashtags || ''}
        `;
    }

    // 2. CONFIGURARE TASK (SPEED OPTIMIZED)
    let specificInstructions = "";

    if (isCampaign) {
        // --- PROMPT CAMPANIE OPTIMIZAT PENTRU VITEZA (NO 504 ERROR) ---
        specificInstructions = `
        TASK: Generate a ${postCount}-part Campaign Sequence.
        TOPIC: "${topic}"
        GOAL: ${objective}
        
        STRUCTURE:
        - Post 1: Hook/Teaser
        - Middle Posts: Value/Education
        - Last Post: Sales/CTA
        
        CONSTRAINT: Keep each post UNDER 60 WORDS. Be punchy. 
        REQUIRED OUTPUT: A JSON Array with exactly ${postCount} objects.
        `;
    } else if (isRemix) {
        specificInstructions = `
        TASK: Remix content into ${remixFormats.length} formats: ${remixFormats.join(', ')}.
        SOURCE: "${topic}"
        CONSTRAINT: Short & Native formats.
        REQUIRED OUTPUT: A JSON Array with ${remixFormats.length} objects.
        `;
    } else if (isFollowUp) {
        specificInstructions = `
        TASK: Write a logical follow-up/sequel to the provided SOURCE content.
        SOURCE: "${parentContent.substring(0, 500)}"
        
        CRITICAL STYLE INSTRUCTION:
        - You MUST match the tone, voice, sentence structure, and formatting of the SOURCE exactly.
        - If the source uses emojis, use them. If it's formal, remain formal.
        - Treat this as "Part 2" or a deep-dive response to the original.
        
        REQUIRED OUTPUT: A JSON Array with 1 object.
        `;
    } else {
        specificInstructions = `
        TASK: Generate ${postCount} viral variations.
        TOPIC: "${topic}"
        GOAL: ${objective}
        CONSTRAINT: Max 50 words per variation.
        REQUIRED OUTPUT: A JSON Array with ${postCount} objects.
        `;
    }

    const systemPrompt = `
    You are a Fast Social Media AI. Write in ${language}.
    
    ${brandContext}
    
    ${specificInstructions}
    
    RETURN ONLY RAW JSON ARRAY:
    [
      {
        "platform": "Generic",
        "content": "Short text here...",
        "imagePrompt": "Visual description..."
      }
    ]
    `;

    try {
        const data = await safeFetch('/api/generate-text', {
            prompt: systemPrompt,
            // Nu mai trimitem contextul separat pentru a reduce latenta, totul e in prompt
            // Dar pastram parametrii tehnici
            language: language,
            imageBase64, imageMimeType, objective, useRealTime,
            isCampaign, postCount, isRemix, remixFormats,
            isFollowUp, parentContent
        });

        const parsed = extractJsonArray(data.output);

        if (parsed.length === 0) {
            throw new Error("AI returned empty content. Try a shorter topic.");
        }

        if (Array.isArray(parsed)) {
            return parsed.map((p: any, index: number) => {
                let content = p.content || p.post || p.text || p.body || p;
                if (typeof content !== 'string') content = JSON.stringify(content);

                let platform = p.platform || 'Generic';
                if (isRemix && remixFormats[index]) platform = remixFormats[index];

                return {
                    content: content,
                    type: isCampaign ? 'campaign' : (isRemix ? 'remix' : 'single'),
                    platform: platform
                };
            });
        }
        return [];

    } catch (e: any) {
        console.error("Gemini Generation Error:", e);
        // Mesaj prietenos pentru utilizator in caz de timeout
        if (e.message.includes("504")) {
            throw new Error("Request timed out. Try generating fewer posts (e.g. 3) or use a simpler topic.");
        }
        throw new Error(e.message || "Failed to generate posts.");
    }
}

// --- 2. GENERARE IMAGINI ---
export async function generateImageForPost(
    postText: string,
    isPremium: boolean = false,
    topicContext: string = '',
    brandColors: string[] = []
): Promise<string> {

    // A. STANDARD (FLUX)
    if (!isPremium) {
        const cleanPrompt = encodeURIComponent(`${postText} ${topicContext}`.slice(0, 500));
        return `https://image.pollinations.ai/prompt/${cleanPrompt}?nologo=true&seed=${Math.floor(Math.random() * 10000)}`;
    }

    // B. PREMIUM (DALL-E 3)
    try {
        const imagePrompt = postText.length > 200 ? `Editorial photo: ${postText.substring(0, 200)}` : postText;

        const data = await safeFetch('/api/generate-image', {
            prompt: imagePrompt,
            isPremium: true,
            topic: topicContext,
            brandColors: brandColors
        });

        const imageUrl = data.imageUrl;

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
      "niche": "Industry",
      "audience": "Target Audience",
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
    } catch (e) { return originalContent; }
}

export async function refinePostContent(content: string, type: RefinementType): Promise<string> {
    try {
        const data = await safeFetch('/api/generate-text', { prompt: `Rewrite (${type}): "${content}"` });
        return data.output;
    } catch (e) { return content; }
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
