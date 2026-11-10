import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import type { AstNode } from 'flatmarkdown-ast';
import { FmNode } from './fm-node';
import { defaultContext, RenderContext } from './types';

function renderNode(node: AstNode, ctx?: RenderContext) {
  return render(<FmNode node={node} context={ctx ?? defaultContext()} />);
}

describe('FmNode', () => {
  // ── Block Nodes ──

  describe('document', () => {
    it('renders children', () => {
      const { container } = renderNode({
        type: 'document',
        children: [
          { type: 'paragraph', children: [{ type: 'text', value: 'hello' }] },
        ],
      });
      expect(container.querySelector('p')!.textContent).toContain('hello');
    });
  });

  describe('paragraph', () => {
    it('wraps in <p>', () => {
      const { container } = renderNode({
        type: 'paragraph',
        children: [{ type: 'text', value: 'test' }],
      });
      expect(container.querySelector('p')).toBeTruthy();
      expect(container.querySelector('p')!.textContent).toContain('test');
    });

    it('omits <p> in tight list', () => {
      const { container } = renderNode(
        { type: 'paragraph', children: [{ type: 'text', value: 'tight' }] },
        { ...defaultContext(), tightList: true },
      );
      expect(container.querySelector('p')).toBeNull();
      expect(container.textContent).toContain('tight');
    });
  });

  describe('heading', () => {
    for (let level = 1; level <= 6; level++) {
      it(`renders <h${level}>`, () => {
        const { container } = renderNode({
          type: 'heading',
          level,
          children: [{ type: 'text', value: `Heading ${level}` }],
        });
        const h = container.querySelector(`h${level}`);
        expect(h).toBeTruthy();
        expect(h!.textContent).toContain(`Heading ${level}`);
      });
    }
  });

  describe('code_block', () => {
    it('renders <pre><code>', () => {
      const { container } = renderNode({ type: 'code_block', fenced: true, info: '', literal: 'let x = 1;' });
      const code = container.querySelector('pre > code');
      expect(code).toBeTruthy();
      expect(code!.textContent).toBe('let x = 1;');
    });

    it('adds language class from info', () => {
      const { container } = renderNode({ type: 'code_block', fenced: true, info: 'typescript', literal: 'const x = 1;' });
      const code = container.querySelector('code');
      expect(code!.className).toBe('language-typescript');
    });

    it('no class when info is empty', () => {
      const { container } = renderNode({ type: 'code_block', fenced: true, info: '', literal: 'x' });
      const code = container.querySelector('code');
      expect(code!.className).toBe('');
    });
  });

  describe('block_quote', () => {
    it('renders <blockquote>', () => {
      const { container } = renderNode({
        type: 'block_quote',
        children: [{ type: 'paragraph', children: [{ type: 'text', value: 'quoted' }] }],
      });
      expect(container.querySelector('blockquote')).toBeTruthy();
      expect(container.querySelector('blockquote p')!.textContent).toContain('quoted');
    });
  });

  describe('multiline_block_quote', () => {
    it('renders <blockquote>', () => {
      const { container } = renderNode({
        type: 'multiline_block_quote',
        children: [{ type: 'paragraph', children: [{ type: 'text', value: 'multi' }] }],
      });
      expect(container.querySelector('blockquote')).toBeTruthy();
    });
  });

  describe('list', () => {
    it('renders <ul> for unordered', () => {
      const { container } = renderNode({
        type: 'list',
        list_type: 'bullet',
        start: 1,
        tight: false,
        delimiter: 'period',
        children: [
          { type: 'item', list_type: 'bullet', start: 0, children: [{ type: 'paragraph', children: [{ type: 'text', value: 'item1' }] }] },
        ],
      });
      expect(container.querySelector('ul')).toBeTruthy();
      expect(container.querySelector('li')).toBeTruthy();
    });

    it('renders <ol> for ordered', () => {
      const { container } = renderNode({
        type: 'list',
        list_type: 'ordered',
        start: 1,
        tight: false,
        delimiter: 'period',
        children: [
          { type: 'item', list_type: 'ordered', start: 1, children: [{ type: 'paragraph', children: [{ type: 'text', value: 'first' }] }] },
        ],
      });
      expect(container.querySelector('ol')).toBeTruthy();
    });

    it('sets start attribute when not 1', () => {
      const { container } = renderNode({
        type: 'list',
        list_type: 'ordered',
        start: 3,
        tight: false,
        delimiter: 'period',
        children: [
          { type: 'item', list_type: 'ordered', start: 3, children: [{ type: 'paragraph', children: [{ type: 'text', value: 'third' }] }] },
        ],
      });
      expect(container.querySelector('ol')!.getAttribute('start')).toBe('3');
    });

    // tightはlistが持つ。itemはtightを持たない
    it('reads tight from the list', () => {
      const { container } = renderNode({
        type: 'list',
        list_type: 'bullet',
        start: 1,
        tight: true,
        delimiter: 'period',
        children: [
          { type: 'item', list_type: 'bullet', start: 0, children: [{ type: 'paragraph', children: [{ type: 'text', value: 'one' }] }] },
        ],
      });
      expect(container.querySelector('li p')).toBeNull();
      expect(container.querySelector('li')!.textContent).toContain('one');
    });

    // tightが外すのは、itemの直下の段落の<p>だけ。引用の中の段落は<p>を保つ
    it('keeps <p> for a paragraph inside a block quote in a tight item', () => {
      const { container } = renderNode({
        type: 'list',
        list_type: 'bullet',
        start: 1,
        tight: true,
        delimiter: 'period',
        children: [
          {
            type: 'item',
            list_type: 'bullet',
            start: 0,
            children: [
              { type: 'paragraph', children: [{ type: 'text', value: 'one' }] },
              { type: 'block_quote', children: [{ type: 'paragraph', children: [{ type: 'text', value: 'quoted' }] }] },
            ],
          },
        ],
      });
      expect(container.querySelector('li > p')).toBeNull();
      expect(container.querySelector('blockquote > p')!.textContent).toContain('quoted');
    });
  });

  describe('item', () => {
    // tightなリストの中では、itemの段落の<p>を外す
    it('renders <li> and drops <p> in a tight list', () => {
      const { container } = renderNode(
        {
          type: 'item',
          list_type: 'bullet',
          start: 0,
          children: [{ type: 'paragraph', children: [{ type: 'text', value: 'tight item' }] }],
        },
        { ...defaultContext(), inTightList: true },
      );
      const li = container.querySelector('li');
      expect(li).toBeTruthy();
      expect(li!.querySelector('p')).toBeNull();
      expect(li!.textContent).toContain('tight item');
    });
  });

  describe('task_item', () => {
    it('renders unchecked checkbox', () => {
      const { container } = renderNode({
        type: 'task_item',
        symbol: null,
        children: [{ type: 'paragraph', children: [{ type: 'text', value: 'todo' }] }],
      });
      const checkbox = container.querySelector('input[type="checkbox"]') as HTMLInputElement;
      expect(checkbox).toBeTruthy();
      expect(checkbox.checked).toBe(false);
      expect(checkbox.disabled).toBe(true);
    });

    it('renders checked checkbox', () => {
      const { container } = renderNode({
        type: 'task_item',
        symbol: 'x',
        children: [{ type: 'paragraph', children: [{ type: 'text', value: 'done' }] }],
      });
      const checkbox = container.querySelector('input[type="checkbox"]') as HTMLInputElement;
      expect(checkbox.checked).toBe(true);
    });
  });

  describe('table', () => {
    const tableNode: AstNode = {
      type: 'table',
      alignments: ['left', 'center', 'none'],
      num_columns: 3,
      num_rows: 2,
      children: [
        {
          type: 'table_row',
          header: true,
          children: [
            { type: 'table_cell', children: [{ type: 'text', value: 'H1' }] },
            { type: 'table_cell', children: [{ type: 'text', value: 'H2' }] },
            { type: 'table_cell', children: [{ type: 'text', value: 'H3' }] },
          ],
        },
        {
          type: 'table_row',
          header: false,
          children: [
            { type: 'table_cell', children: [{ type: 'text', value: 'A' }] },
            { type: 'table_cell', children: [{ type: 'text', value: 'B' }] },
            { type: 'table_cell', children: [{ type: 'text', value: 'C' }] },
          ],
        },
      ],
    };

    it('renders <table>', () => {
      const { container } = renderNode(tableNode);
      expect(container.querySelector('table')).toBeTruthy();
    });

    it('header row uses <th>', () => {
      const { container } = renderNode(tableNode);
      const ths = container.querySelectorAll('th');
      expect(ths.length).toBe(3);
      expect(ths[0].textContent).toContain('H1');
    });

    it('body row uses <td>', () => {
      const { container } = renderNode(tableNode);
      const tds = container.querySelectorAll('td');
      expect(tds.length).toBe(3);
      expect(tds[0].textContent).toContain('A');
    });

    it('applies alignment', () => {
      const { container } = renderNode(tableNode);
      const ths = container.querySelectorAll('th');
      expect(ths[0].getAttribute('align')).toBe('left');
      expect(ths[1].getAttribute('align')).toBe('center');
      expect(ths[2].getAttribute('align')).toBeNull();
    });
  });

  describe('thematic_break', () => {
    it('renders <hr>', () => {
      const { container } = renderNode({ type: 'thematic_break' });
      expect(container.querySelector('hr')).toBeTruthy();
    });
  });

  describe('html_block', () => {
    it('passes through HTML via innerHTML', () => {
      const { container } = renderNode({ type: 'html_block', block_type: 6, literal: '<div class="custom">hi</div>' });
      expect(container.querySelector('.custom')).toBeTruthy();
    });
  });

  describe('footnote_definition', () => {
    it('renders div with id', () => {
      const { container } = renderNode({
        type: 'footnote_definition',
        name: 'note1',
        children: [{ type: 'paragraph', children: [{ type: 'text', value: 'footnote text' }] }],
      });
      const div = container.querySelector('div.footnote');
      expect(div).toBeTruthy();
      expect(div!.id).toBe('fn-note1');
    });

    // 定義の先頭に、参照へ戻るリンクのラベルを置く。本文が同じ行に続くよう、最初の段落の中に入れる
    it('puts a label that links back to the reference in the first paragraph', () => {
      const { container } = renderNode({
        type: 'footnote_definition',
        name: 'note1',
        children: [{ type: 'paragraph', children: [{ type: 'text', value: 'footnote text' }] }],
      });
      const label = container.querySelector('div.footnote > p > a.footnote-label');
      expect(label).toBeTruthy();
      expect(label!.getAttribute('href')).toBe('#fnref-note1');
      expect(label!.textContent).toBe('[note1]:');
      expect(container.querySelector('div.footnote > p')!.textContent).toBe('[note1]: footnote text');
    });

    // 最初の子が段落でない定義では、ラベルをその前に置く
    it('keeps the label in front of a definition that starts with another block', () => {
      const { container } = renderNode({
        type: 'footnote_definition',
        name: 'note1',
        children: [{ type: 'code_block', fenced: true, info: 'text', literal: 'x' }],
      });
      expect(container.querySelector('div.footnote > a.footnote-label')).toBeTruthy();
      expect(container.querySelector('div.footnote > pre > code')!.textContent).toBe('x');
    });
  });

  describe('alert', () => {
    it('renders div with alert class', () => {
      const { container } = renderNode({
        type: 'alert',
        alert_type: 'warning',
        title: null,
        children: [{ type: 'paragraph', children: [{ type: 'text', value: 'Careful!' }] }],
      });
      const div = container.querySelector('div.alert.alert-warning');
      expect(div).toBeTruthy();
    });
  });

  describe('subtext', () => {
    it('renders children', () => {
      const { container } = renderNode({
        type: 'subtext',
        children: [{ type: 'text', value: 'sub' }],
      });
      expect(container.textContent).toContain('sub');
    });
  });

  // ── Inline Nodes ──

  describe('text', () => {
    it('renders value', () => {
      const { container } = renderNode({ type: 'text', value: 'hello world' });
      expect(container.textContent).toContain('hello world');
    });
  });

  describe('softbreak', () => {
    it('renders newline', () => {
      const { container } = renderNode({ type: 'softbreak' });
      expect(container.textContent).toContain('\n');
    });
  });

  describe('linebreak', () => {
    it('renders <br>', () => {
      const { container } = renderNode({ type: 'linebreak' });
      expect(container.querySelector('br')).toBeTruthy();
    });
  });

  describe('emph', () => {
    it('renders <em>', () => {
      const { container } = renderNode({
        type: 'emph',
        children: [{ type: 'text', value: 'italic' }],
      });
      const em = container.querySelector('em');
      expect(em).toBeTruthy();
      expect(em!.textContent).toContain('italic');
    });
  });

  describe('strong', () => {
    it('renders <strong>', () => {
      const { container } = renderNode({
        type: 'strong',
        children: [{ type: 'text', value: 'bold' }],
      });
      expect(container.querySelector('strong')!.textContent).toContain('bold');
    });
  });

  describe('strikethrough', () => {
    it('renders <del>', () => {
      const { container } = renderNode({
        type: 'strikethrough',
        children: [{ type: 'text', value: 'deleted' }],
      });
      expect(container.querySelector('del')!.textContent).toContain('deleted');
    });
  });

  describe('underline', () => {
    it('renders <u>', () => {
      const { container } = renderNode({
        type: 'underline',
        children: [{ type: 'text', value: 'underlined' }],
      });
      expect(container.querySelector('u')!.textContent).toContain('underlined');
    });
  });

  describe('highlight', () => {
    it('renders <mark>', () => {
      const { container } = renderNode({
        type: 'highlight',
        children: [{ type: 'text', value: 'highlighted' }],
      });
      expect(container.querySelector('mark')!.textContent).toContain('highlighted');
    });
  });

  describe('superscript', () => {
    it('renders <sup>', () => {
      const { container } = renderNode({
        type: 'superscript',
        children: [{ type: 'text', value: '2' }],
      });
      expect(container.querySelector('sup')!.textContent).toContain('2');
    });
  });

  describe('subscript', () => {
    it('renders <sub>', () => {
      const { container } = renderNode({
        type: 'subscript',
        children: [{ type: 'text', value: '2' }],
      });
      expect(container.querySelector('sub')!.textContent).toContain('2');
    });
  });

  describe('spoilered_text', () => {
    it('renders <span class="spoiler">', () => {
      const { container } = renderNode({
        type: 'spoilered_text',
        children: [{ type: 'text', value: 'secret' }],
      });
      const span = container.querySelector('span.spoiler');
      expect(span).toBeTruthy();
      expect(span!.textContent).toContain('secret');
    });
  });

  describe('code', () => {
    it('renders <code>', () => {
      const { container } = renderNode({ type: 'code', literal: 'x++' });
      const code = container.querySelector('code');
      expect(code).toBeTruthy();
      expect(code!.textContent).toBe('x++');
    });
  });

  describe('link', () => {
    it('renders <a> with href', () => {
      const { container } = renderNode({
        type: 'link',
        url: 'https://example.com',
        title: 'Example',
        children: [{ type: 'text', value: 'click' }],
      });
      const a = container.querySelector('a');
      expect(a).toBeTruthy();
      expect(a!.getAttribute('href')).toBe('https://example.com');
      expect(a!.getAttribute('title')).toBe('Example');
      expect(a!.textContent).toContain('click');
    });

    it('omits title when empty', () => {
      const { container } = renderNode({
        type: 'link',
        url: 'https://example.com',
        title: '',
        children: [{ type: 'text', value: 'link' }],
      });
      expect(container.querySelector('a')!.getAttribute('title')).toBeNull();
    });
  });

  describe('embed', () => {
    // embedは<img>になる。srcはurl、altは子のテキスト、titleはtitle
    it('renders <img> with src, alt, and title', () => {
      const { container } = renderNode({
        type: 'embed',
        url: 'pic.png',
        title: 'Photo',
        children: [{ type: 'text', value: 'alt text' }],
      });
      const img = container.querySelector('img');
      expect(img).toBeTruthy();
      expect(img!.getAttribute('src')).toBe('pic.png');
      expect(img!.getAttribute('alt')).toBe('alt text');
      expect(img!.getAttribute('title')).toBe('Photo');
    });
  });

  describe('wikilink', () => {
    it('renders <a> with data-wikilink', () => {
      const { container } = renderNode({
        type: 'wikilink',
        url: 'MyPage',
        children: [{ type: 'text', value: 'My Page' }],
      });
      const a = container.querySelector('a[data-wikilink]');
      expect(a).toBeTruthy();
      expect(a!.textContent).toContain('My Page');
    });

    it('uses hrefPrefix from options', () => {
      const ctx = defaultContext({ wikilink: { hrefPrefix: '/wiki/' } });
      const { container } = renderNode(
        { type: 'wikilink', url: 'MyPage', children: [{ type: 'text', value: 'link' }] },
        ctx,
      );
      const a = container.querySelector('a[data-wikilink]');
      expect(a!.getAttribute('href')).toBe('/wiki/MyPage');
    });

    it('default prefix is empty string', () => {
      const { container } = renderNode({
        type: 'wikilink',
        url: 'MyPage',
        children: [{ type: 'text', value: 'link' }],
      });
      const a = container.querySelector('a[data-wikilink]');
      expect(a!.getAttribute('href')).toBe('MyPage');
    });

    it('applies cssClass', () => {
      const ctx = defaultContext({ wikilink: { cssClass: 'wiki-link' } });
      const { container } = renderNode(
        { type: 'wikilink', url: 'Page', children: [{ type: 'text', value: 'P' }] },
        ctx,
      );
      const a = container.querySelector('a[data-wikilink]');
      expect(a!.classList.contains('wiki-link')).toBe(true);
    });

    it('uses custom linkComponent', () => {
      function CustomLink({ to, children, ...rest }: { to: string; children?: React.ReactNode; [k: string]: unknown }) {
        return <a href={to} data-custom="true" {...rest}>{children}</a>;
      }
      const ctx = defaultContext({ wikilink: { linkComponent: CustomLink, hrefPrefix: '/p/' } });
      const { container } = renderNode(
        { type: 'wikilink', url: 'Page', children: [{ type: 'text', value: 'P' }] },
        ctx,
      );
      const a = container.querySelector('a[data-custom]');
      expect(a).toBeTruthy();
      expect(a!.getAttribute('href')).toBe('/p/Page');
    });
  });

  describe('hashtag', () => {
    // hashtagは、タグ名をhrefに持つリンクになる。表示は#付きのタグ名
    it('renders a link to the tag with the hashtag class', () => {
      const { container } = renderNode({ type: 'hashtag', value: 'diary' });
      const a = container.querySelector('a.hashtag');
      expect(a).toBeTruthy();
      expect(a!.getAttribute('href')).toBe('diary');
      expect(a!.textContent).toBe('#diary');
    });

    // タグはページへのリンクなので、wikilinkのhrefPrefixを使う
    it('uses hrefPrefix of the wikilink options', () => {
      const ctx = defaultContext({ wikilink: { hrefPrefix: '/wiki/' } });
      const { container } = renderNode({ type: 'hashtag', value: 'diary' }, ctx);
      expect(container.querySelector('a.hashtag')!.getAttribute('href')).toBe('/wiki/diary');
    });

    // SPAの遷移のため、wikilinkのlinkComponentを使う
    it('uses linkComponent of the wikilink options', () => {
      function CustomLink({ to, children, ...rest }: { to: string; children?: React.ReactNode; [k: string]: unknown }) {
        return <a href={to} data-custom="true" {...rest}>{children}</a>;
      }
      const ctx = defaultContext({ wikilink: { linkComponent: CustomLink, hrefPrefix: '/p/' } });
      const { container } = renderNode({ type: 'hashtag', value: 'diary' }, ctx);
      const a = container.querySelector('a[data-custom]');
      expect(a).toBeTruthy();
      expect(a!.getAttribute('href')).toBe('/p/diary');
      expect(a!.classList.contains('hashtag')).toBe(true);
      expect(a!.textContent).toBe('#diary');
    });
  });

  describe('footnote_reference', () => {
    it('renders superscript link', () => {
      const { container } = renderNode({ type: 'footnote_reference', name: 'fn1', ref_num: 1, ix: 1 });
      const a = container.querySelector('sup > a');
      expect(a).toBeTruthy();
      expect(a!.getAttribute('href')).toBe('#fn-fn1');
      expect(a!.textContent).toBe('[fn1]');
    });

    // 表示するのは脚注の名前。ixは本文ごとに1から数え直すので、表示に使わない
    it('shows the name, not ix', () => {
      const { container } = renderNode({ type: 'footnote_reference', name: 'note', ref_num: 1, ix: 4 });
      expect(container.querySelector('sup > a')!.textContent).toBe('[note]');
    });

    // インライン脚注の名前（__inline_1）はパーサーが作ったものなので、番号だけを表示する
    it('shows the number of an inline footnote', () => {
      const { container } = renderNode({ type: 'footnote_reference', name: '__inline_1', ref_num: 1, ix: 1 });
      const a = container.querySelector('sup > a');
      expect(a!.textContent).toBe('[1]');
      expect(a!.getAttribute('href')).toBe('#fn-__inline_1');
    });

    // idは一意でなければならない。同じ脚注への2つ目の参照は、番号付きのidを持つ
    it('gives the first reference the plain id and the second its number', () => {
      const first = renderNode({ type: 'footnote_reference', name: 'note', ref_num: 1, ix: 1 });
      expect(first.container.querySelector('sup.footnote-ref')!.id).toBe('fnref-note');
      const second = renderNode({ type: 'footnote_reference', name: 'note', ref_num: 2, ix: 1 });
      expect(second.container.querySelector('sup.footnote-ref')!.id).toBe('fnref-note-2');
    });
  });

  describe('shortcode', () => {
    it('renders emoji', () => {
      const { container } = renderNode({ type: 'shortcode', code: 'smile', emoji: '😊' });
      expect(container.textContent).toContain('😊');
    });
  });

  describe('math', () => {
    it('renders display math in <pre><code>', () => {
      const { container } = renderNode({ type: 'math', dollar_math: true, display_math: true, literal: 'E=mc^2' });
      const code = container.querySelector('pre > code.math.math-display');
      expect(code).toBeTruthy();
      expect(code!.textContent).toBe('E=mc^2');
    });

    it('renders inline math in <code>', () => {
      const { container } = renderNode({ type: 'math', dollar_math: true, display_math: false, literal: 'x^2' });
      const code = container.querySelector('code.math.math-inline');
      expect(code).toBeTruthy();
      expect(code!.textContent).toBe('x^2');
      expect(container.querySelector('pre')).toBeNull();
    });
  });

  describe('html_inline', () => {
    it('passes through HTML via innerHTML', () => {
      const { container } = renderNode({ type: 'html_inline', value: '<b>bold</b>' });
      expect(container.querySelector('b')!.textContent).toBe('bold');
    });
  });

});
