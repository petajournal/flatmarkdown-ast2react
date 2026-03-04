import type { ComponentType } from 'react';

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
  tableAlignments: string[];
  cellIndex: number;
  tightList: boolean;
}

export function defaultContext(options: ReactRenderOptions = {}): RenderContext {
  return {
    options,
    inHeaderRow: false,
    tableAlignments: [],
    cellIndex: 0,
    tightList: false,
  };
}
