import { describe, it, expect } from 'vitest';
import { defaultContext } from './types';

describe('defaultContext', () => {
  it('returns default values', () => {
    const ctx = defaultContext();
    expect(ctx.options).toEqual({});
    expect(ctx.inHeaderRow).toBe(false);
    expect(ctx.tableAlignments).toEqual([]);
    expect(ctx.cellIndex).toBe(0);
    expect(ctx.tightList).toBe(false);
  });

  it('stores provided options', () => {
    const options = { wikilink: { hrefPrefix: '/wiki/' } };
    const ctx = defaultContext(options);
    expect(ctx.options).toBe(options);
  });
});
