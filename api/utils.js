import admin from 'firebase-admin';

// Inițializăm Firebase Admin doar o singură dată
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      // Fix pentru newline-uri în cheia privată pe Vercel
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
  });
}

const db = admin.firestore();

export async function verifyUserAndCredits(req, cost = 1) {
  const token = req.headers.authorization?.split('Bearer ')[1];
  
  if (!token) throw new Error("Unauthorized: No token provided");

  try {
    // 1. Verificăm cine e userul
    const decodedToken = await admin.auth().verifyIdToken(token);
    const uid = decodedToken.uid;

    // 2. Verificăm creditele în baza de date
    const userRef = db.collection('users').doc(uid);
    const doc = await userRef.get();

    if (!doc.exists) throw new Error("User not found");

    const userData = doc.data();
    const limit = userData.imageLimit || 5;
    const used = userData.imageCount || 0;

    // Verificăm dacă mai are loc
    // (Dacă costul e 0 - ex: text - îl lăsăm să treacă oricum)
    if (cost > 0 && used + cost > limit) {
      throw new Error("Limit Reached: Please upgrade your plan.");
    }

    return { uid, userRef, userData };
  } catch (error) {
    console.error("Auth Error:", error);
    throw new Error("Unauthorized or Limit Reached");
  }
}

export async function deductCredits(userRef, cost = 1) {
  if (cost > 0) {
    await userRef.update({
      imageCount: admin.firestore.FieldValue.increment(cost)
    });
  }
}
