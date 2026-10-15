import type { Rule as ESLintRule } from 'eslint'
import type { AST } from 'vue-eslint-parser'
import type { Rule } from './index'
import { createPluginFromRules } from 'eslint-factory'
import * as vueParser from 'vue-eslint-parser'

const newlinePattern = /[\r\n]/
const indentPattern = /^[\t ]*/
const objectSeparatorPattern = /^[\t \r\n,]*$/

interface HtmlAttributeNewlineOptions {
  maxAttributes?: number
}

interface DocumentParserServices {
  defineDocumentVisitor: (visitor: { VStartTag: (node: AST.VStartTag) => void }) => ReturnType<ESLintRule.RuleModule['create']>
}

interface AttributeGap {
  range: [number, number]
  replacement: string
}

function getChildIndent(indent: string): string {
  return indent + (indent.includes('\t') ? '\t' : '  ')
}

function getStartTagGaps(text: string, node: AST.VStartTag, indent: string, newline: string): AttributeGap[] {
  const attributeIndent = getChildIndent(indent)
  const gaps: AttributeGap[] = []
  let previousEnd = node.range[0] + 1 + node.parent.rawName.length

  for (const attribute of node.attributes) {
    if (attribute.directive && attribute.value?.expression?.type === 'ObjectExpression')
      gaps.push(...getObjectWhitespaceGaps(text, attribute.value.expression))

    if (!newlinePattern.test(text.slice(previousEnd, attribute.range[0]))) {
      gaps.push({
        range: [previousEnd, attribute.range[0]],
        replacement: newline + attributeIndent,
      })
    }
    previousEnd = attribute.range[1]
  }

  const closingStart = node.range[1] - (node.selfClosing ? 2 : 1)
  if (!newlinePattern.test(text.slice(previousEnd, closingStart))) {
    gaps.push({
      range: [previousEnd, closingStart],
      replacement: newline + indent,
    })
  }

  return gaps
}

function getObjectWhitespaceGaps(text: string, expression: AST.ESLintObjectExpression): AttributeGap[] {
  const ranges: Array<[number, number]> = []
  let previousEnd = expression.range[0] + 1
  for (const property of expression.properties) {
    ranges.push([previousEnd, property.range[0]])
    previousEnd = property.range[1]
  }
  ranges.push([previousEnd, expression.range[1] - 1])

  const gaps: AttributeGap[] = []
  for (const range of ranges) {
    const separator = text.slice(...range)
    if (newlinePattern.test(separator) && objectSeparatorPattern.test(separator)) {
      gaps.push({
        range,
        replacement: separator.includes(',') ? ', ' : ' ',
      })
    }
  }
  return gaps
}

function getInterpolationGaps(text: string, node: AST.VStartTag, indent: string, newline: string): AttributeGap[] {
  let ancestor: AST.VElement | AST.VDocumentFragment = node.parent
  while (ancestor.type === 'VElement') {
    if (['pre', 'textarea', 'script', 'style'].includes(ancestor.name))
      return []
    ancestor = ancestor.parent
  }

  const { children, endTag } = node.parent
  const content = children.filter(child => child.type !== 'VText' || child.value.trim())
  const [expression] = content
  if (!endTag || content.length !== 1 || expression?.type !== 'VExpressionContainer')
    return []

  const gaps: AttributeGap[] = [
    {
      range: [node.range[1], expression.range[0]],
      replacement: newline + getChildIndent(indent),
    },
    {
      range: [expression.range[1], endTag.range[0]],
      replacement: newline + indent,
    },
  ]
  return gaps.filter(gap => !newlinePattern.test(text.slice(...gap.range)))
}

function getTagIndent(text: string, node: AST.VStartTag): string {
  const lineStart = text.lastIndexOf('\n', node.range[0] - 1) + 1
  return text.slice(lineStart, node.range[0]).match(indentPattern)?.[0] ?? ''
}

const htmlAttrNewlineRule: ESLintRule.RuleModule = {
  meta: {
    type: 'layout',
    docs: {
      description: 'Put each attribute on its own line when a tag exceeds the configured attribute limit.',
    },
    fixable: 'whitespace',
    schema: [{
      type: 'object',
      properties: {
        maxAttributes: { type: 'integer', minimum: 0 },
      },
      additionalProperties: false,
    }],
  },
  create(context) {
    const { sourceCode } = context
    const [options = {}] = context.options as [HtmlAttributeNewlineOptions?]
    const { maxAttributes = 2 } = options
    const services = sourceCode.parserServices as DocumentParserServices

    return services.defineDocumentVisitor({
      /** Format attributes and standalone Vue interpolations without rewriting expressions. */
      VStartTag(node) {
        if (node.attributes.length <= maxAttributes)
          return

        const { text } = sourceCode
        const indent = getTagIndent(text, node)
        const newline = text.includes('\r\n') ? '\r\n' : '\n'
        const gaps = getStartTagGaps(text, node, indent, newline)
        gaps.push(...getInterpolationGaps(text, node, indent, newline))

        if (gaps.length === 0)
          return

        context.report({
          loc: node.loc,
          message: `Put each attribute, the closing bracket, and standalone Vue interpolation content on separate lines when a tag has more than ${maxAttributes} attributes.`,
          fix: fixer => gaps.map(gap => fixer.replaceTextRange(gap.range, gap.replacement)),
        })
      },
    })
  },
}

export const htmlAttrNewline: Rule = createPluginFromRules({
  name: 'html-attribute-newline',
  include: ['**/*.vue'],
  languageOptions: { parser: vueParser },
  rules: [{ name: 'html-attribute-newline', ...htmlAttrNewlineRule }],
})

export const htmlDocumentAttrNewline: Rule = {
  ...htmlAttrNewline,
  name: 'html-attribute-newline/html',
  files: ['**/*.html'],
  languageOptions: {
    parser: vueParser,
    parserOptions: { parser: false },
  },
}
