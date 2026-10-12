import { existsSync } from 'node:fs'
import { dirname, extname, join, resolve, sep } from 'node:path'
import { createSimplePlugin } from 'eslint-factory'

function normalizeRelativePath(source: string): Array<string> {
  const resolved: Array<string> = []

  for (const segment of source.split('/')) {
    if (segment === '..') {
      if (resolved.length === 0)
        return []
      resolved.pop()
    }
    else if (segment !== '.' && segment !== '') {
      resolved.push(segment)
    }
  }

  const firstSegment = resolved[0]
  if (firstSegment === 'src')
    resolved.shift()

  return resolved
}

function findSrcRoot(filename: string): string {
  let directory = dirname(resolve(filename))

  while (directory !== dirname(directory)) {
    const directoryName = directory.split(sep).at(-1)
    if (directoryName === 'src')
      return directory
    directory = dirname(directory)
  }

  return ''
}

function getImportCandidates(target: string): Array<string> {
  const candidates = extname(target)
    ? [target]
    : [target, ...['.ts', '.tsx', '.js', '.jsx', '.vue', '.json'].map(extension => `${target}${extension}`), ...['index.ts', 'index.tsx', 'index.js', 'index.jsx', 'index.vue'].map(index => join(target, index))]

  return candidates
}

function isExistingDirectSrcImport(source: string, filename: string, srcRoot: string): boolean {
  const target = resolve(dirname(resolve(filename)), source)
  const relativeTarget = target.slice(srcRoot.length + 1)
  const targetSegments = relativeTarget.split(sep)

  return targetSegments.length === 1 && getImportCandidates(target).some(candidate => existsSync(candidate))
}

function resolveAlias(source: string, filename: string): string {
  const resolvedPath = normalizeRelativePath(source)
  const srcRoot = findSrcRoot(filename)

  if (resolvedPath.length !== 1 || srcRoot === '' || !isExistingDirectSrcImport(source, filename, srcRoot))
    return ''

  return `@/${resolvedPath[0]}`
}

export default createSimplePlugin({
  name: 'no-relative-src-import',
  description: 'Use @/ aliases instead of relative imports within src.',
  create(context) {
    return {
      ImportDeclaration(node) {
        const source = node.source.value
        if (typeof source !== 'string' || !source.startsWith('../'))
          return

        const alias = resolveAlias(source, context.sourceCode.fileName)
        if (alias === '')
          return

        context.report({
          node: node.source,
          message: 'Use an @/ alias instead of a relative src import.',
          fix: fixer => fixer.replaceText(node.source, `'${alias}'`),
        })
      },
    }
  },
})
