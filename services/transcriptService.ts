
import { YoutubeTranscript } from 'youtube-transcript';

export interface TranscriptItem {
    text: string;
    duration: number;
    offset: number;
    lang?: string;
}

export interface TranscriptResult {
    transcript: string; // Full text combined
    items: TranscriptItem[];
    language: string;
    isGenerated: boolean;
    videoId: string;
}

export class TranscriptService {

    /**
     * strictFetch
     * Fetches transcript strictly. Fails if disabled or unavailable.
     * Preferences: Manual EN -> Manual RO -> Auto EN -> First Available.
     */
    static async getTranscript(videoId: string, preferredLangs: string[] = ['en', 'ro']): Promise<TranscriptResult> {
        // Try each language in order
        for (const lang of preferredLangs) {
            try {
                const transcriptList = await YoutubeTranscript.fetchTranscript(videoId, { lang });
                if (transcriptList && transcriptList.length > 0) {
                    const fullText = transcriptList.map(t => t.text).join(' ');
                    return {
                        transcript: this.cleanTranscript(fullText),
                        items: transcriptList,
                        language: lang,
                        isGenerated: false,
                        videoId: videoId
                    };
                }
            } catch (ignore) {
                // Continue to next language
            }
        }

        // If specific languages failed, try default (no lang param)
        try {
            const transcriptList = await YoutubeTranscript.fetchTranscript(videoId);
            if (transcriptList && transcriptList.length > 0) {
                const fullText = transcriptList.map(t => t.text).join(' ');
                return {
                    transcript: this.cleanTranscript(fullText),
                    items: transcriptList,
                    language: transcriptList[0].lang || 'unknown',
                    isGenerated: false,
                    videoId: videoId
                };
            }
        } catch (e) {
            // Fallback failed too
        }

        console.error(`Transcript fetch failed for ${videoId}`);
        throw new Error("Transcript unavailable or disabled.");
    }

    /**
     * cleanTranscript
     * Removes [Music], [Applause], and normalizes whitespace.
     */
    static cleanTranscript(text: string): string {
        return text
            .replace(/\[.*?\]/g, '') // Remove [Music], [Applause]
            .replace(/\(.*?\)/g, '') // Remove (Music)
            .replace(/<.*?>/g, '')   // Remove XML/HTML tags if any
            .replace(/\s+/g, ' ')    // Normalize whitespace
            .replace(/&#39;/g, "'")  // Fix common HTML entities
            .replace(/&quot;/g, '"')
            .trim();
    }
}
