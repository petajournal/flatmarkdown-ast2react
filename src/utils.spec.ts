import { describe, it, expect } from 'vitest';
import type { AstNode } from 'flatmarkdown-ast';
import { extractText } from './utils';

describe('extractText', () => {
  it('returns value from text node', () => {
    expect(extractText({ type: 'text', value: 'hello' })).toBe('hello');
  });

  it('concatenates text from nested children', () => {
    const node: AstNode = {
      type: 'emph',
      children: [
        { type: 'text', value: 'foo' },
        { type: 'strong', children: [{ type: 'text', value: 'bar' }] },
      ],
    };
    expect(extractText(node)).toBe('foobar');
  });

  // 改行は空白になる。前後の単語がつながらないようにするため
  it('turns a line break into a space', () => {
    expect(extractText({ type: 'softbreak' })).toBe(' ');
    expect(extractText({ type: 'linebreak' })).toBe(' ');
  });

  // インラインコードの中身も文字として数える
  it('includes the literal of inline code', () => {
    const node: AstNode = {
      type: 'embed',
      url: 'a.png',
      title: '',
      children: [{ type: 'text', value: 'run ' }, { type: 'code', literal: 'npm test' }],
    };
    expect(extractText(node)).toBe('run npm test');
  });

  // ハッシュタグは、#付きのタグ名になる
  it('writes a hashtag with its hash sign', () => {
    const node: AstNode = { type: 'emph', children: [{ type: 'hashtag', value: 'diary' }] };
    expect(extractText(node)).toBe('#diary');
  });

  it('returns empty string for node with no children', () => {
    expect(extractText({ type: 'emph' })).toBe('');
  });
});
