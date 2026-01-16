import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        proxy: {
          '/jsonrpc': {
            target: 'http://localhost:8069',
            changeOrigin: true,
            secure: false, // if you are not using HTTPS
          },
          '/web': {
            target: 'http://localhost:8069',
            changeOrigin: true,
            secure: false, // if you are not using HTTPS
          },
          '/api/protected': {
            target: 'http://localhost:8069',
            changeOrigin: true,
            secure: false, // if you are not using HTTPS
          },
          '/api/auth/login': {
            target: 'http://localhost:8069',
            changeOrigin: true,
            secure: false, // if you are not using HTTPS
          },
          '/api/auth/signup': {
            target: 'http://localhost:8069',
            changeOrigin: true,
            secure: false, // if you are not using HTTPS
          },
          '/api/auth/logout': {
            target: 'http://localhost:8069',
            changeOrigin: true,
            secure: false, // if you are not using HTTPS
          },
          '/api/supabase/user': {
            target: 'http://localhost:8069',
            changeOrigin: true,
            secure: false, // if you are not using HTTPS
          }
        }
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
