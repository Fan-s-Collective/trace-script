import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import { mainfest } from './scripts/create-manifest.ts'

function resolve(name: string): ReturnType<typeof fileURLToPath> {
  return fileURLToPath(new URL(`./src/entry/${name}.ts`, import.meta.url))
}

export default defineConfig(({ mode }) => {
  return {
    root: fileURLToPath(new URL('.', import.meta.url)),
    publicDir: 'public',
    plugins: [
      vue(),
      tailwindcss(),
      mainfest(mode),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      port: 4173,
      open: '/index.html',
    },
    build: {
      outDir: mode === 'development' ? 'dist-dev' : 'dist',
      emptyOutDir: true,
      copyPublicDir: true,
      rollupOptions: {
        input: {
          content: resolve('content'),
          background: resolve('background'),
          devtools: resolve('devtools'),
          panel: fileURLToPath(new URL('./panel.html', import.meta.url)),
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
