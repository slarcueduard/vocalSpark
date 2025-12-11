import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface CountdownTimerProps {
    endDate: Date;
    onExpire?: () => void;
    compact?: boolean;
}

export function CountdownTimer({ endDate, onExpire, compact = false }: CountdownTimerProps) {
    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

    function calculateTimeLeft() {
        const difference = endDate.getTime() - new Date().getTime();

        if (difference <= 0) {
            return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
        }

        return {
            days: Math.floor(difference / (1000 * 60 * 60 * 24)),
            hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
            minutes: Math.floor((difference / 1000 / 60) % 60),
            seconds: Math.floor((difference / 1000) % 60),
            expired: false
        };
    }

    useEffect(() => {
        const timer = setInterval(() => {
            const newTimeLeft = calculateTimeLeft();
            setTimeLeft(newTimeLeft);

            if (newTimeLeft.expired && onExpire) {
                onExpire();
                clearInterval(timer);
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [endDate, onExpire]);

    if (timeLeft.expired) {
        return (
            <div className="text-red-400 font-bold text-sm animate-pulse">
                Offer Expired
            </div>
        );
    }

    if (compact) {
        return (
            <div className="flex items-center gap-2 text-orange-400">
                <Clock size={14} className="animate-pulse" />
                <span className="font-mono text-xs">
                    {timeLeft.days}d {timeLeft.hours}h {timeLeft.minutes}m {timeLeft.seconds}s
                </span>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center gap-3">
            <TimeUnit value={timeLeft.days} label="Days" />
            <Separator />
            <TimeUnit value={timeLeft.hours} label="Hours" />
            <Separator />
            <TimeUnit value={timeLeft.minutes} label="Min" />
            <Separator />
            <TimeUnit value={timeLeft.seconds} label="Sec" />
        </div>
    );
}

function TimeUnit({ value, label }: { value: number; label: string }) {
    return (
        <div className="flex flex-col items-center">
            <div className="bg-gradient-to-br from-orange-600 to-red-600 text-white rounded-lg px-3 py-2 min-w-[60px] text-center shadow-lg">
                <span className="font-mono text-2xl font-bold">
                    {String(value).padStart(2, '0')}
                </span>
            </div>
            <span className="text-[10px] text-gray-400 uppercase tracking-wider mt-1 font-bold">
                {label}
            </span>
        </div>
    );
}

function Separator() {
    return (
        <div className="text-orange-500 text-2xl font-bold animate-pulse">:</div>
    );
}
