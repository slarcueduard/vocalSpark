import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    // 1. Load env file based on `mode` (development/production).
    // This loads variables from .env files into `env` object.
    const env = loadEnv(mode, (process as any).cwd(), '');
    
    // 2. Prioritize System Environment Variables (Vercel) -> Then .env file variables
    // Vercel injects secrets into process.env during the build.
    const geminiKey = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY || env.VITE_GEMINI_API_KEY || env.GEMINI_API_KEY || '';

    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        // Expose the determined API Key to the client-side code
        'process.env.API_KEY': JSON.stringify(geminiKey),
      },
      resolve: {
        alias: {
          '@': path.resolve((process as any).cwd(), '.'),
        }
      }
    };
});