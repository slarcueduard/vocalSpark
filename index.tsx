import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import axios from "axios";
import * as cheerio from "cheerio";
import * as cors from "cors";

admin.initializeApp();
const corsHandler = cors({ origin: true });

// Aceasta este funcția pe care o vom apela din Frontend
export const scrapeUrl = functions.https.onCall(async (data, context) => {
  // 1. Verificăm dacă userul e autentificat (Opțional, pentru securitate)
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "You must be logged in to use the scraper."
    );
  }

  const url = data.url;

  if (!url) {
    throw new functions.https.HttpsError("invalid-argument", "URL is required.");
  }

  try {
    // 2. Facem request-ul către site (ne dăm drept un browser real pentru a evita blocarea)
    const response = await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
      timeout: 10000, // 10 secunde timeout
    });

    const html = response.data;
    const $ = cheerio.load(html);

    // 3. Curățăm HTML-ul de elemente inutile (reclame, meniuri, scripturi)
    $("script").remove();
    $("style").remove();
    $("nav").remove();
    $("footer").remove();
    $("header").remove();
    $("iframe").remove();
    $(".ads").remove();
    $("#comments").remove();

    // 4. Extragem textul relevant (Titluri și Paragrafe)
    let content = "";

    // Luăm titlul paginii
    const title = $("title").text().trim();
    content += `TITLE: ${title}\n\n`;

    // Luăm descrierea meta
    const metaDesc = $('meta[name="description"]').attr("content");
    if (metaDesc) content += `DESCRIPTION: ${metaDesc}\n\n`;

    // Luăm corpul textului (h1, h2, h3, p, li)
    $("h1, h2, h3, p, li").each((_, element) => {
      const text = $(element).text().trim();
      // Filtrăm textele foarte scurte (de obicei meniuri sau butoane)
      if (text.length > 20) {
        content += text + "\n";
      }
    });

    // 5. Limităm textul pentru a nu depăși limita de tokeni a lui Gemini (ex: 5000 caractere)
    const cleanContent = content.slice(0, 8000);

    return {
      success: true,
      data: cleanContent,
    };

  } catch (error: any) {
    console.error("Scraping error:", error.message);
    
    // Returnăm un mesaj prietenos, nu eroare de server
    return {
      success: false,
      error: "Could not scrape this URL. The site might be blocking bots. Please copy-paste the text manually.",
    };
  }
});
