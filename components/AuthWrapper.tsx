import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Loader } from './Loader';
import { SparklesIcon } from './Icons';

export const AuthWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading, signIn } = useAuth();

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-black text-white">
        <Loader size="lg" />
      </div>
    );
  }

  // Dacă utilizatorul NU este logat, arătăm ecranul de Login
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white p-4">
        <div className="bg-gray-900 p-8 rounded-2xl shadow-2xl max-w-md w-full text-center border border-gray-700">
          <div className="flex justify-center mb-6">
            <div className="bg-brand-primary/20 p-4 rounded-full">
              <SparklesIcon className="w-12 h-12 text-brand-primary" />
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-2 text-white">
            Vocal Spark
          </h1>
          <p className="text-gray-400 mb-8 text-sm">
            Create viral social media posts & visuals in seconds. <br />
            Join the workspace to start creating.
          </p>
          <button
            onClick={signIn}
            className="w-full bg-white text-gray-900 font-bold py-3 px-4 rounded-xl hover:bg-gray-100 transition flex items-center justify-center gap-3 shadow-lg transform hover:scale-[1.02]"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
            Continue with Google
          </button>
        </div>
      </div>
    );
  }

  // Dacă este logat, afișăm aplicația
  return <>{children}</>;
};
