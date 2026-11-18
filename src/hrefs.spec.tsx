import { render } from '@testing-library/react';
import type { AstNode } from 'flatmarkdown-ast';
import { FmNode } from './fm-node';
import { defaultContext, type ReactRenderOptions } from './types';
import hrefs from '../testdata/hrefs.json';

// testdata/hrefs.json is a copy of flatmarkdown-ast2html/tests/hrefs.json of the flatmarkdown
// repository. The Rust renderer is tested with the same table, so both give the same hrefs.
interface Case {
  kind: 'wikilink' | 'hashtag';
  template: string;
  fragmentPattern: string;
  name: string;
  href: string;
}

const table = hrefs as { cases: Case[] };

function renderedHref(c: Case): string | null {
  const [node, options]: [AstNode, ReactRenderOptions] =
    c.kind === 'wikilink'
      ? [
          { type: 'wikilink', url: c.name, children: [{ type: 'text', value: 'x' }] },
          { wikilink: { href: c.template, fragmentPattern: c.fragmentPattern } },
        ]
      : [{ type: 'hashtag', value: c.name }, { hashtag: { href: c.template } }];
  const { container } = render(<FmNode node={node} context={defaultContext(options)} />);
  return container.querySelector('a')!.getAttribute('href');
}

// hrefの表
describe('the table of hrefs', () => {
  // 表のどの行でも、描いたhrefは、表のhrefである
  it.each(table.cases.map(c => [JSON.stringify(c), c] as const))(
    'renders the href of the table for %s',
    (_, c) => {
      expect(renderedHref(c)).toBe(c.href);
    },
  );
});
