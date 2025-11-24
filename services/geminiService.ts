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

// --- HELPER CRITIC: Fetch Sigur (Rezolvă eroarea "Unexpected token 'A'") ---
async function safeFetch(url: string, body: any) {
    const headers = await getAuthHeader();
    
    const response = await fetch(url, {
        method: 'POST',
        headers: headers as any,
        body: JSON.stringify(body)
    });

    // 1. Citim răspunsul ca TEXT pur (nu JSON direct)
    const text = await response.text();
    
    // 2. Încercăm să îl transformăm în JSON
    let data;
    try {
        data = JSON.parse(text);
    } catch (e) {
        // Dacă nu e JSON, înseamnă că serverul a crăpat urât (HTML error page)
        console.error("Server Raw Response:", text);
        throw new Error(`Server Error (${response.status}): The server returned an invalid response.`);
    }

    // 3. Verificăm dacă API-ul a raportat o eroare logică
    if (!response.ok) {
        throw new Error(data.error || `API Error: ${response.statusText}`);
    }

    return data;
}

// --- 1. IMAGINI (Prin Backend cu Fallback Inteligent) ---
export async function generateImageForPost(postText: string, brandProfile?: BrandProfile): Promise<string> {
    try {
        // Încercăm Backend-ul (care scade credite și încearcă Google)
        const data = await safeFetch('/api/generate-image', { prompt: postText });
        return data.imageUrl;
    } catch (e) {
        console.warn("Backend image generation failed, using Client-Side Fallback.", e);
        // Dacă backend-ul eșuează (ex: eroare 500), generăm imaginea local prin Pollinations (Gratis, nu necesită credite)
        const cleanPrompt = encodeURIComponent(postText.substring(0, 100));
        return `https://image.pollinations.ai/prompt/${cleanPrompt}?width=1080&height=1080&nologo=true&model=flux`;
    }
}

export async function generateImageVariation(base64ImageData: string, mimeType: string, style: string): Promise<string> {
    // Variațiile le facem direct prin fallback pentru viteză în acest MVP
    await new Promise(r => setTimeout(r, 1500));
    const cleanStyle = encodeURIComponent(style + " artistic style");
    return `https://image.pollinations.ai/prompt/${cleanStyle}?width=1080&height=1080&nologo=true&model=flux`;
}

// --- 2. LOGO OVERLAY (Client-Side - Performanță Maximă) ---
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

// --- 3. TEXT (Prin Backend - Sigur și Robust) ---
export async function generateSocialMediaPosts(
  topic: string, tone: Tone, postCount: number, language: string, brandVoice: string, brandProfile?: BrandProfile, imageBase64?: string, imageMimeType?: string
): Promise<Omit<Post, 'id' | 'imageUrl' | 'isGeneratingImage' | 'adaptedContent'>[]> {
    
    let prompt = `
    ACT AS: Expert Social Media Manager.
    TASK: Write ${postCount} engaging posts about: "${topic}".
    TONE: ${tone}.
    LANGUAGE: ${language}.
    OUTPUT: JSON Array only. Example: [{"content": "..."}]
    `;
    if (brandVoice) prompt += `\nSTYLE: ${brandVoice}`;

    try {
        // Apelăm funcția noastră sigură
        const data = await safeFetch('/api/generate-text', { 
            prompt, 
            imageBase64, // Trimite imaginea la backend dacă există (pentru multimodal)
            imageMimeType 
        });

        // Curățăm răspunsul primit de la backend (în caz că are markdown)
        const cleanText = data.output.replace(/```json|```/g, '').trim();
        const parsed = JSON.parse(cleanText);
        
        if(Array.isArray(parsed)) return parsed.map((p: any) => ({ content: p.content || p }));
        return [];

    } catch (e: any) {
        console.error("Backend Text Gen failed:", e);
        // Returnăm o eroare vizibilă în UI ca să știi ce s-a întâmplat
        return [{ content: `Generation Error: ${e.message}` }];
    }
}

// --- Helper Functions ---
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
        const data = await safeFetch('/api/generate-text', { prompt: `Adapt for ${platform}: "${originalContent}"` });
        return data.output;
    } catch(e) { return originalContent; }
}

export async function refinePostContent(content: string, type: RefinementType): Promise<string> {
    try {
        const data = await safeFetch('/api/generate-text', { prompt: `Rewrite (${type}): "${content}"` });
        return data.output;
    } catch(e) { return content; }
}

export async function analyzeBrandVoice(sampleText: string): Promise<string> {
    try {
        const data = await safeFetch('/api/generate-text', { prompt: `Analyze style: "${sampleText}"` });
        return data.output;
    } catch(e) { return ""; }
}
