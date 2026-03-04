import type { AstNode } from 'flatmarkdown-ast';

export function extractText(node: AstNode): string {
  if (node.type === 'text') return (node as { value: string }).value;
  if ('children' in node && node.children) {
    return (node.children as AstNode[]).map(extractText).join('');
  }
  return '';
}
