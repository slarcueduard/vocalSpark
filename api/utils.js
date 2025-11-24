import admin from 'firebase-admin';

// Inițializăm Firebase Admin o singură dată
if (!admin.apps.length) {
  // Decodăm cheia privată (Vercel transformă \n în text, trebuie să le facem înapoi linii noi)
  const privateKey = process.env.FIREBASE_PRIVATE_KEY 
    ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') 
    : undefined;

  if (privateKey) {
    admin.initializeApp({
        credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: privateKey,
        }),
    });
  } else {
      console.error("FIREBASE_PRIVATE_KEY missing in Vercel Env Variables");
  }
}

const db = admin.firestore();

// Verifică Userul și Creditele
export async function verifyUserAndCredits(req, cost = 1) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error("Unauthorized: Missing token");
  }

  const token = authHeader.split('Bearer ')[1];

  try {
    // 1. Validăm token-ul trimis din Frontend
    const decodedToken = await admin.auth().verifyIdToken(token);
    const uid = decodedToken.uid;

    // 2. Citim datele userului din bază
    const userRef = db.collection('users').doc(uid);
    const doc = await userRef.get();

    if (!doc.exists) throw new Error("User profile not found");

    const userData = doc.data();
    
    // Dacă e admin sau are plan infinit, poți sări verificarea (opțional)
    // Aici verificăm strict limita numerică
    const limit = userData.imageLimit || 5; 
    const used = userData.imageCount || 0;

    if (cost > 0 && (used + cost > limit)) {
      throw new Error("Credit limit reached. Please upgrade.");
    }

    return { uid, userRef, userData };

  } catch (error) {
    console.error("Auth/Credit Check Failed:", error);
    throw new Error(error.message || "Unauthorized");
  }
}

// Scade Creditele
export async function deductCredits(userRef, cost = 1) {
  if (cost > 0) {
    try {
        await userRef.update({
            imageCount: admin.firestore.FieldValue.increment(cost)
        });
    } catch (e) {
        console.error("Failed to deduct credit:", e);
    }
  }
}
