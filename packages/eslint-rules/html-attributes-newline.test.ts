import { vue } from '@antfu/eslint-config'
import { ESLint, Linter } from 'eslint'
import { describe, expect, it } from 'vitest'
import repositoryConfig from '../../eslint.config'
import htmlAttributesNewline from './html-attributes-newline'

const vueConfig = (await vue()).find(config => config.languageOptions?.parser)
if (!vueConfig)
  throw new Error('Vue parser configuration is required for rule tests.')

const config = [
  { files: ['**/*.vue'], languageOptions: vueConfig.languageOptions },
  htmlAttributesNewline,
]
const linter = new Linter()
const filename = 'example.vue'

function verifyFix(input: string, output: string) {
  const messages = linter.verify(input, config, { filename })
  expect(messages).toHaveLength(1)
  expect(messages[0].ruleId).toBe('html-attributes-newline/html-attributes-newline')
  const fixed = linter.verifyAndFix(input, config, { filename })
  expect(fixed.output).toBe(output)
  expect(fixed.messages).toEqual([])
  expect(linter.verifyAndFix(output, config, { filename }).fixed).toBeFalsy()
}

describe('html-attributes-newline', () => {
  it.each([
    '<button>Toggle</button>',
    '<button disabled>Toggle</button>',
    '<button type="button" disabled>Toggle</button>',
    '<button type="button" class="toggle" disabled>Toggle</button>',
    '<button type="button"\n  class="toggle"\n  disabled\n>Toggle</button>',
    '<button\n  type="button"\n  class="toggle"\n  disabled\n  title="Toggle"\n>Toggle</button>',
  ])('accepts short or already wrapped tags: %s', (tag) => {
    expect(linter.verify(`<template>\n${tag}\n</template>`, config, { filename })).toEqual([])
  })

  it('fixes the supplied button while preserving directives and template literals', () => {
    const attributes = [
      'type="button"',
      'class="collapse-button"',
      ':aria-expanded="!collapsed"',
      `:aria-label="\`\${collapsed ? 'Expand' : 'Collapse'} \${trace.traceId}\`"`,
      '@click="emit(\'toggle\')"',
    ]
    verifyFix(
      `<template>\n    <button ${attributes.join(' ')}>Toggle</button>\n</template>`,
      `<template>\n    <button\n${attributes.map(attribute => `      ${attribute}`).join('\n')}\n    >Toggle</button>\n</template>`,
    )
  })

  it('wraps exactly four attributes in self-closing component tags', () => {
    verifyFix(
      '<template>\n  <TraceRow :trace="trace" v-if="visible" @click="select" compact />\n</template>',
      '<template>\n  <TraceRow\n    :trace="trace"\n    v-if="visible"\n    @click="select"\n    compact\n  />\n</template>',
    )
  })

  it('adds missing breaks to a partially wrapped tag', () => {
    verifyFix(
      '<template>\n  <button type="button"\n    class="toggle" disabled\n    title="Toggle">Toggle</button>\n</template>',
      '<template>\n  <button\n    type="button"\n    class="toggle"\n    disabled\n    title="Toggle"\n  >Toggle</button>\n</template>',
    )
  })

  it('moves only the closing bracket when attributes already occupy separate lines', () => {
    verifyFix(
      '<template>\n  <input\n    type="text"\n    name="query"\n    disabled\n    required/>\n</template>',
      '<template>\n  <input\n    type="text"\n    name="query"\n    disabled\n    required\n  />\n</template>',
    )
  })

  it('preserves quoted greater-than signs and multiline attribute values', () => {
    verifyFix(
      '<template>\n  <button title="a > b" :disabled="count > 3" :class="{\n    active: ready,\n  }" @click="select">Toggle</button>\n</template>',
      '<template>\n  <button\n    title="a > b"\n    :disabled="count > 3"\n    :class="{\n    active: ready,\n  }"\n    @click="select"\n  >Toggle</button>\n</template>',
    )
  })

  it('preserves CRLF line endings and tab indentation', () => {
    verifyFix(
      '<template>\r\n\t<input a b c d />\r\n</template>',
      '<template>\r\n\t<input\r\n\t\ta\r\n\t\tb\r\n\t\tc\r\n\t\td\r\n\t/>\r\n</template>',
    )
  })

  it('ignores markup inside comments, script strings, and interpolations', () => {
    const input = `<script>const markup = '<button a b c d>'</script>
<template>
  <!-- <button a b c d> -->
  <p>{{ '<button a b c d>' }}</p>
</template>`
    expect(linter.verify(input, config, { filename })).toEqual([])
  })

  it('does not apply to JavaScript files', () => {
    expect(linter.verify('const markup = "<button a b c d>"', [htmlAttributesNewline], { filename: 'example.js' })).toEqual([])
  })

  it('does not crash when a Vue parser is not available', () => {
    expect(linter.verify('const count = 4', [htmlAttributesNewline], { filename })).toEqual([])
  })

  it('converges with the repository Vue formatting rules', async () => {
    const eslint = new ESLint({ overrideConfigFile: true, overrideConfig: await repositoryConfig, fix: true })
    const input = '<template>\n  <button type="button" class="toggle" aria-label="Toggle" title="Toggle">Toggle</button>\n</template>\n'
    const [result] = await eslint.lintText(input, { filePath: filename })
    expect(result.messages).toEqual([])
    expect(result.output).toContain('<button\n')
    expect(result.output).toContain('    title="Toggle"\n  >')
    const [secondPass] = await eslint.lintText(result.output ?? input, { filePath: filename })
    expect(secondPass.messages).toEqual([])
    expect(secondPass.output).toBeUndefined()
  })
})
