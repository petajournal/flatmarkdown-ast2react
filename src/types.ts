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

export interface HashtagReactOptions {
  /**
   * Prefix prepended to the tag name for href/to.
   * Default: `hrefPrefix` of the wikilink options.
   */
  hrefPrefix?: string;
  /** CSS class applied to hashtag anchors. Default: 'hashtag' */
  cssClass?: string;
}

export interface EmbedReactOptions {
  /**
   * An absolute URL that the URL of an embed is resolved against, as a browser resolves a
   * relative URL against the address of the page. An absolute URL of an embed stays as it is.
   * Default: none; the URL is used as written.
   */
  baseUrl?: string;
}

export interface ReactRenderOptions {
  wikilink?: WikiLinkReactOptions;
  hashtag?: HashtagReactOptions;
  embed?: EmbedReactOptions;
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
