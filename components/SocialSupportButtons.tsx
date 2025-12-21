import React from 'react';
import { MessageCircle, Send, Facebook, Hash, Phone } from 'lucide-react';

interface SocialSupportButtonsProps {
    variant?: 'horizontal' | 'vertical';
    showLabels?: boolean;
}

export function SocialSupportButtons({ variant = 'horizontal', showLabels = true }: SocialSupportButtonsProps) {
    const socials = [
        {
            name: 'Discord',
            icon: () => (
                <svg width="18" height="18" viewBox="0 0 127.14 96.36" fill="currentColor">
                    <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.11,77.11,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22c1.24-18.87-8.44-42.36-18.9-72.15ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z" />
                </svg>
            ),
            url: 'https://discord.gg/hA5NvuMNbZ',
            color: 'bg-indigo-600 hover:bg-indigo-500',
            hoverColor: 'group-hover:text-indigo-400'
        },
        {
            name: 'Telegram',
            icon: Send,
            url: 'https://t.me/+7E7jz-AefrZkMjZk',
            color: 'bg-blue-500 hover:bg-blue-400',
            hoverColor: 'group-hover:text-blue-400'
        },
        {
            name: 'WhatsApp',
            icon: Phone,
            url: 'https://chat.whatsapp.com/IdxgRcn7REnJyxKYLDZvsG',
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
        {
            name: 'Discord',
            icon: () => (
                <svg width="18" height="18" viewBox="0 0 127.14 96.36" fill="currentColor">
                    <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.11,77.11,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22c1.24-18.87-8.44-42.36-18.9-72.15ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z" />
                </svg>
            ),
            url: 'https://discord.gg/hA5NvuMNbZ'
        },
        { name: 'Telegram', icon: Send, url: 'https://t.me/+7E7jz-AefrZkMjZk' },
        { name: 'WhatsApp', icon: Phone, url: 'https://chat.whatsapp.com/IdxgRcn7REnJyxKYLDZvsG' }
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

// Specific version for the sidebar (Telegram, Discord, WhatsApp)
export function SidebarSocials() {
    const socials = [
        {
            name: 'Telegram',
            icon: Send,
            url: 'https://t.me/+7E7jz-AefrZkMjZk',
            color: 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 border border-blue-500/20'
        },
        {
            name: 'Discord',
            icon: () => (
                <svg width="18" height="18" viewBox="0 0 127.14 96.36" fill="currentColor">
                    <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.11,77.11,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22c1.24-18.87-8.44-42.36-18.9-72.15ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z" />
                </svg>
            ),
            url: 'https://discord.gg/hA5NvuMNbZ',
            color: 'bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500/20 border border-indigo-500/20'
        },
        {
            name: 'WhatsApp',
            icon: Phone,
            url: 'https://chat.whatsapp.com/IdxgRcn7REnJyxKYLDZvsG',
            color: 'bg-green-500/10 text-green-500 hover:bg-green-500/20 border border-green-500/20'
        }
    ];

    return (
        <div className="mt-6 px-4">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Community</div>
            <div className="flex gap-2">
                {socials.map((social) => (
                    <a
                        key={social.name}
                        href={social.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className={`flex-1 p-2 rounded-lg transition-all flex items-center justify-center ${social.color}`}
                        title={`Join our ${social.name} community`}
                    >
                        <social.icon size={18} />
                    </a>
                ))}
            </div>
        </div>
    );
}
