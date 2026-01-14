import { Post, Tone, Platform, RefinementType, BrandProfile, PostObjective } from "../types";
import { auth } from "./firebase";
import { UNIVERSAL_STYLE_RULES } from "../constants/universalRules";

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
    topic: string, tone: Tone, postCount: number, language: string, brandVoice: string, brandProfile?: BrandProfile, imageBase64?: string, imageMimeType?: string, objective: PostObjective = 'engagement', useRealTime: boolean = false, isCampaign: boolean = false, isRemix: boolean = false, remixFormats: string[] = [], isFollowUp: boolean = false, parentContent: string = "", isMultiPlatform: boolean = false, targetPlatforms: Platform[] = [], remixTargetTopic: string = "",
    xRayConstraints?: { hook: string, tone: string, structure: string }, // NEW: Explicit constraints
    isReply: boolean = false, replyOptions: { useEmojis: boolean, question: string | boolean, link: string } = { useEmojis: true, question: '', link: '' },
    useGreenScreen: boolean = false // NEW: TikTok Green Screen Mode
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

    if (isMultiPlatform) {
        strategyLayer = `
        MODE: MULTI_PLATFORM_ADAPTATION
        TOPIC: "${topic}"
        TARGET PLATFORMS: ${targetPlatforms.join(', ')}
        GOAL: ${objective}
        
        INSTRUCTIONS:
        Generate ONE distinct post for EACH requested platform.
        - Customize valid formatting (hashtags, length, structure) for that SPECIFIC platform.
        - Twitter/X: Short, punchy, no hashtags or max 1.
        - LinkedIn: Professional, spaced out, longer form.
        - Instagram: Visual caption style, engaging hook, emoji usage.
        - Facebook: Conversational, community-focused.
        `;
    } else if (isCampaign) {
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
        // --- X-RAY / REVERSE ENGINEERING STRATEGY ---

        let analysisContext = "";

        if (xRayConstraints) {
            // USER PRE-ANALYZED: Use these specific constraints
            analysisContext = `
            ### LOCKED STRUCTURAL DNA
            You must IGNORE the internal analysis of the reference content and instead use these EXPLICIT constraints:
            1. **FORCED HOOK:** ${xRayConstraints.hook} (You MUST start with this pattern).
            2. **FORCED TONE:** ${xRayConstraints.tone}.
            3. **FORCED STRUCTURE:** ${xRayConstraints.structure}.
            `;
        } else {
            // AUTO-MODE: Analyze it now
            analysisContext = `
            ### PHASE 1: THE X-RAY (STRUCTURAL ANALYSIS)
            First, deep-scan the REFERENCE_CONTENT to extract its "Viral DNA".
            Identify: Hook Pattern, Rhythm, Tone, Structural Skeleton.
            `;
        }

        strategyLayer = `
        ### ROLE & OBJECTIVE
        You are Vocal Spark AI. "Reverse Engineer" the reference content and rewrite the NEW_TOPIC using the SAME formula.

        ### INPUT DATA
        1. REFERENCE_CONTENT: "${topic}"
        2. NEW_TOPIC: "${remixTargetTopic}"
        3. TARGET_PLATFORMS: ${remixFormats.join(', ')}
        4. LANGUAGE: ${language}

        ${analysisContext}

        ${useGreenScreen && remixFormats.includes('TikTok Script') ? `
        ### SPECIAL MODE: TIKTOK GREEN SCREEN
        For the **TikTok Script** format, you MUST output a 3-COLUMN SCRIPT (Visual | Action | Script).
        INSTRUCTION: Analyze the REFERENCE_CONTENT (Source Text).
        Break it down into 3-5 segments.
        For each segment:
        - VISUAL: Identify the SPECIFIC SENTENCE or DATA POINT from the source text that the user should Screenshot. DIRECT QUOTE IT.
        - ACTION: Direct the user (e.g., "Point at the headline", "Highlight the date").
        - SCRIPT: Conversational, punchy commentary.
        ` : ''}

        ### PHASE 2: THE REMIX (GENERATION)
        Generate a NEW POST about the NEW_TOPIC.
        Constraints:
        - **Structure Lock:** Mimic paragraph breaks and sentence lengths.
        - **No "AI Slop":** Write naturally.
        `;
    } else if (isFollowUp) {
        strategyLayer = `
        MODE: SEQUEL_GENERATION
        SOURCE CONTEXT: "${parentContent.substring(0, 800)}"
        TASK: Write Part 2 / Follow-up.
        CONSTRAINT: Match the exact tone of the source. Start with a transition (e.g., "That said...", "Update:").
        `;
    } else if (isReply) {
        strategyLayer = `
        MODE: REPLY_GENERATION
        SOURCE COMMENT: "${topic}"
        TASK: Write a reply.
        CUSTOMIZATION:
        ${replyOptions.useEmojis ? '- Use Emojis: YES' : '- Use Emojis: NO'}
        ${replyOptions.question ? `- Closing Question: "${replyOptions.question}"` : ''}
        ${replyOptions.link ? `- Include Link: "${replyOptions.link}"` : ''}
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
    const formatLayer = `
    FORMATTING RULES:
    - JSON OUTPUT ONLY. No markdown, no intro text.
    - Return an ARRAY of objects.
    - OBJECT COMPOSITION:
      {
        "content": "Full post text here...",
        "type": "post" (or "thread" etc),
        "platform": "Platform Name" (optional, for multi-platform),
        "x_ray_analysis": {
             "hook_type": "...",
             "tone_detected": "...",
             "structure_tag": "..."
        } (INCLUDE THIS ONLY FOR REMIX MODE)
      }
    `;

    // --- 4. IMAGE CONTEXT ---
    let imagePrompt = "";
    if (imageBase64) {
        imagePrompt = `
        IMAGE CONTEXT: An image is attached to this request.
        MIME: ${imageMimeType}
        INSTRUCTION: Analyze the image and use it as context for the generated posts. 
        If the objective is 'sales', describe the product in the image.
        `;
    }

    const fullPrompt = `
    ${UNIVERSAL_STYLE_RULES}
    
    ${identityLayer}
    ${preferenceLayer}
    ${strategyLayer}
    ${formatLayer}
    ${imagePrompt}
    `;

    // --- 4. EXECUTION ---
    try {
        const payload: any = {
            prompt: fullPrompt, // We inject the fully constructed prompt
            // Pass metadata for logging/tracking purposes, though the prompt contains the logic
            language,
            objective,
            useRealTime,
            isCampaign,
            postCount,
            isRemix,
            remixFormats,
            isFollowUp,
            parentContent,
            isMultiPlatform,
            targetPlatforms,
            isReply,
            replyOptions
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
            // If multi-platform, trust the AI but fallback to valid list order if reasonable
            if (isMultiPlatform && targetPlatforms[index] && platform === 'Generic') platform = targetPlatforms[index];


            return {
                content: content,
                type: isCampaign ? 'campaign' : (isRemix ? 'remix' : (isMultiPlatform ? 'multi' : 'single')),
                platform: platform,
                topic: topic, // Preserve context
                xRayAnalysis: p.x_ray_analysis // Map X-Ray Analysis if available
            };
        });

    } catch (e: any) {
        console.error("Gemini Generation Error:", e);
        if (e.message && e.message.includes("504")) {
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

    // A. UNIFIED BACKEND GENERATION (Resolves Standard Image Preview & CORS Issues)
    // We now use the backend for *all* generation:
    // - Premium: DALL-E 3 (High Quality)
    // - Standard: DALL-E 2 (Fast, Cheap, Reliable)
    // This returns a Base64 string directly, preventing client-side preview failures.

    try {
        const imagePrompt = postText.length > 400 ? postText.substring(0, 400) : postText;

        const data = await safeFetch('/api/generate-image', {
            prompt: imagePrompt,
            isPremium: isPremium,
            topic: topicContext,
            brandColors: brandColors
        });

        return data.imageUrl;

    } catch (e: any) {
        console.error("Image Gen Failed:", e);
        throw e;
    }
}

// --- 3. ANALIZĂ BRAND ---
// ... (existing brand analysis code if any, or just place this before the end)

// --- 4. VIRAL X-RAY ANALYSIS ---
export async function analyzeViralStructure(content: string): Promise<{ hook: string, tone: string, structure: string }> {
    const prompt = `
    ROLE: You are an expert Content Analyst.
    TASK: Analyze the provided text and extract its "Viral DNA".
    INPUT TEXT: "${content.substring(0, 1000)}"

    OUTPUT FORMAT (JSON ONLY):
    {
        "hook": "Name of the hook pattern (e.g. Negative Warning, Contrarian Statement)",
        "tone": "The dominant tone (e.g. Aggressive, Empathetic)",
        "structure": "The structural skeleton (e.g. Listicle, Story-Lesson-CTA)"
    }
    `;

    try {
        const data = await safeFetch('/api/generate-text', {
            prompt: prompt,
            temperature: 0.2 // Low temp for analytical precision
        });

        // Robust JSON extraction
        let cleanJson = data.output.replace(/```json/g, '').replace(/```/g, '').trim();
        // Find actual JSON object if there's extra text
        const firstBrace = cleanJson.indexOf('{');
        const lastBrace = cleanJson.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1) {
            cleanJson = cleanJson.substring(firstBrace, lastBrace + 1);
        }

        const parsed = JSON.parse(cleanJson);

        // Normalize keys to lowercase to avoid "Hook" vs "hook" issues
        return {
            hook: parsed.hook || parsed.Hook || parsed.HOOK || "Generic Hook",
            tone: parsed.tone || parsed.Tone || parsed.TONE || "Professional",
            structure: parsed.structure || parsed.Structure || parsed.STRUCTURE || "Standard Post"
        };
    } catch (e) {
        console.error("X-Ray Analysis Failed:", e);
        return {
            hook: "Generic Hook",
            tone: "Professional",
            structure: "Standard Post"
        };
    }
}
export const analyzeBrandVoice = async (content: string, mode: 'personal' | 'influencer' = 'personal') => {
    if (!content || content.length < 10) {
        throw new Error("Content is too short.");
    }

    const modeSpecificPrompt = mode === 'influencer'
        ? `
        ROLE: You are a Ghostwriter analyzing SOMEONE ELSE'S style to extract replicable patterns.
        
        OBJECTIVE: Extract their TEACHABLE FORMULA (not plagiarism).
        FOCUS ON:
        - Hook patterns (how they start posts)
        - Recurring phrases and vocabulary
        - Storytelling structure
        - What makes their content shareable
        
        This is for LEARNING their strategy, not copying.
        `
        : `
        ROLE: You are a Brand Strategist analyzing YOUR CLIENT'S authentic voice.
        
        OBJECTIVE: Build a consistent personal brand identity.
        FOCUS ON:
        - Their natural writing quirks
        - Unique phrases they use
        - Tone consistency
        - Audience connection style
        
        This is for MAINTAINING their authentic voice.
        `;

    const prompt = `
    ${modeSpecificPrompt}
    
    CONTENT TO ANALYZE: "${content.substring(0, 3000)}"
    
    Extract "Voice DNA" into JSON:
    {
      "niche": "Primary industry/topic (e.g., Tech Startups, Fitness, Marketing)",
      "audience": "Target audience description",
      "tone_score": number 0-100 (0=casual, 100=formal),
      "emoji_score": number 0-100 (0=minimal, 100=heavy),
      "length_score": number 0-100 (0=short punchy, 100=long detailed),
      "voice_description": "2-sentence style instruction for this ${mode === 'influencer' ? 'style pattern' : 'personal voice'}",
      "suggested_hashtags": ["#hashtag1", "#hashtag2", "#hashtag3", "#hashtag4", "#hashtag5"]
    }
    
    HASHTAG RULES:
    - Provide MINIMUM 3, MAXIMUM 5 hashtags
    - Base them on the detected niche and audience
    - Mix: 1-2 broad niche tags + 2-3 specific topic tags
    - Use proper capitalization (e.g., #ContentMarketing, not #contentmarketing)
    - No spaces in hashtags
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
            voice_description: "Professional yet accessible.",
            suggested_hashtags: ["#Business", "#Marketing", "#Growth"]
        };
    }
};

