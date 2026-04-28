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
          // Proxy /odoo/* → Odoo SaaS to bypass CORS in development.
          // The browser calls /odoo/web/dataset/call_kw; Vite rewrites to
          // https://edu-facodi.odoo.com/web/dataset/call_kw
          '/odoo': {
            target: 'https://edu-facodi.odoo.com',
            changeOrigin: true,
            secure: true,
            rewrite: (path) => path.replace(/^\/odoo/, ''),
          },
        },
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
