import type { Plugin } from 'vite'
import { readFileSync } from 'node:fs'

export interface ExtensionManifest {
  manifest_version: 3
  name: string
  description: string
  version: string
  minimum_chrome_version: string
  devtools_page: string
  background: {
    service_worker: string
    type: 'module'
  }
  content_scripts: Array<{
    matches: string[]
    js: string[]
    run_at: 'document_start'
    all_frames: true
  }>
}

export function getExtensionVersion(): string {
  const packageJson = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')) as { version?: string }
  return packageJson.version ?? ''
}

export function mainfest(mode: string): Plugin {
  return {
    name: 'trace-script-extension-manifest',
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'manifest.json',
        source: `${JSON.stringify(createManifest(mode), null, 2)}\n`,
      })
    },
  }
}

function isValidVersionStr(version: string): string | undefined {
  if (!version.length)
    return
  const versionParts = version.split('.')
  const hasValidFormat = /^(?:0|[1-9]\d{0,4})(?:\.(?:0|[1-9]\d{0,4})){1,3}$/.test(version)
  const hasPartsWithinRange = versionParts.every(part => Number(part) <= 65535)
  const hasNonZeroPart = versionParts.some(part => Number(part) !== 0)

  if (!hasValidFormat || !hasPartsWithinRange || !hasNonZeroPart) {
    return
  }
  return version
}

export function createManifest(mode: string): ExtensionManifest {
  const version = isValidVersionStr(getExtensionVersion())
  if (!version)
    throw new Error('The extension version must contain 2–4 numeric parts between 0 and 65535, with at least one nonzero part.')

  return {
    manifest_version: 3,
    name: mode === 'development' ? 'Trace Script (Development)' : 'Trace Script',
    description: 'Inspect Agent event streams in Chrome DevTools.',
    version,
    minimum_chrome_version: '120',
    devtools_page: 'devtools.html',
    background: {
      service_worker: 'background.js',
      type: 'module',
    },
    content_scripts: [{
      matches: ['<all_urls>'],
      js: ['content.js'],
      run_at: 'document_start',
      all_frames: true,
    }],
  }
}
