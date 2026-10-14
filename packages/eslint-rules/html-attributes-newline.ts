import { createSimplePlugin } from 'eslint-factory'

interface StartTag {
  range: [number, number]
  loc: {
    start: { line: number }
  }
  attributes: { range: [number, number] }[]
  selfClosing: boolean
  parent: { rawName: string }
}

export default createSimplePlugin({
  name: 'html-attributes-newline',
  description: 'Require one attribute per line in HTML tags with more than three attributes.',
  include: ['**/*.vue'],
  fixable: 'whitespace',
  create(context) {
    const { sourceCode } = context
    const services = sourceCode.parserServices
    if (typeof services.defineTemplateBodyVisitor !== 'function')
      return {}

    return services.defineTemplateBodyVisitor({
      VStartTag(node: StartTag) {
        if (node.attributes.length <= 3)
          return

        const indent = sourceCode.lines[node.loc.start.line - 1].match(/^[\t ]*/)?.[0] ?? ''
        const attributeIndent = `${indent}${indent.includes('\t') ? '\t' : '  '}`
        const newline = sourceCode.text.includes('\r\n') ? '\r\n' : '\n'
        const gaps: { range: [number, number], indent: string }[] = []
        let previousEnd = node.range[0] + 1 + node.parent.rawName.length

        for (const attribute of node.attributes) {
          gaps.push({ range: [previousEnd, attribute.range[0]], indent: attributeIndent })
          previousEnd = attribute.range[1]
        }

        gaps.push({
          range: [previousEnd, node.range[1] - (node.selfClosing ? 2 : 1)],
          indent,
        })

        const missingNewlines = gaps.filter(gap => !/[\r\n]/.test(sourceCode.text.slice(...gap.range)))
        if (missingNewlines.length === 0)
          return

        context.report({
          loc: {
            start: sourceCode.getLocFromIndex(node.range[0]),
            end: sourceCode.getLocFromIndex(node.range[1]),
          },
          message: 'Put each attribute and the closing bracket on separate lines when a tag has more than three attributes.',
          fix: fixer => missingNewlines.map(gap => fixer.replaceTextRange(gap.range, `${newline}${gap.indent}`)),
        })
      },
    })
  },
})
