import admin from 'firebase-admin';

if (!admin.apps.length) {
  // 1. Citim cheia
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;

  // 2. Curățăm cheia (Esențial pentru Vercel)
  if (privateKey) {
    // Dacă începe și se termină cu ghilimele ("), le scoatem
    if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
      privateKey = privateKey.slice(1, -1);
    }
    // Înlocuim literalul \n cu newline real
    privateKey = privateKey.replace(/\\n/g, '\n');
  }

  if (privateKey && process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL) {
    try {
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: privateKey,
            }),
        });
    } catch (e) {
        console.error("Firebase Init Error:", e);
    }
  } else {
      console.error("MISSING FIREBASE ENV VARIABLES IN VERCEL");
  }
}

const db = admin.firestore();

export async function verifyUserAndCredits(req, cost = 1) {
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

    if (!doc.exists) throw new Error("User profile not found in DB");

    const userData = doc.data();
    if (cost > 0) {
        const limit = userData.imageLimit || 5; 
        const used = userData.imageCount || 0;
        if (used + cost > limit) throw new Error("Credit limit reached");
    }

    return { uid, userRef, userData };
  } catch (error) {
    // Aruncăm eroarea mai departe ca să o prindă handler-ul principal
    throw new Error(`Auth Error: ${error.message}`);
  }
}

export async function deductCredits(userRef, cost = 1) {
  if (cost > 0) {
    try {
        await userRef.update({
            imageCount: admin.firestore.FieldValue.increment(cost)
        });
    } catch(e) {
        console.error("Failed to deduct credit", e);
    }
  }
}
