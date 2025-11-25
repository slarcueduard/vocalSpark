import { Post, Tone, Platform, RefinementType, BrandProfile } from "../types";
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
        // Fallback: Uneori AI-ul returnează doar un obiect, nu o listă
        try {
             if (text.trim().startsWith('{')) {
                 return [JSON.parse(text)];
             }
        } catch (e2) {}
        
        throw new Error("AI did not return a valid JSON list.");
    }
}

// --- 1. IMAGINI (Prin Backend) ---
// Aceasta este singura definiție a funcției!
export async function generateSocialMediaPosts(
  topic: string, tone: Tone, postCount: number, language: string, brandVoice: string, brandProfile?: BrandProfile, imageBase64?: string, imageMimeType?: string
) {
    // Folosim limba din profil dacă există, altfel parametrul language, altfel English
    const finalLang = brandProfile?.language || language || 'English';

    // ... în request body către backend:
    const data = await safeFetch('/api/generate-text', { 
            prompt, 
            brandContext: brandVoice, 
            language: finalLang, // <--- TRIMITEM LIMBA AICI
            imageBase64, 
            imageMimeType 
    });
        
        return data.imageUrl;

    } catch (e) {
        console.error("Image Generation Failed:", e);
        throw e; // Aruncăm eroarea ca să o vadă UI-ul (ex: "Not enough credits")
    }
}

export async function generateImageVariation(base64ImageData: string, mimeType: string, style: string): Promise<string> {
    // Variațiile momentan folosesc un fallback rapid (Pollinations)
    // Într-un viitor update putem muta și asta pe backend
    await new Promise(r => setTimeout(r, 1000)); 
    const cleanStyle = encodeURIComponent(style + " artistic style, high quality");
    const seed = Math.floor(Math.random() * 1000);
    return `https://image.pollinations.ai/prompt/${cleanStyle}?width=1080&height=1080&seed=${seed}&model=flux`;
}

// --- 2. LOGO OVERLAY (Client-Side) ---
export type LogoPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
export async function overlayLogoOnImage(mainImageUrl: string, logoUrl: string, position: LogoPosition = 'top-left', removeBg: boolean = false): Promise<string> {
    return new Promise((resolve, reject) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const mainImg = new Image();
        const logoImg = new Image();
        mainImg.crossOrigin = "Anonymous"; logoImg.crossOrigin = "Anonymous";
        
        mainImg.onload = () => {
          canvas.width = mainImg.width; canvas.height = mainImg.height;
          ctx?.drawImage(mainImg, 0, 0);
          
          logoImg.onload = () => {
            if (ctx) {
              const logoWidth = canvas.width * 0.20;
              const scaleFactor = logoWidth / logoImg.width;
              const logoHeight = logoImg.height * scaleFactor;
              const padding = canvas.width * 0.05;
              let x = padding, y = padding;
              
              switch (position) {
                  case 'top-left': x = padding; y = padding; break;
                  case 'top-right': x = canvas.width - logoWidth - padding; y = padding; break;
                  case 'bottom-left': x = padding; y = canvas.height - logoHeight - padding; break;
                  case 'bottom-right': x = canvas.width - logoWidth - padding; y = canvas.height - logoHeight - padding; break;
              }
              
              ctx.shadowColor = "rgba(0,0,0,0.5)"; ctx.shadowBlur = 15;
              ctx.drawImage(logoImg, x, y, logoWidth, logoHeight);
              resolve(canvas.toDataURL('image/png'));
            }
          };
          logoImg.src = logoUrl;
        };
        mainImg.onerror = (e) => reject(e);
        mainImg.src = mainImageUrl;
    });
}

// --- 3. TEXT (Prin Backend) ---
export async function generateSocialMediaPosts(
  topic: string, tone: Tone, postCount: number, language: string, brandVoice: string, brandProfile?: BrandProfile, imageBase64?: string, imageMimeType?: string
): Promise<Omit<Post, 'id' | 'imageUrl' | 'isGeneratingImage' | 'adaptedContent'>[]> {
    
    let prompt = `
    ROLE: Expert Social Media Manager.
    TASK: Write ${postCount} highly engaging social media posts about: "${topic}".
    TONE: ${tone}.
    LANGUAGE: ${language}.
    FORMAT: Return ONLY a raw JSON Array. Structure: [{"content": "Post text here... emojis included"}]
    `;
    
    // Trimitem brandContext separat în body, dar îl includem și în prompt text pentru siguranță
    if (brandVoice) prompt += `\nBRAND VOICE: ${brandVoice}`;

    try {
        const data = await safeFetch('/api/generate-text', { 
            prompt, 
            brandContext: brandVoice, // Trimitem la backend pentru system prompt
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
