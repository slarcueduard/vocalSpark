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

// --- 5. GROUNDED REMIX PIPELINE (NEW) ---
export async function generateGroundedRemix(
    url: string,
    platforms: string[] = ['linkedin', 'x'],
    tone: string = 'professional',
    language: string = 'English'
): Promise<any> {
    try {
        console.log("Calling Grounded Remix Pipeline...");
        const data = await safeFetch('/api/remix-video', {
            url,
            platforms,
            tone,
            language
        });

        // The API returns { video, transcript_meta, analysis, posts }
        if (!data || !data.posts) {
            throw new Error("Pipeline returned no posts.");
        }

        return data;

    } catch (e: any) {
        console.error("Grounded Remix Failed:", e);
        throw e;
    }
}

// --- HELPER: Extract JSON (Robust) ---
function extractJsonArray(text: string): any[] {
    try {
        let cleanText = text.replace(/```json|```/g, '').trim();

        // Try finding the first '[' and last ']'
        const firstBracket = cleanText.indexOf('[');
        const lastBracket = cleanText.lastIndexOf(']');

        if (firstBracket !== -1 && lastBracket !== -1) {
            cleanText = cleanText.substring(firstBracket, lastBracket + 1);
        } else {
            // Backup: Maybe it returned a single object not in array?
            const firstBrace = cleanText.indexOf('{');
            const lastBrace = cleanText.lastIndexOf('}');
            if (firstBrace !== -1 && lastBrace !== -1) {
                cleanText = cleanText.substring(firstBrace, lastBrace + 1);
                // We will parse it and wrap in array below
            }
        }

        let parsed = JSON.parse(cleanText);

        if (parsed.posts && Array.isArray(parsed.posts)) return parsed.posts;
        if (Array.isArray(parsed)) return parsed;
        return [parsed];
    } catch (e) {
        console.error("JSON Parse Error:", text);
        // Attempt a regex fix for common issues (trailing commas)
        try {
            const fixed = text.replace(/,\s*([\]}])/g, '$1');
            const parsed = JSON.parse(fixed);
            if (Array.isArray(parsed)) return parsed;
            return [parsed];
        } catch (e2) {
            return [];
        }
    }
}

