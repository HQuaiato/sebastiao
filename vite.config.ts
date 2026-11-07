import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base './' para funcionar no GitHub Pages (/sebastiao/)
export default defineConfig({
  base: './',
  plugins: [react()],
});
