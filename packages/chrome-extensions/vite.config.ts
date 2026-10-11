import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import { mainfest } from './scripts/create-manifest.ts'

export default defineConfig(() => {
  const mode = process.env.MODE === 'development' ? 'development' : 'production'
  const isDev = mode === 'development'
  return {
    root: fileURLToPath(new URL('.', import.meta.url)),
    publicDir: 'public',
    plugins: [
      vue(),
      tailwindcss(),
      mainfest(mode),
    ],
    build: {
      outDir: isDev ? 'dist-dev' : 'dist',
      emptyOutDir: true,
      copyPublicDir: true,
      rollupOptions: {
        input: {
          content: fileURLToPath(new URL('./src/content.ts', import.meta.url)),
          background: fileURLToPath(new URL('./src/background.ts', import.meta.url)),
          devtools: fileURLToPath(new URL('./src/devtools.ts', import.meta.url)),
        },
        output: {
          entryFileNames: '[name].js',
          chunkFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash][extname]',
        },
      },
    },
  }
})
