
// Node 18+ has built-in fetch


async function testApi() {
    const url = "http://localhost:3000/api/remix-video";
    const body = {
        url: "https://www.youtube.com/watch?v=jNQXAC9IVRw", // Me at the zoo (short, reliable)
        platforms: ["linkedin", "x"],
        tone: "funny",
        language: "English",
        mock: true
    };

    console.log(`Sending POST to ${url}...`);
    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        const status = res.status;
        console.log(`Status: ${status}`);

        const text = await res.text();
        try {
            const json = JSON.parse(text);
            console.log("Response JSON:", JSON.stringify(json, null, 2));
        } catch (e) {
            console.log("Response Text:", text);
        }

    } catch (e) {
        console.error("Fetch failed:", e);
    }
}

testApi();
