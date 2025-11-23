
import React, { useState } from 'react';
import { MailIcon, CheckCircleIcon } from './Icons';

export const NewsletterSignup: React.FC = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim() && email.includes('@')) { 
      console.log(`Subscribing with email: ${email}`);
      setSubmitted(true);
      // In a real application, you would call an API to your email marketing service here.
      setTimeout(() => {
        setSubmitted(false);
        setEmail('');
      }, 5000); // Reset form after 5 seconds
    }
  };

  return (
    <div className="bg-brand-bg-light p-8 rounded-2xl shadow-lg border border-gray-700 my-12">
      <div className="text-center max-w-2xl mx-auto">
        <MailIcon className="w-12 h-12 mx-auto text-brand-secondary mb-4" />
        <h3 className="text-2xl font-bold text-brand-text mb-2">Stay Ahead of the Curve</h3>
        <p className="text-brand-text-secondary mb-6">
          Subscribe to our newsletter for the latest AI trends, social media marketing tips, and exclusive updates on new Social Spark AI features.
        </p>
        
        {submitted ? (
          <div className="flex items-center justify-center gap-2 text-brand-primary h-12">
            <CheckCircleIcon className="w-6 h-6" />
            <p className="font-semibold">Thank you for subscribing!</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto h-12">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your.email@example.com"
              required
              className="flex-grow bg-brand-bg-dark border border-gray-600 rounded-md px-4 py-3 focus:ring-2 focus:ring-brand-primary focus:outline-none transition w-full"
              aria-label="Email for newsletter"
            />
            <button
              type="submit"
              className="bg-brand-primary text-brand-bg-dark font-bold py-3 px-4 rounded-md hover:bg-opacity-90 transition-transform transform hover:scale-105"
            >
              Subscribe
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
