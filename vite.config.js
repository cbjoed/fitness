import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Served from a custom domain root (see CNAME), not a repo subpath.
  // If deploying to https://<user>.github.io/fitness/ without a custom domain,
  // change this to '/fitness/' so built asset URLs resolve correctly.
  base: '/',
})
