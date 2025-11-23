import React from 'react';
import { CheckIcon, XIcon } from './Icons'; // Asigură-te că ai iconițele

interface PricingModalProps {
  onClose: () => void;
}

export const PricingModal: React.FC<PricingModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-brand-bg-light max-w-5xl w-full rounded-2xl border border-gray-700 overflow-hidden flex flex-col md:flex-row relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">✕</button>
        
        {/* FREE TRIAL */}
        <div className="flex-1 p-8 border-r border-gray-700 flex flex-col">
          <h3 className="text-xl font-bold text-gray-400">Free Trial</h3>
          <div className="text-3xl font-bold text-white mt-2 mb-6">$0 <span className="text-sm font-normal">/ 5 days</span></div>
          <ul className="space-y-4 flex-1">
            <li className="flex gap-2"><CheckIcon className="text-green-400"/> 5 AI Images</li>
            <li className="flex gap-2"><CheckIcon className="text-green-400"/> Unlimited Text Posts</li>
            <li className="flex gap-2"><CheckIcon className="text-green-400"/> Upload & Filters</li>
          </ul>
          <button className="mt-8 py-2 px-4 rounded-lg bg-gray-700 text-gray-300 cursor-not-allowed">Current Plan</button>
        </div>

        {/* CREATOR */}
        <div className="flex-1 p-8 border-r border-gray-700 flex flex-col bg-brand-primary/5 relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-brand-primary"></div>
          <h3 className="text-xl font-bold text-brand-primary">Creator</h3>
          <div className="text-3xl font-bold text-white mt-2 mb-6">$15 <span className="text-sm font-normal">/ mo</span></div>
          <ul className="space-y-4 flex-1">
            <li className="flex gap-2"><CheckIcon className="text-brand-primary"/> 50 AI Images</li>
            <li className="flex gap-2"><CheckIcon className="text-brand-primary"/> Unlimited Text Posts</li>
            <li className="flex gap-2"><CheckIcon className="text-brand-primary"/> 1 Brand Voice Profile</li>
            <li className="flex gap-2"><CheckIcon className="text-brand-primary"/> Advanced Magic Edit</li>
          </ul>
          <a href="LINK_STRIPE_CREATOR" className="mt-8 py-2 px-4 rounded-lg bg-brand-primary text-black font-bold text-center hover:opacity-90">Upgrade to Creator</a>
        </div>

        {/* BUSINESS */}
        <div className="flex-1 p-8 flex flex-col">
          <h3 className="text-xl font-bold text-purple-400">Business Pro</h3>
          <div className="text-3xl font-bold text-white mt-2 mb-6">$49 <span className="text-sm font-normal">/ mo</span></div>
          <ul className="space-y-4 flex-1">
            <li className="flex gap-2"><CheckIcon className="text-purple-400"/> 200 AI Images</li>
            <li className="flex gap-2"><CheckIcon className="text-purple-400"/> 5 Brand Voice Profiles</li>
            <li className="flex gap-2"><CheckIcon className="text-purple-400"/> Content Calendar</li>
            <li className="flex gap-2"><CheckIcon className="text-purple-400"/> Priority Support</li>
          </ul>
          <a href="LINK_STRIPE_BUSINESS" className="mt-8 py-2 px-4 rounded-lg bg-purple-600 text-white font-bold text-center hover:bg-purple-700">Get Business Pro</a>
        </div>
      </div>
    </div>
  );
};
