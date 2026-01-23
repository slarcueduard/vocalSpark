import admin from 'firebase-admin';

// --- 1. Inițializare Firebase Admin (Singleton) ---
// Verificăm dacă există deja o aplicație pornită pentru a evita erorile la redeploy sau hot-reload
if (!admin.apps.length) {

  // Curățăm cheia privată: Vercel stochează newline-urile ca string "\\n", 
  // dar Firebase are nevoie de newline-uri reale "\n".
  const privateKey = process.env.FIREBASE_PRIVATE_KEY
    ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
    : undefined;

  if (!privateKey) {
    console.error('CRITICAL ERROR: FIREBASE_PRIVATE_KEY is missing in Environment Variables!');
  }

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.VITE_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: privateKey,
    }),
  });
}

export function initFirebaseAdmin() {
  return admin;
}

const db = admin.firestore();

/**
 * Verifică Token-ul Userului și Balanța de Credite
 * @param {Object} req - Obiectul Request
 * @param {Number} costInCredits - Cât costă operațiunea (ex: 1, 2, 20)
 * @returns {Promise<{userRef: FirebaseFirestore.DocumentReference, userData: any}>}
 */
export async function verifyUserAndCredits(req, costInCredits) {
  const authHeader = req.headers.authorization;

  // Validare Header Authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Unauthorized: No token provided');
  }

  const token = authHeader.split('Bearer ')[1];

  try {
    // 1. Verificăm Token-ul la Google/Firebase (Secure)
    const decodedToken = await admin.auth().verifyIdToken(token);
    const userId = decodedToken.uid;
    const userRef = db.collection('users').doc(userId);

    // 2. Citim datele userului din Baza de Date
    const doc = await userRef.get();

    // --- LOGICA DE USER NOU (TRIAL START) ---
    if (!doc.exists) {
      const trialCredits = 150; // BONUS DE BUN VENIT: 150 Credite

      // Creăm profilul inițial în baza de date
      const newProfile = {
        credits: trialCredits,
        email: decodedToken.email,
        subscriptionTier: 'trial', // Marcat ca Trial
        subscriptionStatus: 'active',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        imageCount: 0 // Statistici opționale
      };

      await userRef.set(newProfile);

      // Verificare de siguranță (deși 150 > orice cost individual)
      if (costInCredits > trialCredits) {
        throw new Error(`Insufficient credits for new user. Cost: ${costInCredits}, Balance: ${trialCredits}`);
      }

      // Returnăm datele proaspăt create
      return { userRef, userData: newProfile };
    }

    // --- LOGICA DE USER EXISTENT ---
    const userData = doc.data();
    const currentCredits = userData.credits || 0;

    // 3. Verificăm dacă are destule credite pentru acțiunea curentă
    if (currentCredits < costInCredits) {
      throw new Error(`Insufficient credits. You have ${currentCredits} credits, but this action requires ${costInCredits}. Please upgrade your plan.`);
    }

    return { userRef, userData };

  } catch (error) {
    console.error("Auth/Credit Verification Error:", error);
    // Aruncăm o eroare curată către frontend
    throw new Error(error.message || 'Authentication or Credit check failed');
  }
}

/**
 * Scade creditele din contul userului
 * @param {Object} userRef - Referința către documentul Firestore
 * @param {Number} cost - Numărul de credite de scăzut
 */
export async function deductCredits(userRef, cost) {
  if (cost > 0) {
    await userRef.update({
      credits: admin.firestore.FieldValue.increment(-cost)
    });
  }
}
