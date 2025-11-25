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

// src/services/geminiService.ts

// ... alte importuri

// Modificăm funcția ca să accepte isPremium
export async function generateImageForPost(postText: string, isPremium: boolean = false): Promise<string> {
    try {
        const token = await auth.currentUser?.getIdToken();
        
        const response = await fetch('/api/generate-image', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ 
                prompt: postText,
                isPremium: isPremium // Trimitem alegerea la backend
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Image generation failed");
        }

        return data.imageUrl;
    } catch (e) {
        console.error("Image Gen Error:", e);
        throw e;
    }
}

// ... restul funcțiilor rămân la fel

// --- HELPER CRITIC: Fetch Sigur ---
// Gestionează erorile de rețea și răspunsurile non-JSON (ex: erori Vercel 504/404)
async function safeFetch(url: string, body: any) {
    const headers = await getAuthHeader();
    
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: headers as any,
            body: JSON.stringify(body)
        });

        const text = await response.text();
        
        // Verificăm dacă e JSON valid
        let data;
        try {
            data = JSON.parse(text);
        } catch (e) {
            console.error("Server Raw Response (Not JSON):", text);
            // Dacă primim HTML (eroare Vercel), extragem titlul sau mesajul scurt
            throw new Error(`Server Error (${response.status}): Invalid response format.`);
        }

        if (!response.ok) {
            throw new Error(data.error || `API Error: ${response.statusText}`);
        }

        return data;

    } catch (error: any) {
        console.error(`Fetch failed for ${url}:`, error);
        throw error; // Aruncăm eroarea mai departe ca să fie prinsă de funcțiile specifice
    }
}

// --- HELPER: Extragere JSON din textul AI ---
// AI-ul pune adesea text înainte sau după JSON. Asta curăță totul.
function extractJsonArray(text: string): any[] {
    try {
        // 1. Încercare directă
        return JSON.parse(text);
    } catch (e) {
        // 2. Căutăm parantezele de array [...]
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
        throw new Error("AI did not return a valid JSON list.");
    }
}

// --- 1. IMAGINI (Prin Backend cu Fallback) ---
export async function generateImageForPost(postText: string, brandProfile?: BrandProfile): Promise<string> {
    try {
        // Construim un prompt vizual mai bun
        const imagePrompt = `Editorial photo representing: ${postText}`;
        const style = brandProfile?.visualStyle || "cinematic";

        // Încercăm Backend-ul (Verifică credite -> OpenAI/Replicate)
        const data = await safeFetch('/api/generate-image', { 
            prompt: imagePrompt,
            style: style 
        });
        return data.imageUrl;

    } catch (e) {
        console.warn("Backend image generation failed, using Client-Side Fallback.", e);
        
        // Fallback: Pollinations (Gratis, Client-side direct)
        // Nu necesită backend, merge direct din browser
        const cleanPrompt = encodeURIComponent(postText.substring(0, 150));
        const seed = Math.floor(Math.random() * 1000);
        return `https://image.pollinations.ai/prompt/${cleanPrompt}?width=1080&height=1080&nologo=true&seed=${seed}&model=flux`;
    }
}

export async function generateImageVariation(base64ImageData: string, mimeType: string, style: string): Promise<string> {
    // Momentan folosim fallback-ul rapid pentru variații
    await new Promise(r => setTimeout(r, 1000)); // Mic delay artificial pt UX
    const cleanStyle = encodeURIComponent(style + " artistic style, high quality");
    const seed = Math.floor(Math.random() * 1000);
    return `https://image.pollinations.ai/prompt/${cleanStyle}?width=1080&height=1080&nologo=true&seed=${seed}&model=flux`;
}

// --- 2. LOGO OVERLAY (Client-Side - Neschimbat) ---
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
    
    // Prompt optimizat pentru Gemini
    let prompt = `
    ROLE: Expert Social Media Manager.
    TASK: Write ${postCount} highly engaging social media posts about: "${topic}".
    TONE: ${tone}.
    LANGUAGE: ${language}.
    FORMAT: Return ONLY a raw JSON Array. Do not use Markdown blocks.
    Structure: [{"content": "Post text here... emojis included"}]
    `;
    
    if (brandVoice) prompt += `\nBRAND VOICE INSTRUCTIONS: ${brandVoice}`;

    try {
        const data = await safeFetch('/api/generate-text', { 
            prompt, 
            imageBase64, 
            imageMimeType 
        });

        // Folosim extractorul robust
        const parsed = extractJsonArray(data.output);
        
        if(Array.isArray(parsed)) {
            return parsed.map((p: any) => ({ content: p.content || p }));
        }
        return [];

    } catch (e: any) {
        console.error("Text Generation Logic Error:", e);
        // Returnăm o eroare în UI, dar într-un format care nu sparge aplicația
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
        const data = await safeFetch('/api/generate-text', { prompt: `Adapt this post for ${platform}, keeping the same meaning but optimizing for the platform's best practices: "${originalContent}"` });
        return data.output;
    } catch(e) { return originalContent; }
}

export async function refinePostContent(content: string, type: RefinementType): Promise<string> {
    try {
        const promptMap: Record<string, string> = {
            'shorten': 'Shorten this post while keeping the punchline:',
            'expand': 'Expand this post with more details and value:',
            'more-emojis': 'Add relevant emojis to this post:',
            'formal': 'Rewrite this post to be more professional and formal:'
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
