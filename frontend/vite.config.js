import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/jd': 'http://127.0.0.1:8000',
      '/resume': 'http://127.0.0.1:8000',
      '/talent-check': 'http://127.0.0.1:8000',
      '/match': 'http://127.0.0.1:8000',
      '/mock-interview': 'http://127.0.0.1:8000',
      '/companies': 'http://127.0.0.1:8000',
      '/health': 'http://127.0.0.1:8000',
      '/api': 'http://127.0.0.1:8000',
    }
  }
})
