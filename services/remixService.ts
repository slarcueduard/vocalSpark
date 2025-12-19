
import OpenAI from 'openai';

interface RemedialOptions {
    apiKey: string;
    baseURL?: string;
    model: string;
}

export interface RemixOptions {
    platforms: string[];
    tone: string;
    language: string;
}

export class RemixService {
    private openai: OpenAI;
    private model: string;

    constructor(options: RemedialOptions) {
        this.openai = new OpenAI({
            apiKey: options.apiKey,
            baseURL: options.baseURL,
        });
        this.model = options.model;
    }

    /**
     * pipeline
     * Main entry point: Chunk -> Map -> Reduce
     */
    async process(transcript: string, videoUrl: string, options: RemixOptions) {
        // 1. Chunk
        const chunks = this.chunkText(transcript, 6000); // ~6k chars safe for 128k context but good for granularity

        // 2. Map (Parallel Summarization)
        const briefs = await Promise.all(
            chunks.map((chunk, i) => this.mapSummarize(chunk, i, chunks.length))
        );

        // Filter out empty/no-info briefs
        const validBriefs = briefs.filter(b => b && !b.includes("NO_INFO"));

        if (validBriefs.length === 0) {
            throw new Error("Transcript contained no usable information.");
        }

        // 3. Reduce (Final Generation)
        const finalContent = await this.reduceSynthesize(validBriefs.join('\n\n'), videoUrl, options);

        return finalContent;
    }

    /**
     * Helper: Split text into chunks
     */
    private chunkText(text: string, size: number): string[] {
        const chunks: string[] = [];
        for (let i = 0; i < text.length; i += size) {
            chunks.push(text.slice(i, i + size));
        }
        return chunks;
    }

    /**
     * Stage A: Map - Extract strictly grounded facts
     */
    private async mapSummarize(chunk: string, index: number, total: number): Promise<string> {
        try {
            const response = await this.openai.chat.completions.create({
                model: this.model, // gpt-4o-mini or sonar-pro
                messages: [
                    { role: "system", content: "You are a Fact Extractor. Extract key points strictly from the provided text. if text is noise (music/intro/ads), return 'NO_INFO'." },
                    { role: "user", content: `CHUNK ${index + 1}/${total}:\n"${chunk}"\n\nTASK: List key facts and direct quotes. Do not invent info.` }
                ]
            });
            return response.choices[0].message.content || "NO_INFO";
        } catch (e) {
            console.error(`Chunk ${index} failed:`, e);
            return "NO_INFO";
        }
    }

    /**
     * Stage B: Reduce - Synthesize grounded posts
     */
    private async reduceSynthesize(combinedBriefs: string, videoUrl: string, options: RemixOptions) {
        const prompt = `
        ROLE: Social Media Strategist.
        TASK: Create grounded interaction-driving posts based on the provided FACTS.
        
        INPUT FACTS (Source of Truth):
        "${combinedBriefs.substring(0, 50000)}"

        VIDEO URL: ${videoUrl}
        TONE: ${options.tone}
        LANGUAGE: ${options.language}
        PLATFORMS: ${options.platforms.join(', ')}

        REQUIREMENTS:
        1. **LinkedIn/Facebook**: 2 Variants. Long-form (150-200 words). Structured (Hook, Meat, Takeaway).
        2. **X (Twitter)**: 3 Variants. Short, punchy (max 280 chars).
        3. **Instagram (Optional)**: 1 Caption variant if requested.

        CONSTRAINT:
        - Use the URL strictly ONCE per post.
        - STRICTLY GROUNDED: Do not invent advice not in the facts.

        OUTPUT JSON:
        {
            "analysis": {
                "main_idea": "1 sentence summary",
                "key_takeaways": ["5 bullet points"],
                "keywords": ["tag1", "tag2"]
            },
            "posts": [
                { "platform": "linkedin", "content": "..." },
                { "platform": "linkedin", "content": "..." },
                { "platform": "x", "content": "..." },
                { "platform": "x", "content": "..." },
                { "platform": "x", "content": "..." }
            ]
        }
        `;

        const response = await this.openai.chat.completions.create({
            model: "gpt-4o", // Use stronger model for final synthesis
            messages: [
                { role: "system", content: "You are a Content Strategist. Return strictly valid JSON." },
                { role: "user", content: prompt }
            ],
            response_format: { type: "json_object" }
        });

        return JSON.parse(response.choices[0].message.content || "{}");
    }
}
