
import dotenv from 'dotenv';
import OpenAI from 'openai';

dotenv.config({ path: '../.env' }); // Adjust path if running from api/

const key = process.env.OPENAI_API_KEY;
console.log("Key length:", key ? key.length : "MISSING");
if (key) console.log("Key preview:", key.substring(0, 10) + "..." + key.substring(key.length - 5));

const openai = new OpenAI({ apiKey: key });

async function test() {
    try {
        console.log("Sending request...");
        const completion = await openai.chat.completions.create({
            messages: [{ role: "user", content: "Hello" }],
            model: "gpt-4o-mini",
        });
        console.log("Success:", completion.choices[0].message.content);
    } catch (error) {
        console.error("Error:", error);
    }
}

test();
