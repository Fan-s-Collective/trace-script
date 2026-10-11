import { createSimplePlugin } from 'eslint-factory'

/**
 * Require one blank line between consecutive expression statements.
 */
export default createSimplePlugin({
  name: 'expression-statement-newline',
  include: ['**/*.{js,jsx,ts,tsx,mjs,cjs}'],
  exclude: ['**/*.test.ts'],
  create(context) {
    const { sourceCode } = context

    return {
      ExpressionStatement(node) {
        const parent = node.parent
        if (!('body' in parent) || !Array.isArray(parent.body))
          return

        const index = parent.body.indexOf(node)
        if (index <= 0)
          return

        const previous = parent.body[index - 1]
        if (previous.type !== 'ExpressionStatement')
          return

        const gap = sourceCode.text.slice(previous.range[1], node.range[0])
        if (!/^[ \t\r\n]*$/.test(gap))
          return

        const lineBreaks = gap.match(/\r?\n/g)?.length ?? 0
        if (lineBreaks === 2)
          return

        const line = sourceCode.getLines()[node.loc.start.line - 1]
        const indentation = line.match(/^[ \t]*/)?.[0] ?? ''
        const lineEnding = gap.includes('\r\n') ? '\r\n' : '\n'

        context.report({
          node,
          message: 'Add one blank line between consecutive expression statements.',
          fix: fixer => fixer.replaceTextRange(
            [previous.range[1], node.range[0]],
            `${lineEnding}${lineEnding}${indentation}`,
          ),
        })
      },
    }
  },
})
