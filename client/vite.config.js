import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Keep the dev server reachable at the IPv4 loopback URL used by the app.
    host: '127.0.0.1',
  },
})
