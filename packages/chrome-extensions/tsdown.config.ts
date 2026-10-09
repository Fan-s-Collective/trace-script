import { build, defineConfig } from 'tsdown'
import { assembleExtension } from './scripts/build'

export default defineConfig((options) => {
  const mode = process.env.TRACE_SCRIPT_BUILD_MODE === 'development' ? 'development' : 'production'

  return {
    entry: {
      background: 'apps/extension/background/index.ts',
      devtools: 'apps/extension/devtools/index.ts',
    },
    outDir: '.build/extension',
    platform: 'browser',
    target: 'chrome120',
    deps: { alwaysBundle: ['@trace-script/core', '@trace-script/metadata', 'zod'] },

    outExtensions: () => ({ js: '.js' }),
    dts: false,
    clean: true,
    watch: options.watch ? ['apps/extension', 'apps/panel/app', 'apps/panel/nuxt.config.ts'] : false,
    hooks: {
      'build:done': async () => {
        await build({
          config: false,
          entry: { content: 'apps/extension/content/index.ts' },
          outDir: '.build/extension',
          platform: 'browser',
          target: 'chrome120',
          format: 'iife',
          outputOptions: { entryFileNames: '[name].js' },
          deps: { alwaysBundle: ['@trace-script/core', '@trace-script/metadata', 'zod'] },
          outExtensions: () => ({ js: '.js' }),
          dts: false,
          clean: false,
        })
        await assembleExtension(mode)
      },
    },
  }
})