// --- UTILS ---
export async function adaptPostForPlatform(originalContent: string, platform: Platform): Promise<string> {
    try {
        const data = await safeFetch('/api/generate-text', {
            prompt: `${UNIVERSAL_STYLE_RULES}\n\nAdapt for ${platform}: "${originalContent}"`
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
        const data = await safeFetch('/api/generate-text', { prompt: `${UNIVERSAL_STYLE_RULES}\n\nRewrite (${type}): "${content}"` });
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
// --- 5. IDEA GENERATOR ---
export async function generatePostIdeas(niche: string): Promise<string> {
    try {
        // Add random seed to prevent caching/repetition
        const seed = Math.random().toString(36).substring(7);

        const prompt = `
        ROLE: You are an experienced creator giving advice to a friend. NOT a robot.
        TASK: Write a short, messy, "rough draft" post idea about: "${niche}".
        CONTEXT: The user wants to write something authentic, vulnerable, or controversial.
        
        CRITICAL RULES:
        1. NO ROBOTIC LANGUAGE (e.g. "Delve into", "Unlock", "Mastering", "In this post").
        2. NO TITLES. Just the raw idea/hook.
        3. DO NOT use the word "${niche}" literally if it sounds awkward (e.g. "My mistake in babies"). say "My mistake as a new parent" instead.
        4. TONE: Conversational, slightly imperfect, human.
        5. LENGTH: 2-3 sentences (approx 40 words).
        
        GOOD EXAMPLES:
        - "Honestly, I used to think [Topic] was all about [Common Myth], but man was I wrong. "
        - "Unpopular opinion: Stop trying to be perfect at [Topic]. It's killing your progress."
        - "I wish someone told me this when I started... you don't need [Expensive Thing] to succeed."
        
        Generate ONE idea now. (Random Seed: ${seed})
        `;

        const data = await safeFetch('/api/generate-text', {
            prompt: prompt,
            temperature: 0.9 // High creativity
        });

        let output = data.output;

        // --- ROBUST CLEANUP START ---
        // 1. If it looks like JSON/Array, parse it.
        if (output.trim().match(/^\[|^\{/)) {
            try {
                const raw = output.replace(/```json|```/g, '').trim();
                const parsed = JSON.parse(raw);
                const item = Array.isArray(parsed) ? parsed[0] : parsed;
                if (item.content) output = item.content;
                else if (item.post) output = item.post;
                else if (typeof item === 'string') output = item;
            } catch (e) {
                // Parse failed, fall to regex
            }
        }

        // 2. Forced Regex Cleanup (The "Nuclear" Option)
        // Removes {"content": and [{"content": wrappers
        output = output.replace(/^\[?\{?\s*["']?content["']?\s*:\s*["']?/i, '');
        // Removes closing }]" at the end
        output = output.replace(/["']?\s*\}?\]?$/i, '');
        // Removes plain "content": prefix if left
        output = output.replace(/["']?content["']?\s*:\s*/i, '');
        // Standard cleanup
        output = output.replace(/^["']|["']$/g, '').replace(/^Topic:\s*/i, '').trim();
        // --- ROBUST CLEANUP END ---

        return output;
    } catch (e) {
        console.error("Idea Generation Failed:", e);

        // LARGE set of high-quality fallback templates to prevent repetition
        const templates = [
            `I used to think that successful ${niche} was just about luck, but I was wrong. The real secret is...`,
            `Unpopular opinion: Most people are overcomplicating ${niche}. You really only need to focus on one thing.`,
            `If I could go back to start over in ${niche}, I would tell myself to stop worrying about the metrics.`,
            `The biggest lie everyone tells you about ${niche} is that you need to be an expert to start.`,
            `I learned more about ${niche} from my biggest failure than I ever did from my wins.`,
            `Don't let anyone tell you that ${niche} is easy. It's hard, but it's worth it because...`,
            `My entire perspective on ${niche} changed when I stopped trying to copy others.`,
            `The best advice I ever got about ${niche}? Keep it simple.`,
            `Why is nobody talking about the mental toll of ${niche}? Let's be real for a second.`,
            `Stop waiting for the "perfect moment" to start in ${niche}. It doesn't exist.`
        ];
        return templates[Math.floor(Math.random() * templates.length)];
    }
}

// --- 6. SMART SOURCE FINDER ---
export async function findTrendingContent(niche: string): Promise<string> {
    try {
        const prompt = `
        TASK: Search for a trending, high-performing news article or blog post related to: "${niche}".
        CRITICAL: Return ONLY the URL (https://...). No title, no introductory text.
        REQUIREMENT: Must be recent (last 24-48 hours).
        `;

        const data = await safeFetch('/api/generate-text', {
            prompt,
            useRealTime: true
        });

        // Clean up output to ensure it's just a URL
        let url = data.output.trim();
        // Remove 'Here is a link...' wrappers if they persist
        const urlMatch = url.match(/(https?:\/\/[^\s]+)/);
        if (urlMatch) return urlMatch[0];

        return url;
    } catch (e) {
        console.error("Smart Source Setup Failed", e);
        throw e;
    }
}
