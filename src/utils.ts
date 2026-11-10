import type { AstNode } from 'flatmarkdown-ast';

export function extractText(node: AstNode): string {
  if (node.type === 'text') return (node as { value: string }).value;
  if ('children' in node && node.children) {
    return (node.children as AstNode[]).map(extractText).join('');
  }
  return '';
}

const INLINE_FOOTNOTE_PREFIX = '__inline_';

/**
 * The text that a reader sees for a footnote. An inline footnote has a name that the parser
 * made (`__inline_1`), so its number is shown instead.
 */
export function footnoteLabel(name: string): string {
  return name.startsWith(INLINE_FOOTNOTE_PREFIX) ? name.slice(INLINE_FOOTNOTE_PREFIX.length) : name;
}
