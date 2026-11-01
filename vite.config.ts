import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ command }) => {
  // A globally exported NODE_ENV (e.g. `test` in a shell profile) would otherwise make the
  // production build bundle React's development runtime. Builds are always production.
  if (command === 'build') process.env.NODE_ENV = 'production'
  return {
    plugins: [react()],
    worker: { format: 'es' },
  }
})
