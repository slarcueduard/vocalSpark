import admin from 'firebase-admin';

if (!admin.apps.length) {
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
  }
}

const db = admin.firestore();

export async function verifyUserAndCredits(req, cost = 1) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error("Unauthorized");
  }
  const token = authHeader.split('Bearer ')[1];

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    const uid = decodedToken.uid;
    const userRef = db.collection('users').doc(uid);
    const doc = await userRef.get();

    if (!doc.exists) throw new Error("User not found");

    const userData = doc.data();
    // Verificăm limita doar dacă costul > 0
    if (cost > 0) {
        const limit = userData.imageLimit || 5; 
        const used = userData.imageCount || 0;
        if (used + cost > limit) throw new Error("Limit Reached");
    }

    return { uid, userRef, userData };
  } catch (error) {
    throw error;
  }
}

export async function deductCredits(userRef, cost = 1) {
  if (cost > 0) {
    await userRef.update({
        imageCount: admin.firestore.FieldValue.increment(cost)
    });
  }
}
