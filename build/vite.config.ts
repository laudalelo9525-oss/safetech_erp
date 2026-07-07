import { defineConfig, configDefaults } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
  },
  preview: {
    host: true,
  },
  test: {
    // Playwright e2e specs live separately and shouldn't be run by vitest
    exclude: [...configDefaults.exclude, 'tests/e2e/**'],
  },
})
