import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// base must match the GitHub repo name — the site is served at
// https://jeremyperonto.com/<repo>/ via GitHub Pages.
export default defineConfig({
  base: '/derby/',
  plugins: [react()],
  test: {
    include: ['test/**/*.test.ts'],
  },
})
