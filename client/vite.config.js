import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/ local
// export default defineConfig({
//   plugins: [react()],
//   server: {
//     proxy: {
//       '/api': 'http://localhost:5000',
//       '/uploads': 'http://localhost:5000'
//     }
//   }
// })

// client/vite.config.js
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        // Gunakan domain Production yang permanen ini:
        target: 'https://booking-ruang-rapat.vercel.app',
        changeOrigin: true,
        secure: true,
      }
    }
  }
})