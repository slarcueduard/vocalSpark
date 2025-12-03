import Stripe from 'stripe';
import admin from 'firebase-admin';
import { buffer } from 'micro'; // IMPORTANT: Stripe are nevoie de body crud

// Inițializare Firebase (dacă nu e deja init)
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

// Configurare Vercel să NU parseze body-ul automat (pt semnătură)
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const buf = await buffer(req);
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    // Verificăm că cererea vine chiar de la Stripe
    event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
  } catch (err) {
    console.error(`Webhook Error: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // --- GESTIONAREA EVENIMENTELOR ---
  if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const userId = session.metadata.firebaseUserId;
      const planType = session.metadata.planType;

      console.log(`Payment success for user: ${userId}, plan: ${planType}`);

      // Definim creditele per plan
      let creditsToAdd = 600; // Creator
      if (planType === 'pro') creditsToAdd = 2500;
      if (planType === 'agency') creditsToAdd = 7000;

      // Actualizăm Firebase
      const userRef = db.collection('users').doc(userId);
      await userRef.update({
          subscriptionTier: planType,
          subscriptionStatus: 'active',
          credits: creditsToAdd, // Resetăm sau adăugăm (depinde de strategie, aici resetăm lunar)
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
         if (planType === 'founder') {
          // Founder primește statut 'agency' pe viață sau un statut special 'founder'
          // și credite lunare mari (sau nelimitate teoretic, dar punem o limită mare gen 10k)
          await userRef.update({
              subscriptionTier: 'agency', // Îi dăm acces full
              subscriptionStatus: 'lifetime', // Marker special
              credits: 99999, // Sau logică de reset lunar
              isFounder: true
          });
      }
      else if (planType === 'credits_500') {
          // Adăugăm la existent, nu înlocuim!
          await userRef.update({
              credits: admin.firestore.FieldValue.increment(500)
          });
      }
      });
  }

  // Putem adăuga logică și pentru 'invoice.payment_succeeded' pentru reînnoiri lunare

  res.status(200).json({ received: true });
}
