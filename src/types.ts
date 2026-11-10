import type { ComponentType } from 'react';
import type { TableAlignment } from 'flatmarkdown-ast';

export interface WikiLinkReactOptions {
  /** Custom link component (e.g. react-router's Link). Receives `to` and `children`. */
  linkComponent?: ComponentType<{ to: string; className?: string | null; children?: React.ReactNode }>;
  /** Prefix prepended to the wikilink url for href/to. Default: '' */
  hrefPrefix?: string;
  /** CSS class applied to wikilink anchors. */
  cssClass?: string;
}

export interface ReactRenderOptions {
  wikilink?: WikiLinkReactOptions;
}

export interface RenderContext {
  options: ReactRenderOptions;
  inHeaderRow: boolean;
  tableAlignments: TableAlignment[];
  cellIndex: number;
  /** true inside a tight list; an item then drops <p> around its own paragraphs */
  inTightList: boolean;
  /** true only for a paragraph that is a direct child of an item in a tight list */
  tightList: boolean;
}

export function defaultContext(options: ReactRenderOptions = {}): RenderContext {
  return {
    options,
    inHeaderRow: false,
    tableAlignments: [],
    cellIndex: 0,
    inTightList: false,
    tightList: false,
  };
}
