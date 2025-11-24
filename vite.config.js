import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3002,
    host: true
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    cssCodeSplit: false, // CSS'i tek dosyada tut
    minify: 'esbuild', // Terser yerine esbuild kullan (daha hızlı ve varsayılan)
    cssMinify: 'esbuild', // CSS minify için esbuild kullan
    rollupOptions: {
      output: {
        // CSS'in optimize edilmesini kontrol et
        assetFileNames: (assetInfo) => {
          if (assetInfo.name === 'index.css') {
            return 'assets/[name].[ext]';
          }
          return 'assets/[name]-[hash].[ext]';
        },
      },
    },
  }
})
