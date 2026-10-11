import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import { mainfest } from './scripts/create-manifest.ts'

function resolve(name: string): ReturnType<typeof fileURLToPath> {
  return fileURLToPath(new URL(`./src/entry/${name}.ts`, import.meta.url))
}

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
          content: resolve('content'),
          background: resolve('background'),
          devtools: resolve('devtools'),
          panel: resolve('panel'),
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
