import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    console.log("--- DEBUG START ---");
    console.log("Checking API Key permissions...");
    
    // Cerem lista de modele disponibile pentru această cheie
    // Dacă cheia e proastă sau proiectul e blocat, aici va crăpa.
    const modelInstance = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    // Atenție: SDK-ul nu are o metodă directă simplă de "listModels" expusă ușor în toate versiunile,
    // așa că testăm o generare simplă de "Hello".
    
    const result = await modelInstance.generateContent("Hello check");
    const response = await result.response;
    const text = response.text();

    console.log("--- DEBUG SUCCESS ---");
    return res.status(200).json({ 
        status: "Success", 
        message: "API Key is working!", 
        output: text 
    });

  } catch (error) {
    console.error("--- DEBUG ERROR ---");
    console.error(error);
    
    return res.status(500).json({ 
        status: "Error",
        message: error.message,
        details: "Verifică consola Vercel pentru detalii complete."
    });
  }
}
