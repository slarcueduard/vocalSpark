import { Post, Tone, Platform, RefinementType, BrandProfile } from "../types";
import { auth } from "./firebase"; // Avem nevoie de auth pentru a trimite token-ul la backend

// Helper: Obține tokenul de securitate al userului logat
async function getAuthHeader() {
    const user = auth.currentUser;
    if (!user) return {}; // Sau throw error, depinde de flow
    const token = await user.getIdToken();
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
}

// --- 1. IMAGINI (Prin Backend - Pollinations Fallback integrat acolo) ---
export async function generateImageForPost(postText: string, brandProfile?: BrandProfile): Promise<string> {
    const headers = await getAuthHeader();
    
    // Apelăm serverul nostru
    const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }, // Nu cerem auth pt imagini momentan ca să meargă rapid
        body: JSON.stringify({ prompt: postText })
    });

    if (!response.ok) {
        // Fallback client-side dacă serverul eșuează
        console.warn("Backend image generation failed, using client fallback.");
        const cleanPrompt = encodeURIComponent(postText.substring(0, 100));
        return `https://image.pollinations.ai/prompt/${cleanPrompt}?width=1080&height=1080&nologo=true&model=flux`;
    }

    const data = await response.json();
    return data.imageUrl;
}

export async function generateImageVariation(base64ImageData: string, mimeType: string, style: string): Promise<string> {
    // Pentru variații, momentan folosim fallback-ul direct pentru viteză
    await new Promise(r => setTimeout(r, 1500));
    const cleanStyle = encodeURIComponent(style + " artistic style");
    return `https://image.pollinations.ai/prompt/${cleanStyle}?width=1080&height=1080&nologo=true&model=flux`;
}

// --- 2. LOGO OVERLAY (Rămâne Client-Side - e pur grafic) ---
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
        mainImg.src = mainImageUrl;
      });
}

// --- 3. TEXT (PRIN BACKEND - AICI REZOLVĂM EROAREA) ---
export async function generateSocialMediaPosts(
  topic: string,
  tone: Tone,
  postCount: number,
  language: string,
  brandVoice: string,
  brandProfile?: BrandProfile,
  imageBase64?: string,
  imageMimeType?: string
): Promise<Omit<Post, 'id' | 'imageUrl' | 'isGeneratingImage' | 'adaptedContent'>[]> {
    
    // Obținem tokenul ca să știm cine face cererea (pentru credite)
    const headers = await getAuthHeader();

    // Construim prompt-ul
    let prompt = `
    ACT AS: Expert Social Media Manager.
    TASK: Write ${postCount} engaging posts about: "${topic}".
    TONE: ${tone}.
    LANGUAGE: ${language}.
    OUTPUT: JSON Array only. Example: [{"content": "..."}]
    `;
    if (brandVoice) prompt += `\nSTYLE: ${brandVoice}`;

    try {
        // APELĂM SERVERUL NOSTRU (/api/generate-text)
        const response = await fetch('/api/generate-text', {
            method: 'POST',
            headers: headers as any,
            body: JSON.stringify({ 
                prompt,
                imageBase64, // Trimitem și imaginea la backend dacă e cazul
                imageMimeType
            })
        });

        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.error || "Server Error");
        }
        
        const data = await response.json();
        // Backend-ul ne dă textul gata generat
        const cleanText = data.output.replace(/```json|```/g, '').trim();
        const parsed = JSON.parse(cleanText);
        
        if(Array.isArray(parsed)) return parsed.map((p: any) => ({ content: p.content || p }));
        return [];

    } catch (e: any) {
        console.error("Backend Text Gen failed:", e);
        return [{ content: `Error: ${e.message}. Please try again.` }];
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
    // Folosim tot backend-ul pentru adaptare
    const headers = await getAuthHeader();
    try {
        const res = await fetch('/api/generate-text', {
            method: 'POST', headers: headers as any,
            body: JSON.stringify({ prompt: `Adapt for ${platform}: "${originalContent}"` })
        });
        const data = await res.json();
        return data.output;
    } catch(e) { return originalContent; }
}

export async function refinePostContent(content: string, type: RefinementType): Promise<string> {
    const headers = await getAuthHeader();
    try {
        const res = await fetch('/api/generate-text', {
            method: 'POST', headers: headers as any,
            body: JSON.stringify({ prompt: `Rewrite (${type}): "${content}"` })
        });
        const data = await res.json();
        return data.output;
    } catch(e) { return content; }
}

export async function analyzeBrandVoice(sampleText: string): Promise<string> {
    const headers = await getAuthHeader();
    try {
        const res = await fetch('/api/generate-text', {
            method: 'POST', headers: headers as any,
            body: JSON.stringify({ prompt: `Analyze style: "${sampleText}"` })
        });
        const data = await res.json();
        return data.output;
    } catch(e) { return ""; }
}
