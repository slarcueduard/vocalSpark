import admin from 'firebase-admin';

// Funcție sigură de inițializare
function initFirebase() {
  if (admin.apps.length) return; // Deja inițializat

  console.log("Initializing Firebase Admin...");

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    console.error("MISSING ENV VARS: Verifică FIREBASE_PROJECT_ID, CLIENT_EMAIL, PRIVATE_KEY în Vercel.");
    throw new Error("Missing Firebase Configuration");
  }

  // --- CURĂȚARE AVANSATĂ A CHEII ---
  // 1. Dacă userul a pus ghilimele extra la început/sfârșit (ex: "---BEGIN...")
  if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
    privateKey = privateKey.slice(1, -1);
  }
  // 2. Înlocuim literalul \n cu newline real (Vercel le strică des)
  privateKey = privateKey.replace(/\\n/g, '\n');

  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
    console.log("Firebase Admin Initialized Successfully!");
  } catch (error) {
    console.error("FIREBASE INIT ERROR:", error);
    // Aruncăm eroarea ca să știm că e de la config
    throw new Error(`Firebase Config Error: ${error.message}`);
  }
}

// Încercăm inițializarea globală, dar prindem eroarea să nu crape tot procesul
try {
    initFirebase();
} catch (e) {
    console.error("Critical Startup Error:", e);
}

const db = admin.firestore();

export async function verifyUserAndCredits(req, cost = 1) {
  // Dacă Firebase a eșuat la start, oprim aici cu mesaj clar
  if (!admin.apps.length) {
      throw new Error("Server Configuration Error: Firebase not initialized.");
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error("Unauthorized: Missing Token");
  }
  const token = authHeader.split('Bearer ')[1];

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    const uid = decodedToken.uid;
    
    const userRef = db.collection('users').doc(uid);
    const doc = await userRef.get();

    // Dacă userul nu există în baza de date, nu dăm eroare, îl lăsăm (poate e user vechi)
    // sau returnăm date default
    let userData = { imageLimit: 5, imageCount: 0 };
    
    if (doc.exists) {
        userData = doc.data();
    } else {
        console.warn(`User ${uid} not found in Firestore, using defaults.`);
    }

    if (cost > 0) {
        const limit = userData.imageLimit || 5; 
        const used = userData.imageCount || 0;
        if (used + cost > limit) throw new Error("Credit limit reached");
    }

    return { uid, userRef, userData };
  } catch (error) {
    console.error("Verification Failed:", error);
    throw new Error(`Auth Error: ${error.message}`);
  }
}

export async function deductCredits(userRef, cost = 1) {
  if (cost > 0 && admin.apps.length) {
    try {
        // Verificăm dacă referința există înainte de update
        const doc = await userRef.get();
        if (doc.exists) {
            await userRef.update({
                imageCount: admin.firestore.FieldValue.increment(cost)
            });
        }
    } catch(e) {
        console.error("Failed to deduct credit:", e);
    }
  }
}
