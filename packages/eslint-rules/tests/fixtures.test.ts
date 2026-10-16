import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { ESLint } from 'eslint'
import { describe, expect, it } from 'vitest'
import rules from '../src'

const input = fileURLToPath(new URL('./fixtures/input', import.meta.url))
const output = fileURLToPath(new URL('./fixtures/output', import.meta.url))
const eslint = new ESLint({
  fix: true,
  overrideConfigFile: true,
  overrideConfig: rules,
})
const inputFiles = (await fs.readdir(input, { recursive: true, withFileTypes: true }))
  .filter(entry => entry.isFile())
  .map(entry => relative(input, join(entry.parentPath, entry.name)))
  .sort()
const outputFiles = (await fs.readdir(output, { recursive: true, withFileTypes: true }))
  .filter(entry => entry.isFile())
  .map(entry => relative(output, join(entry.parentPath, entry.name)))
  .sort()

describe('all fixtures', () => {
  it('input and output fixture files match', () => {
    expect(inputFiles.length).toBeGreaterThan(0)
    expect(outputFiles).toEqual(inputFiles)
  })

  it.each(inputFiles)('%s', async (file) => {
    const filePath = join(input, file)
    const source = await fs.readFile(filePath, 'utf8')
    const [result] = await eslint.lintText(source, { filePath })
    assert(result)
    expect.soft(result.messages).toEqual([])
    const fixed = result.output ?? source
    await expect.soft(fixed).toMatchFileSnapshot(join(output, file))

    const [secondPass] = await eslint.lintText(fixed, { filePath })
    assert(secondPass)
    expect.soft(secondPass.messages).toEqual([])
    expect.soft(secondPass.output).toBeUndefined()
  })
})
