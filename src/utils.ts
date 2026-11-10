import type { AstNode } from 'flatmarkdown-ast';

/**
 * The text of a node and its descendants, without any markup: what the `alt` of an image holds.
 * Raw inline HTML counts as text, as in the CommonMark reference renderer.
 */
export function extractText(node: AstNode): string {
  if (node.type === 'text' || node.type === 'html_inline') return node.value;
  if (node.type === 'code') return node.literal;
  if (node.type === 'hashtag') return `#${node.value}`;
  if (node.type === 'softbreak' || node.type === 'linebreak') return ' ';
  if ('children' in node && node.children) {
    return node.children.map(extractText).join('');
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
