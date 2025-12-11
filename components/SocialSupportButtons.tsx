import React from 'react';
import { MessageCircle, Send, Facebook, Hash } from 'lucide-react';

interface SocialSupportButtonsProps {
    variant?: 'horizontal' | 'vertical';
    showLabels?: boolean;
}

export function SocialSupportButtons({ variant = 'horizontal', showLabels = true }: SocialSupportButtonsProps) {
    const socials = [
        {
            name: 'Discord',
            icon: MessageCircle,
            url: 'https://discord.gg/your-server', // TODO: Replace with actual Discord invite
            color: 'bg-indigo-600 hover:bg-indigo-500',
            hoverColor: 'group-hover:text-indigo-400'
        },
        {
            name: 'Telegram',
            icon: Send,
            url: 'https://t.me/your-channel', // TODO: Replace with actual Telegram link
            color: 'bg-blue-500 hover:bg-blue-400',
            hoverColor: 'group-hover:text-blue-400'
        },
        {
            name: 'Facebook',
            icon: Facebook,
            url: 'https://facebook.com/groups/your-group', // TODO: Replace with actual Facebook group
            color: 'bg-blue-600 hover:bg-blue-500',
            hoverColor: 'group-hover:text-blue-400'
        },
        {
            name: 'WhatsApp',
            icon: Hash, // Using Hash as placeholder - can replace with proper WhatsApp icon
            url: 'https://chat.whatsapp.com/your-group', // TODO: Replace with actual WhatsApp link
            color: 'bg-green-600 hover:bg-green-500',
            hoverColor: 'group-hover:text-green-400'
        }
    ];

    return (
        <div className={`flex ${variant === 'vertical' ? 'flex-col' : 'flex-row flex-wrap'} gap-3`}>
            {socials.map((social) => (
                <a
                    key={social.name}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`group flex items-center gap-2 px-4 py-2 rounded-lg ${social.color} text-white transition-all shadow-md hover:shadow-lg hover:scale-105`}
                >
                    <social.icon size={18} />
                    {showLabels && (
                        <span className="text-sm font-medium">{social.name}</span>
                    )}
                </a>
            ))}
        </div>
    );
}

// Compact icon-only version for footer
export function SocialIconsCompact() {
    const socials = [
        { name: 'Discord', icon: MessageCircle, url: 'https://discord.gg/your-server' },
        { name: 'Telegram', icon: Send, url: 'https://t.me/your-channel' },
        { name: 'Facebook', icon: Facebook, url: 'https://facebook.com/groups/your-group' },
        { name: 'WhatsApp', icon: Hash, url: 'https://chat.whatsapp.com/your-group' }
    ];

    return (
        <div className="flex gap-3">
            {socials.map((social) => (
                <a
                    key={social.name}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 bg-gray-800 hover:bg-gray-700 rounded-lg flex items-center justify-center text-gray-400 hover:text-white transition-all group"
                    aria-label={social.name}
                >
                    <social.icon size={18} className="group-hover:scale-110 transition-transform" />
                </a>
            ))}
        </div>
    );
}
