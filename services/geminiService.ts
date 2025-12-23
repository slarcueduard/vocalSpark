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

// --- 6. GENERIC URL REMIX PIPELINE (NEW) ---
export async function generateUrlRemix(
    url: string,
    remixFormats: string[],
    tone: string,
    language: string
): Promise<any> {
    try {
        console.log(`Calling URL Remix Pipeline for: ${url}`);
        const data = await safeFetch('/api/remix-url', {
            url,
            platforms: remixFormats,
            tone,
            language
        });
        return data;

    } catch (e: any) {
        console.error("URL Remix Failed:", e);
        // Fallback or rethrow? Rethrow so UI knows
        throw e;
    }
}

// --- 1. GENERARE TEXT (POSTĂRI / CAMPANII / REMIX) ---
export async function generateSocialMediaPosts(
    topic: string, tone: Tone, postCount: number, language: string, brandVoice: string, brandProfile?: BrandProfile, imageBase64?: string, imageMimeType?: string, objective: PostObjective = 'engagement', useRealTime: boolean = false, isCampaign: boolean = false, isRemix: boolean = false, remixFormats: string[] = [], isFollowUp: boolean = false, parentContent: string = ""
): Promise<any[]> {

    // --- 1. PERSONA & IDENTITY LAYER ---
    // Instead of just "context", we define the AI's Identity.
    const identityLayer = `
    ROLE: You are an elite Social Media Ghostwriter.
    YOU ARE NOT AN AI. You are a human strategist mimicing a specific persona.
    
    IDENTITY PROFILE:
    ${brandProfile?.voiceDNA
            ? `"${brandProfile.voiceDNA}" \n(Adopt this syntax, sentence length, and vocabulary EXACTLY.)`
            : `VOICE: ${brandProfile?.voiceDNA || brandVoice || "Authentic, relatable, and high-impact."}`}
    
    AUDIENCE: ${brandProfile?.targetAudience || "General Audience"}
    LANGUAGE: ${language}
    `;

    // --- 1.5 PREFERENCE LAYER (Granular Control) ---
    // If brandProfile has preferences, we override defaults.
    const lengthPref = brandProfile?.postLength || 'medium';
    const detailPref = brandProfile?.detailLevel || 'balanced';
    const innovPref = brandProfile?.innovationFactor || 'balanced';

    let lengthInstruction = "";
    if (lengthPref === 'short') lengthInstruction = "CONSTRAINT: Concise but Specific. Max 350 chars. Prioritize substance over brevity. Name tools/examples.";
    if (lengthPref === 'medium') lengthInstruction = "CONSTRAINT: Standard length (40-80 words). Balanced flow.";
    if (lengthPref === 'long') lengthInstruction = "CONSTRAINT: Long-form. Expand on the topic. Use > 150 words. Use spacing.";

    let detailInstruction = "";
    if (detailPref === 'minimal') detailInstruction = "STYLE: Minimalist. No fluff. Straight to the point.";
    if (detailPref === 'balanced') detailInstruction = "STYLE: Balanced context.";
    if (detailPref === 'deep') detailInstruction = "STYLE: Deep Dive. Provide examples, 'why', and nuance. Educational.";

    let innovInstruction = "";
    if (innovPref === 'safe') innovInstruction = "RISK: Low. Professional, corporate, safe.";
    if (innovPref === 'balanced') innovInstruction = "RISK: Medium. Engaging.";
    if (innovPref === 'unique') innovInstruction = "RISK: High. Polarizing, metaphor-heavy, unconventional structure. BREAK PATTERNS.";

    const preferenceLayer = `
    PREFERENCES:
    - ${lengthInstruction}
    - ${detailInstruction}
    - ${innovInstruction}
    `;

    // --- 2. OBJECTIVE & STRATEGY LAYER ---
    let strategyLayer = "";

    if (isCampaign) {
        strategyLayer = `
        MODE: CAMPAIGN_SEQUENCE (${postCount} Posts)
        TOPIC: "${topic}"
        GOAL: ${objective}
        STRUCTURE:
        - Post 1 (The Hook): Mystery, intrigue, short impactful statements.
        - Post ${postCount > 2 ? '2-' + (postCount - 1) : '2'} (The Value): Education, "how-to", or deeper insight.
        - Post ${postCount} (The Close): Soft sell or Call-to-Action.
        
        CRITICAL: Each post must flow into the next but stand alone.
        `;
    } else if (isRemix) {
        strategyLayer = `
        MODE: REMIX_CONTENT
        SOURCE MATERIAL: "${topic}"
        FORMATS REQUIRED: ${remixFormats.join(', ')}
        
        INSTRUCTIONS:
        - ADAPT the source material to fit the NATIVE CULTURE of each platform.
        - LinkedIn: Professional/Editorial, longer form, line spacing.
        - Twitter/X: Punchy, thread-style, no fluff.
        - Instagram: Visual-first caption, friendly, lots of emojis.
        `;
    } else if (isFollowUp) {
        strategyLayer = `
        MODE: SEQUEL_GENERATION
        SOURCE CONTEXT: "${parentContent.substring(0, 800)}"
        TASK: Write Part 2 / Follow-up.
        CONSTRAINT: Match the exact tone of the source. Start with a transition (e.g., "That said...", "Update:").
        `;
    } else {
        // Single / Standard
        strategyLayer = `
        MODE: SINGLE_POSTS_BATCH
        TOPIC: "${topic}"
        QUANTITY: ${postCount} Distinct Options
        GOAL: ${objective}
        
        STYLES TO GENERATE:
        1. The Storyteller (Personal anecdote style)
        2. The Contrarian (Hot take / "Unpopular opinion")
        3. The Value Bomb (Actionable list or tip)
        (Ensure variety in structures)
        `;
    }

    // --- 3. CONSTRAINT & FORMATTING LAYER ---
    const systemPrompt = `
    ${identityLayer}

    ${preferenceLayer}

    ${strategyLayer}

    GLOBAL CONSTRAINTS:
    1. SPECIFICITY RULE: NEVER be generic. If you mention a strategy, tool, or method, NAME IT SPECIFICALLY (e.g., instead of 'use AI tools', say 'use ChatGPT or Claude').
    2. NO "AI FLUFF": Never use words like "delve", "unlock", "elevate", "game-changer", "transformative".
    2. FORMATTING: Use short paragraphs. Variable sentence length. 1-2 sentence hooks.
    3. FORCE JSON: Return ONLY a raw JSON array.
    
    OUTPUT SCHEMA:
    [
      {
        "platform": "Generic", 
        "content": "The actual post text...",
        "imagePrompt": "Description for an image...",
        "type": "${isCampaign ? 'campaign' : (isRemix ? 'remix' : 'single')}"
      }
    ]
    `;

    // --- 4. EXECUTION ---
    try {
        const payload: any = {
            prompt: systemPrompt, // We inject the fully constructed prompt
            // Pass metadata for logging/tracking purposes, though the prompt contains the logic
            language,
            objective,
            useRealTime,
            isCampaign,
            postCount,
            isRemix,
            remixFormats,
            isFollowUp,
            parentContent
        };

        // Pass image data only if relevant
        if (imageBase64) {
            payload.imageBase64 = imageBase64;
            payload.imageMimeType = imageMimeType;
        }

        const data = await safeFetch('/api/generate-text', payload);
        const parsed = extractJsonArray(data.output);

        if (parsed.length === 0) {
            throw new Error("AI returned empty content. Try a different topic.");
        }

        // --- 5. POST-PROCESSING (Failsafe) ---
        return parsed.map((p: any, index: number) => {
            let content = p.content || p.post || p.text || p.body || p;
            if (typeof content !== 'string') content = JSON.stringify(content);

            // Fix formatting quirks common in AI
            content = content.replace(/^["']|["']$/g, ''); // Remove surrounding quotes if any

            let platform = p.platform || 'Generic';
            if (isRemix && remixFormats[index]) platform = remixFormats[index];

            return {
                content: content,
                type: isCampaign ? 'campaign' : (isRemix ? 'remix' : 'single'),
                platform: platform,
                topic: topic // Preserve context
            };
        });

    } catch (e: any) {
        console.error("Gemini Generation Error:", e);
        if (e.message.includes("504")) {
            throw new Error("Request timed out. Try fewer posts.");
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
