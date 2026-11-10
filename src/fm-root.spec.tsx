import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import type { AstNode } from 'flatmarkdown-ast';
import { FmRoot } from './fm-root';

describe('FmRoot', () => {
  it('renders AST object', () => {
    const ast: AstNode = {
      type: 'document',
      children: [
        { type: 'paragraph', children: [{ type: 'text', value: 'Hello' }] },
      ],
    };
    const { container } = render(<FmRoot ast={ast} />);
    expect(container.querySelector('p')!.textContent).toContain('Hello');
  });

  it('parses JSON string input', () => {
    const ast: AstNode = {
      type: 'document',
      children: [
        { type: 'heading', level: 1, children: [{ type: 'text', value: 'Title' }] },
      ],
    };
    const { container } = render(<FmRoot ast={JSON.stringify(ast)} />);
    expect(container.querySelector('h1')!.textContent).toContain('Title');
  });

  it('passes options to context', () => {
    const ast: AstNode = {
      type: 'document',
      children: [
        { type: 'wikilink', url: 'Page', children: [{ type: 'text', value: 'Link' }] },
      ],
    };
    const { container } = render(
      <FmRoot ast={ast} options={{ wikilink: { hrefPrefix: '/docs/', cssClass: 'my-link' } }} />,
    );
    const a = container.querySelector('a[data-wikilink]');
    expect(a).toBeTruthy();
    expect(a!.getAttribute('href')).toBe('/docs/Page');
    expect(a!.classList.contains('my-link')).toBe(true);
  });

  it('renders nothing for empty string', () => {
    const { container } = render(<FmRoot ast="" />);
    expect(container.innerHTML).toBe('');
  });
});
