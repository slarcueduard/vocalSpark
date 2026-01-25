import OpenAI from 'openai';
import { verifyUserAndCredits, deductCredits, initFirebaseAdmin } from './_utils.js';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const admin = initFirebaseAdmin();
const db = admin.firestore();

export default async function handler(req, res) {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') return res.status(200).end();

    try {
        const { brandProfile, action, currentSettings } = req.body;
        console.log(`[API] Today's Post Action: ${action}`, { brandProfileName: brandProfile?.name });

        if (!brandProfile && action === 'activate') {
            throw new Error("Missing Brand Profile for activation.");
        }

        // 1. AUTH & COST
        const COST = 3; // Lower cost for daily
        const { userRef, userData } = await verifyUserAndCredits(req, COST);

        const userId = userRef.id;
        const settingsRef = db.collection('todayPostSettings').doc(userId);

        // 2. FETCH CURRENT STATE
        let settingsDoc = await settingsRef.get();
        let settings = settingsDoc.exists ? settingsDoc.data() : null;
        let thread = null;

        // 3. LOGIC BRANCHING
        let generatedPost = null;
        let newNarrative = "";

        // === LOGIC A: INITIALIZATION (Day 1) ===
        if (action === 'activate' || !settings || !settings.currentTopicThreadId) {

            // A. Pick Core Topic (AI Analysis)
            const topicPrompt = `
        Analyze this Brand DNA:
        - Name: ${brandProfile.name}
        - Industry: ${brandProfile.industry}
        - Audience: ${brandProfile.targetAudience}
        - Offer: ${brandProfile.offer}
        - Enemy: ${brandProfile.enemy}

        Select ONE "Core Topic" for a long-term daily content series. 
        The topic must be broad enough for 100+ posts but specific enough to build authority.
        Example: "The Psychology of UI Design" or "Sustainable Gardening for Beginners".
        
        Output only the topic string.
        `;

            const topicCompletion = await openai.chat.completions.create({
                messages: [{ role: "user", content: topicPrompt }],
                model: "gpt-4o",
            });
            const coreTopic = topicCompletion.choices[0].message.content.trim();

            // B. Generate First Post (Day 1)
            const day1Prompt = `
        You are writing Day 1 of a daily series on: "${coreTopic}".
        
        BRAND CONTEXT:
        - Voice: ${brandProfile.voiceDNA}
        - Archetype: ${brandProfile.archetype}
        - Preferences: ${brandProfile.postLength} length, ${brandProfile.detailLevel} detail.

        TASK:
        1. Write the first post introducing this new series.
        2. Hook the reader immediately.
        3. Explain what they will learn in this journey.
        4. NO FLUFF. NO "I'm thrilled to announce". Start with value or conflict.

        OUTPUT FORMAT JSON:
        {
            "content": "Post text...",
            "summary": "Brief summary of what this series covers and the narrative arc."
        }
        `;

            const post1Completion = await openai.chat.completions.create({
                messages: [{ role: "user", content: day1Prompt }],
                model: "gpt-4o",
                response_format: { type: "json_object" }
            });

            const rawContent = post1Completion.choices[0].message.content;
            let day1Data;
            try {
                day1Data = JSON.parse(rawContent);
            } catch (e) {
                console.error("[API] JSON Parse Error (Day 1):", rawContent);
                throw new Error("AI generated invalid JSON for Day 1.");
            }

            // C. Create Thread
            const threadRef = db.collection('topicThreads').doc();
            await threadRef.set({
                id: threadRef.id,
                userId,
                brandDnaId: brandProfile.name, // using name as ID proxy for now or passed ID
                coreTopic,
                narrativeSummary: day1Data.summary,
                sequenceCount: 1,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });

            // D. Update Settings
            await settingsRef.set({
                userId,
                brandDnaId: brandProfile.name,
                status: 'active',
                startDate: admin.firestore.FieldValue.serverTimestamp(),
                lastGeneratedAt: admin.firestore.FieldValue.serverTimestamp(),
                currentTopicThreadId: threadRef.id
            });

            generatedPost = {
                content: day1Data.content,
                sequenceNumber: 1,
                threadId: threadRef.id,
                topic: coreTopic
            };
        }

        // === LOGIC B: CONTINUATION (Day N) ===
        else {
            // Fetch Thread
            const threadRef = db.collection('topicThreads').doc(settings.currentTopicThreadId);
            const threadDoc = await threadRef.get();

            if (!threadDoc.exists) throw new Error("Thread not found");
            thread = threadDoc.data();

            // Fetch All Posts for Thread (In-Memory Sort to avoid Index)
            const postsQuery = await db.collection('posts')
                .where('threadId', '==', thread.id)
                .get();

            const lastPosts = postsQuery.docs
                .map(d => d.data())
                .sort((a, b) => b.sequenceNumber - a.sequenceNumber) // Descending
                .slice(0, 3)
                .map(p => p.content)
                .join("\n---\n");
            const nextSeq = thread.sequenceCount + 1;

            // Generate Day N
            const dayNPrompt = `
        You are writing Post #${nextSeq} of the daily series: "${thread.coreTopic}".
        
        BRAND DNA:
        - Voice: ${brandProfile.voiceDNA}
        - Enemy: ${brandProfile.enemy}
        
        NARRATIVE SO FAR:
        ${thread.narrativeSummary}

        LAST 3 POSTS:
        ${lastPosts}

        TASK:
        Write the next post.
        - Must advance the narrative.
        - Must NOT repeat points from last 3 posts.
        - Must NOT summarize previous posts.
        - Start with a Hook.

        OUTPUT JSON:
        {
            "content": "Post text...",
            "updated_summary": "Updated narrative summary including this new point."
        }
        `;

            const dayNCompletion = await openai.chat.completions.create({
                messages: [{ role: "user", content: dayNPrompt }],
                model: "gpt-4o",
                response_format: { type: "json_object" }
            });

            const dayNData = JSON.parse(dayNCompletion.choices[0].message.content);

            // Update Thread
            await threadRef.update({
                narrativeSummary: dayNData.updated_summary,
                sequenceCount: nextSeq,
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });

            // Update Settings
            await settingsRef.update({
                lastGeneratedAt: admin.firestore.FieldValue.serverTimestamp()
            });

            generatedPost = {
                content: dayNData.content,
                sequenceNumber: nextSeq,
                threadId: thread.id,
                topic: thread.coreTopic
            };
        }

        // 4. SAVE POST TO DB
        const postRef = db.collection('posts').doc();
        const finalPost = {
            id: postRef.id,
            content: generatedPost.content,
            userId,
            authorId: userId,
            type: 'daily_post',
            generationType: 'daily_post',
            isPublished: false,
            status: 'draft', // or scheduled if we auto-schedule?
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            threadId: generatedPost.threadId,
            sequenceNumber: generatedPost.sequenceNumber,
            topic: generatedPost.topic,
            xRayAnalysis: {
                hook_type: 'daily_series',
                tone_detected: brandProfile.voiceDNA,
                structure_tag: `Day ${generatedPost.sequenceNumber}`
            }
        };

        await postRef.set(finalPost);
        await deductCredits(userRef, COST);

        return res.status(200).json({ success: true, post: finalPost });

    } catch (error) {
        console.error("Today's Post Error:", error);
        return res.status(500).json({ error: error.message, stack: error.stack });
    }
}
