import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  const frontendPort = Number(env.FRONTEND_PORT) || 1500;
  const backendPort = Number(env.BACKEND_PORT) || 1501;
  const backendOrigin = `http://localhost:${backendPort}`;

  return {
    server: {
      proxy: {
        '/api': {
          target: backendOrigin,
          changeOrigin: true,
        },
        '/assets': {
          target: backendOrigin,
          changeOrigin: true,
        },
      },
      port: frontendPort,
      host: '0.0.0.0',
      strictPort: true,
    },
    base: '/',
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
