import { Post, Tone, Platform, RefinementType, BrandProfile } from "../types";
import { auth } from "./firebase"; // Avem nevoie de auth pentru token

// Helper: Obține tokenul utilizatorului curent
async function getAuthHeader() {
    const user = auth.currentUser;
    if (!user) throw new Error("User not logged in");
    const token = await user.getIdToken();
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
}

// --- 1. IMAGINI (Prin Backend) ---
export async function generateImageForPost(postText: string, brandProfile?: BrandProfile): Promise<string> {
    const headers = await getAuthHeader();
    
    const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers,
        body: JSON.stringify({ prompt: postText })
    });

    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Image generation failed");
    }

    const data = await response.json();
    return data.imageUrl;
}

export async function generateImageVariation(base64ImageData: string, mimeType: string, style: string): Promise<string> {
    // Momentan backend-ul nostru face doar text-to-image prompt based pe descriere
    // Putem trimite "Make this image Cyberpunk"
    const headers = await getAuthHeader();
    
    const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers,
        body: JSON.stringify({ prompt: "Image variation", style: style }) // Simplificat pentru MVP
    });

    const data = await response.json();
    return data.imageUrl;
}

// --- 2. TEXT (Prin Backend) ---
export async function generateSocialMediaPosts(
  topic: string,
  tone: Tone,
  postCount: number,
  language: string,
  brandVoice: string,
  brandProfile?: BrandProfile,
  imageBase64?: string, // Imaginea pentru context text
  imageMimeType?: string
): Promise<Omit<Post, 'id' | 'imageUrl' | 'isGeneratingImage' | 'adaptedContent'>[]> {
    
    const headers = await getAuthHeader();

    // Construim prompt-ul complex aici, dar îl trimitem la server să îl execute
    let prompt = `
    ACT AS: Expert Social Media Manager.
    TASK: Write ${postCount} posts about: "${topic}".
    TONE: ${tone}.
    LANGUAGE: ${language}.
    OUTPUT: JSON Array only. [{"content": "..."}]
    `;
    if (brandVoice) prompt += `\nSTYLE: ${brandVoice}`;
    
    // Dacă avem imagine, o putem trimite în body (dar atenție la limita de mărime a request-ului Vercel - 4.5MB)
    // Pentru MVP, trimitem doar textul. Multimodalitatea full pe backend necesită upload în Storage întâi.
    
    const response = await fetch('/api/generate-text', {
        method: 'POST',
        headers,
        body: JSON.stringify({ prompt })
    });

    if (!response.ok) throw new Error("Text generation failed");
    
    const data = await response.json();
    // Curățare JSON care vine din backend
    const cleanText = data.output.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleanText);
    
    if(Array.isArray(parsed)) return parsed.map((p: any) => ({ content: p.content || p }));
    return [];
}

// --- 3. HELPERE ---
export function fileToBase64(file: File): Promise<{mimeType: string, data: string}> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve({ mimeType: (reader.result as string).split(';')[0].split(':')[1], data: (reader.result as string).split(',')[1] });
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Logo Overlay rămâne client-side (e gratis și rapid)
export type LogoPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
export async function overlayLogoOnImage(mainImageUrl: string, logoUrl: string, position: LogoPosition = 'top-left', removeBg: boolean = false): Promise<string> {
    // ... (Păstrează codul pentru Canvas de la pasul anterior, e perfect)
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

export async function adaptPostForPlatform(content: string, platform: Platform): Promise<string> {
    const headers = await getAuthHeader();
    const res = await fetch('/api/generate-text', {
        method: 'POST', headers,
        body: JSON.stringify({ prompt: `Adapt for ${platform}: "${content}"` })
    });
    const data = await res.json();
    return data.output;
}

export async function refinePostContent(content: string, type: RefinementType): Promise<string> {
    const headers = await getAuthHeader();
    const res = await fetch('/api/generate-text', {
        method: 'POST', headers,
        body: JSON.stringify({ prompt: `Rewrite (${type}): "${content}"` })
    });
    const data = await res.json();
    return data.output;
}
