
import React, { useState } from 'react';
import { SparklesIcon, GoogleIcon, ExternalLinkIcon } from './Icons';
import { Loader } from './Loader';
import { ConfigChecker } from './ConfigChecker';
import { firebaseConfig } from '../firebaseConfig';
import { UserProfile } from '../types';

export type AuthState = 'loading' | 'authenticating' | 'unauthenticated' | 'trial' | 'trial_expired' | 'subscribed';

interface PaywallProps {
  state: AuthState;
  userProfile: UserProfile | null;
  onSignIn: () => void;
  onSubscribe: () => void;
  error?: string | null;
}

const PaywallContent: React.FC<{
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
}> = ({ icon, title, description, children }) => (
  <div className="w-full max-w-lg bg-brand-bg-light p-8 rounded-2xl shadow-lg border border-gray-700 text-center">
    <div className="flex justify-center mb-4">{icon}</div>
    <h2 className="text-2xl font-bold text-brand-text mb-2">{title}</h2>
    <p className="text-brand-text-secondary mb-6">{description}</p>
    <div>{children}</div>
  </div>
);

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
        alert('Failed to copy text.');
      });
  };

  return (
    <button
      onClick={handleCopy}
      className="ml-2 text-xs bg-gray-700 text-brand-text-secondary px-2 py-0.5 rounded hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-secondary flex-shrink-0"
      aria-label={`Copy ${textToCopy}`}
    >
      {copied ? 'Copied!' : 'Copy'}
    </button>
  );
};


const TroubleshootingGuide: React.FC<{ projectId: string }> = ({ projectId }) => (
  <div className="mt-4 text-left border-t border-gray-600 pt-4">
    <h4 className="font-semibold text-brand-text-secondary text-sm mb-2">Troubleshooting Checklist:</h4>
    <ul className="space-y-4 text-xs">
      <li className="flex items-start gap-2">
        <span className="mt-0.5 font-bold text-brand-text-secondary">1.</span>
        <div>
          <strong>Is Google Sign-In enabled?</strong>
          <a
            href={`https://console.firebase.google.com/project/${projectId}/authentication/providers`}
            target="_blank" rel="noopener noreferrer"
            className="text-brand-secondary hover:underline flex items-center gap-1.5"
          >
            <span>Check your Firebase Sign-in providers</span>
            <ExternalLinkIcon className="w-3 h-3" />
          </a>
        </div>
      </li>
      <li className="flex items-start gap-2">
        <span className="mt-0.5 font-bold text-brand-text-secondary">2.</span>
        <div>
          <strong className="block mb-1">Are the domains authorized?</strong>
          <p className="text-brand-text-secondary mb-2">You must add the current domain to Firebase Auth settings.</p>
          <a
            href={`https://console.firebase.google.com/project/${projectId}/authentication/settings`}
            target="_blank" rel="noopener noreferrer"
            className="text-brand-secondary hover:underline flex items-center gap-1.5"
          >
            <span>Open Firebase Authorized Domains</span>
            <ExternalLinkIcon className="w-3 h-3" />
          </a>
        </div>
      </li>
    </ul>
  </div>
);


