import admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.VITE_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: (process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, '\n'),
    }),
  });
}

const db = admin.firestore();

export async function verifyUserAndCredits(req, costInCredits) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Unauthorized: No token provided');
  }

  const token = authHeader.split('Bearer ')[1];
  
  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    const userId = decodedToken.uid;
    const userRef = db.collection('users').doc(userId);
    
    const doc = await userRef.get();
    
    // ... (importurile de firebase admin rămân la fel) ...

// În interiorul funcției verifyUserAndCredits:
    
    const doc = await userRef.get();
    
    // USER NOU (TRIAL START)
    if (!doc.exists) {
      const trialCredits = 150; // BONUS DE BUN VENIT
      await userRef.set({ 
        credits: trialCredits, 
        email: decodedToken.email,
        subscriptionTier: 'trial',
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      // Dacă cere mai mult decât are din start (puțin probabil)
      if (costInCredits > trialCredits) throw new Error('Insufficient credits');
      
      return { userRef, userData: { credits: trialCredits } };
    }

// ... (restul verificărilor rămân la fel)

    const userData = doc.data();
    const currentCredits = userData.credits || 0;

    if (currentCredits < costInCredits) {
      throw new Error(`Insufficient credits. You have ${currentCredits}, required: ${costInCredits}.`);
    }

    return { userRef, userData };

  } catch (error) {
    console.error("Auth Error:", error);
    throw new Error('Authentication or Credit Check Failed');
  }
}

export async function deductCredits(userRef, cost) {
  await userRef.update({
    credits: admin.firestore.FieldValue.increment(-cost)
  });
}
