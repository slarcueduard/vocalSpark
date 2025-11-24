import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Loader } from './Loader';
import { SparklesIcon, ExternalLinkIcon } from './Icons';
import { firebaseConfig } from '../firebaseConfig';

// Helper component for copying text
const CopyButton: React.FC<{ textToCopy: string }> = ({ textToCopy }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(textToCopy)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(err => {
        console.error('Failed to copy text: ', err);
      });
  };

  return (
    <button
      onClick={handleCopy}
      className="ml-2 text-xs bg-gray-700 text-brand-text-secondary px-2 py-0.5 rounded hover:bg-gray-600 transition-colors focus:outline-none flex-shrink-0"
    >
      {copied ? 'Copied!' : 'Copy'}
    </button>
  );
};

// Component to display Auth Errors intelligently
const AuthErrorDisplay: React.FC<{ error: string }> = ({ error }) => {
  // Regex to find the blocked domain in the error message
  const blockedDomainMatch = error.match(/requests-from-referer-(.*?)-are-blocked/);
  let blockedDomain = blockedDomainMatch ? blockedDomainMatch[1] : null;

  // CRITICAL FIX: Firebase only wants the domain (e.g. "example.com"), NOT the protocol ("https://example.com")
  if (blockedDomain) {
    blockedDomain = blockedDomain.replace(/^https?:\/\//, '').replace(/\/$/, '');
  }

  return (
    <div className="mt-6 text-left w-full max-w-md">
      <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
        <strong className="text-red-300 block mb-1">Sign-In Failed</strong>
        
        {blockedDomain ? (
          <>
            <p className="text-brand-text-secondary text-sm mb-3">
               <strong>Action Required:</strong> This preview domain is not authorized in Firebase.
            </p>
            <div className="bg-black/30 p-3 rounded mb-3 flex items-center justify-between gap-2">
                <code className="text-xs text-brand-text break-all font-mono">{blockedDomain}</code>
                <CopyButton textToCopy={blockedDomain} />
            </div>
            <a
                href={`https://console.firebase.google.com/project/${firebaseConfig.projectId}/authentication/settings`}
                target="_blank" rel="noopener noreferrer"
                className="text-brand-secondary hover:underline flex items-center gap-1.5 text-sm font-bold"
            >
                <span>Add to Authorized Domains</span>
                <ExternalLinkIcon className="w-3 h-3" />
            </a>
            <p className="text-xs text-brand-text-secondary mt-3 leading-relaxed">
                <strong>Tip:</strong> If you previously added this URL with <em>https://</em>, please delete it and add <strong>only</strong> the domain shown above.
            </p>
          </>
        ) : (
          <p className="text-brand-text-secondary text-sm break-words">{error}</p>
        )}
      </div>
    </div>
  );
};

export const AuthWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading, isTrialExpired, daysRemaining, signIn, loginAsGuest, logout, subscribe, error } = useAuth();

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
            Velocity Automation AI
          </h1>
          <p className="text-gray-400 mb-8">
            Accelerate growth with bespoke AI solutions.<br/>
            Start your <strong>5-Day Free Trial</strong> today.
          </p>
          
          <div className="space-y-3">
            <button
                onClick={signIn}
                className="w-full bg-white text-gray-900 font-bold py-3 px-4 rounded-lg hover:bg-gray-100 transition flex items-center justify-center gap-3"
            >
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-6 h-6" />
                Continue with Google
            </button>
            
            <button
                onClick={loginAsGuest}
                className="w-full bg-transparent border border-gray-600 text-brand-text-secondary font-semibold py-3 px-4 rounded-lg hover:bg-gray-800 hover:text-brand-text transition flex items-center justify-center gap-2 text-sm"
            >
                Preview App (Guest Mode)
            </button>
          </div>
        </div>
        
        {/* Display Error if present */}
        {error && <AuthErrorDisplay error={error} />}
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
            Your 5-day free trial has ended. To continue streamlining your operations, please upgrade to the Pro plan.
          </p>
          
          <button 
            onClick={subscribe}
            className="block w-full bg-brand-primary text-brand-bg-dark font-bold py-3 px-4 rounded-lg hover:opacity-90 transition mb-4"
          >
            Upgrade Now - $4.99/mo
          </button>
          
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
