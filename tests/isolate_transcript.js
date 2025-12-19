
import { YoutubeTranscript } from 'youtube-transcript';
// Mock fetch for node environment if needed, or rely on global if Node 18+
// In SocialSpark environment verifying if fetch exists or using node-fetch
// const fetch = require('node-fetch'); // We might need this if it's not global

const videoId = 'tFqMpi7KuzI';
const url = `https://www.youtube.com/watch?v=${videoId}`;

async function runTest() {
    console.log(`--- TESTING VIDEO: ${videoId} ---`);
    console.log(`URL: ${url}`);

    // 1. Test Library Default
    try {
        console.log("\n[1] Testing Library (Default)...");
        const items = await YoutubeTranscript.fetchTranscript(url);
        console.log(`SUCCESS: Found ${items.length} items.`);
    } catch (e) {
        console.log(`FAILED: ${e.message}`);
    }

    // 2. Test Library 'en'
    try {
        console.log("\n[2] Testing Library (lang: 'en')...");
        const items = await YoutubeTranscript.fetchTranscript(url, { lang: 'en' });
        console.log(`SUCCESS: Found ${items.length} items.`);
    } catch (e) {
        console.log(`FAILED: ${e.message}`);
    }

    // 3. Test Manual Scrape (Simulation)
    console.log("\n[3] Testing Manual Scrape (Cookies)...");
    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept-Language': 'en-US,en;q=0.9',
                'Cookie': 'CONSENT=YES+cb.20230531-04-p0.en+FX+430'
            }
        });
        const html = await response.text();
        const captionMatch = html.match(/"captionTracks":\s*(\[.*?\])/) || html.match(/"captionTracks":(\[.*?\])/);

        if (captionMatch) {
            console.log("SUCCESS: Found captionTracks JSON!");
            const tracks = JSON.parse(captionMatch[1]);
            console.log("Tracks found:", tracks.map(t => `${t.languageCode} (${t.kind || 'standard'})`).join(', '));
        } else {
            console.log("FAILED: No captionTracks found in HTML. (Cookie might be invalid or Bot check active)");
            // console.log("Partial HTML:", html.substring(0, 500)); 
        }

    } catch (e) {
        console.log(`FAILED: ${e.message}`);
    }
}

runTest();
