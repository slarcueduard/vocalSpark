import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Loader } from './Loader';
import { SparklesIcon } from './Icons';

export const AuthWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading, isTrialExpired, daysRemaining, signIn, logout } = useAuth();

  if (loading) {
    return <div className="h-screen flex items-center justify-center bg-brand-bg-dark"><Loader size="lg" /></div>;
  }

  // 1. User not logged in -> Show Login Screen
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-brand-bg-dark text-brand-text p-4">
        <div className="bg-brand-bg-light p-8 rounded-2xl shadow-2xl max-w-md w-full text-center border border-gray-700">
          <div className="flex justify-center mb-6">
            <SparklesIcon className="w-16 h-16 text-brand-primary" />
          </div>
          <h1 className="text-3xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-brand-secondary">
            Social Spark AI
          </h1>
          <p className="text-gray-400 mb-8">
            Create viral social media posts in seconds. <br/>
            Start your <strong>5-Day Free Trial</strong> today.
          </p>
          <button
            onClick={signIn}
            className="w-full bg-white text-gray-900 font-bold py-3 px-4 rounded-lg hover:bg-gray-100 transition flex items-center justify-center gap-3"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-6 h-6" />
            Continue with Google
          </button>
        </div>
      </div>
    );
  }

  // 2. User Trial Expired -> Show Paywall
  if (isTrialExpired) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-brand-bg-dark text-brand-text p-4">
        <div className="bg-brand-bg-light p-8 rounded-2xl shadow-2xl max-w-md w-full text-center border border-red-500/50">
          <h2 className="text-2xl font-bold mb-4 text-white">Trial Expired ⏳</h2>
          <p className="text-gray-300 mb-6">
            Your 5-day free trial has ended. To continue creating amazing content, please upgrade to the Pro plan.
          </p>
          
          {/* REPLACE THIS LINK WITH YOUR STRIPE LINK LATER */}
          <a 
            href="https://velocityautomationai.com/pricing" 
            target="_blank"
            rel="noreferrer"
            className="block w-full bg-brand-primary text-brand-bg-dark font-bold py-3 px-4 rounded-lg hover:opacity-90 transition mb-4"
          >
            Upgrade Now
          </a>
          
          <button onClick={logout} className="text-sm text-gray-500 hover:text-white underline">
            Log out
          </button>
        </div>
      </div>
    );
  }

  // 3. User Active -> Show App + Trial Banner
  return (
    <>
       {daysRemaining <= 5 && (
        <div className="bg-gradient-to-r from-brand-primary to-brand-secondary text-brand-bg-dark text-center text-xs font-bold py-1">
          Trial Active: {daysRemaining} days remaining
        </div>
      )}
      {children}
    </>
  );
};
