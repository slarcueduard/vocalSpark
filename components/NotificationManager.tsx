import React, { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../services/firebase';
import { Post } from '../types';
import { Bell } from 'lucide-react';

export const NotificationManager: React.FC = () => {
    const [permission, setPermission] = useState<NotificationPermission>('default');
    const [upcomingEvents, setUpcomingEvents] = useState<Post[]>([]);

    useEffect(() => {
        if (!('Notification' in window)) {
            console.warn("This browser does not support desktop notification");
            return;
        }
        setPermission(Notification.permission);
    }, []);

    const requestPermission = async () => {
        const perm = await Notification.requestPermission();
        setPermission(perm);
    };

    // Listen for events scheduled in the future (today or later)
    useEffect(() => {
        const user = auth.currentUser;
        if (!user) return;

        // Query for posts that have a scheduledDate
        // We can't easily filter "future only" perfectly with Firestore real-time efficiently without composite indexes sometimes, 
        // but we can query by userId and filter in memory for the immediate "upcoming" check.
        const q = query(
            collection(db, 'posts'),
            where('userId', '==', user.uid)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const now = new Date();
            const events = snapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() } as Post))
                .filter(p => p.scheduledDate) // Must have a date
                .filter(p => !p.isPublished) // Not yet published/done
                .map(p => ({
                    ...p,
                    scheduledDate: p.scheduledDate?.toDate ? p.scheduledDate.toDate() : new Date(p.scheduledDate)
                }))
                .filter(p => p.scheduledDate > now); // Only future events

            setUpcomingEvents(events);
        });

        return () => unsubscribe();
    }, []);

    // Check every minute if an event is due
    useEffect(() => {
        const interval = setInterval(() => {
            const now = new Date();
            // User requested 30 minutes notification window
            const notificationWindow = new Date(now.getTime() + 30 * 60000);

            const upcoming = upcomingEvents.filter(event => {
                const eventTime = event.scheduledDate;
                // Consider events due between now and next 30 mins
                return eventTime && eventTime > now && eventTime <= notificationWindow;
            });

            // If we have upcoming events, show In-App Toast
            // We use a simplified logic: if ANY event is due soon, we show the first one.
            if (upcoming.length > 0) {
                const evt = upcoming[0]; // Pick first for now
                // Also trigger browser notification if allowed
                if (permission === 'granted') {
                    new Notification(`Upcoming: ${evt.topic}`, {
                        body: `Due in ${Math.round((evt.scheduledDate!.getTime() - now.getTime()) / 60000)} mins: ${evt.content?.substring(0, 50)}...`
                    });
                }

                // Dispatch a custom event or use a callback if we had global state.
                // Since this component is inside App, we can't easily push to App state without context.
                // BUT, App.tsx has `checkReminders` which sets `notification`.
                // Ideally, NotificationManager should display its OWN Toast to be "In-App Notification".
            }

        }, 60000);

        return () => clearInterval(interval);
    }, [upcomingEvents, permission]);

    // --- IN-APP TOAST RENDER ---
    // We render the toast here directly if an event is detected in the "render" cycle or state.
    // Let's create a local state for the active toast to ensure it shows.
    const [activeToast, setActiveToast] = useState<Post | null>(null);

    useEffect(() => {
        const checkToast = () => {
            const now = new Date();
            const thirtyMins = new Date(now.getTime() + 30 * 60000);

            const distinctEvent = upcomingEvents.find(e => {
                const t = e.scheduledDate;
                return t && t > now && t <= thirtyMins;
            });

            // Only update if different
            if (distinctEvent && distinctEvent.id !== activeToast?.id) {
                setActiveToast(distinctEvent);
            } else if (!distinctEvent) {
                setActiveToast(null);
            }
        };

        // Check immediately and on updates
        checkToast();
        const i = setInterval(checkToast, 30000);
        return () => clearInterval(i);
    }, [upcomingEvents]);

    if (activeToast) {
        const mins = Math.ceil((activeToast.scheduledDate!.getTime() - new Date().getTime()) / 60000);
        return (
            <div className="fixed top-24 right-6 bg-[#1f2937] border-l-4 border-orange-500 text-white p-4 rounded-r shadow-2xl z-[9999] animate-in slide-in-from-right max-w-sm flex items-start gap-3">
                <Bell className="text-orange-500 shrink-0 mt-1" />
                <div>
                    <h4 className="font-bold text-sm">Upcoming Event ({mins}m)</h4>
                    <p className="text-xs text-gray-300 mt-1 line-clamp-2">{activeToast.topic || "Scheduled Post"}</p>
                    <div className="mt-2 flex gap-2">
                        <button onClick={() => setActiveToast(null)} className="text-[10px] uppercase font-bold text-gray-500 hover:text-white">Dismiss</button>
                    </div>
                </div>
            </div>
        );
    }

    if (permission === 'denied' || permission === 'granted') return null;

    return (
        <div className="fixed bottom-4 right-4 bg-[#161b22] border border-blue-600 p-4 rounded-lg shadow-lg z-50 animate-in slide-in-from-bottom">
            <div className="flex items-center gap-3">
                <Bell className="text-blue-500" />
                <div>
                    <h4 className="font-bold text-white text-sm">Enable Browser Alerts?</h4>
                    <p className="text-xs text-gray-400">Get system notifications even when away.</p>
                </div>
            </div>
            <div className="mt-3 flex gap-2">
                <button
                    onClick={() => setPermission('denied')}
                    className="flex-1 px-3 py-1.5 text-xs text-gray-400 hover:text-white transition"
                >
                    No thanks
                </button>
                <button
                    onClick={requestPermission}
                    className="flex-1 px-3 py-1.5 bg-blue-600 text-white font-bold text-xs rounded hover:bg-blue-500 transition"
                >
                    Enable
                </button>
            </div>
        </div>
    );
};
