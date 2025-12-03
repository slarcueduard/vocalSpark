import Stripe from 'stripe';
import admin from 'firebase-admin';
import { buffer } from 'micro';

// 1. Inițializare Firebase Admin
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
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// 2. Configurare Vercel (Body Parser oprit pt semnătură)
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST');
      return res.status(405).end('Method Not Allowed');
  }

  const buf = await buffer(req);
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
  } catch (err) {
    console.error(`⚠️  Webhook Signature Error: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // 3. Gestionarea Evenimentelor
  if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      
      // Datele trimise de noi din create-checkout.js
      const userId = session.metadata.firebaseUserId;
      const planType = session.metadata.planType;

      if (!userId || !planType) {
          console.error("Missing metadata in Stripe Session");
          return res.status(200).json({ received: true }); // Returnăm 200 ca să nu reîncerce Stripe la infinit
      }

      console.log(`💰 Payment success: User ${userId} -> ${planType}`);
      const userRef = db.collection('users').doc(userId);

      try {
          // --- CAZ 1: FOUNDER (LIFETIME DEAL) ---
          if (planType === 'founder') {
              await userRef.update({
                  subscriptionTier: 'agency', // Primește acces full (Agency features)
                  subscriptionStatus: 'lifetime',
                  credits: 99999, // Credite practic nelimitate (sau un număr imens)
                  isFounder: true,
                  updatedAt: admin.firestore.FieldValue.serverTimestamp()
              });
          } 
          // --- CAZ 2: CREDITE EXTRA (TOP-UP) ---
          else if (planType.startsWith('credits_')) {
              // Extragem suma (ex: credits_500 -> 500)
              const amountStr = planType.split('_')[1]; 
              const amount = parseInt(amountStr) || 0;

              // Folosim 'increment' pentru a ADĂUGA la ce are deja, nu înlocuim
              await userRef.update({
                  credits: admin.firestore.FieldValue.increment(amount),
                  updatedAt: admin.firestore.FieldValue.serverTimestamp()
              });
          } 
          // --- CAZ 3: ABONAMENTE NORMALE (Creator, Pro, Agency) ---
          else {
              let creditsToAdd = 600;
              if (planType === 'pro') creditsToAdd = 2000;
              if (planType === 'agency') creditsToAdd = 7000;

              await userRef.update({
                  subscriptionTier: planType,
                  subscriptionStatus: 'active',
                  credits: creditsToAdd, // La abonament lunar, resetăm creditele la valoarea planului
                  updatedAt: admin.firestore.FieldValue.serverTimestamp()
              });
          }
          
          console.log("✅ Firebase updated successfully.");

      } catch (dbError) {
          console.error("❌ Database Update Failed:", dbError);
          return res.status(500).send("Database Error");
      }
  }

  // Răspundem rapid lui Stripe că am primit mesajul
  res.status(200).json({ received: true });
}