// --- 1. GENERARE TEXT (POSTĂRI / CAMPANII / REMIX) ---
export async function generateSocialMediaPosts(
    topic: string, tone: Tone, postCount: number, language: string, brandVoice: string, brandProfile?: BrandProfile, imageBase64?: string, imageMimeType?: string, objective: PostObjective = 'engagement', useRealTime: boolean = false, isCampaign: boolean = false, isRemix: boolean = false, remixFormats: string[] = [], isFollowUp: boolean = false, parentContent: string = ""
): Promise<any[]> {

    // 1. BRAND CONTEXT (Deep Personalization)
    let brandContext = 'VOICE: Professional, but conversational.';
    if (brandProfile) {
        brandContext = `
        YOUR IDENTITY (Adopt this persona completely):
        - Voice/Style: ${brandProfile.voiceDNA || brandVoice || "Authentic and Relatable"}
        - Target Audience: ${brandProfile.targetAudience || "General Public"}
        - Signature Keywords: ${brandProfile.fixedHashtags || ''}
        
        MANDATORY BEHAVIOR:
        - Write EXACTLY as this person/brand would speak. 
        - Use their vocabulary, their sentence structure, and their rhythm.
        - If the Voice is "Witty", be genuinely funny. If "Professional", be concise and sharp.
        `;
    }

    // 2. CONFIGURARE TASK (Human-Centric & Speed Optimized)
    let specificInstructions = "";

    if (isCampaign) {
        specificInstructions = `
        TASK: Create a ${postCount}-part Campaign Sequence.
        TOPIC: "${topic}"
        GOAL: ${objective}
        
        HUMAN STRATEGY:
        - Treat this as a story unfolding over ${postCount} posts.
        - Post 1: Hook the reader (short, intriguing).
        - Middle Posts: Add value/insight (don't lecture).
        - Last Post: Call to action (natural, not salesy).
        
        CONSTRAINT: Keep each post UNDER 60 WORDS. Be punchy. 
        REQUIRED OUTPUT: A JSON Array with exactly ${postCount} objects.
        `;
    } else if (isRemix) {
        specificInstructions = `
        TASK: Remix content into ${remixFormats.length} distinct native formats: ${remixFormats.join(', ')}.
        SOURCE: "${topic}"
        CONSTRAINT: Adapt specifically to the culture of each platform (e.g., LinkedIn = Professional insight, Twitter = punchy thread).
        REQUIRED OUTPUT: A JSON Array with ${remixFormats.length} objects.
        `;
    } else if (isFollowUp) {
        specificInstructions = `
        TASK: Write a direct SEQUEL (Part 2) to the source text.
        SOURCE: "${parentContent.substring(0, 800)}"
        
        INSTRUCTIONS:
        - Continue the story/topic naturally.
        - Match the exact tone and style.
        - Start with a transition like "Furthermore..." or "Update:".
        
        OUTPUT FORMAT: JSON Array with 1 object.
        `;
    } else {
        specificInstructions = `
        TASK: Ghostwrite ${postCount} viral social media posts.
        TOPIC: "${topic}"
        GOAL: ${objective}
        
        HUMAN RULES:
        - NO predictable AI patterns (e.g., "In this fast-paced world...").
        - NO bullet points unless absolutely necessary.
        - Vary sentence length. Use fragments. Be real.
        - LIMIT: Max 280 characters per post (unless LinkedIn is specified).
        
        REQUIRED OUTPUT: A JSON Array with ${postCount} objects.
        `;
    }

    const systemPrompt = `
    ROLE: You are an elite Social Media Ghostwriter. You write like a HUMAN, not an AI.
    LANGUAGE: ${language}
    
    CRITICAL "ANTI-BOT" RULES:
    1. NEVER start with "Here are..." or "In this post...".
    2. NEVER use buzzwords like "delve", "unlock", "elevate", "game-changer" unless sarcastic.
    3. WRITE LIKE A HUMAN: Use casual transitions, ask questions, be opinionated.
    4. LENGTH PRIORITY: SHORT IS BETTER. Kill the fluff.
    
    ${brandContext}
    
    ${specificInstructions}
    
    RETURN ONLY RAW JSON ARRAY:
    [
      {
        "platform": "Generic",
        "content": "Text...",
        "imagePrompt": "Visual..."
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
        // Fix: Standard images should not be forced to use brand colors literally to avoid weird artifacts.
        // We only use the core post text and style context, ignoring specific brand color logic for standard mode.
        const cleanPrompt = encodeURIComponent(`${postText}`.slice(0, 500));
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
        let output = data.output;

        // Check if output is JSON formatted (same fix as refinePostContent)
        if (typeof output === 'string' && output.trim().startsWith('[{')) {
            try {
                const parsed = JSON.parse(output);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    output = parsed[0].content || parsed[0].post || parsed[0].text || parsed[0];
                }
            } catch (parseError) {
                const match = output.match(/"content"\s*:\s*"([^"]+)"/);
                if (match && match[1]) {
                    output = match[1];
                }
            }
        }

        return typeof output === 'string' ? output : originalContent;
    } catch (e) {
        console.error('Adaptation error:', e);
        return originalContent;
    }
}


export async function refinePostContent(content: string, type: RefinementType): Promise<string> {
    try {
        const data = await safeFetch('/api/generate-text', { prompt: `Rewrite (${type}): "${content}"` });
        let output = data.output;

        // Check if output is JSON formatted
        if (typeof output === 'string' && output.trim().startsWith('[{')) {
            try {
                // Parse JSON array
                const parsed = JSON.parse(output);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    // Extract content from first object
                    output = parsed[0].content || parsed[0].post || parsed[0].text || parsed[0];
                }
            } catch (parseError) {
                // If JSON parsing fails, try regex extraction
                const match = output.match(/"content"\s*:\s*"([^"]+)"/);
                if (match && match[1]) {
                    output = match[1];
                }
            }
        }

        // Return cleaned output
        return typeof output === 'string' ? output : content;
    } catch (e) {
        console.error('Refinement error:', e);
        return content;
    }
}

export async function autoGenerateBrandProfile(rawContent: string): Promise<BrandProfile> {
    try {
        const analysis = await analyzeBrandVoice(rawContent, 'personal');
        return {
            name: 'New Brand Profile',
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
