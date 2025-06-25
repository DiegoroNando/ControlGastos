import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },      server: {
        proxy: {
          // Proxy /api/health to the DB backend
          '/api/health': {
            target: 'http://localhost:3002', // Your DB backend
            changeOrigin: true,
            secure: false,
          },
          // Proxy /api/db requests to the DB backend
          '/api/db': {
            target: 'http://localhost:3002', // Your DB backend
            changeOrigin: true,
            secure: false,
          },          // Proxy other API requests to your main backend
          '/api': {
            target: 'http://localhost:3001',
            changeOrigin: true,
            secure: false,
            configure: (proxy, _options) => {
              proxy.on('error', (err, _req, _res) => {
                console.log('proxy error', err);
              });
            },
            // Important for session cookies
            withCredentials: true
          }
        },
        allowedHosts: ['tester001.intelligia.com.mx']
      }
    };
});
