
import { YoutubeTranscript } from 'youtube-transcript';

const TEST_URL = "https://www.youtube.com/watch?v=jNQXAC9IVRw"; // Me at the zoo

async function test() {
    console.log(`Testing transcript fetch for: ${TEST_URL}`);
    try {
        // Try strict English
        console.log("Attempt 1: Strict 'en'");
        const list1 = await YoutubeTranscript.fetchTranscript(TEST_URL, { lang: 'en' });
        console.log(`Result 1: ${list1 ? list1.length : 'null'} items`);
        if (list1 && list1.length > 0) console.log(JSON.stringify(list1[0]));

        // Try default
        console.log("Attempt 2: Default");
        const list2 = await YoutubeTranscript.fetchTranscript(TEST_URL);
        console.log(`Result 2: ${list2 ? list2.length : 'null'} items`);

    } catch (e) {
        console.error("Failed:", e);
    }
}

test();
