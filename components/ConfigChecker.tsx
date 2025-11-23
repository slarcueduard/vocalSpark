import React, { useState, useEffect } from 'react';
import { verifyGeminiApiKey } from '../services/geminiService';
import { Loader } from './Loader';
import { CheckIcon, ExternalLinkIcon } from './Icons';

// A simple X icon for errors
const ErrorIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
);


type CheckStatus = 'checking' | 'success' | 'error';

interface StatusRowProps {
  status: CheckStatus;
  text: string;
  errorText?: string;
}

const StatusRow: React.FC<StatusRowProps> = ({ status, text, errorText }) => {
  const getStatusIcon = () => {
    switch (status) {
      case 'checking':
        return <Loader size="sm" />;
      case 'success':
        return <CheckIcon className="w-5 h-5 text-brand-primary" />;
      case 'error':
        return <div className="text-red-400"><ErrorIcon /></div>;
    }
  };

  return (
    <div className="flex items-center gap-3">
        {getStatusIcon()}
        <span className={`text-sm ${status === 'error' ? 'text-red-400' : 'text-brand-text'}`}>{text}</span>
    </div>
  );
};


export const ConfigChecker: React.FC = () => {
  const [apiKeyStatus, setApiKeyStatus] = useState<CheckStatus>('checking');
  const [geminiApiStatus, setGeminiApiStatus] = useState<CheckStatus>('checking');
  const [geminiApiError, setGeminiApiError] = useState<string>('');

  useEffect(() => {
    // Check for API Key presence
    if (process.env.API_KEY) {
      setApiKeyStatus('success');
    } else {
      setApiKeyStatus('error');
    }

    // Verify Gemini API accessibility
    const checkApi = async () => {
      const result = await verifyGeminiApiKey();
      if (result.ok) {
        setGeminiApiStatus('success');
      } else {
        setGeminiApiStatus('error');
        setGeminiApiError(result.message);
      }
    };
    
    checkApi();
  }, []);
  
  const showFixInstructions = geminiApiError.toLowerCase().includes('permission denied') || geminiApiError.toLowerCase().includes('api key');

  return (
    <div className="bg-brand-bg-dark border border-gray-600 rounded-lg p-4 my-4">
      <h4 className="text-sm font-semibold text-brand-text-secondary mb-3 text-left">Setup Status</h4>
      <ul className="space-y-3">
        <li className="flex flex-col items-start text-left">
            <StatusRow
              status={apiKeyStatus}
              text="API Key Provided"
            />
            {apiKeyStatus === 'error' && (
                <p className="pl-8 mt-1 text-xs text-brand-text-secondary">API_KEY is not set in the environment.</p>
            )}
        </li>

        <li className="flex flex-col items-start text-left">
           <StatusRow
                status={geminiApiStatus}
                text="Gemini API Accessible"
            />
            {geminiApiStatus === 'error' && (
                <div className="pl-8 mt-2 text-xs space-y-1">
                    <p className="text-brand-text-secondary mb-2">{geminiApiError}</p>
                    {showFixInstructions && (
                      <>
                        <p className="font-semibold text-brand-text-secondary">To fix this:</p>
                        <a 
                            href="https://console.cloud.google.com/apis/library/generativelanguage.googleapis.com" 
                            target="_blank" rel="noopener noreferrer" 
                            className="text-brand-secondary hover:underline flex items-center gap-1.5"
                        >
                            <span>1. Enable the <b>Generative Language API</b> for your project</span>
                            <ExternalLinkIcon className="w-3 h-3" />
                        </a>
                        <a 
                            href="https://console.cloud.google.com/apis/credentials" 
                            target="_blank" rel="noopener noreferrer" 
                            className="text-brand-secondary hover:underline flex items-center gap-1.5"
                        >
                            <span>2. Add the API to your Key's restrictions</span>
                            <ExternalLinkIcon className="w-3 h-3" />
                        </a>
                      </>
                    )}
                </div>
            )}
        </li>

         <li className="flex flex-col items-start text-left">
             <div className="flex items-center gap-3">
                <span className="w-5 h-5 flex items-center justify-center text-brand-primary">🔑</span>
                <span className="text-sm text-brand-text">Firebase Auth Configured</span>
            </div>
             <div className="pl-8 mt-1">
                 <a
                      href="https://console.firebase.google.com/project/_/authentication/settings"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-brand-secondary hover:underline flex items-center gap-1.5"
                    >
                      If sign-in fails, check your authorized domains here.
                      <ExternalLinkIcon className="w-3 h-3" />
                </a>
            </div>
        </li>
      </ul>
    </div>
  );
};