const AuthErrorDisplay: React.FC<{ error: string }> = ({ error }) => {
  // Try to extract the domain from the specific "requests-from-referer-blocked" error
  const blockedDomainMatch = error.match(/requests-from-referer-(.*?)-are-blocked/);
  let blockedDomain = blockedDomainMatch ? blockedDomainMatch[1] : null;

  // CRITICAL FIX: Strip protocol to ensure correct format for Firebase
  if (blockedDomain) {
    blockedDomain = blockedDomain.replace(/^https?:\/\//, '').replace(/\/$/, '');
  }

  return (
    <div className="text-red-400 mt-4 text-sm bg-red-500/10 p-4 rounded-lg border border-red-400/30 text-left">
      <strong className="text-red-300 block mb-1 text-base">Sign-In Failed</strong>
      <p className="text-brand-text-secondary text-xs mb-3">
        The sign-in popup closed unexpectedly.
      </p>

      {blockedDomain ? (
        <div className="bg-yellow-500/10 border border-yellow-500/30 p-3 rounded mb-3">
            <p className="text-yellow-200 text-xs font-bold mb-1">Action Required:</p>
            <p className="text-brand-text-secondary text-xs mb-2">
                The domain <strong>{blockedDomain}</strong> is not authorized. You must add it to the authorized domains list in the Firebase Console.
            </p>
            <div className="flex items-center gap-2 bg-black/30 p-2 rounded">
                <code className="text-xs text-brand-text flex-grow break-all">{blockedDomain}</code>
                <CopyButton textToCopy={blockedDomain} />
            </div>
             <a
                href={`https://console.firebase.google.com/project/${firebaseConfig.projectId}/authentication/settings`}
                target="_blank" rel="noopener noreferrer"
                className="text-brand-secondary hover:underline flex items-center gap-1.5 mt-2 text-xs font-bold"
              >
                <span>Go to Firebase Console to Add Domain</span>
                <ExternalLinkIcon className="w-3 h-3" />
              </a>
        </div>
      ) : (
          <p className="font-mono text-xs bg-gray-900 p-2 rounded mb-3 break-words">
            <span className="text-gray-500">Error: </span>{error}
          </p>
      )}
      
      {!blockedDomain && <TroubleshootingGuide projectId={firebaseConfig.projectId} />}
    </div>
  );
};


export const Paywall: React.FC<PaywallProps> = ({ state, userProfile, onSignIn, onSubscribe, error }) => {
  const getDaysLeft = () => {
    if (!userProfile) return 0;
    const trialEndDate = new Date(userProfile.trialEndDate);
    return Math.max(0, Math.ceil((trialEndDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)));
  };

  const daysLeft = getDaysLeft();

  const renderContent = () => {
    switch (state) {
      case 'unauthenticated':
      case 'trial_expired':
        const isExpired = state === 'trial_expired';
        return (
          <PaywallContent
            icon={<SparklesIcon className={`w-12 h-12 ${isExpired ? 'text-yellow-500' : 'text-brand-primary'}`} />}
            title={isExpired ? "Your Free Trial Has Ended" : "Welcome to Velocity Automation AI"}
            description={isExpired ? "Subscribe to continue using our bespoke AI solutions." : "Sign in to start your 5-day free trial. No credit card required."}
          >
            {!isExpired ? (
              <>
                <ConfigChecker />
                <button
                  onClick={onSignIn}
                  className="w-full flex items-center justify-center gap-3 bg-white text-gray-800 font-semibold py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors disabled:bg-gray-300 mt-6"
                >
                  <GoogleIcon className="w-6 h-6" />
                  <span>Sign In with Google</span>
                </button>
                {error && <AuthErrorDisplay error={error} />}
              </>
            ) : (
              <button
                onClick={onSubscribe}
                className="w-full bg-brand-primary text-brand-bg-dark font-bold py-3 px-4 rounded-md hover:bg-opacity-90 transition-transform transform hover:scale-105"
              >
                Subscribe Now - $4.99/month
              </button>
            )}
          </PaywallContent>
        );
      
      case 'trial':
        return (
           <PaywallContent
            icon={<SparklesIcon className="w-12 h-12 text-brand-primary" />}
            title={`You have ${daysLeft} ${daysLeft === 1 ? 'day' : 'days'} left on your trial!`}
            description="Enjoy full access to Velocity Automation AI. Upgrade now to keep your access after the trial ends."
          >
             <button
              onClick={onSubscribe}
              className="w-full bg-brand-primary text-brand-bg-dark font-bold py-3 px-4 rounded-md hover:bg-opacity-90 transition-transform transform hover:scale-105"
            >
              Subscribe Now - $4.99/month
            </button>
          </PaywallContent>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg-dark text-brand-text font-sans flex flex-col items-center justify-center p-4">
      {renderContent()}
    </div>
  );
};
