import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api': {
        target: process.env.VITE_API_BASE_URL || 'http://localhost:5001',
        changeOrigin: true,
        secure: false,
      },
      '/uploads': {
        target: process.env.VITE_API_BASE_URL || 'http://localhost:5001',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    // Оптимизация для серверов с ограниченными ресурсами
    target: 'es2015',
    minify: 'esbuild',  // Используем встроенный esbuild (быстрее и меньше памяти)
    // Разбиваем на чанки для параллельной сборки
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
        },
      },
    },
    // Ограничиваем размер чанков
    chunkSizeWarningLimit: 1000,
  },
})
