import React from 'react';

interface VoiceRadarChartProps {
    tone: number; // 0-100
    emoji: number; // 0-100
    length: number; // 0-100
}

export function VoiceRadarChart({ tone, emoji, length }: VoiceRadarChartProps) {
    // Configuration
    const size = 200;
    const center = size / 2;
    const radius = 80;

    // Safe value helper
    const safe = (val: number) => {
        const num = Number(val);
        return isNaN(num) ? 50 : Math.max(0, Math.min(100, num));
    };

    // Convert 0-100 score to radius distance
    // We add a base size (20%) so 0 isn't invisible
    const scale = (value: number) => radius * (0.2 + (safe(value) / 100) * 0.8);

    // Calculate points
    // 1. Tone (Top) - Angle -90 degrees (or 270)
    const toneY = center - scale(tone);
    const toneX = center;

    // 2. Emoji (Bottom Left) - Angle 150 degrees (30 deg from bottom)
    // cos(150) = -0.866, sin(150) = 0.5
    // Actually standard radar charts usually split 360 / 3 = 120 deg
    // Top: -90 deg
    // Right Bottom: 30 deg
    // Left Bottom: 150 deg

    const angleLeft = (150 * Math.PI) / 180;
    const emojiX = center + scale(emoji) * Math.cos(angleLeft);
    const emojiY = center + scale(emoji) * Math.sin(angleLeft);

    const angleRight = (30 * Math.PI) / 180;
    const lengthX = center + scale(length) * Math.cos(angleRight);
    const lengthY = center + scale(length) * Math.sin(angleRight);

    // Background Polygon (Full Size)
    const bgPoints = [
        `${center},${center - radius}`, // Top
        `${center + radius * Math.cos(angleRight)},${center + radius * Math.sin(angleRight)}`, // Right
        `${center + radius * Math.cos(angleLeft)},${center + radius * Math.sin(angleLeft)}` // Left
    ].join(' ');

    const activePoints = `${toneX},${toneY} ${lengthX},${lengthY} ${emojiX},${emojiY}`;

    return (
        <div className="relative flex flex-col items-center justify-center p-4">
            <svg width={size} height={size} className="overflow-visible">
                {/* Defs for Gradients */}
                <defs>
                    <linearGradient id="radarGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.6" />
                        <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.6" />
                    </linearGradient>
                    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="5" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                </defs>

                {/* Background Grid - Outer */}
                <polygon points={bgPoints} fill="none" stroke="#1f2937" strokeWidth="1" />

                {/* Background Grid - Inner (50%) */}
                <polygon points={[
                    `${center},${center - radius * 0.5}`,
                    `${center + radius * 0.5 * Math.cos(angleRight)},${center + radius * 0.5 * Math.sin(angleRight)}`,
                    `${center + radius * 0.5 * Math.cos(angleLeft)},${center + radius * 0.5 * Math.sin(angleLeft)}`
                ].join(' ')} fill="none" stroke="#1f2937" strokeWidth="1" strokeDasharray="4 4" />

                {/* Axes Lines */}
                <line x1={center} y1={center} x2={center} y2={center - radius} stroke="#1f2937" strokeWidth="1" />
                <line x1={center} y1={center} x2={center + radius * Math.cos(angleRight)} y2={center + radius * Math.sin(angleRight)} stroke="#1f2937" strokeWidth="1" />
                <line x1={center} y1={center} x2={center + radius * Math.cos(angleLeft)} y2={center + radius * Math.sin(angleLeft)} stroke="#1f2937" strokeWidth="1" />

                {/* The Data Shape */}
                <polygon
                    points={activePoints}
                    fill="url(#radarGradient)"
                    stroke="#60A5FA"
                    strokeWidth="2"
                    filter="url(#glow)"
                    className="transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
                />

                {/* Dots at vertices */}
                <circle cx={toneX} cy={toneY} r="3" fill="#60A5FA" className="transition-all duration-300 ease-out" />
                <circle cx={emojiX} cy={emojiY} r="3" fill="#60A5FA" className="transition-all duration-300 ease-out" />
                <circle cx={lengthX} cy={lengthY} r="3" fill="#60A5FA" className="transition-all duration-300 ease-out" />

                {/* Labels */}
                <text x={center} y={center - radius - 15} textAnchor="middle" fill="#9CA3AF" fontSize="10" fontWeight="bold">Tone</text>
                <text x={center + radius * Math.cos(angleRight) + 10} y={center + radius * Math.sin(angleRight) + 10} textAnchor="start" fill="#9CA3AF" fontSize="10" fontWeight="bold">Length</text>
                <text x={center + radius * Math.cos(angleLeft) - 10} y={center + radius * Math.sin(angleLeft) + 10} textAnchor="end" fill="#9CA3AF" fontSize="10" fontWeight="bold">Emoji</text>

                {/* Values */}
                <text x={center} y={center - radius - 5} textAnchor="middle" fill="#60A5FA" fontSize="10">{safe(tone)}%</text>
                <text x={center + radius * Math.cos(angleRight) + 10} y={center + radius * Math.sin(angleRight) + 20} textAnchor="start" fill="#60A5FA" fontSize="10">{safe(length)}%</text>
                <text x={center + radius * Math.cos(angleLeft) - 10} y={center + radius * Math.sin(angleLeft) + 20} textAnchor="end" fill="#60A5FA" fontSize="10">{safe(emoji)}%</text>
            </svg>
        </div>
    );
}
