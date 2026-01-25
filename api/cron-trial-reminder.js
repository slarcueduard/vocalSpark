
import { Resend } from 'resend';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// --- 1. CONFIGURATION ---
// Ensure Environment Variables are set in Vercel
const RESEND_API_KEY = process.env.RESEND_API_KEY; // Must be set
const SERVICE_ACCOUNT = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
    ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
    : null;

// Helper to init Firebase Admin
function getAdminDB() {
    if (!SERVICE_ACCOUNT) {
        throw new Error("Missing FIREBASE_SERVICE_ACCOUNT_KEY");
    }
    if (getApps().length === 0) {
        initializeApp({
            credential: cert(SERVICE_ACCOUNT)
        });
    }
    return getFirestore();
}

export default async function handler(req, res) {
    // Basic Auth or Cron Secret to prevent public spamming
    // For Vercel Cron, check header: 'Authorization': `Bearer ${process.env.CRON_SECRET}`
    // For simplicity in this demo, we allow it (or check query param ?key=secret)

    // Safety check
    if (!RESEND_API_KEY) {
        return res.status(500).json({ error: "Missing RESEND_API_KEY" });
    }

    try {
        const db = getAdminDB();
        const resend = new Resend(RESEND_API_KEY);

        const now = new Date();
        const hours48FromNow = new Date(now.getTime() + (48 * 60 * 60 * 1000));

        // 2. QUERY USERS
        // Logic: Subscription = 'trial', trialEndDate < 48h from now, trialEndDate > now
        // And 'emailReminderSent' != true

        // Note: Firestore doesn't support complex multi-field inequalities easily without composite indexes.
        // We will query by 'subscriptionTier' == 'trial' and filter in memory if list is small, 
        // OR rely on index if user creates one. 
        // Let's grab all active trials first.

        const usersRef = db.collection('users');
        const snapshot = await usersRef.where('subscriptionTier', '==', 'trial').get();

        if (snapshot.empty) {
            return res.status(200).json({ message: "No trial users found." });
        }

        let sentCount = 0;
        const emailsSent = [];

        for (const doc of snapshot.docs) {
            const user = doc.data();

            // Validation
            if (!user.trialEndDate || !user.email) continue;
            if (user.emailReminderSent === true) continue; // Already handled

            const endDate = new Date(user.trialEndDate);

            // Check if within 48h window AND not expired
            if (endDate > now && endDate <= hours48FromNow) {

                // 3. SEND EMAIL
                console.log(`📧 Sending reminder to ${user.email}...`);

                try {
                    const { data, error } = await resend.emails.send({
                        from: 'Vocal Spark <noreply@vocalspark.io>', // Update this if verified domain exists, else use 'onboarding@resend.dev' for testing
                        to: [user.email],
                        subject: 'Action Required: Your Vocal Spark Trial Ends Soon! ⏳',
                        html: `
                            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                                <h1 style="color: #111;">Your Free Trial is Ending...</h1>
                                <p>You have less than 48 hours left to enjoy Vocal Spark Pro features.</p>
                                <p>Don't lose your Voice DNA, saved posts, and generated campaigns.</p>
                                
                                <div style="background: #f4f4f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                                    <h3 style="margin-top:0;">Why Upgrade?</h3>
                                    <ul>
                                        <li>✨ Unlimited AI Generations</li>
                                        <li>🧬 Advanced Voice DNA Cloning</li>
                                        <li>📅 Calendar & Scheduling</li>
                                    </ul>
                                </div>

                                <div style="text-align: center; margin: 30px 0;">
                                    <a href="https://vocalspark.io/?upgrade=true" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                                        Choose a Plan & Keep Access
                                    </a>
                                </div>
                                
                                <p style="color: #666; font-size: 12px; text-align: center;">
                                    If you do nothing, your account will revert to a restricted state.
                                </p>
                            </div>
                        `
                    });

                    if (error) {
                        console.error('Resend Error:', error);
                        continue;
                    }

                    // 4. MARK AS SENT
                    await usersRef.doc(doc.id).update({
                        emailReminderSent: true,
                        reminderSentAt: new Date().toISOString()
                    });

                    emailsSent.push(user.email);
                    sentCount++;

                } catch (sendErr) {
                    console.error(`Failed to send to ${user.email}`, sendErr);
                }
            }
        }

        return res.status(200).json({
            success: true,
            sent: sentCount,
            recipients: emailsSent
        });

    } catch (error) {
        console.error("Cron Error:", error);
        return res.status(500).json({ error: error.message });
    }
}
