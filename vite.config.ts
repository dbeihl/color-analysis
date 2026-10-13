/// <reference types="vitest/config" />
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import { configDefaults } from 'vitest/config';

export default defineConfig({
  base: '/color-analysis/',
  plugins: [tailwindcss()],
  test: {
    // Playwright specs run under `npx playwright test`, not Vitest.
    exclude: [...configDefaults.exclude, 'e2e/**'],
  },
});
