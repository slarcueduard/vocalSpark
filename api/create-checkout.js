import Stripe from 'stripe';
import { verifyUserAndCredits } from './_utils.js'; // Folosim doar pt a valida tokenul

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    // 1. Validăm userul ca să îi luăm ID-ul (uid)
    // (Nu ne interesează creditele aici, doar cine e)
    const { userRef } = await verifyUserAndCredits(req, 0);
    const userId = userRef.id; // UID-ul din Firebase

    const { planId } = req.body; // 'creator', 'pro', sau 'agency'

    // 2. Alegem prețul corect din variabilele de mediu
    // ...
    let priceId;
    let mode = 'subscription'; // Default

    switch (planId) {
        case 'creator': priceId = process.env.STRIPE_PRICE_CREATOR; break;
        case 'pro': priceId = process.env.STRIPE_PRICE_PRO; break;
        case 'agency': priceId = process.env.STRIPE_PRICE_AGENCY; break;
        
        // NOU: Lifetime Deal
        case 'founder': 
            priceId = process.env.STRIPE_PRICE_FOUNDER; 
            mode = 'payment'; // One-time payment!
            break;

        // NOU: Credite
        case 'credits_500':
            priceId = process.env.STRIPE_PRICE_CREDITS_500;
            mode = 'payment';
            break;
            
        default: throw new Error("Invalid plan");
    }

// ...
    }

    // 3. Creăm sesiunea Stripe
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
    mode: mode, // Folosim variabila dinamică
      success_url: `${process.env.CLIENT_URL}?payment=success`,
      cancel_url: `${process.env.CLIENT_URL}?payment=cancelled`,
      // CRITIC: Aici trimitem ID-ul userului către Stripe ca să știm cui dăm creditele
      metadata: {
        firebaseUserId: userId,
        planType: planId
      },
    });

    // 4. Trimitem link-ul înapoi la Frontend
    return res.status(200).json({ url: session.url });

  } catch (error) {
    console.error("Stripe Error:", error);
    return res.status(500).json({ error: error.message });
  }
}
