import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const pagesBase = '/neuro-map-studio/';

export default defineConfig({
  base: process.env.GITHUB_PAGES === 'true' ? pagesBase : '/',
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: false,
  },
});
