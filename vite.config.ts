
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, (process as any).cwd(), '');
  return {
    plugins: [react()],
    define: {
      // Garante que process.env.API_KEY funcione no código client-side
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
      // Fallback para evitar erros se acessar process.env diretamente
      'process.env': {}
    },
    build: {
      chunkSizeWarningLimit: 1600, // Aumenta o limite para 1600kb para evitar warnings
    },
    server: {
      // Configuração de proxy para evitar CORS em desenvolvimento
      proxy: {
        '/uazapi-proxy': {
          target: 'http://localhost:8080', // Placeholder, altere para sua API se rodar local
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/uazapi-proxy/, '')
        }
      }
    }
  };
});
