import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// `base` is '/' in dev and for a user/org site; the deploy workflow sets
// VITE_BASE to '/<repo>/' for a GitHub Pages project site.
export default defineConfig({
  base: process.env.VITE_BASE || '/',
  plugins: [react()],
})
