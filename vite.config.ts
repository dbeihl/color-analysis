import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  base: '/color-analysis/',
  plugins: [tailwindcss()],
});
